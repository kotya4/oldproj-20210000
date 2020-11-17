window.onload = async function onload() {
  Math.seedrandom('3');
  const height = 400;
  const width = 400;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);


  const grid = new Grid(11, 11);

  grid.gen_cage();
  grid.gen_graph();


  const outlines = grid.calc_outlines();
  const { joined } = grid.join_outlines(outlines);
  grid.expand_joined_outlines(joined, 0.25);


  // Кароче, нужно по-любому делать пешеходные переходы. Без них тухло.
  // Как сделать пешеходные переходы? Нужно выбрать места, где будут
  // светофоры или типа того. Кароче легче всего по рандому натыкать
  // их повсюду, но это не круто. Нужно думать.


  ctx.save();
  ctx.translate(40, 40);
  ctx.fillStyle = 'grey';
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  grid.draw_grid(ctx, 15);
  ctx.strokeStyle = 'green';
  grid.draw_joined_outlines(ctx, joined, 15);
  ctx.restore();


}
