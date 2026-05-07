import { MLClassifier } from "./ml.ts";
import { ThresholdClassifier } from "./threshold.ts";
import type { Classifier } from "./types.ts";

export interface ClassifierEnv {
  CF_AUDIT_CLASSIFIER?: string;
  ML_MODEL_PATH?: string;
}

export function getClassifier(env: ClassifierEnv): Classifier {
  if (env.CF_AUDIT_CLASSIFIER === "ml") {
    return new MLClassifier(env.ML_MODEL_PATH);
  }
  return new ThresholdClassifier();
}

