import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	ASSETS,
	ASSET_MANIFEST,
	filesUnder,
	inputsHash,
	sha,
	type AssetManifest
} from '../../scripts/inputs.js';
import { PRODUCTS, PRODUCT_KEYS } from './products.js';
import { MARKS } from './marks.generated.js';
import { servedFiles, WEB_ICONS } from './web.js';

const manifest: AssetManifest = JSON.parse(readFileSync(ASSET_MANIFEST, 'utf8'));

describe('the generated assets', () => {
	it('are generated from the current masters and generator (run `bun run generate`)', () => {
		expect(manifest.inputs).toBe(inputsHash());
	});

	it('are exactly the files the generator wrote, unchanged', () => {
		const onDisk = filesUnder(ASSETS)
			.map((file) => relative(ASSETS, file))
			.filter((file) => file !== 'manifest.json')
			.sort();
		expect(onDisk).toEqual(Object.keys(manifest.files).sort());
		for (const [file, hash] of Object.entries(manifest.files)) {
			expect(sha(readFileSync(join(ASSETS, file))), file).toBe(hash);
		}
	});

	it('hold every file an app serves, for every product', () => {
		for (const product of PRODUCT_KEYS) {
			for (const file of [...servedFiles().values(), `web/${WEB_ICONS.manifest}`]) {
				expect(existsSync(join(ASSETS, product, file)), `${product}/${file}`).toBe(true);
			}
		}
	});

	it('hold every variant in every tone, and the marks module draws them all', () => {
		for (const product of PRODUCT_KEYS) {
			for (const variant of PRODUCTS[product].variants) {
				for (const tone of ['blue', 'black', 'white']) {
					expect(manifest.files[`${product}/${variant}-${tone}.svg`]).toBeDefined();
				}
				expect(MARKS[product]?.[variant]?.body).toMatch(/^<(path|g)\b/);
			}
		}
	});
});
