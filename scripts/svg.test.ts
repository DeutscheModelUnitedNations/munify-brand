import { describe, expect, it } from 'vitest';
import { pad, parseMaster, placeInk, recolor, square, svgDocument, uncolored } from './svg.js';

const master =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 128" width="256" height="128">\n' +
	'  <title id="t">A mark</title>\n' +
	'  <path fill="#01548F" d="M0 0 H10 V10 Z"/>\n</svg>\n';

describe('parseMaster', () => {
	it('reads the viewBox and drops the title', () => {
		expect(parseMaster(master)).toEqual({
			viewBox: { x: 0, y: 0, width: 256, height: 128 },
			body: '<path fill="#01548F" d="M0 0 H10 V10 Z"/>'
		});
	});

	it('refuses a file without viewBox or without the master colour', () => {
		expect(() => parseMaster('<svg><path/></svg>')).toThrow(/viewBox/);
		expect(() => parseMaster(master.replace('#01548F', '#000000'))).toThrow(/#01548F/);
	});
});

describe('colours', () => {
	it('recolours and uncolours the master colour only', () => {
		const body = '<path fill="#01548F"/><path fill="#1B1837"/>';
		expect(recolor({ body, color: '#FFFFFF' })).toBe(
			'<path fill="#FFFFFF"/><path fill="#1B1837"/>'
		);
		expect(uncolored(body)).toBe('<path/><path fill="#1B1837"/>');
	});
});

describe('svgDocument', () => {
	it('writes a titled document with an optional ground', () => {
		const svg = svgDocument({
			box: { x: 0, y: 0, width: 10, height: 5 },
			body: '<path/>',
			title: 'A & B',
			background: '#1B1837'
		});
		expect(svg).toContain('viewBox="0 0 10 5"');
		expect(svg).toContain('<title id="t">A &amp; B</title>');
		expect(svg).toContain('<rect x="0" y="0" width="10" height="5" fill="#1B1837"/>');
	});
});

describe('geometry', () => {
	it('centres the ink in the target at the given fraction', () => {
		const placed = placeInk({
			body: '<path/>',
			ink: { x: 10, y: 10, width: 20, height: 10 },
			target: { x: 0, y: 0, width: 100, height: 100 },
			fraction: 0.5
		});
		// scale = min(100/20, 100/10) * 0.5 = 2.5; ink becomes 50 × 25, centred
		expect(placed).toBe('<g transform="translate(0 12.5) scale(2.5)"><path/></g>');
	});

	it('pads and squares boxes around their centre', () => {
		expect(pad({ box: { x: 0, y: 0, width: 10, height: 4 }, margin: 1 })).toEqual({
			x: -1,
			y: -1,
			width: 12,
			height: 6
		});
		expect(square({ x: 0, y: 0, width: 10, height: 4 })).toEqual({
			x: 0,
			y: -3,
			width: 10,
			height: 10
		});
	});
});
