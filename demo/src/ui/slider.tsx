import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  gradient?: boolean;
};

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, gradient, ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden rounded-full bg-primary/20">
        <SliderPrimitive.Range
          className="absolute h-full"
          style={
            gradient ? { background: "linear-gradient(to right, #D3D3D3, #000000)" } : undefined
          }
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block inline-flex h-6 w-8 items-center justify-center rounded-full border border-primary/50 bg-background text-xs shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
        {props.value && props.value.length > 0 && props.value[0]}
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  ),
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
