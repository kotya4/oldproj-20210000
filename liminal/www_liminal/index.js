window.onload = (async function main() {
  Math.seedrandom('a');
  const colourful = new Colourful();

  const width = 300, height = 300;

  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.style.imageRendering = 'pixelated';
  ctx.canvas.height = height;
  ctx.canvas.width = width;
  document.body.appendChild(ctx.canvas);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Grid.
  const grid_s = 10;
  const grid_w = ~~(width  / grid_s);
  const grid_h = ~~(height / grid_s);
  const grid = Array(grid_w * grid_h).fill(-1);

  // converts coordinates into grid index.
  const I = (x,y) =>
    (x < 0 || x >= grid_w || y < 0 || y >= grid_h)
      ? -1 : ~~x + ~~y * grid_w;

  // maps coordinates from canvas space to grid space.
  const G = (p) => p.map(e => e / grid_s | 0);

  // Draws grid into canvas.
  function draw_grid(ctx) {
    // colors on grid
    for (let y = 0; y < grid_h; ++y)
      for (let x = 0; x < grid_w; ++x)
    {
      const i = I(x, y);
      if (grid[i] === -1) continue;
      ctx.fillStyle = colourful.get(grid[i]);
      ctx.fillRect(x * grid_s, y * grid_s, grid_s, grid_s);
    }
    // grid itself
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    for (let y = 1; y < grid_h; ++y) {
      ctx.moveTo(    0, y * grid_s);
      ctx.lineTo(width, y * grid_s);
    }
    for (let x = 1; x < grid_w; ++x) {
      ctx.moveTo(x * grid_s,      0);
      ctx.lineTo(x * grid_s, height);
    }
    ctx.stroke();
  }


  ////////////////////////////////////////

  // если мы ограничим количетсво комнат, то мы
  // сможем использовать для индексации интежеры.
  // обоснование для ограничения количества комнат в пределах 256.
  // 1) количество комнат ограничено типом элементов массива grid.
  // 2) количетсво комнат ограничено размерами grid (ширина*высота).
  // 3) количество комнат ограничено логикой (мы бы использовали
  //    roomgenerator, если бы не хотели ограничивать себя 2-5 комнатами).
  // 4) индексация комнат через массив поинтеров к линиям или через
  //    массивы, содержащие реальные индексы [room, side, line], не столь
  //    элегантен, нежели через хеши (скомпонованные в int (или long)
  //    реальные индексы). достаточно выделить 256 значений для комнат,
  //    4 значения для сайдов (можно 256 чтобы не париться), и еще
  //    остается 1024 значения для линий (для каждый комнаты для каждого
  //    сайда), а это, если что, дохуя. можно даже сами гэпы засунуть в
  //    в этот хеш, если очень нужно. но это уже излишняя оптимизация.

  ////////////////////////////////////////

  // Настройки комнаты.
  // У каждой комнаты есть ширина и высота.
  // 1 - это размер двери вместе с косяком,
  // т.е. это размер, в который может поместиться и перемещаться игрок.
  const ROOM_PROPS = {
    W_MIN: 5,
    W_MAX: 10,
    W() { return this.W_MIN + Math.random() * (this.W_MAX - this.W_MIN) | 0 },
    H_MIN: 5,
    H_MAX: 10,
    H() { return this.H_MIN + Math.random() * (this.H_MAX - this.H_MIN) | 0 },
  };

  const TRIES = 2;
  const DEPTH = 2;

  // Добавляет комнату в грид.
  function place_room_in_grid(index, x, y, w, h) {
    const imp = Math.random() < 0.5; // imposition
    for (let _y = 0; _y < h; ++_y)
      for (let _x = 0; _x < w; ++_x)
    {
      const i = I(x + _x, y + _y);
      if (imp || grid[i] === -1) {
        grid[i] = index;
      }
    }
  }

  // содержит позицию и размер комнат (с наложением)
  const rooms_rects = [];

  const w = ROOM_PROPS.W();
  const h = ROOM_PROPS.H();
  const x = (grid_w - w) / 2 | 0;
  const y = (grid_h - h) / 2 | 0;

  rooms_rects.push([x, y, w, h]);

  for (let i = 0; i < rooms_rects.length; ++i) {
    const [x, y, w, h] = rooms_rects[i];
    place_room_in_grid(i, x, y, w, h);
    // Создает комнату рядом с существующей
    if (i >= DEPTH) continue; // до определенной
    const ox = x + w / 2; // середина комнаты
    const oy = y + h / 2;
    let a = Math.random() * Math.PI * 2;
    const da = Math.PI * 2 / TRIES;
    for (let k = 0; k < TRIES; ++k) {
      a += da;
      const nw = ROOM_PROPS.W(); // размеры новой комнаты
      const nh = ROOM_PROPS.H();
      const r = (Math.min(w, h) + Math.min(nw, nh)) / 2;
      const nox = ox + r * Math.cos(a);
      const noy = oy + r * Math.sin(a);
      const ni = I(nox, noy);
      if (ni < 0 || grid[ni] !== -1) continue;
      const nx = nox - nw / 2 | 0;
      const ny = noy - nh / 2 | 0;
      rooms_rects.push([nx, ny, nw, nh]);
    }
  }

  draw_grid(ctx);


  //////////////////////////////////////////////////



  // содержит линии, из которых состоят комнаты
  // (без нормализации, с гридовыми позициями,
  // для каждого квадрата несколько линий).
  const rooms_lines = rooms_rects.map(() => [
    [], // линии, смотрящие вправо (левые)
    [], // линии, смотрящие вниз (верхние)
    [], // линии, смотрящие влево (правые)
    [], // линии, смотрящие вверх (нижние)
  ]);

  // 1) найти все линии (соединив все куски в одну)

  // 2) найти соединения этих линий (если мы захотим сместить одну
  // из линий, сосед так же должен сместиться в этой точке)

  // 3) найти наложения, т.е. линии, которые будут потенциальными
  // дверями.

  // normal_side - направление, куда смотрит нормаль
  // нормаль смотрит во внутрь комнаты:
  // 0 - влево
  // 1 - вверх
  // 2 - вправо
  // 3 - вниз

  // гарантированно, что следующее значение для той же линии
  // будет больше предыдущей (локальный конец линии для данной
  // итерации)

  // TODO: возможно, есть более простой вариант генерации.
  //       смотри @js/bus -> grid->outlines
  //       Этот способ генерации выглядит как пиздец, я сам не понимаю,
  //       что здесь происходит. Я написал более приемлимую версию
  //       этого алгоритма (см. @js/creature/grid.js->Grid::make_outlines).
  //       Кроме того, что новый алгоритм не выглядит как блевотина, к тому же
  //       он решает более широкий круг задач, например, способен создавать
  //       линии для lattice из того же класса (а этот - нет).

  // горизонтальные линии, сверху вниз слева направо
  for (let y = 0; y < grid_h; ++y) {
    let ci = -1; // current room index
    let ts = -1; // current line top start x
    let te = -1; // current line top end x
    let bs = -1; // current line bottom start x
    let be = -1; // current line bottom end x
    const save_current_line = () => {
      if (ci === -1) return;
      if (ts !== -1) rooms_lines[ci][1].push([ts, y  , te+1, y  ]);
      if (bs !== -1) rooms_lines[ci][3].push([bs, y+1, be+1, y+1]);
      ts = bs = -1;
    };
    for (let x = 0; x < grid_w; ++x) {
      const oi = I(x, y);
      if (ci !== grid[oi]) save_current_line(); // индекс комнаты поменялся
      ci = grid[oi]; // сохраняем текущий индекс комнаты
      if (ci === -1) continue; // пропускаем, если это не комната
      const ti = I(x, y-1); // линия, смотрящая вниз (верхняя)
      if (ti === -1 || grid[ti] !== ci) {
        if (ts === -1) ts = x; // это новая линия?
        te = x;
      }
      const bi = I(x, y+1); // линия, смотрящая вверх (нижняя)
      if (bi === -1 || grid[bi] !== ci) {
        if (bs === -1) bs = x; // это новая линия?
        be = x;
      }
    }
    save_current_line(); // линия закончилась, нужно ее сохранить
  }

  // вертикальные линии, слева направо сверху вниз
  for (let x = 0; x < grid_w; ++x) {
    let ci = -1; // current room index
    let ls = -1; // current line left start y
    let le = -1; // current line left end y
    let rs = -1; // current line right start y
    let re = -1; // current line right end y
    const save_current_line = () => {
      if (ci === -1) return;
      if (ls !== -1) rooms_lines[ci][0].push([x  , ls, x  , le+1]);
      if (rs !== -1) rooms_lines[ci][2].push([x+1, rs, x+1, re+1]);
      ls = rs = -1;
    };
    for (let y = 0; y < grid_h; ++y) {
      const oi = I(x, y);
      if (ci !== grid[oi]) save_current_line(); // индекс комнаты поменялся
      ci = grid[oi]; // сохраняем текущий индекс комнаты
      if (ci === -1) continue; // пропускаем, если это не комната
      const li = I(x-1, y); // линия, смотрящая вправо (левая)
      if (li === -1 || grid[li] !== ci) {
        if (ls === -1) ls = y; // это новая линия?
        le = y;
      }
      const ri = I(x+1, y); // линия, смотрящая влево (правая)
      if (ri === -1 || grid[ri] !== ci) {
        if (rs === -1) rs = y; // это новая линия?
        re = y;
      }
    }
    save_current_line(); // линия закончилась, нужно ее сохранить
  }

  //////////////////////////////////////////////////

  // индексируем каждую линию, это понадобится позже,
  // когда мы начнем заполнять гэпы.
  // const rooms_indices = rooms_rects.map((room) => );


  //////////////////////////////////////////////////

  // граф соседей комнат
  // смотрим лишь правые и нижние комнаты
  // для всех целов кроме самых правых и самых нижних
  const rooms_neighbours = rooms_rects.map(() => new Set());
  for (let y = 0; y < grid_h - 1; ++y) {
    for (let x = 0; x < grid_w - 1; ++x) {
      const or = grid[I(x  , y  )];
      const rr = grid[I(x+1, y  )];
      const br = grid[I(x  , y+1)];
      if (or === -1) continue;
      if (rr !== -1 && or !== rr) {
        rooms_neighbours[or].add(rr);
        rooms_neighbours[rr].add(or);
      }
      if (br !== -1 && or !== br) {
        rooms_neighbours[or].add(br);
        rooms_neighbours[br].add(or);
      }
    }
  }

  // копируем значения из сета соседей в будущий граф с гэпами.
  // граф с гэпами содержит дупликаты вершин, т.к. гарантируется,
  // что из каждой комнаты можно попасть в соседнюю через одну или
  // больше дверей. чем больше способов - тем больше дупликатов.
  const rooms_gaps = [];
  rooms_neighbours.forEach((e) => rooms_gaps.push([...e]));
  // это можно было бы сделать полным перебором всех
  // линий для каждой, пытаясь понять, накладываются
  // ли они друг на друга, но мы создаем граф
  // и проверяем лишь те линии, для которых
  // комнаты являются соседями.
  const gaps = [];
  for (let neighbours of rooms_neighbours) {

    // если для всех комнат исследовать соседей, так,
    // что для текущей комнаты выбрать правую и нижнюю
    // стороны, а для соседей левую и верхнюю, тогда
    // при проходе по каждому из комнат гэпов-дупликатов
    // не будет.

    for (let cri of neighbours) { // current room index

      const rl = rooms_lines[cri][2]; // right lines
      const bl = rooms_lines[cri][3]; // bottom lines

      for (let nri of neighbours) { // neighbour room index

        if (cri === nri) continue; // скипаем комнату для самой себя

        const ll = rooms_lines[nri][0]; // left lines
        const tl = rooms_lines[nri][1]; // top lines

        // т.к. на этом этапе все линии паралельны
        // или перпендикулярны друг к другу, то
        // достаточно сравнивать лишь по одной точке от
        // каждой линии между собой.

        if (rl[0] === ll[0]) { // вертикальные линии колинеарны
          // линии лежат друг в друге
          if (ll[1] <= rl[1] && rl[1] <  ll[3]
          ||  ll[1] <  rl[3] && rl[3] <= ll[3])
          {
            const y1 = Math.max(ll[1], rl[1]);
            const y2 = Math.min(ll[3], rl[3]);
            const x = rl[0];
            gaps.push([x, y1, x, y2, rl, ll]);

          }
        }

        // то же самое для горизонтальных ...


      }

    }

  }



  // теперь граф необходимо сделать элементарным (без циклов и петель).
  // это станет основой, на которую мы будем "наращивать" удаленные
  // ребра случайным образом. так, все комнаты будут соединены между
  // собой, и случайным образом иметь больше одной двери.
  // данный граф отличается от графа из roomgenerator, т.к. в данным
  // алгоритме могут образоваться петли (несколько дверей из двух
  // соседних комнат).



















  rooms_lines.forEach((e) => {
    const points = []; // сет поинтов
    const lines = []; // два индекса поинтов и нормаль
    // для каждого сайда
    e.forEach((e, si) => {
      const normal = si;
      // для каждой линии в сайде
      e.forEach((e) => {
        // координаты точек
        const p1x = e[0];
        const p1y = e[1];
        const p2x = e[2];
        const p2y = e[3];
        // индексы точек в сете
        let p1i = points.findIndex(p => p[0] === p1x && p[1] === p1y);
        let p2i = points.findIndex(p => p[0] === p2x && p[1] === p2y);
        // если точки не существуют, добавить в сет
        if (p1i < 0) {
          p1i = points.length;
          points.push([p1x, p1y]);
        }
        if (p2i < 0) {
          p2i = points.length;
          points.push([p2x, p2y]);
        }
        // добавить линию в буффер
        lines.push([p1i, p2i, normal]);
      });
    });

    // теперь линии шарят общие точки между собой,
    // и мы можем, изменяя конкретные точки, влиять
    // на несколько линий сразу.

    // давайте сместим стороны линий, чтобы
    // они не накладывались друг на друга
    const pd = 0.2;
    for (let li of lines) {
      const p1 = points[li[0]];
      const p2 = points[li[1]];
      const n = li[2];
      if (n === 0) {
        p1[0] += pd;
        p2[0] += pd;
      }
      if (n === 1) {
        p1[1] += pd;
        p2[1] += pd;
      }
      if (n === 2) {
        p1[0] -= pd;
        p2[0] -= pd;
      }
      if (n === 3) {
        p1[1] -= pd;
        p2[1] -= pd;
      }
    }

    // отрисуем все линии для данной комнаты
    for (let li of lines) {
      const p1 = points[li[0]];
      const p2 = points[li[1]];
      const n = li[2];
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(p1[0] * grid_s, p1[1] * grid_s);
      ctx.lineTo(p2[0] * grid_s, p2[1] * grid_s);
      ctx.stroke();
    }

  });




  //////////////////////////////////////////////////

  // стены с дверями косоебить не будем.
  // косоебим стены, смещая точки вовнутрь комнаты.





});
