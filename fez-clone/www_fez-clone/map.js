
class Keyboard {
  constructor(parent=document) {
    this.keys = {};
    this.onkeydown = (e) => this.keys[e.code] = true;
    this.onkeyup = (e) => this.keys[e.code] = false;
    this.parent = parent;
  }

  listen() {
    this.parent.addEventListener('keydown', this.onkeydown);
    this.parent.addEventListener('keyup', this.onkeyup);
  }

  forget() {
    this.parent.removeEventListener('keydown', this.onkeydown);
    this.parent.removeEventListener('keyup', this.onkeyup);
  }
}


function tostr(v) {
  return JSON.stringify(v);
}


export {
  Keyboard,
  tostr,
};
