export interface SevenDaySummaryV1 {
  schema_version: "1.0.0";
  week_starting?: string;
  generated_at?: string;
  generatedAt?: string;
  expectedSnapshots: number;
  actualSnapshots: number;
  fallbackRateMean: number;
  issuesOpenedTotal: number;
  p95LatencyMedianMs: number;
  leakageHits: number;
  thresholdSnapshots: number;
  mlSnapshots: number;
}

export interface TrendWeek {
  week_starting: string;
  actualSnapshots: number;
  expectedSnapshots: number;
  fallbackRateMean: number;
  p95LatencyMedianMs: number;
  issuesOpenedTotal: number;
  leakageHits: number;
  thresholdSnapshots: number;
  mlSnapshots: number;
  period: "threshold" | "ml" | "mixed";
}

export interface WeeklyTrend {
  schema_version: "1.0.0";
  generated_at: string;
  source_count: number;
  skipped_count: number;
  warnings: string[];
  weeks: TrendWeek[];
  metrics: {
    fallback_rate: number[];
    p95_latency_ms: number[];
    issues_opened: number[];
    leakage_hits: number[];
  };
}
