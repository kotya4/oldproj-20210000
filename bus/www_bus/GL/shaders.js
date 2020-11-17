///////////////////////////////////
// Some outter definitions       //
///////////////////////////////////

const POINTLIGHTS_NUM = 1;

const POINTLIGHTS =
`
  struct PointLight {
    float quadratic;
    float constant;
    float linear;
    vec3 position;
    vec3 specular;
    vec3 ambient;
    vec3 diffuse;
  };

  #define POINTLIGHTS_NUM ${POINTLIGHTS_NUM}
`;

///////////////////////////////////
// Shaders                       //
///////////////////////////////////

const VERTEX_SHADER =
`#version 300 es
  precision mediump float;

  ${POINTLIGHTS}

  in vec4 a_color;
  in vec2 a_texuv;
  in vec3 a_coord;
  in vec3 a_normal;
  in vec3 a_tangent;

  uniform mat4 u_modelview;
  uniform mat4 u_projection;
  uniform vec3 u_camera_pos;
  uniform mat3 u_normalmatrix;
  uniform PointLight u_pointlights [POINTLIGHTS_NUM];

  out vec2 v_texuv;
  out vec3 v_normal;
  out vec3 v_T_frag_pos; // T for Tangent
  out vec3 v_T_camera_pos;
  out vec3 v_T_light_pos [POINTLIGHTS_NUM];

  void main(void) {

    vec4 frag_pos = u_modelview * vec4(a_coord, 1.0);

    // TBN
    vec3 normal = normalize(u_normalmatrix * a_normal);
    vec3 tangent = normalize(u_normalmatrix * a_tangent);
    tangent = normalize(tangent - dot(tangent, normal) * normal);
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = transpose(mat3(tangent, bitangent, normal));

    // out
    v_texuv = a_texuv;
    v_normal = normal;
    v_T_frag_pos = TBN * vec3(frag_pos);
    v_T_camera_pos = TBN * u_camera_pos;
    for (int i = 0; i < POINTLIGHTS_NUM; ++i) {
      v_T_light_pos[i] = TBN * u_pointlights[i].position;
    }

    // position
    gl_Position = u_projection * frag_pos;
  }
`;

const FRAGMENT_SHADER =
`#version 300 es
  precision mediump float;

  ${POINTLIGHTS}

  vec3 calc_pointlight(PointLight, vec3, vec3, vec3);
  vec3 calc_pointlight(PointLight, vec3, vec3, vec3, vec3);

  uniform sampler2D u_texture;
  uniform sampler2D u_normalmap;
  uniform PointLight u_pointlights [POINTLIGHTS_NUM];

  in vec2 v_texuv;
  in vec3 v_T_frag_pos;
  in vec3 v_T_camera_pos;
  in vec3 v_T_light_pos [POINTLIGHTS_NUM];

  out vec4 FragColor;

  void main(void) {
    vec3 normal = normalize(texture(u_normalmap, v_texuv).rgb * 2.0 - 1.0);
    vec3 camera_dir = normalize(v_T_camera_pos - v_T_frag_pos);
    vec3 light = vec3(0.5);

    for (int i = 0; i < POINTLIGHTS_NUM; ++i) {
      light += calc_pointlight(u_pointlights[i], v_T_light_pos[i], normal, v_T_frag_pos, camera_dir);
    }

    FragColor = texture(u_texture, v_texuv) * vec4(light, 1.0);
  }

  // calculates PointLight WITHOUT passing 'light_pos' argument (PointLight.position will be used instead)
  vec3 calc_pointlight(PointLight light, vec3 normal, vec3 frag_pos, vec3 camera_dir) {
    return calc_pointlight(light, light.position, normal, frag_pos, camera_dir);
  }

  // calculates PointLight WITH aditional 'light_pos' argument
  vec3 calc_pointlight(PointLight light, vec3 light_pos, vec3 normal, vec3 frag_pos, vec3 camera_dir) {
    // source: https://learnopengl.com/Lighting/Multiple-lights
    vec3 light_direction = normalize(light_pos - frag_pos);
    // diffuse shading
    float diff = max(dot(normal, light_direction), 0.0);
    // specular shading
    vec3 reflect_direction = reflect(-light_direction, normal);
    float spec = pow(max(dot(camera_dir, reflect_direction), 0.0), 32.0); // material.shininess
    // attenuation
    float distance    = length(light_pos - frag_pos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
    // combine results
    vec3 ambient  = light.ambient  *        vec3(0.0) * attenuation; // vec3(texture(material.diffuse, v_texuv))
    vec3 diffuse  = light.diffuse  * diff * vec3(1.0) * attenuation; // vec3(texture(material.diffuse, v_texuv))
    vec3 specular = light.specular * spec * vec3(1.0) * attenuation; // vec3(texture(material.specular, v_texuv))
    return (ambient + diffuse + specular);
  }
`;
