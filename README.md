# MUNify brand

`@deutschemodelunitednations/munify-brand` is the logo universe of MUNify, the open-source
initiative of Deutsche Model United Nations e.V., and of its products CHASE and DELEGATOR: every
mark in every tone, favicons, app and maskable icons, web app manifests, iOS launch images and
social cards. On top of the files it gives SvelteKit apps a `<Logo>` component, a `<BrandHead>`
component and a Vite plugin that serves the icon set, so no app keeps its own copies.

The same files are on the CDN under `https://cdn.dmun.de/cdn/munify/` (`cdn-container`, committed
by hand from `assets/`). How to use the marks — clear space, minimum sizes, colours, don'ts — is
in [GUIDELINES.md](./GUIDELINES.md).

## What is in it

| Import                                                   | What                                                                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `@deutschemodelunitednations/munify-brand`               | `Logo`, `BrandHead`, `COLORS`, `PRODUCTS`, `brandHead()`, `webManifest()`, `SPLASH_SCREENS`, `markOf()`     |
| `@deutschemodelunitednations/munify-brand/vite`          | `munifyBrand({ product, manifest })`, the Vite plugin serving the web icon set                              |
| `@deutschemodelunitednations/munify-brand/assets/<file>` | any generated file, e.g. `assets/chase/horizontal-blue.svg` (Vite turns the import into a hashed asset URL) |

### Files

Per product (`munify`, `chase`, `delegator`) in `assets/<product>/`:

| File                                    | What                                                                                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<variant>-{blue,black,white}.svg/.png` | the mark in one colour, transparent                                                                                                                            |
| `<variant>-reversed.svg/.png`           | white on navy `#1B1837`                                                                                                                                        |
| `<variant>-on-white.svg/.png`           | blue on white with 22 % clear space, for documents and partners                                                                                                |
| `symbol-small-{blue,black,white}.svg`   | the small-size cut, below 24 px                                                                                                                                |
| `lift-{blue,reversed}.svg/.png`         | the depth set, screens only (marketing, stores)                                                                                                                |
| `og-card.svg/.png`                      | 1200×630 link preview: white lockup and tagline on navy                                                                                                        |
| `web/`                                  | `favicon.ico`, dark-aware `favicon.svg`, PNG favicons, `apple-touch-icon.png`, `icon-192/512`, `maskable-192/512`, `safari-pinned-tab.svg`, `site.webmanifest` |
| `splash/{light,dark}/<w>x<h>.png`       | iOS launch images, 31 screens each                                                                                                                             |

Variants: MUNify `symbol`, `symbol-small`, `wordmark`, `horizontal`, `stacked`; CHASE and
DELEGATOR `symbol`, `symbol-small`, `horizontal` (the sub-brand lockup), `compact`. PNGs are 2000 px
on the long edge. The repository and the CDN also hold `-hires.png` (8000 px) for print; the npm
package leaves them out.

## Using it in a SvelteKit app

```bash
bun add @deutschemodelunitednations/munify-brand
```

**Icons, manifest, launch images, social card.** Add the plugin and put `BrandHead` in the root
layout. Delete the app's own `favicon*`, `apple-touch-icon*`, `android-chrome-*`, `maskable-*`,
`safari-pinned-tab.svg`, `site.webmanifest` and splash screens from `static/`.

```ts
// vite.config.ts
import { munifyBrand } from '@deutschemodelunitednations/munify-brand/vite';

export default defineConfig({
	plugins: [
		munifyBrand({
			product: 'delegator',
			// merged into the generated manifest; icons are added by the plugin
			manifest: { lang: 'de', description: '…', start_url: '/', screenshots: [/* … */] }
		}),
		sveltekit()
	]
});
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import { BrandHead } from '@deutschemodelunitednations/munify-brand';
</script>

<BrandHead product="delegator" origin="https://delegator.dmun.de" />
```

The plugin answers `/favicon.ico`, `/apple-touch-icon.png` (both probed by browsers on their own)
and everything under `/brand/` — in dev from a middleware, in the build as files of the client
bundle. `BrandHead` writes the matching `<link>`/`<meta>` tags: favicons, manifest, mask icon,
`theme-color` (white / navy), the 62 `apple-touch-startup-image` links (`splash={false}` to drop)
and, given `origin`, `og:image`.

**Logos in the UI.**

```svelte
<script lang="ts">
	import { Logo } from '@deutschemodelunitednations/munify-brand';
</script>

<Logo product="chase" class="h-10 w-auto" />
<Logo product="delegator" variant="symbol" class="size-8" decorative />
```

The logo is inline SVG and fills with `var(--munify-logo, #01548F)`. Set that variable to white in
the dark theme and every logo follows the theme switch — DMUN-Blau never goes on the dark ground:

```css
[data-theme='dark'] {
	--munify-logo: #fff;
}
```

`tone="blue" | "white" | "black"` forces a colour. The `viewBox` is the mark's tight ink box, so
keep the clear space (GUIDELINES §2) with margin around it. It is named for screen readers ("MUNify
CHASE logo", `label` to change); `decorative` hides it next to text that already names the
product.

**Any other file**: `import card from '@deutschemodelunitednations/munify-brand/assets/munify/og-card.png'`.

Apps that are not SvelteKit (the Docusaurus manual) copy what they need from
`node_modules/@deutschemodelunitednations/munify-brand/assets/` or link the CDN.

## Development

```bash
bun install
bun run generate  # render assets/ and src/lib/marks.generated.ts from masters/ (~1 min)
bun run check     # svelte-check
bun run test      # vitest
bun run build     # svelte-package into dist/
```

`masters/<product>/<variant>.svg` are the only drawings: one per mark, in DMUN-Blau `#01548F`.
Every tone, raster, icon, launch image and card is derived from them by `scripts/generate.ts`
(resvg; the card taglines outlined from Outfit Light). The output is committed, and
`assets.test.ts` fails when it is older than its inputs (masters, generator, renderer version), so
run `bun run generate` after changing any of them — also after reformatting the generator.

The geometry of the marks is Python in `workspace/` (`build.py`, `products.py`), kept from the
design work: redraw there, copy the blue result into `masters/`, generate.

**After a release**, refresh the CDN: copy `assets/` to `cdn-container/cdn/munify/` and commit.

## Releasing

Publish a GitHub release tagged `v<version>` (`gh release create v0.2.0 --generate-notes`). The
tag is the version: the release workflow sets it in `package.json` before publishing, so no bump
commit is needed. The workflow checks, tests, builds and publishes to npm through **trusted
publishing** — no token: npm trusts `release.yml` of this repository through GitHub's OIDC token,
and the package gets provenance.

A version npm already has is skipped with a notice instead of failing the run (`0.1.0` was
published by hand, as npm offers trusted publishing only for a package that exists).

The npm side, set up once in the package's settings on npmjs.com: **Trusted publishing** names
organisation `DeutscheModelUnitedNations`, repository `munify-brand`, workflow `release.yml`, no
environment; **Publishing access** should "Require two-factor authentication and disallow tokens",
so only the workflow can publish.

## Licence

Code (`src/`, `scripts/`, `workspace/`): [MIT](./LICENSE). The marks (`masters/`, `assets/`, the
drawings in `src/lib/marks.generated.ts`): © Deutsche Model United Nations e.V.,
[CC BY-ND 4.0](./LICENSE-MARKS.md) — share them unchanged with credit; the licence grants no
trademark rights.
