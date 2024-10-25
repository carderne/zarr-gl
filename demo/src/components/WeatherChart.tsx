import {
  Bar,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  TooltipProps,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/ui/chart";
import { Monthly } from "@/lib/openmeteo";

type CustomTooltipProps = TooltipProps<number, string> & {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border border-border bg-background p-2 shadow-md">
        <p className="font-bold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${Math.round(entry.value!)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function WeatherChart({ data }: { data: Monthly[] }) {
  return (
    <ChartContainer
      config={{
        rain: {
          label: "Rain (mm)",
          color: "#a6bddb",
        },
        temp: {
          label: "Temp (°C)",
          color: "#fec44f",
        },
        wind: {
          label: "Wind (m/s)",
          color: "#addd8e",
        },
      }}
    >
      <ComposedChart data={data} margin={{ top: 10, right: -20, bottom: 10, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis
          yAxisId="left"
          orientation="left"
          stroke="var(--color-temp)"
          domain={[0, 30]}
          ticks={[-10, 0, 10, 20, 30]}
          tickFormatter={(value) => String(Math.round(value))}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="var(--color-rain)"
          domain={[0, 30]}
          ticks={[0, 10, 20]}
          tickFormatter={(value) => String(Math.round(value))}
        />
        <ChartTooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          yAxisId="right"
          dataKey="rain"
          fill="var(--color-rain)"
          name="Rain (mm)"
          barSize={20}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="temp"
          name="Temp (°C)"
          stroke="var(--color-temp)"
          fill="url(#tempGradient)"
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="wind"
          stroke="var(--color-wind)"
          name="Wind (kn)"
          strokeWidth={2}
        />
        <defs>
          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-temp)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-temp)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
      </ComposedChart>
    </ChartContainer>
  );
}
