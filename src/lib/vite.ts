import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import type { Product } from './products.js';
import { WEB_ICONS, publicPath, servedFiles, webManifest, type WebManifest } from './web.js';

const CONTENT_TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
	'.webmanifest': 'application/manifest+json'
};

const contentType = (path: string) =>
	CONTENT_TYPES[path.slice(path.lastIndexOf('.'))] ?? 'application/octet-stream';

/** The package's `assets/`, found from wherever this module runs (`dist/` or `src/lib/`). */
export function packageAssets(from = dirname(fileURLToPath(import.meta.url))): string {
	for (let dir = from; ; dir = dirname(dir)) {
		if (existsSync(join(dir, 'assets', 'manifest.json'))) return join(dir, 'assets');
		if (dirname(dir) === dir) throw new Error('munify-brand: assets/ not found');
	}
}

/** Every response the plugin answers: URL path → content type and bytes. */
export function brandResponses({
	product,
	manifest,
	assets = packageAssets()
}: {
	product: Product;
	manifest?: WebManifest;
	assets?: string;
}): Map<string, { type: string; body: () => Uint8Array | string }> {
	const responses = new Map<string, { type: string; body: () => Uint8Array | string }>();
	for (const [path, file] of servedFiles()) {
		responses.set(path, {
			type: contentType(file),
			body: () => readFileSync(join(assets, product, file))
		});
	}
	const manifestPath = publicPath(`web/${WEB_ICONS.manifest}`);
	responses.set(manifestPath, {
		type: contentType(manifestPath),
		body: () => JSON.stringify(webManifest({ product, overrides: manifest }), null, '\t') + '\n'
	});
	return responses;
}

/**
 * Serves a product's favicons, app icons, manifest, iOS launch images and social card from the
 * package: `/favicon.ico`, `/apple-touch-icon.png` and `/brand/*` (see `servedFiles`). In dev
 * through a middleware, in the build as assets of the client bundle, so nothing is copied into
 * the app's `static/`. `manifest` merges into the generated `site.webmanifest` (description,
 * lang, start_url, screenshots, …).
 *
 * ```ts
 * plugins: [munifyBrand({ product: 'delegator', manifest: { lang: 'de' } }), sveltekit()]
 * ```
 */
export function munifyBrand({
	product,
	manifest
}: {
	product: Product;
	manifest?: WebManifest;
}): Plugin {
	const responses = brandResponses({ product, manifest });
	return {
		name: 'munify-brand',
		configureServer(server) {
			server.middlewares.use((request, response, next) => {
				const path = request.url?.split('?')[0];
				const found = path ? responses.get(path) : undefined;
				if (!found) return next();
				response.setHeader('Content-Type', found.type);
				response.setHeader('Cache-Control', 'no-cache');
				response.end(found.body());
			});
		},
		generateBundle() {
			if (this.environment.name !== 'client') return;
			for (const [path, { body }] of responses) {
				this.emitFile({ type: 'asset', fileName: path.slice(1), source: body() });
			}
		}
	};
}
