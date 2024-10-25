const Highlight = ({ text, color }: { text: string; color: string }) => (
  <div className="relative inline-block w-max">
    <span
      style={{ backgroundColor: color }}
      className="absolute inset-0 z-10 h-full -skew-y-2 rounded"
    ></span>
    <span className="relative z-20 px-1">{text}</span>
  </div>
);

export default Highlight;
