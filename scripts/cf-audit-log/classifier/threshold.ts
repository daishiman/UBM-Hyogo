import { classify as classifySeverity } from "../severity-classifier.ts";
import type { Classifier, ClassifierInput, SeverityResult } from "./types.ts";

export class ThresholdClassifier implements Classifier {
  readonly name = "threshold" as const;
  readonly version = "threshold@1.0.0";

  classify(input: ClassifierInput): SeverityResult | null {
    const result = classifySeverity(input.event, input.baseline, input.context);
    if (!result) return null;
    return {
      severity: result.severity,
      confidence: 1,
      classifierUsed: this.name,
      classifierVersion: this.version,
      reason: result.reason,
    };
  }
}

