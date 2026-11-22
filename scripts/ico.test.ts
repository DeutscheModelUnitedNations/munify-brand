import { describe, expect, it } from 'vitest';
import { encodeIco } from './ico.js';

describe('encodeIco', () => {
	it('writes the header, one entry per image and the PNGs after them', () => {
		const a = new Uint8Array([1, 2, 3]);
		const b = new Uint8Array([4, 5]);
		const ico = encodeIco([
			{ size: 16, png: a },
			{ size: 256, png: b }
		]);
		const view = new DataView(ico.buffer);
		expect(view.getUint16(2, true)).toBe(1); // icon
		expect(view.getUint16(4, true)).toBe(2); // two images
		expect(view.getUint8(6)).toBe(16);
		expect(view.getUint8(6 + 16)).toBe(0); // 256 is written as 0
		expect(view.getUint32(6 + 8, true)).toBe(3);
		expect(view.getUint32(6 + 12, true)).toBe(38); // 6 + 2 × 16
		expect(view.getUint32(6 + 16 + 12, true)).toBe(41);
		expect([...ico.slice(38)]).toEqual([1, 2, 3, 4, 5]);
	});

	it('refuses sizes an icon cannot have', () => {
		expect(() => encodeIco([{ size: 512, png: new Uint8Array() }])).toThrow(/1–256/);
	});
});
