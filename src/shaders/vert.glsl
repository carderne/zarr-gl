#version 300 es
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
