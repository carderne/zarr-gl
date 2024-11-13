#version 300 es
in vec2 vertex;
out vec2 texCoord;
void main() {
  gl_Position = vec4(vertex, 0.0, 1.0);
  texCoord = vertex * 0.5 + 0.5;  // Convert from [-1,1] to [0,1]
}
