"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ReturnsChartProps {
  data: Array<{
    period: string;
    monthlyYield: number | null;
    yearToDateYield: number | null;
  }>;
}

export function ReturnsChart({ data }: ReturnsChartProps) {
  const chartData = data
    .filter((d) => d.yearToDateYield !== null)
    .map((d) => ({
      period: d.period,
      תשואה_שנתית_מצטברת: d.yearToDateYield,
      תשואה_חודשית: d.monthlyYield,
    }));

  if (chartData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        אין נתוני תשואות זמינים
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
          width={50}
        />
        <Tooltip
          formatter={(value: number | undefined) => [`${value?.toFixed(2) ?? "-"}%`]}
          labelFormatter={(label) => `תקופה: ${label}`}
        />
        <Line
          type="monotone"
          dataKey="תשואה_שנתית_מצטברת"
          stroke="#eab308"
          strokeWidth={2}
          dot={false}
          name="תשואה שנתית מצטברת"
        />
        <Line
          type="monotone"
          dataKey="תשואה_חודשית"
          stroke="#94a3b8"
          strokeWidth={1}
          dot={false}
          name="תשואה חודשית"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
