import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "../chartTooltip";
import dayjs from "dayjs";
import type { ISalesChart } from "../../../interfaces";

type Props = {
  data: ISalesChart[];
};

const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);

export const NewCustomers = (props: Props) => {
  const data = props.data || [];

  return (
    <ResponsiveContainer width="99%">
      <BarChart
        data={data}
        barSize={15}
        margin={{ top: 30, right: 10, left: -25, bottom: 0 }}
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
          tickFormatter={(value) => formatCompactNumber(Number(value))}
        />
        <Bar type="natural" dataKey="value" fill="#ffee00" />
        <Tooltip
          cursor={{
            fill: "rgba(255, 255, 255, 0.2)",
            radius: 4,
          }}
          content={
            <ChartTooltip
              labelFormatter={(label) => dayjs(label).format("MMM D, YYYY")}
            />
          }
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
