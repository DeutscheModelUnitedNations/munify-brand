import { describe, expect, it } from 'vitest';
import { SCREENS, SPLASH_SCREENS } from './splash.js';

describe('SPLASH_SCREENS', () => {
	it('has iPhones in portrait, iPads in both orientations, each light and dark', () => {
		const tablets = SCREENS.filter((screen) => screen.tablet).length;
		expect(SPLASH_SCREENS).toHaveLength(2 * (SCREENS.length + tablets));
	});

	it('gives every image its own file, named by its pixel size', () => {
		const files = SPLASH_SCREENS.map((screen) => screen.file);
		expect(new Set(files).size).toBe(files.length);
		expect(files).toContain('splash/light/1320x2868.png');
		expect(files).toContain('splash/dark/2752x2064.png');
	});

	it('picks the scheme by media query', () => {
		const dark = SPLASH_SCREENS.find((screen) => screen.file === 'splash/dark/1179x2556.png');
		expect(dark?.media).toBe(
			'(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and ' +
				'(orientation: portrait) and (prefers-color-scheme: dark)'
		);
	});
});
