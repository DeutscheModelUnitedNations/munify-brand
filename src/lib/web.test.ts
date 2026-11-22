import { describe, expect, it } from 'vitest';
import { SPLASH_SCREENS } from './splash.js';
import { brandHead, publicPath, servedFiles, webManifest } from './web.js';

describe('publicPath', () => {
	it('keeps the two probed files at the root and the rest under /brand', () => {
		expect(publicPath('web/favicon.ico')).toBe('/favicon.ico');
		expect(publicPath('web/apple-touch-icon.png')).toBe('/apple-touch-icon.png');
		expect(publicPath('web/favicon.svg')).toBe('/brand/favicon.svg');
		expect(publicPath('splash/dark/1290x2796.png')).toBe('/brand/splash/dark/1290x2796.png');
		expect(publicPath('og-card.png')).toBe('/brand/og-card.png');
	});
});

describe('servedFiles', () => {
	it('serves every icon, launch image and the social card, but not the static manifest', () => {
		const files = servedFiles();
		expect(files.get('/favicon.ico')).toBe('web/favicon.ico');
		expect(files.get('/brand/maskable-512.png')).toBe('web/maskable-512.png');
		expect(files.get('/brand/og-card.png')).toBe('og-card.png');
		expect(files.has('/brand/site.webmanifest')).toBe(false);
		expect(files.size).toBe(11 + SPLASH_SCREENS.length + 1);
	});
});

describe('webManifest', () => {
	it('names the product and lists any and maskable icons, relative to the manifest', () => {
		const manifest = webManifest({ product: 'chase' });
		expect(manifest).toMatchObject({ name: 'MUNify CHASE', short_name: 'CHASE' });
		expect(manifest.icons?.map((icon) => `${icon.src} ${icon.purpose}`)).toEqual([
			'icon-192.png any',
			'icon-512.png any',
			'maskable-192.png maskable',
			'maskable-512.png maskable'
		]);
	});

	it('merges overrides and appends their icons', () => {
		const manifest = webManifest({
			product: 'delegator',
			overrides: {
				lang: 'de',
				short_name: 'DELEGATOR!',
				screenshots: [{ src: '/a.jpg' }],
				icons: [{ src: '/extra.png', sizes: '64x64', type: 'image/png' }]
			}
		});
		expect(manifest).toMatchObject({
			lang: 'de',
			short_name: 'DELEGATOR!',
			screenshots: [{ src: '/a.jpg' }]
		});
		expect(manifest.icons).toHaveLength(5);
		expect(manifest.icons?.at(-1)?.src).toBe('/extra.png');
	});
});

describe('brandHead', () => {
	const hrefs = (tags: ReturnType<typeof brandHead>) => tags.map((tag) => tag.attrs.href);

	it('links the icons, manifest and every launch image', () => {
		const tags = brandHead({ product: 'delegator' });
		expect(hrefs(tags)).toEqual(
			expect.arrayContaining([
				'/favicon.ico',
				'/brand/favicon.svg',
				'/apple-touch-icon.png',
				'/brand/site.webmanifest',
				'/brand/safari-pinned-tab.svg'
			])
		);
		const startup = tags.filter((tag) => tag.attrs.rel === 'apple-touch-startup-image');
		expect(startup).toHaveLength(SPLASH_SCREENS.length);
		expect(tags.find((tag) => tag.attrs.name === 'apple-mobile-web-app-title')?.attrs.content).toBe(
			'DELEGATOR'
		);
	});

	it('leaves out what is switched off, adds the social card for an origin', () => {
		const tags = brandHead({
			product: 'munify',
			splash: false,
			themeColor: false,
			origin: 'https://munify.cloud'
		});
		expect(tags.some((tag) => tag.attrs.rel === 'apple-touch-startup-image')).toBe(false);
		expect(tags.some((tag) => tag.attrs.name === 'theme-color')).toBe(false);
		expect(tags.find((tag) => tag.attrs.property === 'og:image')?.attrs.content).toBe(
			'https://munify.cloud/brand/og-card.png'
		);
	});

	it('has no social card without an origin', () => {
		expect(brandHead({ product: 'munify' }).some((tag) => tag.attrs.property)).toBe(false);
	});
});
