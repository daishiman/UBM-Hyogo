import { extractFeatures } from "../features/extract.ts";
import type { RedactedFeatures } from "../features/schema.ts";
import { ThresholdClassifier } from "./threshold.ts";
import type { Classifier, ClassifierInput, SeverityResult } from "./types.ts";

const DEFAULT_REDACT_SECRET = "cf-audit-default-secret-cf";
const DEFAULT_TIMEOUT_MS = 2000;
const DEFAULT_THRESHOLDS = { high: 0.75, medium: 0.5, low: 0.3 };

export interface WorkersAIResponse {
  readonly anomalyScore: number;
}

export interface WorkersAIOptions {
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
  readonly redactSecret?: string;
  readonly thresholds?: { high: number; medium: number; low: number };
}

export class WorkersAIClassifier implements Classifier {
  readonly name = "workers-ai" as const;
  readonly version = "workers-ai@1.0.0";
  private readonly fallback = new ThresholdClassifier();
  private readonly fetchImpl: typeof fetch | null;
  private readonly timeoutMs: number;
  private readonly redactSecret: string;
  private readonly thresholds: { high: number; medium: number; low: number };

  constructor(
    private readonly gatewayUrl: string | null,
    private readonly token: string | null,
    opts: WorkersAIOptions = {},
  ) {
    this.fetchImpl = opts.fetchImpl ?? (typeof fetch === "function" ? fetch : null);
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.redactSecret = opts.redactSecret ?? DEFAULT_REDACT_SECRET;
    this.thresholds = opts.thresholds ?? DEFAULT_THRESHOLDS;
  }

  get fallbackActive(): boolean {
    return !this.gatewayUrl || !this.token || !this.fetchImpl;
  }

  classify(input: ClassifierInput): SeverityResult | null {
    if (!this.gatewayUrl || !this.token || !this.fetchImpl) {
      return this.fallbackResult(input, "config-missing");
    }
    let features: RedactedFeatures;
    try {
      features = extractFeatures(input.event, { redactSecret: this.redactSecret });
    } catch {
      return null;
    }
    const score = this.scoreSyncOrNull(features);
    if (score === null) {
      return this.fallbackResult(input, "workers-ai-fallback");
    }
    const t = this.thresholds;
    let severity: SeverityResult["severity"] | null = null;
    if (score >= t.high) severity = "HIGH";
    else if (score >= t.medium) severity = "MEDIUM";
    else if (score >= t.low) severity = "LOW";
    if (!severity) return null;
    return {
      severity,
      confidence: Number(score.toFixed(4)),
      classifierUsed: "workers-ai",
      classifierVersion: this.version,
      reason: `workers-ai score ${score.toFixed(3)}`,
    };
  }

  async classifyAsync(input: ClassifierInput): Promise<SeverityResult | null> {
    if (!this.gatewayUrl || !this.token || !this.fetchImpl) {
      return this.fallbackResult(input, "config-missing");
    }
    let features: RedactedFeatures;
    try {
      features = extractFeatures(input.event, { redactSecret: this.redactSecret });
    } catch {
      return null;
    }
    let score: number | null = null;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      const res = await this.fetchImpl(this.gatewayUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ features }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`workers-ai status ${res.status}`);
      const body = (await res.json()) as WorkersAIResponse;
      if (typeof body.anomalyScore === "number") score = body.anomalyScore;
    } catch {
      return this.fallbackResult(input, "workers-ai-fallback");
    }
    if (score === null) return this.fallbackResult(input, "workers-ai-fallback");
    const t = this.thresholds;
    let severity: SeverityResult["severity"] | null = null;
    if (score >= t.high) severity = "HIGH";
    else if (score >= t.medium) severity = "MEDIUM";
    else if (score >= t.low) severity = "LOW";
    if (!severity) return null;
    return {
      severity,
      confidence: Number(score.toFixed(4)),
      classifierUsed: "workers-ai",
      classifierVersion: this.version,
      reason: `workers-ai score ${score.toFixed(3)}`,
    };
  }

  private scoreSyncOrNull(_features: RedactedFeatures): number | null {
    // Synchronous classify path is intentionally not network-bound;
    // production replay uses classifyAsync. The sync entrypoint exists so the
    // Classifier interface remains uniform across candidates.
    return null;
  }

  private fallbackResult(
    input: ClassifierInput,
    tag: string,
  ): SeverityResult | null {
    const fb = this.fallback.classify(input);
    if (!fb) return null;
    return {
      ...fb,
      classifierUsed: "workers-ai",
      classifierVersion: this.version,
      reason: `${fb.reason}; ${tag}`,
    };
  }
}
