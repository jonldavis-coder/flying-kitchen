import { qrcodegen } from "./qrcodegen.mjs";

export function qrModules(text) {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM);
  const grid = [];
  for (let y = 0; y < qr.size; y += 1) {
    const row = [];
    for (let x = 0; x < qr.size; x += 1) row.push(qr.getModule(x, y));
    grid.push(row);
  }
  return grid;
}

export function rasterQr(text, scale = 6, quiet = 2) {
  const grid = qrModules(text);
  const span = grid.length + quiet * 2;
  const dim = span * scale;
  const data = new Uint8ClampedArray(dim * dim * 4);
  data.fill(255);
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid.length; x += 1) {
      if (!grid[y][x]) continue;
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const px = (x + quiet) * scale + dx;
          const py = (y + quiet) * scale + dy;
          const i = (py * dim + px) * 4;
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 255;
        }
      }
    }
  }
  return { data, dim };
}
