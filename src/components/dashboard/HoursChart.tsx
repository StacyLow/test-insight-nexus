import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

interface HoursChartProps {
  data: { date: string; hours: number }[];
  title: string;
  description: string;
}

export const HoursChart = ({ data, title, description }: HoursChartProps) => {
  const chartConfig = {
    hours: {
      label: "Hours",
      color: "hsl(var(--success))",
    },
  };

  const formattedData = data.map(item => ({
    ...item,
    displayDate: format(parseISO(item.date), "MMM dd"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
              />
              <Line 
                type="monotone"
                dataKey="hours" 
                stroke="var(--color-hours)"
                strokeWidth={3}
                dot={{ fill: "var(--color-hours)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "var(--color-hours)", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};