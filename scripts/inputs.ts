import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const ROOT = join(import.meta.dirname, '..');
export const ASSETS = join(ROOT, 'assets');
export const ASSET_MANIFEST = join(ASSETS, 'manifest.json');

/** Every file the generated assets depend on: change one and `bun run generate` must run again. */
const INPUTS = [
	'masters',
	'scripts/generate.ts',
	'scripts/svg.ts',
	'scripts/ico.ts',
	'src/lib/products.ts',
	'src/lib/splash.ts',
	'src/lib/web.ts',
	'node_modules/@resvg/resvg-js/package.json',
	'node_modules/@fontsource/outfit/files/outfit-latin-300-normal.woff'
];

export function filesUnder(path: string): string[] {
	if (!statSync(path).isDirectory()) return [path];
	return readdirSync(path)
		.sort()
		.flatMap((name) => filesUnder(join(path, name)));
}

export const sha = (content: string | Uint8Array) =>
	createHash('sha256').update(content).digest('hex').slice(0, 16);

/** One hash over the inputs, recorded in `assets/manifest.json`. */
export function inputsHash() {
	const hash = createHash('sha256');
	for (const file of INPUTS.flatMap((input) => filesUnder(join(ROOT, input)))) {
		hash.update(relative(ROOT, file)).update('\0').update(readFileSync(file)).update('\0');
	}
	return hash.digest('hex').slice(0, 16);
}

export type AssetManifest = {
	/** {@link inputsHash} the assets were generated from */
	inputs: string;
	/** Path inside `assets/` → content hash */
	files: Record<string, string>;
};
