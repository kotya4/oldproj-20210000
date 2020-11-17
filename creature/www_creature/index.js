window.onload = async function onload() {
  const SEED = Math.random() * 0xffff | 0;
  console.log('SEED: ' + SEED);
  Math.seedrandom(SEED);
  // Math.seedrandom(22291);
  // Math.seedrandom(22291); // TODO: стремный пример с неработающим графом, т.к. rect'ы накладываются друг на друга, нужно исправить fill_rects
  const height = 400;
  const width = 400;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);


  const COLORS = Array(100).fill().map(() => `rgb(${Math.random()*256},${Math.random()*256},${Math.random()*256})`);


  const grid = new Grid(21, 21);
  const rects = grid.fill_rects(2, 2, 5, 10, 5, 10);
  const borders = rects.map((_,i) => grid.make_outlines(i));



  // Minimal imposition length of two colinear outlines,
  // where fits door for player (in grid-space).
  // Set zero if any imposition is ok.
  const THRES = 1;
  // Imposition graph. Index: rect index.
  const graph = borders.map(() => []);
  for (let i = 0; i < borders.length; ++i) {
    for (let k = 0; k < borders.length; ++k) {
      if (i === k) continue;
      // vertical
      const b1Rs = borders[i][2];
      const b2Ls = borders[k][0];
      for (let b1R of b1Rs) for (let b2L of b2Ls) {
        if (b1R[0] === b2L[0]) { // colinear (same row === same x)
          const LR1 = Math.max(b1R[1], b2L[1]);
          const LR2 = Math.min(b1R[3], b2L[3]);
          if (LR2 - LR1 >= THRES) { // impositioned
            const imp = [b1R[0], LR1, b1R[0], LR2]; // x, y1, x, y2 of imposition
            const vertex_i = { border: b1R, index: k, imp };
            const vertex_k = { border: b2L, index: i, imp };
            vertex_i.twin = vertex_k;
            vertex_k.twin = vertex_i;
            graph[i].push(vertex_i);
            graph[k].push(vertex_k);
      } } }
      // horizontal
      const b1Bs = borders[i][3];
      const b2Ts = borders[k][1];
      for (let b1B of b1Bs) for (let b2T of b2Ts) {
        if (b1B[1] === b2T[1]) { // colinear (same column === same y)
          const TB1 = Math.max(b1B[0], b2T[0]);
          const TB2 = Math.min(b1B[2], b2T[2]);
          if (TB2 - TB1 >= THRES) { // impositioned
            const imp = [TB1, b1B[1], TB2, b1B[1]]; // x1, y, x2 y of imposition
            const vertex_i = { border: b1B, index: k, imp };
            const vertex_k = { border: b2T, index: i, imp };
            vertex_i.twin = vertex_k;
            vertex_k.twin = vertex_i;
            graph[i].push(vertex_i);
            graph[k].push(vertex_k);
      } } }
    }
  }

  // Removes duplicit vertices from graph (elementarify).
  (function elementarify__r(graph_i, is_vertex_used) {
    is_vertex_used[graph_i] = true; // отмечаем грань "graph_i" как использованный
    const edges = graph[graph_i];
    const edge_0 = Math.random() * edges.length | 0; // кайндоф случайный порядок перебора
    for (let k = 0; k < edges.length; ++k) { // перебираем все ребра грани "graph_i"
      const edge = edges[(edge_0 + k) % edges.length];
      if (!is_vertex_used[edge.index]) { // если грань ребра еще не была использована, то
        edge.elem = true; // отмечаем это ребро как элементарное
        edge.twin.dupl = true; // отмечаем дупликат ребра как дупликат
        elementarify__r(edge.index, is_vertex_used); // и элементаризуем ребра грани этого ребра
      }
    }
  })(Math.random() * graph.length | 0, []); // начинаем со случайного ребра

  // Good edges number.
  // Good -- can be drew.
  // Best -- must be drew.
  let good_edges_num = 0;
  for (let i = 0; i < graph.length; ++i) {
    for (let k = 0; k < graph[i].length; ++k) {
      if (!graph[i][k].elem && !graph[i][k].dupl) {
        ++good_edges_num;
      }
    }
  }

  // Restores random edges. best_edges_num == 0 then only elementaries.
  (function restore(best_edges_num=0) {
    let edges_i = 0;
    // TODO: there is no random, do permutation.
    const graph_0 = Math.random() * graph.length | 0;
    for (let i0 = 0; i0 < graph.length; ++i0) {
      const i = (graph_0 + i0) % graph.length;
      const edge_0 = graph[i].length;
      for (let k0 = 0; k0 < graph[i].length; ++k0) {
        const k = (edge_0 + k0) % graph[i].length;
        if (!graph[i][k].dupl) {
          if (graph[i][k].elem) graph[i][k].best = true;
          else if (edges_i++ < best_edges_num) graph[i][k].best = true;
        }
      }
    }
  })();



  console.log(graph);


  // ctx.save();
  ctx.lineWidth = 0.5;
  const scale = 10;
  ctx.translate(40, 40);
  ctx.scale(scale, scale);

  grid.draw_grid(ctx, 1, COLORS.reverse());

  // rects
  for (let i = 0; i < borders.length; ++i) {
    // sides
    for (let k = 0; k < borders[i].length; ++k) {
      // lines
      for (let t = 0; t < borders[i][k].length; ++t) {
        const line = borders[i][k][t];
        ctx.strokeStyle = COLORS[k];
        ctx.beginPath();
        ctx.moveTo(line[0], line[1]);
        ctx.lineTo(line[2], line[3]);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }
  // ctx.restore();
  // rects
  for (let i = 0; i < graph.length; ++i) {
    // edges
    for (let k = 0; k < graph[i].length; ++k) {
      if (!graph[i][k].dupl) {
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(graph[i][k].imp[0], graph[i][k].imp[1]);
        ctx.lineTo(graph[i][k].imp[2], graph[i][k].imp[3]);
        ctx.closePath();
        ctx.stroke();
      }
      // elementary/restored edge
      if (graph[i][k].best) {
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(graph[i][k].imp[0], graph[i][k].imp[1]);
        ctx.lineTo(graph[i][k].imp[2], graph[i][k].imp[3]);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }





/*

  // // -- source: rooms/js/roomgenerator.js, line ~158 --
  // Removes duplicit edges from graph (simplify).
  const graph_simple = graph.map(e => new Set(e));

  // Adds full-edges (i.e. if graph[i] contains k, then graph[k] contains i).
  for (let i = 0; i < graph.length; ++i) {
    for (let k of graph_simple[i]) {
      graph_simple[k].add(i);
    }
  }

  // Removes duplicit vertices from graph (elementarify).
  const graph_elementary = graph.map(() => -1);
  const is_vertex_used = graph.map(() => false);
  (function __elementarify__r(i) {
    for (let k of graph_simple[i]) {
      is_vertex_used[i] = true;
      if (is_vertex_used[k]) continue;
      is_vertex_used[k] = true;
      // Uncomment one of lines to make graph elementary.
      // Uncomment both lines to make graph full-edged.
      // graph_elementary[i].push(k);
      // graph_elementary[k].push(i);
      // But we want to save graph configuration,
      // so edges must be added where they originaly were in "graph".
      if (null != graph[i].find(e => e === k))
        // graph_elementary[i].push(k);
        graph_elementary[i] = k;
      else
        graph_elementary[k] = i;
        // graph_elementary[k].push(i);
      __elementarify__r(k);
    }
  })(Math.random() * graph.length | 0); // Randomises first vertex index.



  console.log(graph_imp);
  console.log(graph_elementary);
*/
  // TODO: после того, как граф построен, и определены линии, которые
  //       необходимо оставить (не забываем, что у нас будет ползунок
  //       от 0.0 до 1.0 для выбора распределения удаленных ребер),
  //       нужно определить длину отрезка (который будет
  //       заменен на дверь, окно, и т.д.) и ее позицию, после чего
  //       поделить линии в borders (запомнив, какой из них - отрезок).
  //       только после этого для каждого аулайна вызывается make_joined
  //       и expand_joined (при этом нужно как-то сделать так, чтобы
  //       линии в joined запомнили, где находится отрезок из аутлайна).







  /*

  const outlines = grid.make_outlines();
  const { joined } = grid.make_joined_outlines(outlines);
  grid.expand_joined_outlines(joined, -0.25);

  const CELL_SIZE = 15;

  ctx.save();
  ctx.translate(40, 40);
  ctx.fillStyle = 'grey';
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  grid.draw_grid(ctx, CELL_SIZE, ['red', 'green', 'blue', 'orange', 'hotpink']);
  ctx.strokeStyle = 'white';
  // grid.draw_joined_outlines(ctx, joined, CELL_SIZE);
  grid.draw_outlines(ctx, joined, CELL_SIZE);
  ctx.restore();

  */
};
