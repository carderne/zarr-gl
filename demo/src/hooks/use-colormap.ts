import { useMemo } from "react";
import makeColormap, { type Options } from "@/lib/colormap";

const useColormap = (name: string, options: Options) => {
  const colormap = useMemo(() => {
    return makeColormap(name, options);
  }, [name, options]);

  return colormap;
};

export default useColormap;
