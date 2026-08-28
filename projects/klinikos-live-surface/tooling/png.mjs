/* Minimal PNG reader: enough to sample pixels from a Chromium screenshot.
   Handles 8-bit RGB/RGBA, all five filter types, zlib via node:zlib. */
import zlib from "node:zlib";

export function PNG(buf) {
  let pos = 8, width = 0, height = 0, depth = 0, ctype = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      depth = data[8]; ctype = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (depth !== 8) throw new Error("unsupported PNG bit depth " + depth);
  const ch = ctype === 6 ? 4 : ctype === 2 ? 3 : ctype === 0 ? 1 : -1;
  if (ch < 0) throw new Error("unsupported PNG colour type " + ctype);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const out = Buffer.alloc(height * stride);
  let ri = 0;
  for (let y = 0; y < height; y++) {
    const f = raw[ri++];
    const line = raw.subarray(ri, ri + stride); ri += stride;
    const cur = out.subarray(y * stride, y * stride + stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }
  return {
    width, height,
    at(x, y) {
      if (x < 0 || y < 0 || x >= width || y >= height) return null;
      const i = y * stride + x * ch;
      return ch === 1 ? [out[i], out[i], out[i]] : [out[i], out[i + 1], out[i + 2]];
    },
  };
}
