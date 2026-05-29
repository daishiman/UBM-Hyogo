// issue-958 Track B: hidden / member_only な member を一括で public に戻す hook。
// 既存 PATCH /admin/members/:memberId/status を逐次呼び出し、進捗を追跡する。
// 並列実行禁止 — D1 transaction の race / audit log の順序保証のため `for...of` で sequential。

"use client";

import { useCallback, useState } from "react";
import { FetchAuthedError, useAdminMutation } from "./useAdminMutation";

export type BulkRepublishTarget = {
  readonly memberId: string;
  readonly currentPublishState: "hidden" | "member_only";
};

export type BulkRepublishFailure = {
  readonly memberId: string;
  readonly code: string;
  readonly message: string;
};

export type BulkRepublishProgress = {
  readonly total: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly failures: ReadonlyArray<BulkRepublishFailure>;
};

export type BulkRepublishState = "idle" | "running" | "done";

export interface UseBulkRepublishReturn {
  readonly state: BulkRepublishState;
  readonly progress: BulkRepublishProgress;
  readonly start: (
    targets: ReadonlyArray<BulkRepublishTarget>,
  ) => Promise<void>;
  readonly reset: () => void;
}

const INITIAL_PROGRESS: BulkRepublishProgress = {
  total: 0,
  succeeded: 0,
  failed: 0,
  failures: [],
};

export function useBulkRepublish(): UseBulkRepublishReturn {
  const [state, setState] = useState<BulkRepublishState>("idle");
  const [progress, setProgress] =
    useState<BulkRepublishProgress>(INITIAL_PROGRESS);
  const mutation = useAdminMutation<unknown>(
    "/api/admin/members/__bulk_republish_placeholder__/status",
    "PATCH",
    {
      refreshOnSuccess: false,
      successMessage: "公開状態を更新しました",
    },
  );

  const start = useCallback(
    async (targets: ReadonlyArray<BulkRepublishTarget>): Promise<void> => {
      if (targets.length === 0) return;
      setState("running");
      let succeeded = 0;
      let failed = 0;
      const failures: BulkRepublishFailure[] = [];
      setProgress({
        total: targets.length,
        succeeded,
        failed,
        failures: [],
      });

      for (const t of targets) {
        try {
          await mutation.trigger(
            { publishState: "public" },
            `/api/admin/members/${encodeURIComponent(t.memberId)}/status`,
          );
          succeeded += 1;
        } catch (e) {
          failed += 1;
          const status = e instanceof FetchAuthedError ? e.status : null;
          failures.push({
            memberId: t.memberId,
            code: status === null ? "NETWORK_ERROR" : `HTTP_${status}`,
            message: e instanceof Error ? e.message : String(e),
          });
        }
        setProgress({
          total: targets.length,
          succeeded,
          failed,
          failures: [...failures],
        });
      }
      setState("done");
    },
    [mutation],
  );

  const reset = useCallback(() => {
    setState("idle");
    setProgress(INITIAL_PROGRESS);
  }, []);

  return { state, progress, start, reset };
}
