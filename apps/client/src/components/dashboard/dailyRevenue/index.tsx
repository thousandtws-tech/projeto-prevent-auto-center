import {
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts";
import { ChartTooltip } from "../chartTooltip";
import dayjs from "dayjs";
import type { ISalesChart } from "../../../interfaces";

type Props = {
  data: ISalesChart[];
};

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);

export const DailyRevenue = (props: Props) => {
  const data = props.data || [];

  return (
    <ResponsiveContainer width="99%">
      <AreaChart
        data={data}
        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
      >
        <XAxis
          dataKey="date"
          fontSize={12}
          tickFormatter={(value) => {
            if (data.length > 7) {
              return dayjs(value).format("MM/DD");
            }

            return dayjs(value).format("ddd");
          }}
        />
        <YAxis
          dataKey="value"
          fontSize={12}
          tickFormatter={(value) => {
            return formatCompactCurrency(Number(value));
          }}
        />
        <defs>
          <linearGradient id="area-color" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ffee00" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#ffee00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#ffee00"
          fill="url(#area-color)"
        />
        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={(value) =>
                new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(value))
              }
              labelFormatter={(label) => dayjs(label).format("MMM D, YYYY")}
            />
          }
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
