"use client";
// step-07: admin/requests detail view (presentational)
// 親 spec: docs/30-workflows/step-07-requests-approve-reject/phase-2-design.md
import { EmptyState } from "../ui/EmptyState";
import type { RequestNoteType, RequestQueueItem } from "./RequestQueuePanel";

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

export interface RequestQueueDetailProps {
  readonly item: RequestQueueItem | null;
  readonly type: RequestNoteType;
  readonly onApprove: () => void;
  readonly onReject: () => void;
  readonly busy: boolean;
}

export function RequestQueueDetail({
  item,
  type: _type,
  onApprove,
  onReject,
  busy,
}: RequestQueueDetailProps) {
  if (!item) {
    return (
      <aside aria-label="申請詳細" className="card-flat card-pad-lg">
        <EmptyState title="左の一覧から申請を選択してください。" />
      </aside>
    );
  }
  return (
    <aside aria-label="申請詳細" className="card card-pad-lg">
      <article aria-labelledby="admin-request-detail-h">
        <h3 id="admin-request-detail-h" className="h-card">
          申請詳細
        </h3>
        <dl>
          <dt>noteId</dt>
          <dd>
            <code>{item.noteId}</code>
          </dd>
          <dt>会員</dt>
          <dd>
            <code>{item.memberSummary.memberId}</code>（公開状態: {item.memberSummary.publishState},
            削除済: {item.memberSummary.isDeleted ? "はい" : "いいえ"}）
          </dd>
          <dt>種別</dt>
          <dd>{NOTE_TYPE_LABEL[item.noteType]}</dd>
          <dt>提出日時</dt>
          <dd>{item.requestedAt}</dd>
          {item.requestedReason && (
            <>
              <dt>理由</dt>
              <dd>{item.requestedReason}</dd>
            </>
          )}
          <dt>申請内容</dt>
          <dd>
            <code>{summarizePayload(item.requestedPayload)}</code>
          </dd>
          <dt>状態</dt>
          <dd>{item.requestStatus}</dd>
        </dl>
        <div className="btn-row" role="group" aria-label="操作">
          <button
            type="button"
            onClick={onApprove}
            disabled={busy || item.requestStatus !== "pending"}
          >
            承認する
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={busy || item.requestStatus !== "pending"}
          >
            却下する
          </button>
        </div>
      </article>
    </aside>
  );
}
