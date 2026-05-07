import { ThresholdClassifier } from "./threshold.ts";
import type { Classifier, ClassifierInput, SeverityResult } from "./types.ts";

export class MLClassifier implements Classifier {
  readonly name = "ml" as const;
  readonly version: string;
  private readonly fallback = new ThresholdClassifier();
  constructor(modelPath: string | undefined) {
    void modelPath;
    this.version = "ml@v0.0.0-skeleton-fallback";
  }

  classify(input: ClassifierInput): SeverityResult | null {
    const fallbackResult = this.fallback.classify(input);
    if (!fallbackResult) return null;
    return {
      ...fallbackResult,
      classifierUsed: this.name,
      classifierVersion: this.version,
      reason: `${fallbackResult.reason}; ml-fallback-to-threshold`,
    };
  }
}
