import { COLORS, PRODUCTS, type Product } from './products.js';
import { SPLASH_SCREENS } from './splash.js';

/**
 * Where an app serves a product's web files. Browsers and iOS probe `/favicon.ico` and
 * `/apple-touch-icon.png` on their own, so those two stay at the root; everything else lives
 * under `/brand/`, out of the app's own namespace.
 */
export const BRAND_BASE = '/brand';

/** The web icon set, as files in `assets/<product>/web/`. */
export const WEB_ICONS = {
	ico: 'favicon.ico',
	svg: 'favicon.svg',
	png16: 'favicon-16.png',
	png32: 'favicon-32.png',
	png48: 'favicon-48.png',
	appleTouch: 'apple-touch-icon.png',
	icon192: 'icon-192.png',
	icon512: 'icon-512.png',
	maskable192: 'maskable-192.png',
	maskable512: 'maskable-512.png',
	pinnedTab: 'safari-pinned-tab.svg',
	manifest: 'site.webmanifest'
} as const;

export const OG_CARD = { file: 'og-card.png', width: 1200, height: 630 } as const;

const ROOT_FILES: readonly string[] = [WEB_ICONS.ico, WEB_ICONS.appleTouch];

/** The URL an app serves a file of `assets/<product>/` at. */
export function publicPath(assetFile: string) {
	if (!assetFile.startsWith('web/')) return `${BRAND_BASE}/${assetFile}`;
	const name = assetFile.slice('web/'.length);
	return ROOT_FILES.includes(name) ? `/${name}` : `${BRAND_BASE}/${name}`;
}

/**
 * Every file an app serves for a product: URL path → file inside `assets/<product>/`.
 * The manifest is not in here: apps serve their own ({@link webManifest}).
 */
export function servedFiles(): Map<string, string> {
	const files = [
		...Object.values(WEB_ICONS)
			.filter((file) => file !== WEB_ICONS.manifest)
			.map((file) => `web/${file}`),
		...SPLASH_SCREENS.map((screen) => screen.file),
		OG_CARD.file
	];
	return new Map(files.map((file) => [publicPath(file), file]));
}

export type ManifestIcon = { src: string; sizes: string; type: string; purpose?: string };

/** The Web App Manifest fields apps commonly set. Anything else passes through unchanged. */
export type WebManifest = {
	name?: string;
	short_name?: string;
	description?: string;
	id?: string;
	start_url?: string;
	scope?: string;
	lang?: string;
	display?: string;
	background_color?: string;
	theme_color?: string;
	icons?: ManifestIcon[];
	[field: string]: unknown;
};

/**
 * A product's manifest. Icon `src`s are relative, so they resolve next to the manifest wherever
 * it is served (an app's `/brand/`, the CDN's `/cdn/munify/<product>/web/`). `overrides` are
 * merged over the defaults; their `icons` are added after the product's own.
 */
export function webManifest({
	product,
	overrides = {}
}: {
	product: Product;
	overrides?: WebManifest;
}): WebManifest {
	const { icons: extraIcons = [], ...rest } = overrides;
	return {
		name: PRODUCTS[product].name,
		short_name: PRODUCTS[product].shortName,
		display: 'standalone',
		background_color: COLORS.white,
		theme_color: COLORS.white,
		...rest,
		icons: [
			{ src: WEB_ICONS.icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: WEB_ICONS.icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
			{ src: WEB_ICONS.maskable192, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
			{ src: WEB_ICONS.maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
			...extraIcons
		]
	};
}

export type HeadTag =
	{ tag: 'link'; attrs: Record<string, string> } | { tag: 'meta'; attrs: Record<string, string> };

/**
 * The tags `BrandHead` writes. `origin` (`https://delegator.dmun.de`) adds the social card, which
 * crawlers need as an absolute URL; `splash` adds the iOS launch images.
 */
export function brandHead({
	product,
	splash = true,
	themeColor = true,
	origin
}: {
	product: Product;
	splash?: boolean;
	themeColor?: boolean;
	origin?: string;
}): HeadTag[] {
	const link = (attrs: Record<string, string>): HeadTag => ({ tag: 'link', attrs });
	const meta = (attrs: Record<string, string>): HeadTag => ({ tag: 'meta', attrs });
	const at = (file: string) => publicPath(file);
	const tags: HeadTag[] = [
		link({ rel: 'icon', href: at(`web/${WEB_ICONS.ico}`), sizes: '32x32' }),
		link({ rel: 'icon', href: at(`web/${WEB_ICONS.svg}`), type: 'image/svg+xml' }),
		link({ rel: 'apple-touch-icon', href: at(`web/${WEB_ICONS.appleTouch}`), sizes: '180x180' }),
		link({ rel: 'manifest', href: at(`web/${WEB_ICONS.manifest}`) }),
		link({ rel: 'mask-icon', href: at(`web/${WEB_ICONS.pinnedTab}`), color: COLORS.blue }),
		meta({ name: 'apple-mobile-web-app-title', content: PRODUCTS[product].shortName })
	];
	if (themeColor) {
		tags.push(
			meta({ name: 'theme-color', media: '(prefers-color-scheme: light)', content: COLORS.white }),
			meta({ name: 'theme-color', media: '(prefers-color-scheme: dark)', content: COLORS.navy })
		);
	}
	if (splash) {
		for (const screen of SPLASH_SCREENS) {
			tags.push(
				link({ rel: 'apple-touch-startup-image', href: at(screen.file), media: screen.media })
			);
		}
	}
	if (origin) {
		const image = new URL(at(OG_CARD.file), origin).href;
		tags.push(
			meta({ property: 'og:image', content: image }),
			meta({ property: 'og:image:width', content: String(OG_CARD.width) }),
			meta({ property: 'og:image:height', content: String(OG_CARD.height) }),
			meta({ property: 'og:image:alt', content: PRODUCTS[product].name }),
			meta({ name: 'twitter:card', content: 'summary_large_image' })
		);
	}
	return tags;
}
