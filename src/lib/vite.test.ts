import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { brandResponses, munifyBrand, packageAssets } from './vite.js';

const assets = packageAssets();

describe('brandResponses', () => {
	const responses = brandResponses({ product: 'delegator', manifest: { lang: 'de' } });

	it('serves the product’s own files with their content type', () => {
		const ico = responses.get('/favicon.ico');
		expect(ico?.type).toBe('image/x-icon');
		expect(ico?.body()).toEqual(readFileSync(join(assets, 'delegator/web/favicon.ico')));
		expect(responses.get('/brand/favicon.svg')?.type).toBe('image/svg+xml');
		expect(responses.get('/brand/splash/dark/1179x2556.png')?.type).toBe('image/png');
	});

	it('serves a manifest with the app’s overrides', () => {
		const manifest = responses.get('/brand/site.webmanifest');
		expect(manifest?.type).toBe('application/manifest+json');
		expect(JSON.parse(String(manifest?.body()))).toMatchObject({
			name: 'MUNify DELEGATOR',
			lang: 'de'
		});
	});
});

describe('munifyBrand', () => {
	type Middleware = (
		request: { url?: string },
		response: { setHeader: (name: string, value: string) => void; end: (body: unknown) => void },
		next: () => void
	) => void;

	function middlewareOf(product: 'chase' | 'munify') {
		let middleware: Middleware | undefined;
		const plugin = munifyBrand({ product });
		const hook = plugin.configureServer;
		const server = { middlewares: { use: (fn: Middleware) => (middleware = fn) } };
		// TYPE-SAFETY-EXCEPTION: a stand-in for the ViteDevServer, which only `middlewares.use` is read of
		if (typeof hook === 'function') hook.call(undefined as never, server as never);
		if (!middleware) throw new Error('no middleware');
		return middleware;
	}

	it('answers its paths in dev and passes everything else on', () => {
		const middleware = middlewareOf('chase');
		const headers: Record<string, string> = {};
		let body: unknown;
		let passed = 0;
		const response = {
			setHeader: (name: string, value: string) => (headers[name] = value),
			end: (content: unknown) => (body = content)
		};
		middleware({ url: '/apple-touch-icon.png?v=2' }, response, () => passed++);
		expect(headers['Content-Type']).toBe('image/png');
		expect(body).toEqual(readFileSync(join(assets, 'chase/web/apple-touch-icon.png')));
		middleware({ url: '/dashboard' }, response, () => passed++);
		expect(passed).toBe(1);
	});

	it('emits every file into the client build only', () => {
		const plugin = munifyBrand({ product: 'munify' });
		const emitted: string[] = [];
		const generate = plugin.generateBundle;
		const run = (environment: string) => {
			const context = {
				environment: { name: environment },
				emitFile: ({ fileName }: { fileName: string }) => emitted.push(fileName)
			};
			// TYPE-SAFETY-EXCEPTION: a stand-in for Rollup's plugin context, of which only these two are read
			if (typeof generate === 'function') generate.call(context as never, {} as never, {}, false);
		};
		run('ssr');
		expect(emitted).toEqual([]);
		run('client');
		expect(emitted).toContain('favicon.ico');
		expect(emitted).toContain('brand/site.webmanifest');
		expect(emitted).toContain('brand/og-card.png');
	});
});
