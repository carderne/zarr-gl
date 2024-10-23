export const vertexProgram = `#version 300 es
uniform float scale;
uniform float shift_x;
uniform float shift_y;
uniform mat4 matrix;

in vec2 pix_coord_in;
in vec2 vertex;

out vec2 pix_coord;

void main() {
  vec2 a = vec2(vertex.x * scale + shift_x, vertex.y * scale + shift_y);
  gl_Position = matrix * vec4(a, 0.0, 1.0);
  pix_coord = pix_coord_in;
}
`;

export const fragmentProgram = `#version 300 es
precision highp float;

uniform float vmin;
uniform float vmax;
uniform float opacity;
uniform float nodata;

uniform sampler2D tex;
uniform sampler2D cmap;

in vec2 pix_coord;
out vec4 color;

void main() {
  float value = texture(tex, pix_coord).r;
  if (value == nodata) {
    discard;
  }
  float norm = (value - vmin)/(vmax - vmin);
  float cla = clamp(norm, 0.0, 1.0);
  vec4 c = texture(cmap, vec2(cla, 0.5));
  color = vec4(c.r, c.g, c.b, opacity);
}
`;
