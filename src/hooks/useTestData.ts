import { useState, useMemo } from "react";
import { TestEntry, TestType, DashboardMetrics, DateRange } from "@/types/test-data";
import { addDays, format, isWithinInterval } from "date-fns";

// Mock data generator - replace with actual API calls
const generateMockData = (): TestEntry[] => {
  const mockData: TestEntry[] = [];
  const testTypes = ["decabit", "telenerg", "mcb", "rcd"];
  const outcomes = ["passed", "failed", "skipped"] as const;
  
  for (let i = 0; i < 100; i++) {
    const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    const startTime = Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000; // Last 30 days
    const duration = Math.random() * 300 + 10; // 10-310 seconds
    
    mockData.push({
      _id: { $oid: `mock_${i}` },
      name: `test_${testType}[CMD${Math.floor(Math.random() * 10)}_${Math.random().toFixed(1)}%_${Math.floor(Math.random() * 500)}Hz_On]`,
      originalname: `test_${testType}`,
      description: "",
      session_uuid4: `session_${i}`,
      start: startTime / 1000,
      stop: (startTime + duration * 1000) / 1000,
      duration,
      outcome,
      passed: outcome === "passed",
      failed: outcome === "failed",
      skipped: outcome === "skipped",
      error: false,
      results: [],
      dataset: [],
      versions: {
        meter: {
          serial_number: "240000000119",
          firmware_version_main: "Z-T135VA-01-2419-101",
          firmware_version_ripple: "Z-T135VA-0M-2428-100"
        }
      },
      condition: {
        command: Math.floor(Math.random() * 10),
        amplitude: Math.random() * 2,
        frequency: Math.floor(Math.random() * 500),
        state: "On"
      },
      xray: {
        id: `xray_${i}`,
        key: `STG1-${i}`,
        issue_id: `${i}`
      },
      meter_datetime_str: format(new Date(startTime), "yyyy/M/d HH:mm:ss.SSS"),
      events: [],
      waveform_ids: [],
      document_type: "function_metadata"
    });
  }
  
  return mockData;
};

export const getTestType = (testName: string): TestType => {
  const name = testName.toLowerCase();
  if (name.includes('decabit') || name.includes('telenerg')) {
    return "Meter Test";
  } else if (name.includes('mcb')) {
    return "MCB Test";
  } else if (name.includes('rcd')) {
    return "RCD Test";
  }
  return "Meter Test"; // default
};

export const useTestData = (dateRange: DateRange, testType: TestType) => {
  const [mockData] = useState<TestEntry[]>(() => generateMockData());

  const filteredData = useMemo(() => {
    return mockData.filter(test => {
      const testDate = new Date(test.start * 1000);
      const isInDateRange = isWithinInterval(testDate, {
        start: dateRange.from,
        end: dateRange.to
      });
      
      if (!isInDateRange) return false;
      
      if (testType === "All") return true;
      
      return getTestType(test.name) === testType;
    });
  }, [mockData, dateRange.from, dateRange.to, testType]);

  const metrics = useMemo((): DashboardMetrics => {
    const totalHours = filteredData.reduce((sum, test) => sum + (test.duration / 3600), 0);
    const totalTests = filteredData.length;
    const passedTests = filteredData.filter(test => test.passed).length;
    const failedTests = filteredData.filter(test => test.failed).length;
    const skippedTests = filteredData.filter(test => test.skipped).length;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Group by day for charts
    const dayMap = new Map<string, { count: number; hours: number }>();
    
    filteredData.forEach(test => {
      const date = format(new Date(test.start * 1000), "yyyy-MM-dd");
      const existing = dayMap.get(date) || { count: 0, hours: 0 };
      dayMap.set(date, {
        count: existing.count + 1,
        hours: existing.hours + (test.duration / 3600)
      });
    });

    const testsPerDay = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      count: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));

    const hoursPerDay = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      hours: Math.round(data.hours * 100) / 100
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate: Math.round(passRate * 100) / 100,
      testsPerDay,
      hoursPerDay
    };
  }, [filteredData]);

  return { data: filteredData, metrics };
};