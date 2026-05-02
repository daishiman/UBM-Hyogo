"use client";
// 04b-followup-004: admin queue resolve workflow UI
//
// 不変条件 #4 / #5 / #11: D1 直接アクセスは行わず、admin gate 配下の proxy 経由で
// `/admin/requests` を呼ぶ。confirmation modal で破壊的操作（approve）を二段確認する。
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveAdminRequest } from "../../lib/admin/api";

export type RequestNoteType = "visibility_request" | "delete_request";

export interface RequestQueueItem {
  noteId: string;
  memberId: string;
  noteType: RequestNoteType;
  requestStatus: "pending" | "resolved" | "rejected";
  requestedAt: string;
  requestedReason: string | null;
  requestedPayload: unknown;
  memberSummary: {
    memberId: string;
    publicHandle: string | null;
    publishState: string;
    isDeleted: boolean;
  };
}

export interface RequestQueueListView {
  items: RequestQueueItem[];
  nextCursor: string | null;
  appliedFilters: { status: string; type: string };
}

interface Props {
  readonly initial: RequestQueueListView;
  readonly type: RequestNoteType;
}

const NOTE_TYPE_LABEL: Record<RequestNoteType, string> = {
  visibility_request: "公開停止/再公開",
  delete_request: "退会",
};

const summarizePayload = (payload: unknown): string => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>;
    if (typeof obj["desiredState"] === "string") {
      return `desiredState: ${String(obj["desiredState"])}`;
    }
  }
  return JSON.stringify(payload ?? null);
};

export function RequestQueuePanel({ initial, type }: Props) {
  const router = useRouter();
  const items = initial.items;
  const [selectedId, setSelectedId] = useState<string | null>(
    items[0]?.noteId ?? null,
  );
  const [confirming, setConfirming] = useState<null | "approve" | "reject">(
    null,
  );
  const [resolutionNote, setResolutionNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const current = useMemo(
    () => items.find((i) => i.noteId === selectedId) ?? null,
    [items, selectedId],
  );

  const onFilter = (next: RequestNoteType) => {
    router.push(`/admin/requests?type=${next}`);
  };

  const onNextPage = () => {
    if (!initial.nextCursor) return;
    router.push(
      `/admin/requests?type=${type}&cursor=${encodeURIComponent(initial.nextCursor)}`,
    );
  };

  const openConfirm = (kind: "approve" | "reject") => {
    if (!current) return;
    setConfirming(kind);
  };

  const closeConfirm = () => {
    setConfirming(null);
    setResolutionNote("");
  };

  const onSubmit = async () => {
    if (!current || !confirming) return;
    setBusy(true);
    const r = await resolveAdminRequest(current.noteId, {
      resolution: confirming,
      ...(resolutionNote.trim() ? { resolutionNote: resolutionNote.trim() } : {}),
    });
    setBusy(false);
    if (!r.ok) {
      if (r.status === 409) {
        setToast("他の管理者が既に処理済みです。一覧を再読込します");
        closeConfirm();
        router.refresh();
        return;
      }
      setToast(`処理に失敗しました: ${r.error}`);
      return;
    }
    setToast(
      confirming === "approve" ? "依頼を承認しました" : "依頼を却下しました",
    );
    closeConfirm();
    router.refresh();
  };

  const isDestructive = confirming === "approve";

  return (
    <section aria-labelledby="admin-requests-h">
      <h1 id="admin-requests-h">依頼キュー</h1>
      <div role="group" aria-label="依頼種別">
        {(["visibility_request", "delete_request"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={type === v}
            onClick={() => onFilter(v)}
          >
            {NOTE_TYPE_LABEL[v]}
          </button>
        ))}
      </div>
      {toast && <p role="status">{toast}</p>}

      <div
        className="admin-requests-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}
      >
        <ul aria-label="依頼一覧">
          {items.length === 0 && <li>未処理の依頼はありません</li>}
          {items.map((it) => (
            <li key={it.noteId}>
              <button
                type="button"
                onClick={() => setSelectedId(it.noteId)}
                aria-pressed={selectedId === it.noteId}
              >
                <div>
                  <code>{it.memberId}</code>
                </div>
                <small>
                  {NOTE_TYPE_LABEL[it.noteType]} — {it.requestedAt}
                </small>
              </button>
            </li>
          ))}
        </ul>

        <div aria-label="依頼詳細">
          {!current && <p>左の一覧から依頼を選択してください。</p>}
          {current && (
            <article aria-labelledby="admin-request-detail-h">
              <h2 id="admin-request-detail-h">依頼詳細</h2>
              <dl>
                <dt>noteId</dt>
                <dd>
                  <code>{current.noteId}</code>
                </dd>
                <dt>会員</dt>
                <dd>
                  <code>{current.memberSummary.memberId}</code>（公開状態:{" "}
                  {current.memberSummary.publishState}, 削除済:{" "}
                  {current.memberSummary.isDeleted ? "はい" : "いいえ"}）
                </dd>
                <dt>種別</dt>
                <dd>{NOTE_TYPE_LABEL[current.noteType]}</dd>
                <dt>提出日時</dt>
                <dd>{current.requestedAt}</dd>
                {current.requestedReason && (
                  <>
                    <dt>理由</dt>
                    <dd>{current.requestedReason}</dd>
                  </>
                )}
                <dt>依頼内容</dt>
                <dd>
                  <code>{summarizePayload(current.requestedPayload)}</code>
                </dd>
                <dt>状態</dt>
                <dd>{current.requestStatus}</dd>
              </dl>
              <div role="group" aria-label="操作">
                <button
                  type="button"
                  onClick={() => openConfirm("approve")}
                  disabled={busy || current.requestStatus !== "pending"}
                >
                  承認する
                </button>
                <button
                  type="button"
                  onClick={() => openConfirm("reject")}
                  disabled={busy || current.requestStatus !== "pending"}
                >
                  却下する
                </button>
              </div>
            </article>
          )}
        </div>
      </div>

      {initial.nextCursor && (
        <button type="button" onClick={onNextPage} aria-label="次の依頼ページ">
          次のページ
        </button>
      )}

      {confirming && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-h"
        >
          <h3 id="confirm-h">
            {confirming === "approve" ? "依頼を承認します" : "依頼を却下します"}
          </h3>
          {isDestructive && current.noteType === "delete_request" && (
            <p role="alert">
              退会依頼を承認すると、当該会員は論理削除されます（公開ディレクトリから削除）。
              この操作は取り消しできません。
            </p>
          )}
          {isDestructive && current.noteType === "visibility_request" && (
            <p role="alert">
              公開状態を依頼内容に応じて変更します。会員へ即時反映されます。
            </p>
          )}
          <label>
            メモ（任意・最大 500 文字、PII を含めない）
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
            />
          </label>
          <div role="group" aria-label="確認">
            <button type="button" onClick={onSubmit} disabled={busy}>
              {confirming === "approve" ? "承認を実行" : "却下を実行"}
            </button>
            <button type="button" onClick={closeConfirm} disabled={busy}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
