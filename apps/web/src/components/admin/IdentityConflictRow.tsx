// issue-194-03b-followup-001-email-conflict-identity-merge
// admin identity 重複候補 1 行 + merge / dismiss 操作 (二段階確認は merge 側で confirm prompt)
"use client";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IdentityConflictRow as Row } from "@ubm-hyogo/shared";

const callJson = async (
  url: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; data: unknown }> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

export function IdentityConflictRow({ item }: { item: Row }) {
  const router = useRouter();
  const formId = useId();
  const [isPending, startTransition] = useTransition();
  const [stage, setStage] = useState<"idle" | "merge-confirm" | "merge-final" | "dismiss">("idle");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const mergeReasonId = `${formId}-merge-reason`;
  const dismissReasonId = `${formId}-dismiss-reason`;

  const onMerge = () => {
    setErr(null);
    startTransition(async () => {
      const res = await callJson(
        `/api/admin/identity-conflicts/${encodeURIComponent(item.conflictId)}/merge`,
        { targetMemberId: item.candidateTargetMemberId, reason },
      );
      if (!res.ok) {
        const e = (res.data as { error?: string }).error ?? "MERGE_FAILED";
        setErr(`${res.status}: ${e}`);
        return;
      }
      router.refresh();
    });
  };

  const onDismiss = () => {
    setErr(null);
    startTransition(async () => {
      const res = await callJson(
        `/api/admin/identity-conflicts/${encodeURIComponent(item.conflictId)}/dismiss`,
        { reason },
      );
      if (!res.ok) {
        const e = (res.data as { error?: string }).error ?? "DISMISS_FAILED";
        setErr(`${res.status}: ${e}`);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm">
          <div className="font-mono text-xs text-zinc-500">conflict: {item.conflictId}</div>
          <div>
            <span className="text-zinc-500">source:</span> <span className="font-mono">{item.sourceMemberId}</span>
            <span className="ml-2 text-zinc-500">→ target:</span>{" "}
            <span className="font-mono">{item.candidateTargetMemberId}</span>
          </div>
          <div className="text-zinc-500">
            email: <span className="font-mono">{item.responseEmailMasked}</span> / matched:{" "}
            {item.matchedFields.join(", ")}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {stage === "idle" && (
            <>
              <button
                type="button"
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
                onClick={() => setStage("dismiss")}
              >
                別人マーク
              </button>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                onClick={() => setStage("merge-confirm")}
              >
                merge
              </button>
            </>
          )}
        </div>
      </div>

      {stage === "merge-confirm" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="mb-2">
            <strong>確認 1/2:</strong> {item.sourceMemberId} を {item.candidateTargetMemberId} に統合します。
            実体本文は移動せず、canonical 解決テーブルのみ更新します。
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1"
              onClick={() => setStage("idle")}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="rounded-md bg-amber-600 px-3 py-1 text-white"
              onClick={() => setStage("merge-final")}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {stage === "merge-final" && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">
          <p className="mb-2">
            <strong>確認 2/2:</strong> merge 理由を記録します（PII は redaction されます）。
          </p>
          <label htmlFor={mergeReasonId} className="mb-1 block text-xs font-medium text-zinc-700">
            merge 理由
          </label>
          <textarea
            id={mergeReasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mb-2 w-full rounded-md border border-zinc-300 p-2 text-sm"
            placeholder="例: 本人確認済 / 同一人物として統合"
            rows={2}
            maxLength={500}
          />
          {err && (
            <p className="mb-2 text-red-600" role="alert" aria-live="polite">
              {err}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1"
              onClick={() => setStage("idle")}
              disabled={isPending}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-1 text-white disabled:opacity-50"
              onClick={onMerge}
              disabled={isPending || reason.trim().length === 0}
            >
              merge 実行
            </button>
          </div>
        </div>
      )}

      {stage === "dismiss" && (
        <div className="rounded-md border border-zinc-300 bg-zinc-50 p-3 text-sm">
          <p className="mb-2">別人として確定します。再検出を抑止します。理由を記載してください。</p>
          <label htmlFor={dismissReasonId} className="mb-1 block text-xs font-medium text-zinc-700">
            別人マーク理由
          </label>
          <textarea
            id={dismissReasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mb-2 w-full rounded-md border border-zinc-300 p-2 text-sm"
            placeholder="例: 同姓同名 / 別組織所属で確認済"
            rows={2}
            maxLength={500}
          />
          {err && (
            <p className="mb-2 text-red-600" role="alert" aria-live="polite">
              {err}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1"
              onClick={() => setStage("idle")}
              disabled={isPending}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="rounded-md bg-zinc-700 px-3 py-1 text-white disabled:opacity-50"
              onClick={onDismiss}
              disabled={isPending || reason.trim().length === 0}
            >
              別人として確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
