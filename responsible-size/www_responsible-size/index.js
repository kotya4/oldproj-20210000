/* gen by new.py at 2021-04-13 07:08:40.893168 */
window.onload = async function onload () {

  // client space layout

  let client_x = 0;
  let client_y = 0;
  const client_w = 300;
  const client_h = 300;

  let element_grabbed = false;
  let element_x = 100;
  let element_y = 200;
  let element_ox = 0;
  let element_oy = 0;
  const element_w = 64;
  const element_h = 64;

  let scaler_x;
  let scaler_y;

  // DOM

  const client = document.createElement('div');
  client.className = 'client';
  document.body.append(client);

  const element = document.createElement('div');
  element.className = 'element';
  client.append(element);

  const text = document.createElement('div');
  text.className = 'text';
  document.body.append(text);

  // logics

  onresize();

  window.addEventListener('resize', onresize);

  element.addEventListener('mousedown', onmousedown_element);
  client.addEventListener('mousemove', onmousemove_client);
  client.addEventListener('mouseup', onmouseup_client);


  ClipPath.update_element_image_and_generate_clipPath(element, './www_responsible-size/figure.png');


  // client space setters

  function apply_client_position () {
    const rect = client.getBoundingClientRect();
    client_x = rect.x / scaler_x;
    client_y = rect.y / scaler_y;
  }

  function apply_element_position(x, y) {
    element_x = x - element_ox - client_x;
    element_y = y - element_oy - client_y;
  }

  function apply_element_offset(x, y) {
    element_ox = x - element_x - client_x;
    element_oy = y - element_y - client_y;
  }

  // client space to display space converters

  function update_client_size () {
    client.style.width  = (client_w * scaler_x) + 'px';
    client.style.height = (client_h * scaler_y) + 'px';
  }

  function update_element_size () {
    element.style.width  = (element_w * scaler_x) + 'px';
    element.style.height = (element_h * scaler_y) + 'px';
  }

  function update_element_position () {
    element.style.left = (element_x * scaler_x) + 'px';
    element.style.top  = (element_y * scaler_y) + 'px';
  }

  // events

  function onresize () {
    const size = Math.min(window.innerWidth, window.innerHeight);
    scaler_x = size / client_w;
    scaler_y = size / client_h;

    update_client_size();
    update_element_size();
    update_element_position();

    // do only after "update_client_size()"
    apply_client_position();
  }

  function onmousedown_element (e) {
    element_grabbed = true;
    const x = e.clientX / scaler_x;
    const y = e.clientY / scaler_y;
    apply_element_offset(x, y);
  }

  function onmousemove_client (e) {
    if (element_grabbed) {
      const x = e.clientX / scaler_x;
      const y = e.clientY / scaler_y;
      apply_element_position(x, y);
      update_element_position();
      text.innerText = `All measures in client space (i.e. chess board).

                        Element position (left top corner): ${~~element_x} ${~~element_y}

                        Element offset (offset between mouse and element): ${~~element_ox} ${~~element_oy} (always between 0 and element size - 1)

                        Mouse position: ${~~(element_x + element_ox)} ${~~(element_y + element_oy)} (always between 0 and client size - 1)`;
    }
  }

  function onmouseup_client (e) {
    element_grabbed = false;
  }

}
