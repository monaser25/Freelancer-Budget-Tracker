// Reproducible PWA icon generator. Renders FlowLedger's "F" monogram on the
// brand accent color and writes minimal PNGs.
//
// Run from this directory:   node generate-icons.mjs
// Writes:                    icon-192.png, icon-512.png, icon-512-maskable.png
//
// The maskable variant pads the artwork into the safe zone (per W3C maskable
// icon spec) so Android can crop it into circles/squircles without clipping.
//
// Pure dependency-free PNG writer. No canvas, no sharp, no native deps.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BRAND_BG = [0x25, 0x63, 0xeb]; // #2563EB
const FG = [0xff, 0xff, 0xff];

const isInsideGlyph = (x, y, size) => {
  // Draw a stylized "F": a vertical bar + two horizontal arms, centered.
  const u = size / 16;
  const left = 4 * u;
  const right = 12 * u;
  const top = 3 * u;
  const bottom = 13 * u;
  const stemRight = 6 * u;
  const arm1Bottom = 6 * u;
  const arm2Top = 8 * u;
  const arm2Bottom = 9.5 * u;
  const arm2Right = 10 * u;

  // Vertical stem
  if (x >= left && x < stemRight && y >= top && y < bottom) return true;
  // Top arm (full width)
  if (x >= left && x < right && y >= top && y < arm1Bottom) return true;
  // Middle arm (slightly shorter)
  if (x >= left && x < arm2Right && y >= arm2Top && y < arm2Bottom) return true;
  return false;
};

const buildPixels = (size, maskable) => {
  // For maskable, shrink the glyph into the 80% safe zone.
  const inset = maskable ? Math.round(size * 0.1) : 0;
  const innerSize = size - inset * 2;
  const pixels = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const localX = x - inset;
      const localY = y - inset;
      const inside =
        localX >= 0 &&
        localX < innerSize &&
        localY >= 0 &&
        localY < innerSize &&
        isInsideGlyph(localX, localY, innerSize);
      const [r, g, b] = inside ? FG : BRAND_BG;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 0xff;
    }
  }
  return pixels;
};

// Minimal PNG encoder (no compression of filters; uses zlib for IDAT).
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const u32be = (n) => Buffer.from([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);

const chunk = (type, data) => {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = u32be(data.length);
  const crc = u32be(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
};

const encodePng = (size, pixels) => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.concat([
    u32be(size),
    u32be(size),
    Buffer.from([8, 6, 0, 0, 0]), // 8-bit, RGBA, no interlace
  ]);
  // Pack rows with filter byte 0 prefix.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
};

const writeIcon = (filename, size, maskable = false) => {
  const png = encodePng(size, buildPixels(size, maskable));
  writeFileSync(join(__dirname, filename), png);
  console.log(`wrote ${filename} (${size}x${size}${maskable ? ', maskable' : ''})`);
};

writeIcon('icon-192.png', 192);
writeIcon('icon-512.png', 512);
writeIcon('icon-512-maskable.png', 512, true);
