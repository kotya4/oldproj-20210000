window.onload = async function onload() {
  let SEED = Math.random() * 0xffff | 0;
  // SEED = 22291; // TODO: стремный пример с неработающим графом, т.к. rect'ы накладываются друг на друга, нужно исправить fill_rects
  console.log('SEED: ' + SEED);
  Math.seedrandom(SEED);

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

  // array of pass types, each pass has own size, offset, etc.
  // size -- непосредственно размер прохода
  // offset -- отступ от края стены (с одной из сторон)
  const pass_types = [
    { size: 0.5, offset: 0.5 },
    { size: 1.0, offset: 0.5 },
  ];

  // Minimal imposition length of two colinear outlines, where fits smallest pass.
  const smallest_pass_len = pass_types.map(e => e.size + e.offset * 2).sort((a,b) => a - b)[0];
  // Imposition graph. Index === rect index.
  const graph = borders.map(() => []);
  for (let i = 0; i < borders.length; ++i) {
    for (let k = 0; k < borders.length; ++k) {
      if (i === k) continue;
      // vertical
      const b1Rs = borders[i][2];
      const b2Ls = borders[k][0];
      for (let b1Ri = 0; b1Ri < b1Rs.length; ++b1Ri) for (let b2Li = 0; b2Li < b2Ls.length; ++b2Li) {
        const b1R = b1Rs[b1Ri];
        const b2L = b2Ls[b2Li];
        if (b1R[0] === b2L[0]) { // colinear (same row === same x)
          const LR1 = Math.max(b1R[1], b2L[1]);
          const LR2 = Math.min(b1R[3], b2L[3]);
          if (LR2 - LR1 >= smallest_pass_len) { // impositioned
            const imp0 = [LR1, LR2]; // y1, y2 of imposition
            const vertex_i = { index: i, side_i: 2, line_i: b1Ri, type: 'good', imp0 };
            const vertex_k = { index: k, side_i: 0, line_i: b2Li, type: 'dupl', imp0 };
            vertex_i.twin = vertex_k;
            vertex_k.twin = vertex_i;
            graph[i].push(vertex_i);
            graph[k].push(vertex_k);
      } } }
      // horizontal
      const b1Bs = borders[i][3];
      const b2Ts = borders[k][1];
      for (let b1Bi = 0; b1Bi < b1Bs.length; ++b1Bi) for (let b2Ti = 0; b2Ti < b2Ts.length; ++b2Ti) {
        const b1B = b1Bs[b1Bi];
        const b2T = b2Ts[b2Ti];
        if (b1B[1] === b2T[1]) { // colinear (same column === same y)
          const TB1 = Math.max(b1B[0], b2T[0]);
          const TB2 = Math.min(b1B[2], b2T[2]);
          if (TB2 - TB1 >= smallest_pass_len) { // impositioned
            const imp0 = [TB1, TB2]; // x1, x2 of imposition
            const vertex_i = { index: i, side_i: 3, line_i: b1Bi, type: 'good', imp0 };
            const vertex_k = { index: k, side_i: 1, line_i: b2Ti, type: 'dupl', imp0 };
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
      if (!is_vertex_used[edge.twin.index]) { // если грань ребра еще не была использована, то
        edge.type = 'elem';       // отмечаем это ребро как элементарное
        edge.twin.type = 'dupl';  // отмечаем дупликат ребра как дупликат
        elementarify__r(edge.twin.index, is_vertex_used); // и элементаризуем рёбра грани этого ребра
      }
    }
  })(Math.random() * graph.length | 0, []); // начинаем со случайного ребра

  // Filters good edges.
  // Elementary edge -- must be drawn.
  // Duplicit edge -- must not be drawn.
  // Good edge -- can be drawn (not elementary, not duplicit).
  // Best edge -- restored good edge, must be drawn.
  const good_edges = []; // need to permutate later
  for (let i = 0; i < graph.length; ++i) {
    for (let k = 0; k < graph[i].length; ++k) {
      if (graph[i][k].type === 'good') {
        good_edges.push(graph[i][k]);
      }
    }
  }

  // Restores random edges.
  const restored_edges_num = good_edges.length;
  const good_edges_indices = Utils.get_permutation(good_edges.length);
  for (let k0 = 0; k0 < good_edges_indices.length && k0 < restored_edges_num; ++k0) {
    good_edges[good_edges_indices[k0]].type = 'best';
  }


  console.log(graph);


  // creates passes

  // All passes need to be sorted first to reduce inner impositioning.
  const passes_to_sort = [];
  for (let i = 0; i < graph.length; ++i) {
    for (let k = 0; k < graph[i].length; ++k) {
      const edge = graph[i][k];
      if (edge.type === 'elem' || edge.type === 'best') {
        const threshold = edge.imp0[1] - edge.imp0[0];
        const fit_passes_counts = []; // количества помещающихся проходов
        const fit_passes = []; // помещающиеся проходы
        for (let p = 0; p < pass_types.length; ++p) {
          const pass_len = pass_types[p].size + pass_types[p].offset * 2;
          if (threshold - pass_len >= 0) {
            fit_passes.push(pass_types[p]);
            fit_passes_counts.push(threshold / pass_len | 0);
          }
        }
        // choose random pass from fit_passes and how many passes would be placed
        const pass_i = Math.random() * fit_passes.length | 0;
        const pass = fit_passes[pass_i];
        // TODO: proper way of pass counting
        const pass_num = 1; // 1 + Math.random() * fit_passes_counts[pass_i] | 0;

        const pass_pos_1 = edge.imp0[0] + pass.offset + Math.random() * (threshold - (pass.size + pass.offset * 2));
        const pass_pos_2 = pass_pos_1 + pass.size;

        passes_to_sort.push({
          pos0: [pass_pos_1, pass_pos_2],
          edges: [edge, edge.twin],
        });
      }
    }
  }

  const expand_scaler = 0.25;

  const pass_boxes = []; // Boxes such as borders but with slightly another logic on it.
  passes_to_sort.sort((a,b) => a.pos0[0] - b.pos0[0]).forEach(o => {
    const { pos0, edges } = o;
    for (let e of edges) {
      const b = borders[e.index][e.side_i][e.line_i];
      let [x1, y1, x2, y2] = b;
      if (e.side_i === 0 || e.side_i === 2) { // vertical
        y2 = pos0[0];
        y1 = pos0[1];
        // pass box
        // TODO: нужно знать какие границы пренадлежат каким комнатам, чтобы правильно затекстурить и т.д.
        const _x1 = x1+expand_scaler;
        const _x2 = x1-expand_scaler;
        pass_boxes.push([[[_x2, y2, _x2, y1]], [[_x2, y2, _x1, y2]], [[_x1, y2, _x1, y1]], [[_x2, y1, _x1, y1]]]);
      } else { // horisontal
        x2 = pos0[0];
        x1 = pos0[1];
        // pass box
        const _y1 = y1+expand_scaler;
        const _y2 = y1-expand_scaler;
        pass_boxes.push([[[x2, _y2, x2, _y1]], [[x2, _y2, x1, _y2]], [[x1, _y2, x1, _y1]], [[x2, _y1, x1, _y1]]]);
      }
      borders[e.index][e.side_i].push([b[0], b[1], x2, y2]);
      b[0] = x1;
      b[1] = y1;
      // Use this instead if you sort descending.
      // borders[e.index][e.side_i].push([x1, y1, b[2], b[3]]);
      // b[2] = x2;
      // b[3] = y2;
    }
  });







  ctx.lineWidth = 0.15;
  const scale = 15;
  ctx.translate(40, 40);
  ctx.scale(scale, scale);

  // rects
  // grid.draw_grid(ctx, 1, COLORS.reverse());

  // // borders
  for (let i = 0; i < borders.length; ++i) {
    // if (i !== -1) continue;
    // sides
    for (let k = 0; k < borders[i].length; ++k) {
      // lines
      for (let t = 0; t < borders[i][k].length; ++t) {
        const line = borders[i][k][t];
        ctx.strokeStyle = ['red', 'green', 'blue', 'yellow', 'orange', 'pink', 'grey'][i];//'green'; //COLORS[k];
        ctx.beginPath();
        ctx.moveTo(line[0], line[1]);
        ctx.lineTo(line[2], line[3]);
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  // joined
  ctx.strokeStyle = 'white'; //COLORS[k];
  for (let i = 0; i < borders.length; ++i) {
    const { joined, points } = grid.make_joined_outlines(borders[i]);

    for (let k = 0; k < points.length; ++k) {
      // points[k][0] += (Math.random() * 2 - 1) / 2;
      // points[k][1] += (Math.random() * 2 - 1) / 2;
    }

    grid.expand_joined_outlines(joined, -expand_scaler);
    grid.draw_outlines(ctx, joined, 1);
  }


  // joined boxes
  ctx.strokeStyle = 'hotpink'; //COLORS[k];
  for (let i = 0; i < pass_boxes.length; ++i) {
    const { joined, points } = grid.make_joined_outlines(pass_boxes[i]);
    grid.draw_outlines(ctx, joined, 1);
  }

};
