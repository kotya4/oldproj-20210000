/* gen by new.py at 2020-10-18 07:53:17.099595 */
// Генерация избыточной таблицы граней и комбинаторная закраска
// гомеоморфных колец.
// Цель (вряд ли я забуду, но все же): упростить себе работу,
// т.к. рисовать вручную таблицы неблагодатно, а рассмотрение
// структур с цветами ребер/полей поможет выявить скрытые топологии.
// Если фигура не разложима на цепь граней, мы говорим, что у нее более одной суперграни (не учитывая себя).
// Любая циклоида разложима на кольцо граней. У циклоиды нет суперграней (кроме самой себя).
// что будет если делить количество чистых граней на количество комбинаций? мы придем к чему-нибудь?
window.onload = async function onload() {
  // input
  const links_num = 2;
  const direc_num = 2;
  const areas_num = 2;

  const r = 20;
  const rs = 3;

  const edges = generate_edges(links_num, direc_num, areas_num);
  const g = edges.map(() => -1);
  const cols_num = direc_num ** links_num;
  const rows_num = areas_num ** links_num;
  const height = (cols_num + 1) * r * rs;
  const width = (rows_num + 1) * r * rs;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < edges.length; ++i) {
    const x = r * rs * ((i % rows_num    ) + 1);
    const y = r * rs * ((i / rows_num | 0) + 1);
    const io = [false];
    const gi = gomeomorph(i, edges, g, io);
    ctx.strokeStyle = ctx.fillStyle = io[0] ? 'white' : 'rgb(50,50,50)';
    draw_edge(ctx, x, y, r, edges[i]);
    ctx.fillText(`${i+1}`, x - r*rs/3, y + r*rs/2);
    ctx.fillText(`${gi+1}`, x - r*rs/3, y + r*rs/3);
  }
  ctx.restore();
}


function gomeomorph(ei1, edges, g, is_orig) {
  if (g[ei1] >= 0) return g[ei1];

  function compare_arr(a, b) {
    for (let i = 0; i < a.length; ++i) if (a[i] !== b[i]) return false;
    return true;
  }

  const e = edges[ei1];
  const gi = Math.max(...g) + 1;
  g[ei1] = gi;

  for (let ei2 = 0; ei2 < edges.length; ++ei2) {
    if (ei1 === ei2) continue;
    if (g[ei2] >= 0) continue;
    let flag = false;
    for (let offset = 0; offset < edges[ei1].length; ++offset) {
      for (let i1 = 0; i1 < edges[ei1].length; ++i1) {
        const i2 = (offset + i1) % edges[ei2].length;
        flag = compare_arr(edges[ei1][i1], edges[ei2][i2]);
        if (!flag) break; // link != link
      }
      if (flag) { // edge == edge
        g[ei2] = gi;
        break; // exit from offset and continue comparing edges (all gomeoedges must be found)
      }
    }
  }

  is_orig[0] = true;
  return gi;
}


function generate_edges(links_num, direc_num, areas_num) {
  // converts num into array with base radix and capacity len
  function base(num, radix, len) {
    if (radix > 36) throw Error(`"direc_num" (${direc_num}) and "areas_num" (${areas_num}) must be less than 36 (see Number toString() specs.)`);
    if (radix < 2) return [0];
    const s = num.toString(radix);
    const p = Array(len).fill(0);
    for (let i = 0; i < s.length; ++i) p[p.length-i-1] = parseInt(s[s.length-i-1], radix);
    return p;
  }

  const dnum = direc_num ** links_num;
  const anum = areas_num ** links_num;
  // buffering
  const direc = [];
  const areas = [];
  for (let di = 0; di < dnum; ++di) direc.push(base(di, direc_num, links_num));
  for (let ai = 0; ai < anum; ++ai) areas.push(base(ai, areas_num, links_num));
  // filling edges
  const edges = [];
  for (let di = 0; di < dnum; ++di) for (let ai = 0; ai < anum; ++ai) {
    const d = direc[di];
    const a = areas[ai];
    const e = [];
    for (let i = 0; i < links_num; ++i) e.push([d[i], a[i]]);
    edges.push(e);
  }
  return edges;
}


function draw_edge(ctx, x, y, r, edge) {
  const a = -Math.PI / 6;
  const cr = 4; // center symbol radius
  const ar = 1; // area symbol radius
  const dr = 2; // direction symbol radius (deprecated)
  const dl1 = 4; // direction symbol radius
  const dl2 = 4; // direction symbol offset

  ctx.beginPath();
  ctx.ellipse(x, y, cr, cr, 0, 0, Math.PI * 2);
  ctx.fill();

  const links_num = edge.length;
  const lda = Math.PI * 2 / links_num;
  for (let i = 0; i < links_num; ++i) {

    const lx = x + r * Math.cos(a + lda * i);
    const ly = y + r * Math.sin(a + lda * i);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(lx, ly);
    ctx.stroke();

    const areas_num = edge[i][1];
    const ada = lda / areas_num;
    for (let k = 0; k < areas_num; ++k) {
      const ax = x + (r / 2) * Math.cos(a + lda * i + ada / 2 + ada * k);
      const ay = y + (r / 2) * Math.sin(a + lda * i + ada / 2 + ada * k);
      ctx.beginPath();
      ctx.ellipse(ax, ay, ar, ar, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // // deprecated
    // const direc_num = edge[i][0];
    // for (let k = 0; k < direc_num; ++k) {
    //   const dx = x + (r - dr * 3 * k) * Math.cos(a + lda * i);
    //   const dy = y + (r - dr * 3 * k) * Math.sin(a + lda * i);
    //   ctx.fillStyle = 'black';
    //   ctx.strokeStyle = 'white';
    //   ctx.beginPath();
    //   ctx.ellipse(dx, dy, dr, dr, 0, 0, Math.PI * 2);
    //   ctx.fill();
    //   ctx.stroke();
    // }

    const direc_num = edge[i][0];
    for (let k = 0; k < direc_num; ++k) {
      const dx = x + (r - dl2 * k) * Math.cos(a + lda * i);
      const dy = y + (r - dl2 * k) * Math.sin(a + lda * i);
      const dx1 = dx + dl1 * Math.cos(a + lda * i - Math.PI / 2);
      const dy1 = dy + dl1 * Math.sin(a + lda * i - Math.PI / 2);
      const dx2 = dx + dl1 * Math.cos(a + lda * i + Math.PI / 2);
      const dy2 = dy + dl1 * Math.sin(a + lda * i + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(dx1, dy1);
      ctx.lineTo(dx2, dy2);
      ctx.stroke();
    }
  }
}
