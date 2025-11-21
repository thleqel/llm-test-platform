export interface TestSuite {
  name: string;
  version: string;
  test_count: number;
  default_adapter?: any;
  metadata?: any;
}

export interface TestCase {
  id: string;
  name: string;
  suite?: string;
  input: string;
  expected_output: string;
  context?: any;
  adapter?: any;
  metrics: string[];
  thresholds?: Record<string, number>;
  tags: string[];
}

export interface TestRun {
  id: string;
  suite_name: string;
  start_time: string;
  end_time?: string;
  total_tests: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
  status: string;
  metadata?: any;
}

export interface TestResult {
  id: string;
  test_case_id: string;
  test_case_name: string;
  run_id: string;
  status: string;
  input: string;
  actual_output: string;
  expected_output: string;
  metrics: MetricResult[];
  passed: boolean;
  error?: string;
  metadata?: any;
  timestamp: string;
  duration_ms?: number;
  execution_time: number;
}

export interface MetricResult {
  metric: string;
  name: string;
  score: number;
  threshold: number;
  passed: boolean;
  reason?: string;
  metadata?: any;
}

export interface Adapter {
  type: string;
  description: string;
}

export interface Config {
  deepeval_service_url: string;
  max_concurrency: number;
  timeout: number;
  max_retries: number;
  test_artifacts_dir: string;
  test_results_dir: string;
  playwright_headless: boolean;
  playwright_screenshot: boolean;
  deepeval: {
    url: string;
    timeout: number;
    retry_attempts: number;
  };
  execution: {
    max_concurrency: number;
    default_adapter?: any;
  };
  storage: {
    results_dir: string;
    artifacts_dir: string;
  };
  ui: {
    refresh_interval: number;
    show_screenshots: boolean;
    theme: string;
  };
  notifications: {
    enabled: boolean;
    on_failure: boolean;
    on_completion: boolean;
  };
}

export interface StatsOverview {
  total_runs: number;
  total_tests: number;
  total_passed: number;
  total_failed: number;
  pass_rate: number;
  recent_runs: TestRun[];
}

export interface SuiteStats {
  [suiteName: string]: {
    runs: number;
    tests: number;
    passed: number;
    failed: number;
    pass_rate: number;
  };
}
