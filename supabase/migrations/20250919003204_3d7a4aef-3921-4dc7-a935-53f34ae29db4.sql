-- Create a comprehensive test data table that can store all the complex test information
DROP TABLE IF EXISTS public.test_data CASCADE;

CREATE TABLE public.test_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Basic test info
  name TEXT NOT NULL,
  originalname TEXT,
  description TEXT DEFAULT '',
  session_uuid4 TEXT,
  test_type TEXT,
  document_type TEXT DEFAULT 'function_metadata',
  
  -- Timing data
  datetime TEXT NOT NULL,
  start_time BIGINT, -- epoch seconds
  stop_time BIGINT, -- epoch seconds
  duration REAL NOT NULL,
  
  -- Test outcomes
  outcome TEXT CHECK (outcome IN ('passed', 'failed', 'skipped', 'error')),
  passed BOOLEAN DEFAULT false,
  failed BOOLEAN DEFAULT false,
  skipped BOOLEAN DEFAULT false,
  error BOOLEAN DEFAULT false,
  
  -- Test conditions
  command INTEGER,
  amplitude REAL,
  frequency INTEGER,
  state TEXT DEFAULT 'On',
  
  -- MCB/RCD specific fields
  rating TEXT,
  multiplier REAL,
  upper_limit REAL,
  trip_time DOUBLE PRECISION,
  trip_value DOUBLE PRECISION,
  temperature REAL,
  
  -- Device/meter info
  meter_serial_number TEXT,
  meter_firmware_main TEXT,
  meter_firmware_ripple TEXT,
  meter_datetime_str TEXT,
  
  -- XRay info
  xray_id TEXT,
  xray_key TEXT,
  xray_issue_id TEXT,
  
  -- Additional metadata as JSONB for flexibility
  results JSONB DEFAULT '[]'::jsonb,
  dataset JSONB DEFAULT '[]'::jsonb,
  events JSONB DEFAULT '[]'::jsonb,
  waveform_ids JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.test_data ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for demo purposes)
CREATE POLICY "Allow anonymous read access" ON public.test_data
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous insert access" ON public.test_data
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update access" ON public.test_data
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_test_data_updated_at
  BEFORE UPDATE ON public.test_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_test_data_datetime ON public.test_data (datetime);
CREATE INDEX idx_test_data_created_at ON public.test_data (created_at);
CREATE INDEX idx_test_data_test_type ON public.test_data (test_type);
CREATE INDEX idx_test_data_outcome ON public.test_data (outcome);
CREATE INDEX idx_test_data_session ON public.test_data (session_uuid4);

-- Insert some sample data for testing
INSERT INTO public.test_data 
(name, originalname, description, session_uuid4, test_type, datetime, start_time, stop_time, duration, outcome, passed, failed, skipped, error, command, amplitude, frequency, state, rating, multiplier, upper_limit, trip_time, trip_value, temperature, meter_serial_number, meter_firmware_main, meter_firmware_ripple, meter_datetime_str, xray_id, xray_key, xray_issue_id)
VALUES 
('test_mcb[CMD1_5.0%_250Hz_On]', 'test_mcb', 'MCB trip time test', 'session_001', 'MCB Trip Time', '2024/1/15 10:30:00.000', 1705318200, 1705318260, 60.0, 'passed', true, false, false, false, 1, 5.0, 250, 'On', 'C16', 5.0, 0.1, 0.05, null, 25.5, '240000000119', 'Z-T135VA-01-2419-101', 'Z-T135VA-0M-2428-100', '2024/1/15 10:30:00.000', 'xray_001', 'STG1-001', '1'),

('test_rcd[CMD2_1.0%_300Hz_On]', 'test_rcd', 'RCD trip time test', 'session_002', 'RCD Trip Time', '2024/1/15 11:30:00.000', 1705321800, 1705321890, 90.0, 'passed', true, false, false, false, 2, 1.0, 300, 'On', 'TypeA', 1.0, 30.0, 25.0, null, 24.8, '240000000119', 'Z-T135VA-01-2419-101', 'Z-T135VA-0M-2428-100', '2024/1/15 11:30:00.000', 'xray_002', 'STG1-002', '2'),

('test_rcd[CMD3_2.0%_200Hz_On]', 'test_rcd', 'RCD trip value test', 'session_003', 'RCD Trip Value', '2024/1/15 12:30:00.000', 1705325400, 1705325520, 120.0, 'passed', true, false, false, false, 3, 2.0, 200, 'On', 'TypeB', 2.0, 100.0, null, 85.0, 25.2, '240000000119', 'Z-T135VA-01-2419-101', 'Z-T135VA-0M-2428-100', '2024/1/15 12:30:00.000', 'xray_003', 'STG1-003', '3'),

('test_mcb[CMD4_10.0%_400Hz_On]', 'test_mcb', 'MCB short circuit test', 'session_004', 'MCB Trip Time', '2024/1/16 09:15:00.000', 1705400100, 1705400160, 60.0, 'passed', true, false, false, false, 4, 10.0, 400, 'On', 'B20', 10.0, 0.1, 0.08, null, 26.1, '240000000119', 'Z-T135VA-01-2419-101', 'Z-T135VA-0M-2428-100', '2024/1/16 09:15:00.000', 'xray_004', 'STG1-004', '4');