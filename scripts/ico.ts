/**
 * Packs PNGs into an .ico file. Every browser since IE Vista reads PNG-compressed entries, so no
 * BMP conversion is needed.
 */
export function encodeIco(images: { size: number; png: Uint8Array }[]): Uint8Array {
	const headerSize = 6;
	const entrySize = 16;
	let offset = headerSize + entrySize * images.length;
	const total = offset + images.reduce((sum, image) => sum + image.png.length, 0);
	const out = new Uint8Array(total);
	const view = new DataView(out.buffer);
	view.setUint16(0, 0, true); // reserved
	view.setUint16(2, 1, true); // type: icon
	view.setUint16(4, images.length, true);
	images.forEach((image, index) => {
		if (image.size < 1 || image.size > 256)
			throw new Error(`An icon is 1–256 px, not ${image.size}`);
		const entry = headerSize + entrySize * index;
		view.setUint8(entry, image.size === 256 ? 0 : image.size); // width, 0 means 256
		view.setUint8(entry + 1, image.size === 256 ? 0 : image.size); // height
		view.setUint8(entry + 2, 0); // palette size
		view.setUint8(entry + 3, 0); // reserved
		view.setUint16(entry + 4, 1, true); // colour planes
		view.setUint16(entry + 6, 32, true); // bits per pixel
		view.setUint32(entry + 8, image.png.length, true);
		view.setUint32(entry + 12, offset, true);
		out.set(image.png, offset);
		offset += image.png.length;
	});
	return out;
}
