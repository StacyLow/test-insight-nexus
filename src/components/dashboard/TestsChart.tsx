import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

interface TestsChartProps {
  data: { date: string; count: number }[];
  title: string;
  description: string;
}

export const TestsChart = ({ data, title, description }: TestsChartProps) => {
  const chartConfig = {
    count: {
      label: "Tests",
      color: "hsl(var(--primary))",
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
            <BarChart data={formattedData}>
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
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar 
                dataKey="count" 
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};