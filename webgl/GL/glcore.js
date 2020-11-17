
class GLCore {

  constructor(width, height, parent) {
    this.gl = null;
    this
      .init_context('webgl2', { preserveDrawingBuffer: true })
      .set_viewport(width, height)
      .add_class('glcontext')
      .append_to_DOM(parent)
      .prepare()
    ;
  }

  init_context(contextType, contextAttributes) {
    this.gl = document.createElement('canvas').getContext(contextType, contextAttributes);
    return this;
  }

  set_viewport(width, height) {
    const { gl } = this;
    gl.canvas.width = width;
    gl.canvas.height = height;
    gl.viewport(0, 0, width, height);
    return this;
  }

  add_class(cls) {
    this.gl.canvas.classList.add(cls);
    return this;
  }

  append_to_DOM(dom) {
    dom.appendChild(this.gl.canvas);
    return this;
  }

  prepare() {
    const { gl } = this;
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1.0);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // enabling alpha-blending (you must sort transparent models by yourself)
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return this;
  }
}
