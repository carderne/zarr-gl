#version 300 es
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
