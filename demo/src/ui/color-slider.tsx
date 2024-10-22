import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";
import type { RGB } from "@/lib/colormap";

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

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  colormap: RGB[];
}

const ColorSlider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, colormap, ...props }, ref) => {
    const hexColors = colormap.map((rgb) => rgbToHex(rgb[0], rgb[1], rgb[2]));
    const gradientString = `linear-gradient(to right, ${hexColors.join(", ")})`;
    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden rounded-full bg-primary/20">
          <SliderPrimitive.Range
            className="absolute h-full bg-primary"
            style={{ background: gradientString }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/50 bg-background text-xs shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
          {props.value && props.value.length > 0 && props.value[0]}
        </SliderPrimitive.Thumb>
        <SliderPrimitive.Thumb className="block inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/50 bg-background text-xs shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
          {props.value && props.value.length > 1 && props.value[1]}
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    );
  },
);
ColorSlider.displayName = SliderPrimitive.Root.displayName;

export { ColorSlider };
