class Colourful {
  constructor() {
    this.values = [
      0xFFA07A,0xFA8072,0xE9967A,0xF08080,0xCD5C5C,0xDC143C,0xB22222,0xFF0000,
      0x8B0000,0xFF7F50,0xFF6347,0xFF4500,0xFFD700,0xFFA500,0xFF8C00,0xFFFFE0,
      0xFFFACD,0xFAFAD2,0xFFEFD5,0xFFE4B5,0xFFDAB9,0xEEE8AA,0xF0E68C,0xBDB76B,
      0xFFFF00,0x7CFC00,0x7FFF00,0x32CD32,0x00FF00,0x228B22,0x008000,0x006400,
      0xADFF2F,0x9ACD32,0x00FF7F,0x00FA9A,0x90EE90,0x98FB98,0x8FBC8F,0x3CB371,
      0x2E8B57,0x808000,0x556B2F,0x6B8E23,0xE0FFFF,0x00FFFF,0x7FFFD4,0x66CDAA,
      0xAFEEEE,0x40E0D0,0x48D1CC,0x00CED1,0x20B2AA,0x5F9EA0,0x008B8B,0x008080,
      0xB0E0E6,0xADD8E6,0x87CEFA,0x87CEEB,0x00BFFF,0xB0C4DE,0x1E90FF,0x6495ED,
      0x4682B4,0x4169E1,0x0000FF,0x0000CD,0x00008B,0x000080,0x191970,0x7B68EE,
      0x6A5ACD,0x483D8B,0xE6E6FA,0xD8BFD8,0xDDA0DD,0xEE82EE,0xDA70D6,0xFF00FF,
      0xBA55D3,0x9370DB,0x8A2BE2,0x9400D3,0x9932CC,0x8B008B,0x800080,0x4B0082,
      0xFFC0CB,0xFFB6C1,0xFF69B4,0xFF1493,0xDB7093,0xC71585,0xFFFFFF,0xFFFAFA,
      0xF0FFF0,0xF5FFFA,0xF0FFFF,0xF0F8FF,0xF8F8FF,0xF5F5F5,0xFFF5EE,0xF5F5DC,
      0xFDF5E6,0xFFFAF0,0xFFFFF0,0xFAEBD7,0xFAF0E6,0xFFF0F5,0xFFE4E1,0xDCDCDC,
      0xD3D3D3,0xC0C0C0,0xA9A9A9,0x808080,0x696969,0x778899,0x708090,0x2F4F4F,
      0xFFF8DC,0xFFEBCD,0xFFE4C4,0xFFDEAD,0xF5DEB3,0xDEB887,0xD2B48C,0xBC8F8F,
      0xF4A460,0xDAA520,0xCD853F,0xD2691E,0x8B4513,0xA0522D,0xA52A2A,0x800000,
    ].map(e => {
      const s = e.toString(16);
      return '#' + '0'.repeat(6 - s.length) + s;
    });

    {
      const a = this.values;
      for (let i = a.length - 1; i > 0; --i) {
        const k = Math.random() * (1 + i) | 0;
        [a[i], a[k]] = [a[k], a[i]];
      }
    }
  }

  get(i) {
    return this.values[(~~i) % this.values.length];
  }

  random() {
    return this.get(Math.random() * this.values.length | 0);
  }
}
