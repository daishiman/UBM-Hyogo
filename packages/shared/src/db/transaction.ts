import { ApiError, type UbmErrorCode } from "../errors";
import { logError } from "../logging";

export interface CompensationStep<TResult = unknown> {
  name: string;
  execute: () => Promise<TResult>;
  compensate: (result: TResult) => Promise<void>;
}

export interface CompensationFailureRecord {
  failedStep: string;
  compensationFailures: Array<{ step: string; reason: unknown }>;
  originalCause: unknown;
}

export interface RunWithCompensationOptions {
  compensationFailureCode?: UbmErrorCode;
  primaryFailureCode?: UbmErrorCode;
  recordDeadLetter?: (failure: CompensationFailureRecord) => Promise<void>;
}

export async function runWithCompensation<T = unknown>(
  steps: ReadonlyArray<CompensationStep>,
  options?: RunWithCompensationOptions,
): Promise<T[]> {
  const compensationFailureCode = options?.compensationFailureCode ?? "UBM-5101";
  const primaryFailureCode = options?.primaryFailureCode ?? "UBM-5001";
  const completed: Array<{ step: CompensationStep; result: unknown }> = [];

  for (const step of steps) {
    try {
      const result = await step.execute();
      completed.push({ step, result });
    } catch (originalCause) {
      const compensationFailures = await rollback(completed);
      const failure: CompensationFailureRecord = {
        failedStep: step.name,
        compensationFailures,
        originalCause,
      };
      if (options?.recordDeadLetter) {
        try {
          await options.recordDeadLetter(failure);
        } catch (dlqErr) {
          // dead letter 記録失敗も best-effort（throw せず log のみ）
          logError({
            code: compensationFailureCode,
            message: "Dead letter record failed",
            context: { failure: { failedStep: failure.failedStep }, dlqErr: String(dlqErr) },
          });
        }
      }
      if (compensationFailures.length > 0) {
        throw new ApiError({
          code: compensationFailureCode,
          log: { cause: originalCause, context: { failure } },
        });
      }
      throw new ApiError({
        code: primaryFailureCode,
        log: { cause: originalCause, context: { failedStep: step.name } },
      });
    }
  }

  return completed.map(({ result }) => result) as T[];
}

async function rollback(
  completed: ReadonlyArray<{ step: CompensationStep; result: unknown }>,
): Promise<Array<{ step: string; reason: unknown }>> {
  const failures: Array<{ step: string; reason: unknown }> = [];
  for (let i = completed.length - 1; i >= 0; i--) {
    const entry = completed[i];
    if (!entry) continue;
    try {
      await entry.step.compensate(entry.result);
    } catch (compensationErr) {
      failures.push({ step: entry.step.name, reason: compensationErr });
      // 補償失敗は記録のみ・続行
    }
  }
  return failures;
}
