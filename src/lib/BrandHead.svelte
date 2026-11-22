<!--
	@component
	The head tags for a product's favicons, manifest, theme colour, iOS launch images and (with
	`origin`) social card. The files themselves are served by the `munifyBrand` Vite plugin
	(`@deutschemodelunitednations/munify-brand/vite`). Put it in the root layout.
-->
<script lang="ts">
	import type { Product } from './products.js';
	import { brandHead } from './web.js';

	let {
		product,
		splash = true,
		themeColor = true,
		origin
	}: {
		product: Product;
		/** The iOS launch images, light and dark */
		splash?: boolean;
		/** `theme-color` white in light mode, navy in dark mode */
		themeColor?: boolean;
		/** The app's origin (`https://delegator.dmun.de`): adds `og:image`, which must be absolute */
		origin?: string;
	} = $props();

	const tags = $derived(brandHead({ product, splash, themeColor, origin }));
</script>

<svelte:head>
	{#each tags as tag (JSON.stringify(tag))}
		{#if tag.tag === 'link'}
			<link {...tag.attrs} />
		{:else}
			<meta {...tag.attrs} />
		{/if}
	{/each}
</svelte:head>
