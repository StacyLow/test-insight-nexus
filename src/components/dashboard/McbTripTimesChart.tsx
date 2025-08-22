import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
import { TestEntry } from "@/types/test-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface McbTripTimesChartProps {
  data: TestEntry[];
}

interface TripTimeDataPoint {
  date: string;
  timestamp: number;
  [key: string]: any; // For dynamic rating-multiplier combinations
}

interface RatingMultiplierCombo {
  id: string;
  rating: string;
  multiplier: string;
  label: string;
  color: string;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(210, 100%, 50%)",
  "hsl(280, 100%, 50%)",
  "hsl(60, 100%, 50%)",
  "hsl(180, 100%, 50%)",
];

export const McbTripTimesChart = ({ data }: McbTripTimesChartProps) => {
  // Filter MCB tests and extract unique rating/multiplier combinations
  const mcbTests = data.filter(t => t.test_type === 'MCB Trip Time' && t.trip_time && t.rating && t.multiplier);
  
  const uniqueCombinations = useMemo(() => {
    const combos = new Map<string, RatingMultiplierCombo>();
    
    mcbTests.forEach((test) => {
      const rating = String(test.rating || 'Unknown');
      const multiplier = String(test.multiplier || 'Unknown');
      const id = `${rating}-${multiplier}`;
      
      if (!combos.has(id)) {
        combos.set(id, {
          id,
          rating,
          multiplier,
          label: `${rating}A × ${multiplier}`,
          color: CHART_COLORS[combos.size % CHART_COLORS.length],
        });
      }
    });
    
    return Array.from(combos.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [mcbTests]);

  const [selectedCombinations, setSelectedCombinations] = useState<Set<string>>(
    new Set(uniqueCombinations.slice(0, 3).map(c => c.id)) // Default to first 3 combinations
  );

  const chartData = useMemo(() => {
    if (selectedCombinations.size === 0) return [];

    // Group tests by date and rating-multiplier combination
    const dataByDate = new Map<string, TripTimeDataPoint>();

    mcbTests.forEach((test) => {
      const rating = String(test.rating || 'Unknown');
      const multiplier = String(test.multiplier || 'Unknown');
      const comboId = `${rating}-${multiplier}`;
      
      if (!selectedCombinations.has(comboId)) return;

      // Parse the date from the test data dataset
      const testDate = test.dataset && test.dataset.length > 0 ? test.dataset[0].datetime : null;
      const date = testDate ? format(parseISO(testDate), "yyyy-MM-dd") : 'Unknown';
      const timestamp = testDate ? parseISO(testDate).getTime() : 0;
      
      if (!dataByDate.has(date)) {
        dataByDate.set(date, {
          date,
          timestamp,
          displayDate: testDate ? format(parseISO(testDate), "MMM dd") : date,
        });
      }

      const dataPoint = dataByDate.get(date)!;
      
      // Store trip time for this combination
      dataPoint[comboId] = test.trip_time;
    });

    return Array.from(dataByDate.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [mcbTests, selectedCombinations]);

  const chartConfig = useMemo(() => {
    const config: any = {};
    uniqueCombinations.forEach((combo) => {
      config[combo.id] = {
        label: combo.label,
        color: combo.color,
      };
    });
    return config;
  }, [uniqueCombinations]);

  const handleCombinationToggle = (comboId: string, checked: boolean) => {
    const newSelected = new Set(selectedCombinations);
    if (checked) {
      newSelected.add(comboId);
    } else {
      newSelected.delete(comboId);
    }
    setSelectedCombinations(newSelected);
  };

  if (mcbTests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>MCB Trip Times Over Time</CardTitle>
          <CardDescription>No MCB trip time data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>MCB Trip Times Over Time</CardTitle>
        <CardDescription>
          Trip times for different rating and multiplier combinations ({mcbTests.length} tests)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">
            Select Rating × Multiplier Combinations:
          </Label>
          <ScrollArea className="h-32 w-full border rounded-md p-2">
            <div className="space-y-2">
              {uniqueCombinations.map((combo) => (
                <div key={combo.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={combo.id}
                    checked={selectedCombinations.has(combo.id)}
                    onCheckedChange={(checked) => 
                      handleCombinationToggle(combo.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={combo.id}
                    className="text-sm cursor-pointer flex items-center space-x-2"
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: combo.color }}
                    />
                    <span>{combo.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {selectedCombinations.size > 0 && chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                  label={{ value: 'Trip Time (ms)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    `${value} ms`,
                    name
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                {uniqueCombinations
                  .filter(combo => selectedCombinations.has(combo.id))
                  .map((combo) => (
                    <Line
                      key={combo.id}
                      type="monotone"
                      dataKey={combo.id}
                      name={combo.label}
                      stroke={combo.color}
                      strokeWidth={2}
                      dot={{ fill: combo.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: combo.color, strokeWidth: 2 }}
                      connectNulls={false}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            {selectedCombinations.size === 0 
              ? "Please select at least one rating/multiplier combination"
              : "No data available for selected combinations"
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};