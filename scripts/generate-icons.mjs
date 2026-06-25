#!/usr/bin/env node
/* Generate PWA PNG icons with zero dependencies (Node's built-in zlib only).
 * Run:  node scripts/generate-icons.mjs
 *
 * Draws a "haloed person" mark on an indigo→violet gradient:
 *   - rounded square background (full-bleed for maskable / apple-touch)
 *   - golden halo ring
 *   - white head + shoulders (the human)
 * Uses 4x supersampling for smooth edges.
 */
import zlib from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "icons");
mkdirSync(OUT, { recursive: true });

/* ---- palette -------------------------------------------------------- */
const C_A = [67, 56, 202]; // indigo-700  (#4338CA)
const C_B = [126, 34, 206]; // purple-700 (#7E22CE)
const WHITE = [248, 250, 252]; // #F8FAFC
const GOLD = [251, 191, 36]; // amber-400  #FBBF24

const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);

/* Composite src (rgb) with alpha a over dst (rgb), in place-ish. */
function over(dst, src, a) {
  return [lerp(dst[0], src[0], a), lerp(dst[1], src[1], a), lerp(dst[2], src[2], a)];
}

/* Signed-distance test for a rounded square in normalized [0,1] space. */
function insideRoundedSquare(nx, ny, r) {
  const qx = Math.abs(nx - 0.5);
  const qy = Math.abs(ny - 0.5);
  const dx = Math.max(qx - (0.5 - r), 0);
  const dy = Math.max(qy - (0.5 - r), 0);
  return Math.hypot(dx, dy) - r <= 0;
}

/* Return [r,g,b,a] (a in 0..255) for one sub-sample at normalized (nx,ny). */
function sample(nx, ny, opts) {
  const { fullBleed, cornerR, glyph } = opts;

  if (!fullBleed && !insideRoundedSquare(nx, ny, cornerR)) {
    return [0, 0, 0, 0]; // transparent outside the rounded square
  }

  // background gradient (top-left -> bottom-right)
  const t = (nx + ny) / 2;
  let col = [lerp(C_A[0], C_B[0], t), lerp(C_A[1], C_B[1], t), lerp(C_A[2], C_B[2], t)];

  // map into glyph space (glyph occupies `glyph` fraction of the icon)
  const gx = 0.5 + (nx - 0.5) / glyph;
  const gy = 0.5 + (ny - 0.5) / glyph;

  // halo ring around the head
  const dHalo = dist(gx, gy, 0.5, 0.42);
  if (dHalo >= 0.245 && dHalo <= 0.3) {
    col = over(col, GOLD, 0.95);
  } else if (dHalo > 0.3 && dHalo <= 0.34) {
    col = over(col, GOLD, 0.95 * (1 - (dHalo - 0.3) / 0.04)); // soft outer glow
  }

  // shoulders (a dome rising from the bottom)
  if (dist(gx, gy, 0.5, 1.07) <= 0.46) {
    col = over(col, WHITE, 1);
  }
  // head
  if (dist(gx, gy, 0.5, 0.4) <= 0.165) {
    col = over(col, WHITE, 1);
  }

  return [col[0], col[1], col[2], 255];
}

/* Render an icon to an RGBA buffer using SSxSS supersampling. */
function render(size, opts) {
  const SS = 4;
  const n = SS * SS;
  const buf = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let aR = 0, aG = 0, aB = 0, aA = 0;
      for (let j = 0; j < SS; j++) {
        for (let i = 0; i < SS; i++) {
          const nx = (px + (i + 0.5) / SS) / size;
          const ny = (py + (j + 0.5) / SS) / size;
          const [r, g, b, a] = sample(nx, ny, opts);
          const a01 = a / 255;
          aR += r * a01; aG += g * a01; aB += b * a01; aA += a01;
        }
      }
      const o = (py * size + px) * 4;
      if (aA > 0) {
        buf[o] = Math.round(aR / aA);
        buf[o + 1] = Math.round(aG / aA);
        buf[o + 2] = Math.round(aB / aA);
        buf[o + 3] = Math.round((aA / n) * 255);
      } // else leave fully transparent (0,0,0,0)
    }
  }
  return buf;
}

/* ---- minimal PNG encoder (8-bit RGBA) ------------------------------- */
function crc32(buf) {
  if (typeof zlib.crc32 === "function") return zlib.crc32(buf) >>> 0;
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // filter byte (0) per scanline
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

/* ---- outputs -------------------------------------------------------- */
const TARGETS = [
  { file: "icon-192.png", size: 192, opts: { fullBleed: false, cornerR: 0.22, glyph: 0.92 } },
  { file: "icon-512.png", size: 512, opts: { fullBleed: false, cornerR: 0.22, glyph: 0.92 } },
  { file: "icon-maskable-512.png", size: 512, opts: { fullBleed: true, cornerR: 0, glyph: 0.6 } },
  { file: "apple-touch-icon.png", size: 180, opts: { fullBleed: true, cornerR: 0, glyph: 0.78 } }
];

for (const t of TARGETS) {
  const png = encodePNG(t.size, render(t.size, t.opts));
  writeFileSync(join(OUT, t.file), png);
  console.log(`wrote icons/${t.file} (${t.size}x${t.size}, ${png.length} bytes)`);
}

/* favicon as crisp vector */
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="Who Am I?">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4338ca"/>
      <stop offset="1" stop-color="#7e22ce"/>
    </linearGradient>
  </defs>
  <rect x="1.5" y="1.5" width="61" height="61" rx="13" fill="url(#g)"/>
  <circle cx="32" cy="27" r="15.5" fill="none" stroke="#fbbf24" stroke-width="3.1"/>
  <circle cx="32" cy="26" r="9.4" fill="#f8fafc"/>
  <path d="M13.5 57 a18.5 18.5 0 0 1 37 0 Z" fill="#f8fafc"/>
</svg>
`;
writeFileSync(join(OUT, "favicon.svg"), FAVICON);
console.log("wrote icons/favicon.svg");
