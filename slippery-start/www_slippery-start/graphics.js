class RasterFont {
  constructor(o) {
    const {
      buffer_width  = 8 * 16 * 8,
      buffer_height = 12 * 16 * 2,
      colors_str    = RasterFont.WINCOLORS_STR,
      table_src     = RasterFont.FIXEDSYS_SRC,
      char_width    = 8,
      char_height   = 12,
      table_width   = 16,
      table_height  = 16,
    } = o || {};

    this.colors_str = colors_str;
    this.colors_offsets = [];
    this.char_width = char_width;
    this.char_height = char_height;
    this.table_width = table_width;
    this.table_height = table_height;

    // creates buffer containing font populated w/ colors.
    this.buffer = document.createElement('canvas').getContext('2d');
    this.buffer.canvas.width = buffer_width;
    this.buffer.canvas.height = buffer_height;
    this.buffer.canvas.imageSmoothingEnabled = false;

    // creates image from table source.
    const img = new Image();
    img.src = table_src;
    this.promise = new Promise((res,rej) => {
      img.onerror = rej;
      img.onload = () => {
        // color buffer to make sourse-in composite operation
        const color_buffer = document.createElement('canvas').getContext('2d');
        color_buffer.canvas.width = this.buffer.canvas.width;
        color_buffer.canvas.height = this.buffer.canvas.height;
        color_buffer.canvas.imageSmoothingEnabled = false;
        // clear buffers
        this.buffer.clearRect(0, 0, this.buffer.canvas.width, this.buffer.canvas.height);
        color_buffer.clearRect(0, 0, this.buffer.canvas.width, this.buffer.canvas.height);
        this.colors_offsets.length = 0;
        let x = 0;
        let y = 0;
        for (let i = 0; i < this.colors_str.length; ++i) {
          // fill table buffer
          this.buffer.drawImage(img, x, y);
          // fill color buffer
          color_buffer.fillStyle = this.colors_str[i];
          color_buffer.fillRect(x, y, img.width, img.height);
          // save offsets
          this.colors_offsets.push([x, y]);
          // increase offsets
          x += img.width;
          if (x + img.width > this.buffer.canvas.width) {
            x = 0;
            y += img.height;
            if (y + img.height > this.buffer.canvas.height) {
              // out of buffer range
              break;
            }
          }
        }
        // apply color buffer
        this.buffer.globalCompositeOperation = 'source-in';
        this.buffer.drawImage(color_buffer.canvas, 0, 0);
        this.buffer.globalCompositeOperation = 'source-over';
        res();
      };
    });
  }

  // draws character from table buffer.
  draw(ctx, x, y, char_i, color_i) {
    ctx.drawImage(
      this.buffer.canvas,
      this.colors_offsets[color_i][0] + (char_i % this.table_width    ) * this.char_width,
      this.colors_offsets[color_i][1] + (char_i / this.table_width | 0) * this.char_height,
      this.char_width,
      this.char_height,
      x * this.char_width,
      y * this.char_height,
      this.char_width,
      this.char_height,
    );
  }

  // draws bg.
  rect(ctx, x, y, color_i) {
    ctx.fillRect(
      x * this.char_width,
      y * this.char_height,
      this.char_width,
      this.char_height,
    );
  }

  // ptc(x, y) {
  //   return [x / this.char_width | 0, y / this.char_height | 0];
  // }
}


// microsoft windows command promt colors
RasterFont.WINCOLORS_STR = [
  '#000000', // 0 black
  '#800000', // 1 red
  '#008000', // 2 green
  '#808000', // 3 yellow
  '#000080', // 4 blue
  '#800080', // 5 magenta
  '#008080', // 6 cyan
  '#c0c0c0', // 7 grey
  '#808080',
  '#ff0000',
  '#00ff00',
  '#ffff00',
  '#0000ff',
  '#ff00ff',
  '#00ffff',
  '#ffffff',
];


// original fixedsys8x12 black/transparent 16x16 (256) characters image
RasterFont.FIXEDSYS_SRC = '\
data:image/png;base64,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\
79+DL8NwBM6Dl3I1lPbAAAAABJRU5ErkJggg==';


class DisplayBuffer {
  constructor(o) {
    const {
      width     = 80,
      height    = 25,
      textcolor = 7,
      bgcolor   = 0,
      char      = 0,
    } = o || {};

    // used in stroke to choose between symbols
    this.weights = Array(10).fill().map(Math.random);

    this.textcolor_buffer = Array(width).fill().map(() => Array(height).fill(textcolor));
    this.bgcolor_buffer = Array(width).fill().map(() => Array(height).fill(bgcolor));
    this.char_buffer = Array(width).fill().map(() => Array(height).fill(char));
    this.height = height;
    this.width = width;

    // used to create depth slices
    this.stencil_buffer = Array(width).fill(0);
    this.stencil_value = 0;

    this.rf = new RasterFont();

    const opacity=0.1;
    this.colors = [
      `rgba(146.01773348372205,225.38094909231262,250.2419597323884,${opacity})`,
      `rgba(82.2617825081445,157.1359728253633,245.0576851886741,${opacity})`,
      `rgba(142.09978244450764,5.586658644452086,115.73455717596903,${opacity})`,
      `rgba(115.07858925421192,190.34087394917748,213.6766997492074,${opacity})`,
      `rgba(106.48704351523975,172.6733471068868,40.798703922355344,${opacity})`,
      `rgba(18.99635584618352,5.306587158250409,65.85462455995389,${opacity})`,
      `rgba(155.4515060631868,15.236156613133574,42.914512473024786,${opacity})`,
      `rgba(245.99781845017918,73.79262727956018,12.673849177211991,${opacity})`,
      `rgba(211.31188114993898,252.50210504344784,198.00567362375028,${opacity})`,
      `rgba(214.45324480062214,197.42443336260413,196.45589726237154,${opacity})`,
    ];
  }

  get_display_sizes() {
    return [
      this.width * 8,
      this.height * 12,
    ];
  }

  is_in_range(x, y) {
    return !(x < 0 || x >= this.width || y < 0 || y >= this.height);
  }

  test_stencil(x, y, ignore_bits=0) {
    x = ~~x;
    if (x < 0 || x >= this.width) return false;
    return (this.stencil_buffer[x] | ignore_bits) === (this.stencil_value | ignore_bits);
  }

  flush_stencil(v=0) {
    this.stencil_value = v;
    for (let i = 0; i < this.stencil_buffer.length; ++i)
      this.stencil_buffer[i] = v;
  }

  rect_stencil_ptc(x, y, w, h, v) {
    // TODO: y is depricated, use fill_stencil_ptc
    fill_stencil_ptc(x, w, v);
  }

  fill_stencil_ptc(x, w, v) {
    x /= 8;
    w /= 8;
    const dx = w >= 0 ? +1 : -1;
    x = Math.round(x);
    w = Math.round(w);
    for (let x_ = 0; x_ < Math.abs(w); ++x_) {
      const _x_ = x + x_;
      if (_x_ < 0 || _x_ >= this.width) continue;
      this.stencil_buffer[_x_] = v;
    }
  }

  get_char(x, y) {
    if (!this.is_in_range(x, y)) return null;
    return this.char_buffer[x][y];
  }

  get_textcolor(x, y) {
    if (!this.is_in_range(x, y)) return null;
    return this.textcolor_buffer[x][y];
  }

  // get_bgcolor(x, y) {
  //   if (!this.is_in_range(x, y)) return null;
  //   return this.bgcolor_buffer[x][y];
  // }

  // set_char(x, y, v) {
  //   if (!this.is_in_range(x, y)) return null;
  //   return (this.char_buffer[x][y] = v);
  // }

  // set_textcolor(x, y, v) {
  //   if (!this.is_in_range(x, y)) return null;
  //   return (this.textcolor_buffer[x][y] = v);
  // }

  // set_bgcolor(x, y, v) {
  //   if (!this.is_in_range(x, y)) return null;
  //   return (this.bgcolor_buffer[x][y] = v);
  // }


  stroke_ptc(x1, y1, x2, y2, o={}) {
    const {
      force_dx            = null,
      overlap             = true,
      stencil_ignore_mask = 0,
    } = o;


    let color=null; // HACK: args

    x1 /= 8;
    y1 /= 12;
    x2 /= 8;
    y2 /= 12;

    let dx = x2 - x1;
    let dy = y2 - y1;
    const steps_num = Math.abs(dx) > Math.abs(dy) ? Math.abs(dx) : Math.abs(dy);
    dx /= steps_num;
    dy /= steps_num;
    const abdx = Math.abs(dx);
    const abdy = Math.abs(dy);
    // HACK: to reduce breaks on vetical lines (but creates a bit of distortion on diagonales, so idk..)
    if (null != force_dx) dx = force_dx;

    const SLASH = '\\/'[dy * dx < 0 | 0];

    const is_gradient = color instanceof Array;
    const gradient_len = is_gradient ? steps_num / color.length : 1;

    for (let i = 0; i < steps_num; ++i) {
      const __charat = (s) => s.charCodeAt(this.weights[i % this.weights.length] * s.length | 0);

      const x = ~~x1;
      const y = ~~y1;
      const px = x1 - x;
      const py = y1 - y;
      x1 += dx;
      y1 += dy;

      if (!this.is_in_range(x, y)) continue;
      if (!this.test_stencil(x, y, stencil_ignore_mask)) continue;

      if (is_gradient) {
        this.textcolor_buffer[x][y] = color[i/gradient_len|0];
      } else if (color != null) {
        this.textcolor_buffer[x][y] = color;
      }

      if (overlap === false && this.char_buffer[x][y] !== 0) {
        continue;
      }

      if (abdx !== 1) {
        // HACK: to reduce number of sticknig out vertical symbols on top and bottom
        if (i === 0 && dy > 0 && py >= 0.5) {
          this.char_buffer[x][y] = __charat('.,');
          continue;
        }
        if (i > steps_num - 2 && dy > 0 && py >= 0.85) {
          this.char_buffer[x][y] = __charat(`'`);
          continue;
        }

        if (px < abdx) {
          this.char_buffer[x][y] = __charat(this.weights[i % this.weights.length] < (abdx - 0.5) ? SLASH : ';:');
        } else {
          this.char_buffer[x][y] = __charat('|');
        }
        continue;
      }

      if (abdy <= 0.35) {
        this.char_buffer[x][y] = ['`', `'"`, '-', '.,', '_'].map(__charat)[py * 5 | 0];
        continue;
      }

      if (abdy <= 0.66) {
        this.char_buffer[x][y] = [`\`'"`, SLASH, '.,'].map(__charat)[py * 3 | 0];
        continue;
      }

      if      (py < 0.10) this.char_buffer[x][y] = __charat('`');
      else if (py < 0.33) this.char_buffer[x][y] = __charat(`'"`);
      else if (py < 0.80) this.char_buffer[x][y] = __charat(SLASH);
      else                this.char_buffer[x][y] = __charat('.,');
    }
  }

  rect_ptc(x, y, w, h, char_i=0) {
    x /= 8;
    y /= 12;
    w /= 8;
    h /= 12;
    const dx = w >= 0 ? +1 : -1;
    const dy = h >= 0 ? +1 : -1;
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    for (let x_ = 0; x_ < Math.abs(w); ++x_)
      for (let y_ = 0; y_ < Math.abs(h); ++y_)
    {
      if (x + x_ < 0 || x + x_ >= this.width || y + y_ < 0 || y + y_ >= this.height) continue;
      this.char_buffer[x + x_][y + y_] = char_i;
    }
  }

  clear() {
    for (let x = 0; x < this.width; ++x)
      for (let y = 0; y < this.height; ++y)
    {
      this.char_buffer[x][y] = 0;
      // this.textcolor_buffer[x][y];
      // this.bgcolor_buffer[x][y];
    }
  }

  flush(ctx) {
    // ascii
    for (let y = 0; y < this.height; ++y)
      for (let x = 0; x < this.width; ++x)
    {
      this.rf.draw(ctx, x, y, this.get_char(x, y), this.get_textcolor(x, y));
    }

    // draw stencil
    for (let x = 0; x < this.width; ++x) {
      const v = this.stencil_buffer[x];
      ctx.fillStyle = this.colors[v % this.colors.length];
      ctx.fillRect(x*8, 0, 8, this.height * 12);
    }
  }
}
