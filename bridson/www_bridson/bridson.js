// Fast Poisson Disk Sampling in Arbitrary Dimensions
// source: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
class Bridson2d {
  constructor(width, height, radius, tries) {
    this.width = width;   // canvas width
    this.height = height; // canvas height
    this.radius = radius; // disk radius
    this.tries = tries;   // number of attemptions to creating a new point

    this.points = [];     // arrays of coordinates
    this.links = [];      // arrays of children indices

    this.cell_size = radius / Math.sqrt(2);
    this.grid_w = ~~(width  / this.cell_size);
    this.grid_h = ~~(height / this.cell_size);
    this.grid = Array(this.grid_w * this.grid_h).fill(-1);

    // converts coordinates into grid index.
    this.I = (x,y) =>
      (x < 0 || x >= this.grid_w || y < 0 || y >= this.grid_h)
        ? -1 : ~~x + ~~y * this.grid_w;

    // maps coordinates from canvas space to grid space.
    this.G = (p) => p.map(e => e / this.cell_size | 0);
  }

  append_point(p) {
    const { I, G, grid, points, links } = this;
    // creates point, sets index on grid and returns index.
    points.push(p);
    links.push([]); // no children yet.
    return (grid[I(...G(p))] = points.length-1);
  }

  can_point_be(p) {
    const { I, G, grid, points, radius } = this;
    // checks point to be in empty cell.
    const [gx, gy] = G(p);
    const i = I(gx, gy);
    if (i < 0 || grid[i] >= 0)
      return false;
    // checks every cell in 5x5 range and tests if point in radius of their points.
    for (let oy = -2; oy <= +2; ++oy) for (let ox = -2; ox <= +2; ++ox) {
      const i = I(gx + ox, gy + oy);
      // out of grid boundaries
      if (i < 0)
        return false;
      // grid has a point
      if (grid[i] >= 0) {
        const gp = points[grid[i]];
        // current point is in the radius of other point.
        if (radius ** 2 >= (gp[0] - p[0]) ** 2 + (gp[1] - p[1]) ** 2)
          return false;
      }
    }
    // no point interfering with current.
    return true;
  }

  generate() {
    const { width, height, points, tries, radius, links } = this;
    // selects random point as first.
    this.append_point([Math.random()*width, Math.random()*height]);
    // points number will increase while loop evaluating
    for (let i = 0; i < points.length; ++i) {
      const p = points[i];
      // each existing point tries several times to create a new point
      for (let t = 0; t < tries; ++t) {
        // generate random relative circular coordinates
        const r = radius + Math.random() * radius;
        const a = Math.random() * Math.PI * 2;
        // convert into absolute cartesian coordinates
        const x = p[0] + r * Math.cos(a);
        const y = p[1] + r * Math.sin(a);
        // create a new point from it
        const np = [x, y];
        this.can_point_be(np) &&
          links[i].push(this.append_point(np));
      }
    }
  }
}
