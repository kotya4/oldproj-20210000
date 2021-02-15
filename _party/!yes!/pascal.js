
function pascal_seq(seq=[1]) {
  const unit = 0;
  const new_seq = [];
  for (let i = 0; i < seq.length + 1; ++i) {
    new_seq[i] = (i > 0 ? seq[i - 1] : unit) + (i < seq.length ? seq[i] : unit);
  }
  return new_seq;
}


function pascal_tri(num=0, seq=[1]) {
  console.log(seq);
  for (let i = 0; i < num; ++i) {
    seq = pascal_seq(seq);
    console.log(seq);
  }
  return seq;
}


function pascal_bin(ctx, num=0, seq=[1]) {
  for (let i = 0; i < num; ++i) {
    seq = pascal_seq(seq);
  }
  const max = Math.max(seq[Math.ceil(seq.length / 2)]).toString(2).length;

  const s = 10;
  ctx.fillStyle = 'white';
  for (let x = 0; x < seq.length; ++x) {
    const bin = seq[x].toString(2);
    for (let y = 0; y < bin.length; ++y) {
      if ('1' === bin[bin.length - y - 1]) {
        ctx.fillRect(x * s, (max - y - 1) * s, s, s);
      }
    }
  }

  return seq;
}
