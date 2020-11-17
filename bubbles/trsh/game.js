// class Clickable {
//   constructor(domElement, x, y, w, h) {

//     // for tests (not only)
//     this.draw = (ctx) => {
//       ctx.fillStyle = 'white';
//       ctx.fillRect(x, y, w, h);
//       return this;
//     };

//     // can be redefined

//     this.onenter = (x, y, w, h) => {
//       // console.log('Clickable onenter');
//     };

//     this.onleave = (x, y, w, h) => {
//       // console.log('Clickable onleave');
//     };

//     this.onpress = (x, y, w, h) => {
//       // console.log('Clickable onpress');
//     };

//     this.onrelease = (x, y, w, h) => {
//       // console.log('Clickable onrelease');
//     };

//     // system

//     const in_range = (_x, _y) => x <= _x && _x <= x+w && y <= _y && _y <= y+h;
//     let is_onhover = false;
//     let hover_pos = [0, 0];
//     let is_pressed = false;

//     this._onmousemove = (e) => {
//       const rect = domElement.getBoundingClientRect();
//       const is_in_range = in_range(e.clientX-rect.x, e.clientY-rect.y);
//       if      (is_in_range && !is_onhover) {
//         is_onhover = true;
//         this.onenter(x, y, w, h);
//       }
//       else if (!is_in_range && is_onhover) {
//         is_onhover = false;
//         this.onleave(x, y, w, h);
//         if (is_pressed) {
//           is_pressed = false;
//           this.onrelease(x, y, w, h);
//         }
//       }
//     };

//     this._onmousedown = (e) => {
//       e.preventDefault();
//       if (e.button !== 0 || !is_onhover) return;
//       is_pressed = true;
//       this.onpress(x, y, w, h);
//     };

//     this._onmouseup = (e) => {
//       e.preventDefault();
//       if (e.button !== 0 || !is_onhover) return;
//       is_pressed = false;
//       this.onrelease(x, y, w, h);
//     };
//   }

//   enable() {
//     window.addEventListener('mousemove', this._onmousemove);
//     window.addEventListener('mousedown', this._onmousedown);
//     window.addEventListener('mouseup', this._onmouseup);
//   }

//   disable() {
//     window.removeEventListener('mousemove', this._onmousemove);
//     window.removeEventListener('mousedown', this._onmousedown);
//     window.removeEventListener('mouseup', this._onmouseup);
//   }
// }
