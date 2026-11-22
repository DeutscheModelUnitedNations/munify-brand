// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Logo from './Logo.svelte';
import { MARKS } from './marks.generated.js';

const svgOf = (container: HTMLElement) => {
	const svg = container.querySelector('svg');
	if (!svg) throw new Error('no svg');
	return svg;
};

describe('Logo', () => {
	it('draws the horizontal lockup by default, named for assistive technology', () => {
		const svg = svgOf(render(Logo, { product: 'chase' }).container);
		expect(svg.getAttribute('role')).toBe('img');
		expect(svg.getAttribute('aria-label')).toBe('MUNify CHASE logo');
		expect(svg.getAttribute('viewBox')).toBe(MARKS.chase?.horizontal?.viewBox);
		expect(svg.getAttribute('fill')).toBe('currentColor');
		expect(svg.style.color).toBe('var(--munify-logo, #01548F)');
		expect(svg.querySelector('path')).not.toBeNull();
	});

	it('follows variant, tone and label', () => {
		const svg = svgOf(
			render(Logo, { product: 'delegator', variant: 'symbol', tone: 'white', label: 'Home' })
				.container
		);
		expect(svg.getAttribute('viewBox')).toBe(MARKS.delegator?.symbol?.viewBox);
		expect(svg.style.color).toBe('rgb(255, 255, 255)');
		expect(svg.getAttribute('aria-label')).toBe('Home');
	});

	it('hides a decorative logo and passes other attributes through', () => {
		const svg = svgOf(
			render(Logo, { product: 'munify', decorative: true, class: 'h-8' }).container
		);
		expect(svg.getAttribute('aria-hidden')).toBe('true');
		expect(svg.hasAttribute('role')).toBe(false);
		expect(svg.hasAttribute('aria-label')).toBe(false);
		expect(svg.getAttribute('class')).toBe('h-8');
	});

	it('draws no colour of its own', () => {
		for (const variants of Object.values(MARKS)) {
			for (const mark of Object.values(variants)) expect(mark.body).not.toContain('#01548F');
		}
	});
});
