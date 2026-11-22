/** Small, pure helpers for taking the masters apart and composing new SVGs from them. */

export type Box = { x: number; y: number; width: number; height: number };

export type Master = {
	/** The master's own canvas */
	viewBox: Box;
	/** Everything inside `<svg>` but the `<title>` */
	body: string;
};

/** The one colour every master is drawn in. */
export const MASTER_COLOR = '#01548F';

const num = (value: number) => String(Math.round(value * 100) / 100);

export function parseMaster(svg: string): Master {
	const open = svg.match(/<svg\b[^>]*>/);
	const viewBox = open?.[0].match(/viewBox="([^"]+)"/)?.[1];
	if (!open || !viewBox) throw new Error('A master needs an <svg> element with a viewBox');
	const [x = NaN, y = NaN, width = NaN, height = NaN] = viewBox
		.trim()
		.split(/[\s,]+/)
		.map(Number);
	if ([x, y, width, height].some((value) => !Number.isFinite(value))) {
		throw new Error(`Unreadable viewBox "${viewBox}"`);
	}
	const end = svg.lastIndexOf('</svg>');
	const body = svg
		.slice(open.index! + open[0].length, end)
		.replace(/<title\b[^>]*>[\s\S]*?<\/title>/g, '')
		.trim();
	if (!body.includes(MASTER_COLOR)) throw new Error(`A master is drawn in ${MASTER_COLOR}`);
	return { viewBox: { x, y, width, height }, body };
}

/** The body drawn in another colour. */
export function recolor({ body, color }: { body: string; color: string }) {
	return body.replaceAll(MASTER_COLOR, color);
}

/** The body without its fills, so it takes the colour of whatever it sits in. */
export function uncolored(body: string) {
	return body.replaceAll(` fill="${MASTER_COLOR}"`, '');
}

const escapeXml = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A standalone SVG document. `background` fills the whole canvas. */
export function svgDocument({
	box,
	body,
	title,
	background
}: {
	box: Box;
	body: string;
	title: string;
	background?: string;
}) {
	const viewBox = [box.x, box.y, box.width, box.height].map(num).join(' ');
	const ground = background
		? `\n  <rect x="${num(box.x)}" y="${num(box.y)}" width="${num(box.width)}" height="${num(box.height)}" fill="${background}"/>`
		: '';
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${num(box.width)}" height="${num(box.height)}" role="img" aria-labelledby="t">\n` +
		`  <title id="t">${escapeXml(title)}</title>${ground}\n` +
		`  ${body}\n` +
		`</svg>\n`
	);
}

/**
 * Moves `body`, whose ink occupies `ink`, so that the ink is centred in `target` and spans
 * `fraction` of the target's shorter side (or fits `target` exactly, at fraction 1).
 */
export function placeInk({
	body,
	ink,
	target,
	fraction = 1
}: {
	body: string;
	ink: Box;
	target: Box;
	fraction?: number;
}) {
	const scale = Math.min(target.width / ink.width, target.height / ink.height) * fraction;
	const x = target.x + (target.width - ink.width * scale) / 2 - ink.x * scale;
	const y = target.y + (target.height - ink.height * scale) / 2 - ink.y * scale;
	return `<g transform="translate(${num(x)} ${num(y)}) scale(${Math.round(scale * 10000) / 10000})">${body}</g>`;
}

/** `box` grown by `margin` on every side. */
export function pad({ box, margin }: { box: Box; margin: number }): Box {
	return {
		x: box.x - margin,
		y: box.y - margin,
		width: box.width + 2 * margin,
		height: box.height + 2 * margin
	};
}

/** The smallest square around `box`, sharing its centre. */
export function square(box: Box): Box {
	const side = Math.max(box.width, box.height);
	return {
		x: box.x - (side - box.width) / 2,
		y: box.y - (side - box.height) / 2,
		width: side,
		height: side
	};
}
