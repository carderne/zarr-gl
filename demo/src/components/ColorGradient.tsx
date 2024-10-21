import { RGB } from "@/lib/colormap";

const rgbToHex = (r: number, g: number, b: number) => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

interface ColormapGradientProps {
  colormap: RGB[];
}

export default function ColorGradient({ colormap }: ColormapGradientProps) {
  const hexColors = colormap.map((rgb) => rgbToHex(rgb[0], rgb[1], rgb[2]));
  const gradientString = `linear-gradient(to right, ${hexColors.join(", ")})`;

  return (
    <div className="h-4 w-full rounded-lg shadow-md" style={{ background: gradientString }}></div>
  );
}
