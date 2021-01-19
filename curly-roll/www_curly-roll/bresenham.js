function bresenham(ctx, x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1) | 0;
  const dy = Math.abs(y2 - y1) | 0;
  const sx = x1 < x2 ? +1 : -1;
  const sy = y1 < y2 ? +1 : -1;
  let err = (dx > dy ? dx : -dy) >> 1;
  for (let i = dx + dy + 1; i > 0; --i) {
    ctx.fillRect(x1, y1, 1, 1);
    if (x1 === x2 && y1 === y2) break;
    if (err >= -dx) { err -= dy; x1 += sx; }
    if (err <   dy) { err += dx; y1 += sy; }
  }
}
