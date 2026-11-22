/**
 * The launch images iOS shows while an installed web app starts. iOS takes only an image of the
 * device's exact size, chosen by media query, so there is one per screen; a device missing here
 * starts on a blank screen. Each comes in a light (white ground, blue mark) and a dark (navy
 * ground, white mark) version, picked by `prefers-color-scheme`.
 *
 * The rule they are drawn by: the symbol's ink is {@link SPLASH_INK_FRACTION} of the screen's
 * short edge, centred.
 */

/** Share of the short edge the symbol's ink spans on a splash screen. */
export const SPLASH_INK_FRACTION = 0.345;

/** A screen in CSS pixels, portrait, and its pixel ratio */
export type Screen = { width: number; height: number; ratio: number; tablet?: true };

export const SCREENS: readonly Screen[] = [
	// iPhones
	{ width: 440, height: 956, ratio: 3 }, // 16/17 Pro Max
	{ width: 430, height: 932, ratio: 3 }, // 14 Pro Max, 15/16 Plus, 15 Pro Max
	{ width: 428, height: 926, ratio: 3 }, // 12/13 Pro Max, 14 Plus
	{ width: 420, height: 912, ratio: 3 }, // Air
	{ width: 414, height: 896, ratio: 3 }, // XS Max, 11 Pro Max
	{ width: 414, height: 896, ratio: 2 }, // XR, 11
	{ width: 414, height: 736, ratio: 3 }, // 6/7/8 Plus
	{ width: 402, height: 874, ratio: 3 }, // 16/17 Pro, 17
	{ width: 393, height: 852, ratio: 3 }, // 14 Pro, 15, 15 Pro, 16
	{ width: 390, height: 844, ratio: 3 }, // 12, 13, 14, 16e
	{ width: 375, height: 812, ratio: 3 }, // X, XS, 11 Pro, 12/13 mini
	{ width: 375, height: 667, ratio: 2 }, // 6/7/8, SE 2/3
	{ width: 320, height: 568, ratio: 2 }, // SE
	// iPads
	{ width: 1032, height: 1376, ratio: 2, tablet: true }, // Pro 13"
	{ width: 1024, height: 1366, ratio: 2, tablet: true }, // Pro 12.9"
	{ width: 834, height: 1210, ratio: 2, tablet: true }, // Pro 11" (M4)
	{ width: 834, height: 1194, ratio: 2, tablet: true }, // Pro 11"
	{ width: 820, height: 1180, ratio: 2, tablet: true }, // Air 10.9", 10th gen
	{ width: 834, height: 1112, ratio: 2, tablet: true }, // Air 10.5"
	{ width: 810, height: 1080, ratio: 2, tablet: true }, // 10.2"
	{ width: 768, height: 1024, ratio: 2, tablet: true }, // 9.7", mini 5
	{ width: 744, height: 1133, ratio: 2, tablet: true } // mini 6
];

export type SplashScheme = 'light' | 'dark';

export type SplashImage = {
	/** Pixel size, as in the file name */
	width: number;
	height: number;
	scheme: SplashScheme;
	/** Path inside a product's asset folder, also the path under `/brand/` in an app */
	file: string;
	media: string;
};

function splash({
	screen,
	landscape,
	scheme
}: {
	screen: Screen;
	landscape: boolean;
	scheme: SplashScheme;
}): SplashImage {
	const width = (landscape ? screen.height : screen.width) * screen.ratio;
	const height = (landscape ? screen.width : screen.height) * screen.ratio;
	return {
		width,
		height,
		scheme,
		file: `splash/${scheme}/${width}x${height}.png`,
		media:
			`(device-width: ${screen.width}px) and (device-height: ${screen.height}px) and ` +
			`(-webkit-device-pixel-ratio: ${screen.ratio}) and ` +
			`(orientation: ${landscape ? 'landscape' : 'portrait'}) and ` +
			`(prefers-color-scheme: ${scheme})`
	};
}

/** Every launch image: iPhones only in portrait, iPads in both orientations, light and dark. */
export const SPLASH_SCREENS: readonly SplashImage[] = (['light', 'dark'] as const).flatMap(
	(scheme) =>
		SCREENS.flatMap((screen) => [
			splash({ screen, landscape: false, scheme }),
			...(screen.tablet ? [splash({ screen, landscape: true, scheme })] : [])
		])
);
