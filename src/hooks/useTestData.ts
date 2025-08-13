import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TestEntry, TestType, DashboardMetrics, DateRange } from "@/types/test-data";
import { addDays, format, isWithinInterval } from "date-fns";
import { config } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";

// Mock data generator - replace with actual API calls
const generateMockData = (): TestEntry[] => {
  const mockData: TestEntry[] = [];
  const testTypes = ["decabit", "telenerg", "mcb", "rcd"];
  const outcomes = ["passed", "failed"] as const;
  
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
      skipped: false,
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
  if (name.includes('mcb') && (name.includes('trip') || name.includes('time'))) {
    return "MCB Trip Time";
  }
  if (name.includes('rcd') && (name.includes('value') || name.includes('trip value'))) {
    return "RCD Trip Value";
  }
  if (name.includes('rcd') && (name.includes('trip') || name.includes('time'))) {
    return "RCD Trip Time";
  }
  return "RCD Trip Time"; // default
};

// Real data fetching with Supabase and fallback
const fetchRealData = async (dateRange: DateRange, testType: TestType): Promise<TestEntry[]> => {
  console.log('[useTestData] Attempting to fetch real data (Supabase)', {
    dateRange,
    testType,
    useRealData: config.useRealData,
    isDevelopment: config.isDevelopment,
    debugDatabase: config.debugDatabase
  });

  try {
    const fromEpoch = Math.floor(dateRange.from.getTime() / 1000);
    const toEpoch = Math.floor(dateRange.to.getTime() / 1000);

    const { data, error } = await supabase
      .from('test_data')
      .select('id, created_at, datetime, duration, test_type, trip_time, trip_value, rating, multiplier, object_id')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    if (error) throw error;

    const rows = (data || []) as any[];

    // Map Supabase rows to TestEntry shape used by the UI
    const mapped: TestEntry[] = rows.map((r, idx) => {
      const created = r.datetime ? new Date(r.datetime) : new Date(r.created_at);
      const startSec = Math.floor(created.getTime() / 1000);
      const duration = typeof r.duration === 'number' ? r.duration : Number(r.duration) || 0;
      const tt = (r.test_type || '').toString();
      const lower = tt.toLowerCase();

      let inferredName = `test_${lower || 'unknown'}`;
      if (lower.includes('rcd')) {
        if (r.trip_value !== null && r.trip_value !== undefined) inferredName = 'test_rcd trip value';
        else if (r.trip_time !== null && r.trip_time !== undefined) inferredName = 'test_rcd trip time';
      } else if (lower.includes('mcb')) {
        inferredName = 'test_mcb trip time';
      }

      const computedPassed = (r.trip_time !== null && r.trip_time !== undefined) || (r.trip_value !== null && r.trip_value !== undefined);

      return {
        _id: { $oid: r.id || r.object_id || `row_${idx}` },
        name: inferredName,
        originalname: tt || 'test',
        description: '',
        session_uuid4: r.object_id || '',
        start: startSec,
        stop: startSec + duration,
        duration,
        outcome: computedPassed ? 'passed' : 'failed',
        passed: computedPassed,
        failed: !computedPassed,
        skipped: false,
        error: false,
        results: [],
        dataset: [],
        versions: {
          meter: {
            serial_number: '',
            firmware_version_main: '',
            firmware_version_ripple: ''
          }
        },
        condition: {
          command: 0,
          amplitude: Number(r.multiplier) || 0,
          frequency: 0,
          state: 'On'
        },
        xray: { id: '', key: '', issue_id: '' },
        meter_datetime_str: format(created, 'yyyy/M/d HH:mm:ss.SSS'),
        events: [],
        waveform_ids: [],
        document_type: 'function_metadata',
         // Optional fields for MCB metrics
         multiplier: Number(r.multiplier) || undefined,
         rating: r.rating ?? undefined
       };
     });

    // Apply client-side test type filter if needed
    const filtered = testType === 'All' ? mapped : mapped.filter(r => getTestType(r.name) === testType);
    console.log(`[useTestData] Successfully fetched ${filtered.length} real entries from Supabase (raw ${rows.length})`);
    return filtered;
  } catch (error) {
    console.error('[useTestData] Supabase fetch failed, falling back to mock data:', error);

    // Fallback to mock data and filter it
    const mockData = generateMockData();
    const filteredMockData = mockData.filter(test => {
      const testDate = new Date(test.start * 1000);
      const isInDateRange = isWithinInterval(testDate, {
        start: dateRange.from,
        end: dateRange.to
      });

      if (!isInDateRange) return false;
      if (testType === "All") return true;
      return getTestType(test.name) === testType;
    });
    console.log(`[useTestData] Using ${filteredMockData.length} filtered mock entries as fallback`);
    return filteredMockData;
  }
};

export const useTestData = (dateRange: DateRange, testType: TestType) => {
  const [mockData] = useState<TestEntry[]>(() => generateMockData());
  
  console.log('[useTestData] Hook called', {
    dateRange,
    testType,
    useRealData: config.useRealData,
    isDevelopment: config.isDevelopment
  });

  // Fetch real data using React Query (enabled based on config)
  const { data: realData, isLoading, error } = useQuery({
    queryKey: ['testData', dateRange.from.toISOString(), dateRange.to.toISOString(), testType],
    queryFn: () => fetchRealData(dateRange, testType),
    enabled: config.useRealData, // Controlled by environment variable
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });

  const filteredData = useMemo(() => {
    // Use real data if available and enabled, otherwise use mock data
    const sourceData = config.useRealData && realData ? realData : mockData;
    const isUsingRealData = config.useRealData && realData;
    
    console.log('[useTestData] Data source decision', {
      useRealData: config.useRealData,
      hasRealData: !!realData,
      realDataCount: realData?.length || 0,
      mockDataCount: mockData.length,
      isUsingRealData,
      sourceDataCount: sourceData.length
    });
    
    const filtered = sourceData.filter(test => {
      const testDate = new Date(test.start * 1000);
      const isInDateRange = isWithinInterval(testDate, {
        start: dateRange.from,
        end: dateRange.to
      });
      
      if (!isInDateRange) return false;
      if (testType === "All") return true;
      return getTestType(test.name) === testType;
    });
    
    console.log(`[useTestData] Filtered to ${filtered.length} entries for display`);
    return filtered;
  }, [mockData, realData, dateRange.from, dateRange.to, testType]);

const metrics = useMemo((): DashboardMetrics => {
  // Deduplicate hours by unique object_id + duration across the filtered dataset
  const seenKeys = new Set<string>();
  const getKey = (test: TestEntry) => {
    const id = (test as any)?.session_uuid4 || (test._id as any)?.$oid || JSON.stringify(test._id);
    return `${id}|${test.duration}`;
  };

  const totalHours = filteredData.reduce((acc, test) => {
    const key = getKey(test);
    if (seenKeys.has(key)) return acc;
    seenKeys.add(key);
    return acc + test.duration / 3600;
  }, 0);

  const totalTests = filteredData.length; // number of entries in the database (after filters)

  // Group by day for charts with the same dedup rule
  const dayMap = new Map<string, { count: number; hours: number }>();
  const seenPerAll = new Set<string>();

  filteredData.forEach(test => {
    const date = format(new Date(test.start * 1000), "yyyy-MM-dd");
    const existing = dayMap.get(date) || { count: 0, hours: 0 };

    const key = getKey(test);
    const hoursToAdd = seenPerAll.has(key) ? 0 : (seenPerAll.add(key), test.duration / 3600);

    dayMap.set(date, {
      count: existing.count + 1,
      hours: existing.hours + hoursToAdd,
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

  // MCB current threshold buckets (only meaningful when MCB Trip Time is selected)
  const bucketCounts = { '50-100': 0, '100-200': 0, '200-300': 0, '300-400': 0 } as const;
  type BucketKey = keyof typeof bucketCounts;
  let mcbCurrentBuckets: Record<BucketKey, number> | undefined = undefined;

  const parseMultiplierFromText = (text: string): number | undefined => {
    const patterns = [
      /(\d+(?:\.\d+)?)\s*[x×]/i, // 5x or 5×
      /[x×]\s*(\d+(?:\.\d+)?)/i, // x5 or ×5
      /multiplier\s*[:=]?\s*(\d+(?:\.\d+)?)/i,
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m[1]) return parseFloat(m[1]);
    }
    return undefined;
  };

  const parseRatingNumber = (text: string): number | undefined => {
    // Prefer digits following a curve letter like B10, C16, etc., else any standalone number
    const curve = text.match(/[A-Z]\s*(\d+(?:\.\d+)?)/i);
    if (curve && curve[1]) return parseFloat(curve[1]);
    const anyNum = text.match(/\b(\d+(?:\.\d+)?)\b/);
    if (anyNum && anyNum[1]) return parseFloat(anyNum[1]);
    return undefined;
  };

  const computeBuckets = () => {
    const counts: Record<BucketKey, number> = { '50-100': 0, '100-200': 0, '200-300': 0, '300-400': 0 };
    for (const t of filteredData) {
      // Get multiplier
      const mult = (typeof (t as any).multiplier === 'number' && (t as any).multiplier > 0)
        ? (t as any).multiplier as number
        : (t.condition?.amplitude && t.condition.amplitude > 0 ? t.condition.amplitude : parseMultiplierFromText(`${t.name} ${t.originalname} ${t.description}`));

      // Get rating numeric part
      const ratingVal = (typeof (t as any).rating === 'number')
        ? (t as any).rating as number
        : (typeof (t as any).rating === 'string' && (t as any).rating)
          ? parseRatingNumber((t as any).rating as string)
          : parseRatingNumber(`${t.name} ${t.originalname} ${t.description}`);

      if (!mult || !ratingVal) continue;
      const current = mult * ratingVal; // As per spec: current = multiplier × numeric part of rating

      let bucket: BucketKey | undefined = undefined;
      if (current >= 50 && current < 100) bucket = '50-100';
      else if (current >= 100 && current < 200) bucket = '100-200';
      else if (current >= 200 && current < 300) bucket = '200-300';
      else if (current >= 300 && current <= 400) bucket = '300-400';

      if (bucket) counts[bucket] += 1;
    }
    return counts;
  };

  // Only compute when all filtered tests are MCB Trip Time (i.e., when selected)
  let mcbMaxCurrent: { value: number; count: number } | undefined = undefined;
  
  if (filteredData.length > 0 && filteredData.every(t => getTestType(t.name) === 'MCB Trip Time')) {
    mcbCurrentBuckets = computeBuckets();
    
    // Calculate maximum current and its frequency
    const currentValues = new Map<number, number>();
    for (const t of filteredData) {
      const mult = (typeof (t as any).multiplier === 'number' && (t as any).multiplier > 0)
        ? (t as any).multiplier as number
        : (t.condition?.amplitude && t.condition.amplitude > 0 ? t.condition.amplitude : parseMultiplierFromText(`${t.name} ${t.originalname} ${t.description}`));

      const ratingVal = (typeof (t as any).rating === 'number')
        ? (t as any).rating as number
        : (typeof (t as any).rating === 'string' && (t as any).rating)
          ? parseRatingNumber((t as any).rating as string)
          : parseRatingNumber(`${t.name} ${t.originalname} ${t.description}`);

      if (mult && ratingVal) {
        const current = mult * ratingVal;
        currentValues.set(current, (currentValues.get(current) || 0) + 1);
      }
    }
    
    if (currentValues.size > 0) {
      const maxCurrent = Math.max(...currentValues.keys());
      mcbMaxCurrent = {
        value: maxCurrent,
        count: currentValues.get(maxCurrent) || 0
      };
    }
  }

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    totalTests,
    // Pass/fail stats not needed; keep zeros for compatibility
    passedTests: 0,
    failedTests: 0,
    passRate: 0,
    testsPerDay,
    hoursPerDay,
    mcbCurrentBuckets,
    mcbMaxCurrent
  };
}, [filteredData, testType]);

  return { 
    data: filteredData, 
    metrics, 
    isLoading: config.useRealData && isLoading,
    error: config.useRealData ? error : null
  };
};