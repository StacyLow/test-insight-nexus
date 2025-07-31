export interface TestResult {
  description: string;
  long_outcome: string;
  outcome: "passed" | "failed" | "skipped" | "error";
  passed: boolean;
  measured_value: any;
  expected_value: any;
  minimum_value?: any;
  maximum_value?: any;
}

export interface TestEvent {
  timestamp: string;
  type: string;
  command_id: string;
  parameter_1: number;
  parameter_2: number;
}

export interface TestDataset {
  epoch: number;
  datetime: string;
  name: string;
  originalname: string;
  param_command: number;
  param_amplitude: number;
  param_frequency: number;
  param_state: string;
  event_timestamp: string;
  event_type: string;
  event_command_id: string;
  event_parameter_1: number;
  event_parameter_2: number;
  meter_ripple_protocol: string;
  meter_ripple_frequency: string;
  meter_ripple_voltage_minimum: string;
  meter_command_1_mode: string;
  meter_command_1_config: string;
  meter_command_1_state: string;
  meter_command_1_on_delay_length: string;
  meter_command_1_on_delay_random: string;
  meter_command_1_reset_time: string;
  meter_command_1_reset_function: string;
}

export interface TestEntry {
  _id: { $oid: string };
  name: string;
  originalname: string;
  description: string;
  session_uuid4: string;
  start: number;
  stop: number;
  duration: number;
  outcome: "passed" | "failed" | "skipped" | "error";
  passed: boolean;
  failed: boolean;
  skipped: boolean;
  error: boolean;
  results: TestResult[];
  dataset: TestDataset[];
  versions: {
    meter: {
      serial_number: string;
      firmware_version_main: string;
      firmware_version_ripple: string;
    };
  };
  condition: {
    command: number;
    amplitude: number;
    frequency: number;
    state: string;
  };
  xray: {
    id: string;
    key: string;
    issue_id: string;
  };
  meter_datetime_str: string;
  events: TestEvent[];
  waveform_ids: any[];
  document_type: string;
}

export type TestType = "Meter Test" | "MCB Test" | "RCD Test" | "All";

export interface DashboardMetrics {
  totalHours: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  passRate: number;
  testsPerDay: { date: string; count: number }[];
  hoursPerDay: { date: string; hours: number }[];
}

export interface DateRange {
  from: Date;
  to: Date;
}