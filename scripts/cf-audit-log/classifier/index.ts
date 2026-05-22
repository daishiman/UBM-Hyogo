import { IsolationForestClassifier } from "./isolation-forest.ts";
import { MLClassifier } from "./ml.ts";
import { ThresholdClassifier } from "./threshold.ts";
import { WorkersAIClassifier } from "./workers-ai.ts";
import { XGBoostClassifier } from "./xgboost.ts";
import type { Classifier } from "./types.ts";

export interface ClassifierEnv {
  CF_AUDIT_CLASSIFIER?: string;
  ML_MODEL_PATH?: string;
  CF_AUDIT_IF_MODEL?: string;
  CF_AUDIT_XGB_MODEL?: string;
  CF_AUDIT_WORKERS_AI_URL?: string;
  CF_AUDIT_WORKERS_AI_TOKEN?: string;
}

export function getClassifier(env: ClassifierEnv): Classifier {
  switch (env.CF_AUDIT_CLASSIFIER) {
    case "ml":
      return new MLClassifier(env.ML_MODEL_PATH);
    case "isolation-forest":
      return new IsolationForestClassifier(env.CF_AUDIT_IF_MODEL ?? null);
    case "xgboost":
      return new XGBoostClassifier(env.CF_AUDIT_XGB_MODEL ?? null);
    case "workers-ai":
      return new WorkersAIClassifier(
        env.CF_AUDIT_WORKERS_AI_URL ?? null,
        env.CF_AUDIT_WORKERS_AI_TOKEN ?? null,
      );
    default:
      return new ThresholdClassifier();
  }
}
