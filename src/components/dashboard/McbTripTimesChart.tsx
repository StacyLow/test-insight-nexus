import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
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
  tripTime: number;
  rating: string;
  multiplier: string;
  comboId: string;
  displayDate: string;
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
  // Filter MCB tests
  const mcbTests = data.filter(t => t.test_type === 'MCB Trip Time' && t.trip_time && t.rating && t.multiplier);
  
  // Extract unique ratings and multipliers
  const { uniqueRatings, uniqueMultipliers } = useMemo(() => {
    const ratings = new Set<string>();
    const multipliers = new Set<string>();
    
    mcbTests.forEach((test) => {
      ratings.add(String(test.rating || 'Unknown'));
      multipliers.add(String(test.multiplier || 'Unknown'));
    });
    
    return {
      uniqueRatings: Array.from(ratings).sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      }),
      uniqueMultipliers: Array.from(multipliers).sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      }),
    };
  }, [mcbTests]);

  const [selectedRatings, setSelectedRatings] = useState<Set<string>>(
    new Set() // Start with empty selection to force user to select
  );
  
  const [selectedMultipliers, setSelectedMultipliers] = useState<Set<string>>(
    new Set() // Start with empty selection to force user to select
  );

  // Create color mapping for combinations
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    let colorIndex = 0;
    
    uniqueRatings.forEach(rating => {
      uniqueMultipliers.forEach(multiplier => {
        const comboId = `${rating}-${multiplier}`;
        map.set(comboId, CHART_COLORS[colorIndex % CHART_COLORS.length]);
        colorIndex++;
      });
    });
    
    return map;
  }, [uniqueRatings, uniqueMultipliers]);

  const chartData = useMemo(() => {
    if (selectedRatings.size === 0 || selectedMultipliers.size === 0) return [];

    const dataPoints: TripTimeDataPoint[] = [];

    console.log('MCB Tests:', mcbTests.length);
    console.log('Selected Ratings:', Array.from(selectedRatings));
    console.log('Selected Multipliers:', Array.from(selectedMultipliers));

    mcbTests.forEach((test) => {
      const rating = String(test.rating || 'Unknown');
      const multiplier = String(test.multiplier || 'Unknown');
      
      // Only include tests that match selected rating AND multiplier
      if (!selectedRatings.has(rating) || !selectedMultipliers.has(multiplier)) return;

      // Check if we have valid trip_time data
      if (!test.trip_time || typeof test.trip_time !== 'number') return;

      // Parse the date - handle Supabase meter_datetime_str format like "2025/5/4 05:50:33.578"
      const testDate = test.meter_datetime_str;
      if (!testDate) {
        console.log('No test date for test:', test);
        return;
      }

      // Convert the date format from "2025/5/4 05:50:33.578" to a valid Date
      let parsedDate: Date;
      try {
        // Try to parse as ISO first, if that fails, parse the custom format
        if (testDate.includes('T') || testDate.includes('Z')) {
          parsedDate = parseISO(testDate);
        } else {
          // Handle format like "2025/5/4 05:50:33.578"
          parsedDate = new Date(testDate.replace(/(\d{4})\/(\d{1,2})\/(\d{1,2})/, '$1-$2-$3'));
        }
        
        // Validate the date
        if (isNaN(parsedDate.getTime())) {
          console.log('Invalid date for test:', testDate, test);
          return;
        }
      } catch (error) {
        console.log('Failed to parse date for test:', testDate, error, test);
        return;
      }

      const timestamp = parsedDate.getTime();
      const comboId = `${rating}-${multiplier}`;
      
      dataPoints.push({
        date: format(parsedDate, "yyyy-MM-dd"),
        timestamp,
        tripTime: test.trip_time,
        rating,
        multiplier,
        comboId,
        displayDate: format(parsedDate, "MMM dd, yyyy"),
      });
    });

    console.log('Chart Data Points:', dataPoints.length);
    return dataPoints.sort((a, b) => a.timestamp - b.timestamp);
  }, [mcbTests, selectedRatings, selectedMultipliers]);

  // Group data by combination for scatter chart
  const scatterData = useMemo(() => {
    const grouped = new Map<string, TripTimeDataPoint[]>();
    
    chartData.forEach(point => {
      if (!grouped.has(point.comboId)) {
        grouped.set(point.comboId, []);
      }
      grouped.get(point.comboId)!.push(point);
    });
    
    return Array.from(grouped.entries()).map(([comboId, points]) => ({
      comboId,
      label: `${points[0].rating} × ${points[0].multiplier}`,
      color: colorMap.get(comboId) || CHART_COLORS[0],
      data: points,
    }));
  }, [chartData, colorMap]);

  const handleRatingToggle = (rating: string, checked: boolean) => {
    const newSelected = new Set(selectedRatings);
    if (checked) {
      newSelected.add(rating);
    } else {
      newSelected.delete(rating);
    }
    setSelectedRatings(newSelected);
  };

  const handleMultiplierToggle = (multiplier: string, checked: boolean) => {
    const newSelected = new Set(selectedMultipliers);
    if (checked) {
      newSelected.add(multiplier);
    } else {
      newSelected.delete(multiplier);
    }
    setSelectedMultipliers(newSelected);
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
          Trip times plotted by test date for different rating and multiplier combinations ({mcbTests.length} tests)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ratings Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Select Ratings:
            </Label>
            <ScrollArea className="h-32 w-full border rounded-md p-2 bg-background">
              <div className="space-y-2">
                {uniqueRatings.map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rating-${rating}`}
                      checked={selectedRatings.has(rating)}
                      onCheckedChange={(checked) => 
                        handleRatingToggle(rating, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`rating-${rating}`}
                      className="text-sm cursor-pointer"
                    >
                      {rating}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Multipliers Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Select Multipliers:
            </Label>
            <ScrollArea className="h-32 w-full border rounded-md p-2 bg-background">
              <div className="space-y-2">
                {uniqueMultipliers.map((multiplier) => (
                  <div key={multiplier} className="flex items-center space-x-2">
                    <Checkbox
                      id={`multiplier-${multiplier}`}
                      checked={selectedMultipliers.has(multiplier)}
                      onCheckedChange={(checked) => 
                        handleMultiplierToggle(multiplier, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`multiplier-${multiplier}`}
                      className="text-sm cursor-pointer"
                    >
                      ×{multiplier}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {scatterData.length > 0 && chartData.length > 0 ? (
          <ChartContainer config={{}} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <XAxis 
                  type="number"
                  dataKey="timestamp"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(timestamp) => format(new Date(timestamp), "MMM dd")}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  type="number"
                  dataKey="tripTime"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Trip Time (ms)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: any, name: string, props: any) => [
                    `${value} ms`,
                    `${props.payload.rating} × ${props.payload.multiplier}`
                  ]}
                  labelFormatter={(timestamp: number) => 
                    `Date: ${format(new Date(timestamp), "MMM dd, yyyy")}`
                  }
                />
                <Legend />
                {scatterData.map((combo) => (
                  <Scatter
                    key={combo.comboId}
                    name={combo.label}
                    data={combo.data}
                    fill={combo.color}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            {selectedRatings.size === 0 || selectedMultipliers.size === 0
              ? "Please select at least one rating and one multiplier"
              : "No data available for selected combinations"
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};