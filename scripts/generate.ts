/**
 * Renders every derived file from the blue masters in `masters/`:
 *
 *     bun run generate
 *
 * writes `assets/` (the whole logo universe, also what the CDN serves) and
 * `src/lib/marks.generated.ts` (what `<Logo>` draws). Both are committed; `assets.test.ts` fails
 * when they are older than their inputs.
 */
import { Resvg } from '@resvg/resvg-js';
import opentype from 'opentype.js';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
	COLORS,
	PRODUCTS,
	PRODUCT_KEYS,
	TONES,
	markLabel,
	type Product,
	type Variant
} from '../src/lib/products.js';
import { SPLASH_INK_FRACTION, SPLASH_SCREENS } from '../src/lib/splash.js';
import { OG_CARD, WEB_ICONS, webManifest } from '../src/lib/web.js';
import { encodeIco } from './ico.js';
import { ASSETS, ASSET_MANIFEST, ROOT, inputsHash, sha, type AssetManifest } from './inputs.js';
import {
	pad,
	parseMaster,
	placeInk,
	recolor,
	square,
	svgDocument,
	uncolored,
	type Box,
	type Master
} from './svg.js';

/** Long edge of the web PNG and of the print PNG (`-hires`) of every mark. */
const PNG_LONG_EDGE = 2000;
const HIRES_LONG_EDGE = 8000;
/** Clear space of the files on white: share of the ink height on every side (GUIDELINES §2). */
const CLEAR_SPACE = 0.22;
/** Share of the icon the ink spans: favicons (small cut), app icons, maskable icons. */
const FAVICON_INK = 0.88;
const ICON_INK = 0.66;
/** Maskable icons are cropped to a circle of 80 %: the ink stays well inside it. */
const MASKABLE_INK = 0.5;

const files = new Map<string, string | Uint8Array>();
function put(path: string, content: string | Uint8Array) {
	if (typeof content === 'string' && content.includes('NaN')) throw new Error(`NaN in ${path}`);
	files.set(path, content);
}

const resvgOptions = { font: { loadSystemFonts: false } };

function render({ svg, width }: { svg: string; width: number }) {
	return new Resvg(svg, { ...resvgOptions, fitTo: { mode: 'width', value: Math.round(width) } })
		.render()
		.asPng();
}

function inkOf(master: Master): Box {
	const svg = svgDocument({ box: master.viewBox, body: master.body, title: '' });
	const box = new Resvg(svg, resvgOptions).getBBox();
	if (!box) throw new Error('A master without ink');
	return { x: box.x, y: box.y, width: box.width, height: box.height };
}

/** A square of `size`, the ink centred on it at `fraction` of its side. */
function squareSvg({
	master,
	ink,
	size,
	fraction,
	color,
	background,
	title
}: {
	master: Master;
	ink: Box;
	size: number;
	fraction: number;
	color: string;
	background?: string;
	title: string;
}) {
	const side = size * fraction;
	const target = { x: (size - side) / 2, y: (size - side) / 2, width: side, height: side };
	return svgDocument({
		box: { x: 0, y: 0, width: size, height: size },
		body: placeInk({ body: recolor({ body: master.body, color }), ink, target }),
		background,
		title
	});
}

function longEdgeWidth({ box, longEdge }: { box: Box; longEdge: number }) {
	return box.width >= box.height ? longEdge : (longEdge * box.width) / box.height;
}

/** An SVG mark plus its web and print PNG. */
function putMark({ path, svg, box }: { path: string; svg: string; box: Box }) {
	put(`${path}.svg`, svg);
	put(`${path}.png`, render({ svg, width: longEdgeWidth({ box, longEdge: PNG_LONG_EDGE }) }));
	put(
		`${path}-hires.png`,
		render({ svg, width: longEdgeWidth({ box, longEdge: HIRES_LONG_EDGE }) })
	);
}

function masterOf({ product, variant }: { product: Product; variant: Variant }) {
	return parseMaster(readFileSync(join(ROOT, 'masters', product, `${variant}.svg`), 'utf8'));
}

const marks: Record<string, Record<string, { viewBox: string; body: string }>> = {};

function generateMarks(product: Product) {
	marks[product] = {};
	for (const variant of PRODUCTS[product].variants) {
		const master = masterOf({ product, variant });
		const ink = inkOf(master);
		const label = markLabel({ product, variant });
		const small = variant === 'symbol-small';
		const title = small ? `${label}, small-size cut` : label;

		// The component draws the tight ink box, like the lockups' own canvas
		const tight = [ink.x, ink.y, ink.width, ink.height].map((n) => Math.round(n * 100) / 100);
		marks[product][variant] = { viewBox: tight.join(' '), body: uncolored(master.body) };

		for (const tone of Object.keys(TONES) as (keyof typeof TONES)[]) {
			const svg = svgDocument({
				box: master.viewBox,
				body: recolor({ body: master.body, color: TONES[tone] }),
				title
			});
			// The small cut is for below 24 px: an SVG, no large rasters
			if (small) put(`${product}/${variant}-${tone}.svg`, svg);
			else putMark({ path: `${product}/${variant}-${tone}`, svg, box: master.viewBox });
		}
		if (small) continue;

		putMark({
			path: `${product}/${variant}-reversed`,
			svg: svgDocument({
				box: master.viewBox,
				body: recolor({ body: master.body, color: COLORS.white }),
				background: COLORS.navy,
				title: `${title}, reversed`
			}),
			box: master.viewBox
		});

		const clear = pad({ box: ink, margin: ink.height * CLEAR_SPACE });
		putMark({
			path: `${product}/${variant}-on-white`,
			svg: svgDocument({ box: clear, body: master.body, background: COLORS.white, title }),
			box: clear
		});
	}
}

/** The depth set, screens only (GUIDELINES §9): the symbol raised off the ground. */
function generateLifts(product: Product) {
	const master = masterOf({ product, variant: 'symbol' });
	const name = PRODUCTS[product].name;
	const lift = ({ shadow, opacity, color }: { shadow: string; opacity: number; color: string }) =>
		`<defs><filter id="s" x="-25%" y="-25%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="${shadow}" flood-opacity="${opacity}"/></filter></defs>\n  <g filter="url(#s)">${recolor({ body: master.body, color })}</g>`;
	const variants = [
		{
			path: `${product}/lift-blue`,
			background: COLORS.white,
			body: lift({ shadow: '#013256', opacity: 0.3, color: COLORS.blue }),
			title: `${name}, lifted`
		},
		{
			path: `${product}/lift-reversed`,
			background: COLORS.navy,
			body: lift({ shadow: COLORS.black, opacity: 0.45, color: COLORS.white }),
			title: `${name}, lifted, reversed`
		}
	];
	for (const { path, background, body, title } of variants) {
		const svg = svgDocument({ box: master.viewBox, body, background, title });
		put(`${path}.svg`, svg);
		put(`${path}.png`, render({ svg, width: 1024 }));
	}
}

function generateWeb(product: Product) {
	const name = PRODUCTS[product].name;
	const small = masterOf({ product, variant: 'symbol-small' });
	const smallInk = inkOf(small);
	const standard = masterOf({ product, variant: 'symbol' });
	const standardInk = inkOf(standard);
	const web = (file: string) => `${product}/web/${file}`;

	// favicon.svg: the small cut, transparent, blue in light tabs and white in dark ones
	const faviconBox = pad({ box: square(smallInk), margin: square(smallInk).width * 0.02 });
	put(
		web(WEB_ICONS.svg),
		svgDocument({
			box: faviconBox,
			body:
				`<style>path{fill:${COLORS.blue}}@media (prefers-color-scheme:dark){path{fill:${COLORS.white}}}</style>\n  ` +
				uncolored(small.body),
			title: name
		})
	);

	// Rasters ≤ 48 px from the small cut, ≥ 96 px from the standard cut, all on white
	const favicon = (size: number) =>
		render({
			svg: squareSvg({
				master: small,
				ink: smallInk,
				size,
				fraction: FAVICON_INK,
				color: COLORS.blue,
				background: COLORS.white,
				title: name
			}),
			width: size
		});
	const icons = [16, 32, 48].map((size) => ({ size, png: favicon(size) }));
	for (const { size, png } of icons) put(web(`favicon-${size}.png`), png);
	put(web(WEB_ICONS.ico), encodeIco(icons));

	const icon = ({ size, fraction }: { size: number; fraction: number }) =>
		render({
			svg: squareSvg({
				master: standard,
				ink: standardInk,
				size,
				fraction,
				color: COLORS.blue,
				background: COLORS.white,
				title: name
			}),
			width: size
		});
	put(web(WEB_ICONS.appleTouch), icon({ size: 180, fraction: ICON_INK }));
	put(web(WEB_ICONS.icon192), icon({ size: 192, fraction: ICON_INK }));
	put(web(WEB_ICONS.icon512), icon({ size: 512, fraction: ICON_INK }));
	put(web(WEB_ICONS.maskable192), icon({ size: 192, fraction: MASKABLE_INK }));
	put(web(WEB_ICONS.maskable512), icon({ size: 512, fraction: MASKABLE_INK }));

	// Safari's pinned tab takes one black shape, which it colours itself
	put(
		web(WEB_ICONS.pinnedTab),
		svgDocument({
			box: square(smallInk),
			body: recolor({ body: small.body, color: COLORS.black }),
			title: name
		})
	);

	put(web(WEB_ICONS.manifest), JSON.stringify(webManifest({ product }), null, '\t') + '\n');
}

function generateSplash(product: Product) {
	const master = masterOf({ product, variant: 'symbol' });
	const ink = inkOf(master);
	for (const screen of SPLASH_SCREENS) {
		const dark = screen.scheme === 'dark';
		const side = Math.min(screen.width, screen.height) * SPLASH_INK_FRACTION;
		const target = {
			x: (screen.width - side) / 2,
			y: (screen.height - side) / 2,
			width: side,
			height: side
		};
		const svg = svgDocument({
			box: { x: 0, y: 0, width: screen.width, height: screen.height },
			body: placeInk({
				body: recolor({ body: master.body, color: dark ? COLORS.white : COLORS.blue }),
				ink,
				target
			}),
			background: dark ? COLORS.navy : COLORS.white,
			title: PRODUCTS[product].name
		});
		put(`${product}/${screen.file}`, render({ svg, width: screen.width }));
	}
}

const outfitLight = opentype.parse(
	readFileSync(join(ROOT, 'node_modules/@fontsource/outfit/files/outfit-latin-300-normal.woff'))
		.buffer
);

const coord = (value: number) => String(Math.round(value * 100) / 100);

/** SVG path data. opentype.js's own `toPathData` writes `NaN` for some coordinates. */
function pathData(commands: opentype.PathCommand[]) {
	return commands
		.map((command) => {
			switch (command.type) {
				case 'M':
				case 'L':
					return `${command.type}${coord(command.x)} ${coord(command.y)}`;
				case 'Q':
					return `Q${[command.x1, command.y1, command.x, command.y].map(coord).join(' ')}`;
				case 'C':
					return `C${[command.x1, command.y1, command.x2, command.y2, command.x, command.y].map(coord).join(' ')}`;
				case 'Z':
					return 'Z';
			}
		})
		.join('');
}

/**
 * `text` as one path, glyph by glyph with kerning. opentype.js's own shaping chokes on a
 * substitution table of Outfit, and a tagline needs no ligatures.
 */
function outlineText({
	text,
	size,
	centerX,
	baseline
}: {
	text: string;
	size: number;
	centerX: number;
	baseline: number;
}) {
	const scale = size / outfitLight.unitsPerEm;
	const glyphs = [...text].map((char) => outfitLight.charToGlyph(char));
	const advances = glyphs.map(
		(glyph, index) =>
			(glyph.advanceWidth ?? 0) +
			(index + 1 < glyphs.length ? outfitLight.getKerningValue(glyph, glyphs[index + 1]!) : 0)
	);
	const total = advances.reduce((sum, advance) => sum + advance, 0) * scale;
	let x = centerX - total / 2;
	return glyphs
		.map((glyph, index) => {
			const d = pathData(glyph.getPath(x, baseline, size, {}, outfitLight).commands);
			x += advances[index]! * scale;
			return d;
		})
		.join('');
}

/** The 1200×630 link preview: white lockup and tagline on navy, the tagline outlined. */
function generateOgCard(product: Product) {
	const master = masterOf({ product, variant: 'horizontal' });
	const ink = inkOf(master);
	const { width, height } = OG_CARD;
	const lockupHeight = Math.min(130, 1000 / (ink.width / ink.height));
	const lockupWidth = (lockupHeight * ink.width) / ink.height;
	const fontSize = 44;
	const gap = 64;
	const capHeight = (outfitLight.tables.os2?.sCapHeight ?? 700) / outfitLight.unitsPerEm;
	const textHeight = fontSize * capHeight;
	const top = (height - (lockupHeight + gap + textHeight)) / 2;

	const lockup = placeInk({
		body: recolor({ body: master.body, color: COLORS.white }),
		ink,
		target: { x: (width - lockupWidth) / 2, y: top, width: lockupWidth, height: lockupHeight }
	});
	const tagline = PRODUCTS[product].tagline;
	const text = outlineText({
		text: tagline,
		size: fontSize,
		centerX: width / 2,
		baseline: top + lockupHeight + gap + textHeight
	});
	const svg = svgDocument({
		box: { x: 0, y: 0, width, height },
		body: `${lockup}\n  <path fill="${COLORS.white}" d="${text}"/>`,
		background: COLORS.navy,
		title: `${PRODUCTS[product].name}: ${tagline}`
	});
	put(`${product}/og-card.svg`, svg);
	put(`${product}/${OG_CARD.file}`, render({ svg, width }));
}

function writeMarksModule() {
	const source =
		'// Generated by `bun run generate` from masters/. Do not edit.\n\n' +
		'/** A mark in no colour: it fills with `currentColor`. `viewBox` is its tight ink box. */\n' +
		'export type Mark = { viewBox: string; body: string };\n\n' +
		`export const MARKS: Record<string, Record<string, Mark>> = ${JSON.stringify(marks, null, '\t')};\n`;
	writeFileSync(join(ROOT, 'src/lib/marks.generated.ts'), source);
}

for (const product of PRODUCT_KEYS) {
	generateMarks(product);
	generateLifts(product);
	generateWeb(product);
	generateSplash(product);
	generateOgCard(product);
}

rmSync(ASSETS, { recursive: true, force: true });
const manifest: AssetManifest = { inputs: inputsHash(), files: {} };
for (const [path, content] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
	const target = join(ASSETS, path);
	mkdirSync(dirname(target), { recursive: true });
	writeFileSync(target, content);
	manifest.files[path] = sha(content);
}
writeFileSync(ASSET_MANIFEST, JSON.stringify(manifest, null, '\t') + '\n');
writeMarksModule();
console.log(`Wrote ${files.size} files to assets/ and src/lib/marks.generated.ts`);
