import { useState } from "react";
import { subDays } from "date-fns";
import { Clock, TestTube, TrendingUp, Zap, Target, Trophy, Thermometer } from "lucide-react";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { TestsChart } from "@/components/dashboard/TestsChart";
import { HoursChart } from "@/components/dashboard/HoursChart";
import { McbTripTimesChart } from "@/components/dashboard/McbTripTimesChart";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { useTestData } from "@/hooks/useTestData";
import { DateRange } from "@/types/test-data";
import { DbHealthIndicator } from "@/components/DbHealthIndicator";

const Index = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2024, 11, 1), // December 1st, 2024
    to: new Date(),
  });

  const { metrics, data } = useTestData(dateRange);

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
        <div className="grid gap-6 md:grid-cols-5">
          {/* Filters */}
          <div className="md:col-span-2">
            <DashboardFilters
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
          
          {/* Key Metrics */}
          <div className="md:col-span-3 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
            <MetricsCard
              title="Temperature Range"
              value="-10°C to 60°C"
              subtitle="Testing temperature coverage"
              icon={<Thermometer className="h-4 w-4" />}
              variant="default"
            />
          </div>
        </div>


        {/* MCB Current Analysis */}
        {metrics.mcbCurrentBuckets && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">MCB Current Analysis</h2>
            
            {/* Current Threshold Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <MetricsCard
                title="50-100A Range"
                value={metrics.mcbCurrentBuckets["50-100"]}
                subtitle="Tests in 50-100A range"
                icon={<Zap className="h-4 w-4" />}
                variant="default"
              />
              <MetricsCard
                title="100-200A Range"
                value={metrics.mcbCurrentBuckets["100-200"]}
                subtitle="Tests in 100-200A range"
                icon={<Zap className="h-4 w-4" />}
                variant="default"
              />
              <MetricsCard
                title="200-300A Range"
                value={metrics.mcbCurrentBuckets["200-300"]}
                subtitle="Tests in 200-300A range"
                icon={<Zap className="h-4 w-4" />}
                variant="default"
              />
              <MetricsCard
                title="300-400A Range"
                value={metrics.mcbCurrentBuckets["300-400"]}
                subtitle="Tests in 300-400A range"
                icon={<Zap className="h-4 w-4" />}
                variant="default"
              />
            </div>

            {/* Maximum Current Card */}
            <div className="grid gap-4 md:grid-cols-1">
              {metrics.mcbMaxCurrent && (
                <MetricsCard
                  title="Maximum Current Tested"
                  value={`${metrics.mcbMaxCurrent.value}A`}
                  subtitle={`Tested ${metrics.mcbMaxCurrent.count} time${metrics.mcbMaxCurrent.count !== 1 ? 's' : ''}`}
                  icon={<Target className="h-4 w-4" />}
                  variant="success"
                />
              )}
            </div>

            {/* Performance Cards - Side by Side */}
            <div className="grid gap-4 md:grid-cols-2">
              {metrics.mcbShortCircuitPerformance && (
                <MetricsCard
                  title="Short Circuit Performance"
                  value={`${metrics.mcbShortCircuitPerformance.averageSpeedImprovement}%`}
                  subtitle={`Faster than limit (${metrics.mcbShortCircuitPerformance.testsWithData} tests)`}
                  icon={<Trophy className="h-4 w-4" />}
                  variant="success"
                />
              )}
              {metrics.mcbRegularTripPerformance && (
                <MetricsCard
                  title="Regular Trip Performance"
                  value={`${metrics.mcbRegularTripPerformance.averageSpeedImprovement}%`}
                  subtitle={`Faster than limit (${metrics.mcbRegularTripPerformance.testsWithData} tests)`}
                  icon={<Trophy className="h-4 w-4" />}
                  variant="success"
                />
              )}
            </div>
          </div>
        )}

        {/* RCD Trip Time Performance */}
        {(metrics.rcdTypeATripTimePerformance || metrics.rcdTypeBTripTimePerformance) && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">RCD Trip Time Performance</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {metrics.rcdTypeATripTimePerformance && (
                <MetricsCard
                  title="Type A RCD Trip Time Performance"
                  value={`${metrics.rcdTypeATripTimePerformance.averageSpeedImprovement}%`}
                  subtitle={`Faster than limit (${metrics.rcdTypeATripTimePerformance.testsWithData} tests)`}
                  icon={<Clock className="h-4 w-4" />}
                  variant="success"
                />
              )}
              {metrics.rcdTypeBTripTimePerformance && (
                <MetricsCard
                  title="Type B RCD Trip Time Performance"
                  value={`${metrics.rcdTypeBTripTimePerformance.averageSpeedImprovement}%`}
                  subtitle={`Faster than limit (${metrics.rcdTypeBTripTimePerformance.testsWithData} tests)`}
                  icon={<Clock className="h-4 w-4" />}
                  variant="success"
                />
              )}
            </div>
          </div>
        )}

        {/* RCD Trip Value Performance */}
        {(metrics.rcdTypeATripValuePerformance || metrics.rcdTypeBTripValuePerformance) && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">RCD Trip Value Performance</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {metrics.rcdTypeATripValuePerformance && (
                <MetricsCard
                  title="Type A RCD Trip Value Performance"
                  value={`${metrics.rcdTypeATripValuePerformance.averageSpeedImprovement}%`}
                  subtitle={`Faster than limit (${metrics.rcdTypeATripValuePerformance.testsWithData} tests)`}
                  icon={<Zap className="h-4 w-4" />}
                  variant="success"
                />
              )}
              {metrics.rcdTypeBTripValuePerformance && (
                <MetricsCard
                  title="Type B RCD Trip Value Performance"
                  value={`${metrics.rcdTypeBTripValuePerformance.averageSpeedImprovement}%`}
                  subtitle={`Faster than limit (${metrics.rcdTypeBTripValuePerformance.testsWithData} tests)`}
                  icon={<Zap className="h-4 w-4" />}
                  variant="success"
                />
              )}
            </div>
          </div>
        )}

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

        {/* MCB Trip Times Chart */}
        <McbTripTimesChart data={data} />

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
