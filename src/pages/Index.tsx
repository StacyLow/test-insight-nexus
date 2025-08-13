import { useState } from "react";
import { subDays } from "date-fns";
import { Clock, TestTube, TrendingUp } from "lucide-react";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { TestsChart } from "@/components/dashboard/TestsChart";
import { HoursChart } from "@/components/dashboard/HoursChart";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { useTestData } from "@/hooks/useTestData";
import { TestType, DateRange } from "@/types/test-data";
import { DbHealthIndicator } from "@/components/DbHealthIndicator";

const Index = () => {
  const [testType, setTestType] = useState<TestType>("All");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { metrics } = useTestData(dateRange, testType);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Test Results Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Monitor and analyze your testing performance with real-time metrics
          </p>
        </div>

        <div className="flex justify-end">
          <DbHealthIndicator />
        </div>
        
        {/* Main Grid: Filters + Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Filters */}
          <DashboardFilters
            testType={testType}
            onTestTypeChange={setTestType}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          {/* Key Metrics */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <MetricsCard
              title="Total Tests"
              value={metrics.totalTests}
              subtitle="Tests executed in period"
              icon={<TestTube className="h-4 w-4" />}
              variant="default"
            />
            <MetricsCard
              title="Total Testing Hours"
              value={`${metrics.totalHours}h`}
              subtitle="Cumulative test execution time"
              icon={<Clock className="h-4 w-4" />}
              variant="default"
            />
          </div>
        </div>

        {/* Test Results Grid (simplified: no pass/fail stats) */}
        <div className="grid gap-6 md:grid-cols-1">
          <MetricsCard
            title="Average Test Duration"
            value={`${metrics.totalTests > 0 ? (metrics.totalHours / metrics.totalTests * 60).toFixed(1) : 0}min`}
            subtitle="Mean execution time per test"
            icon={<TrendingUp className="h-4 w-4" />}
            variant="default"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TestsChart
            data={metrics.testsPerDay}
            title="Daily Test Execution"
            description="Number of tests executed per day"
          />
          <HoursChart
            data={metrics.hoursPerDay}
            title="Daily Testing Hours"
            description="Hours of testing performed per day"
          />
        </div>

        {/* Daily Averages */}
        <div className="grid gap-6 md:grid-cols-2">
          <MetricsCard
            title="Tests per Day"
            value={`${metrics.testsPerDay.length > 0 ? (metrics.totalTests / metrics.testsPerDay.length).toFixed(1) : 0}`}
            subtitle="Average daily test volume"
            icon={<TestTube className="h-4 w-4" />}
            variant="default"
          />
          <MetricsCard
            title="Hours per Day"
            value={`${metrics.hoursPerDay.length > 0 ? (metrics.totalHours / metrics.hoursPerDay.length).toFixed(1) : 0}h`}
            subtitle="Average daily testing time"
            icon={<Clock className="h-4 w-4" />}
            variant="default"
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
