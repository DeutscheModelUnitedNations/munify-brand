/** The colours of the identity (DMUN corporate design). */
export const COLORS = {
	/** DMUN-Blau, the logo colour. Never on the navy ground, never over large areas. */
	blue: '#01548F',
	/** The dark ground. On it the logo is white. */
	navy: '#1B1837',
	/** Light ground, approved behind the blue logo besides white. */
	paper: '#F0EFF5',
	white: '#FFFFFF',
	/** One-colour print. */
	black: '#000000'
} as const;

/** The tone a mark is drawn in. `reversed` is white on a navy ground. */
export const TONES = { blue: COLORS.blue, black: COLORS.black, white: COLORS.white } as const;
export type Tone = keyof typeof TONES;

export const PRODUCTS = {
	munify: {
		name: 'MUNify',
		shortName: 'MUNify',
		tagline: 'Open-source software for Model UN conferences',
		variants: ['symbol', 'symbol-small', 'wordmark', 'horizontal', 'stacked']
	},
	chase: {
		name: 'MUNify CHASE',
		shortName: 'CHASE',
		tagline: 'Chairing software',
		variants: ['symbol', 'symbol-small', 'horizontal', 'compact']
	},
	delegator: {
		name: 'MUNify DELEGATOR',
		shortName: 'DELEGATOR',
		tagline: 'Conference management',
		variants: ['symbol', 'symbol-small', 'horizontal', 'compact']
	}
} as const;

export type Product = keyof typeof PRODUCTS;
export type Variant<P extends Product = Product> = (typeof PRODUCTS)[P]['variants'][number];

export const PRODUCT_KEYS: readonly Product[] = ['munify', 'chase', 'delegator'];

export function isProduct(value: string): value is Product {
	return Object.hasOwn(PRODUCTS, value);
}

/** What a variant is called in an accessible name ("MUNify CHASE logo, compact"). */
export function markLabel({ product, variant }: { product: Product; variant: Variant }) {
	const name = PRODUCTS[product].name;
	switch (variant) {
		case 'symbol':
		case 'symbol-small':
			return `${name} symbol`;
		case 'wordmark':
			return `${name} wordmark`;
		default:
			return `${name} logo`;
	}
}
