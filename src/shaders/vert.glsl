#version 300 es
uniform float scale;
uniform float shift_x;
uniform float shift_y;
uniform mat4 u_matrix;

in vec2 a_texCoord;

in vec4 vertex;
out vec2 pixCoord;

void main() {
  vec2 a = vec2(vertex.x * scale + shift_x, vertex.y * scale + shift_y);
  gl_Position = u_matrix * vec4(a, 0.0, 1.0);
  pixCoord = a_texCoord;
}
