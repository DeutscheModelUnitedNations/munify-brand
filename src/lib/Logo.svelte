<!--
	@component
	A MUNify mark as inline SVG. It fills with `var(--munify-logo, #01548F)`, so an app sets
	`--munify-logo: #fff` in its dark theme and every logo follows the theme switch; `tone` forces a
	colour. Size it with CSS (`class="h-8 w-auto"`); the viewBox is the mark's tight ink box, so add
	clear space around it yourself (GUIDELINES §2).
-->
<script lang="ts" generics="P extends Product">
	import type { SVGAttributes } from 'svelte/elements';
	import { markOf } from './marks.js';
	import { TONES, markLabel, type Product, type Tone, type Variant } from './products.js';

	type Props = Omit<SVGAttributes<SVGSVGElement>, 'role' | 'viewBox' | 'fill'> & {
		product: P;
		/** Default: `horizontal`, the lockup every product has */
		variant?: Variant<P>;
		/** Force a colour instead of following `--munify-logo` */
		tone?: Tone;
		/** Accessible name; default "MUNify CHASE logo" and so on */
		label?: string;
		/** Hide it from assistive technology, when text next to it already names the product */
		decorative?: boolean;
	};

	let { product, variant, tone, label, decorative = false, ...rest }: Props = $props();

	const mark = $derived(markOf({ product, variant: variant ?? 'horizontal' }));
	const name = $derived(label ?? markLabel({ product, variant: variant ?? 'horizontal' }));
</script>

<svg
	{...rest}
	xmlns="http://www.w3.org/2000/svg"
	viewBox={mark.viewBox}
	fill="currentColor"
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : name}
	aria-hidden={decorative ? 'true' : undefined}
	style:color={tone ? TONES[tone] : 'var(--munify-logo, #01548F)'}
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- generated from the committed masters -->
	{@html mark.body}
</svg>
