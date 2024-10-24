export const MarkerLine = ({ val, label }: { val: number; label: string }) => {
  return (
    <div className="text-md text-uppercase text-center text-black">
      {val} {label}
    </div>
  );
};

const Marker = ({ children, marker }: { children: React.ReactNode; marker: mapboxgl.Marker }) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        marker.remove();
      }}
      className="-translate-y-[calc(50%+12px)] transform"
    >
      <div className="relative rounded-lg bg-white bg-opacity-90 p-1 shadow-lg">
        {children}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full transform">
          <div
            className="h-0 w-0 border-b-0 border-l-[8px] border-r-[8px] border-t-[10px] border-solid border-l-transparent border-r-transparent border-t-white border-opacity-90"
            style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Marker;
