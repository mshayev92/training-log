/*
 * Generates the PWA icon set from one geometry definition, so the SVG, the
 * manifest PNGs and the Apple touch icon can never drift apart.
 *
 * Deliberately dependency-free: it writes PNGs by hand rather than pulling in
 * an image toolchain for four flat-colour squares. Run with `npm run icons`.
 * The output is committed, so a normal build never needs this.
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const INK = [0x14, 0x16, 0x1a];
const GOLD = [0xff, 0xd5, 0x20];

/* A barbell, in unit coordinates: bar, inner plates, outer plates. */
const SHAPES = [
  [0.14, 0.465, 0.86, 0.535],
  [0.24, 0.26, 0.32, 0.74],
  [0.68, 0.26, 0.76, 0.74],
  [0.14, 0.36, 0.22, 0.64],
  [0.78, 0.36, 0.86, 0.64],
];

/* ------------------------------ PNG writing ------------------------------ */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/** Encodes an RGB pixel buffer (3 bytes per pixel) as a PNG. */
function encodePng(width, height, rgb) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------- rendering ------------------------------- */

/**
 * @param size    pixel width/height
 * @param scale   how much of the canvas the glyph fills (maskable icons pull
 *                the glyph into the safe zone so a circular mask can't clip it)
 * @param radius  corner rounding as a fraction of size; 0 for full bleed
 */
function render(size, { scale = 1, radius = 0 } = {}) {
  const px = Buffer.alloc(size * size * 3);
  const r = radius * size;

  // Supersample so edges and corners don't stair-step.
  const SS = 4;
  const inShapes = (x, y) => {
    const u = 0.5 + (x - 0.5) / scale;
    const v = 0.5 + (y - 0.5) / scale;
    return SHAPES.some(([x0, y0, x1, y1]) => u >= x0 && u <= x1 && v >= y0 && v <= y1);
  };
  const inCanvas = (px_, py_) => {
    if (r === 0) return true;
    const cx = Math.min(Math.max(px_, r), size - r);
    const cy = Math.min(Math.max(py_, r), size - r);
    const dx = px_ - cx;
    const dy = py_ - cy;
    return dx * dx + dy * dy <= r * r;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let gold = 0;
      let opaque = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS;
          const fy = y + (sy + 0.5) / SS;
          if (!inCanvas(fx, fy)) continue;
          opaque++;
          if (inShapes(fx / size, fy / size)) gold++;
        }
      }
      const total = SS * SS;
      // Outside the rounded corner falls back to black, which reads as
      // transparent against every launcher background we care about.
      const cover = opaque / total;
      const t = gold / total;
      const i = (y * size + x) * 3;
      for (let c = 0; c < 3; c++) {
        const inside = INK[c] + (GOLD[c] - INK[c]) * (t / (cover || 1));
        px[i + c] = Math.round(inside * cover);
      }
    }
  }
  return encodePng(size, size, px);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Training log">
  <rect width="100" height="100" rx="22" fill="#14161a"/>
${SHAPES.map(
  ([x0, y0, x1, y1]) =>
    `  <rect x="${x0 * 100}" y="${y0 * 100}" width="${((x1 - x0) * 100).toFixed(2)}" height="${((y1 - y0) * 100).toFixed(2)}" fill="#ffd520"/>`
).join("\n")}
</svg>
`;

mkdirSync(OUT, { recursive: true });

const files = [
  ["icon-192.png", render(192, { radius: 0.22 })],
  ["icon-512.png", render(512, { radius: 0.22 })],
  ["icon-maskable-512.png", render(512, { scale: 0.62 })],
  ["apple-touch-icon.png", render(180)], // iOS applies its own mask
  ["icon.svg", Buffer.from(svg)],
];

for (const [name, data] of files) {
  writeFileSync(join(OUT, name), data);
  console.log(`${name}  ${(data.length / 1024).toFixed(1)} kB`);
}
