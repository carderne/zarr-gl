#version 300 es
precision highp float;

uniform float cmin;
uniform float cmax;
uniform float opacity;
uniform float nodata;

uniform sampler2D tex;
uniform sampler2D cmap;

in vec2 pixCoord;
out vec4 outColor;

void main() {
  float value = texture(tex, pixCoord).r;
  if (value == nodata) {
    discard;
  }
  float norm = (value - cmin)/(cmax - cmin);
  float cla = clamp(norm, 0.0, 1.0);
  vec4 c = texture(cmap, vec2(cla, 0.5));
  vec4 color = vec4(c.r, c.g, c.b, opacity);
  outColor = color;
}
