import { MARKS, type Mark } from './marks.generated.js';
import type { Product, Variant } from './products.js';

export type { Mark };

/** The inline drawing of a mark, without colour. */
export function markOf({ product, variant }: { product: Product; variant: Variant }): Mark {
	const mark = MARKS[product]?.[variant];
	if (!mark) throw new Error(`${product} has no ${variant} mark`);
	return mark;
}
