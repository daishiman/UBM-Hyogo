export interface ClassifierMetricsBlock {
  readonly precision: number;
  readonly recall: number;
  readonly fp: number;
  readonly fn: number;
  readonly fpRate: number;
  readonly fnRate: number;
  readonly fallbackRate: number;
  readonly latencyP50: number;
  readonly latencyP95: number;
}

export interface ClassifierMetrics {
  readonly name: string;
  readonly version: string;
  readonly metrics: ClassifierMetricsBlock;
}

export interface SelectionCriteria {
  readonly precisionMinDelta: number;
  readonly recallMinAbsolute: "baseline" | number;
  readonly fallbackRateMax: number;
  readonly latencyP95Max: number;
}

export interface SelectionResult {
  readonly winner: string | null;
  readonly criteria: SelectionCriteria;
  readonly tieBreaker: ReadonlyArray<
    "precision_desc" | "latencyP95_asc" | "fallbackRate_asc"
  >;
  readonly rejected: ReadonlyArray<{ readonly name: string; readonly reason: string }>;
}

export const DEFAULT_CRITERIA: SelectionCriteria = {
  precisionMinDelta: 0.05,
  recallMinAbsolute: "baseline",
  fallbackRateMax: 0.01,
  latencyP95Max: 500,
};

const DEFAULT_TIE_BREAKER = [
  "precision_desc",
  "latencyP95_asc",
  "fallbackRate_asc",
] as const;

export function selectWinner(
  candidates: ReadonlyArray<ClassifierMetrics>,
  baseline: ClassifierMetrics,
  criteria: SelectionCriteria = DEFAULT_CRITERIA,
): SelectionResult {
  const rejected: Array<{ name: string; reason: string }> = [];
  const passing: ClassifierMetrics[] = [];

  const recallTarget =
    criteria.recallMinAbsolute === "baseline"
      ? baseline.metrics.recall
      : criteria.recallMinAbsolute;

  for (const c of candidates) {
    if (c.name === baseline.name) continue;
    const m = c.metrics;
    const reasons: string[] = [];
    if (m.precision < baseline.metrics.precision + criteria.precisionMinDelta) {
      reasons.push(
        `precision_below_baseline+${(criteria.precisionMinDelta * 100).toFixed(0)}pt`,
      );
    }
    if (m.recall < recallTarget) reasons.push("recall_below_baseline");
    if (m.fallbackRate > criteria.fallbackRateMax) {
      reasons.push(`fallbackRate>${criteria.fallbackRateMax}`);
    }
    if (m.latencyP95 > criteria.latencyP95Max) {
      reasons.push(`latencyP95>${criteria.latencyP95Max}ms`);
    }
    if (reasons.length === 0) passing.push(c);
    else rejected.push({ name: c.name, reason: reasons.join(",") });
  }

  passing.sort((a, b) => {
    if (a.metrics.precision !== b.metrics.precision) {
      return b.metrics.precision - a.metrics.precision;
    }
    if (a.metrics.latencyP95 !== b.metrics.latencyP95) {
      return a.metrics.latencyP95 - b.metrics.latencyP95;
    }
    return a.metrics.fallbackRate - b.metrics.fallbackRate;
  });

  return {
    winner: passing[0]?.name ?? null,
    criteria,
    tieBreaker: DEFAULT_TIE_BREAKER,
    rejected,
  };
}
