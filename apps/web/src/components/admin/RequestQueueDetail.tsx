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

export type PublishStateDiffKind = "visibility" | "delete";

export interface PublishStateDiff {
  readonly kind: PublishStateDiffKind;
  readonly before: string;
  readonly after: string;
}

export function formatPublishStateLabel(state: string): string {
  switch (state) {
    case "public":
      return "公開";
    case "member_only":
      return "会員限定";
    case "hidden":
      return "非公開";
    default:
      return "不明";
  }
}

export function buildPublishStateDiff(item: RequestQueueItem): PublishStateDiff | null {
  if (item.noteType === "delete_request") {
    return {
      kind: "delete",
      before: item.memberSummary.isDeleted ? "退会済み" : "在籍",
      after: "退会（論理削除）",
    };
  }

  if (item.noteType !== "visibility_request") return null;
  if (!item.requestedPayload || typeof item.requestedPayload !== "object") return null;
  if (Array.isArray(item.requestedPayload)) return null;

  const desiredState = (item.requestedPayload as Record<string, unknown>)["desiredState"];
  if (typeof desiredState !== "string") return null;

  return {
    kind: "visibility",
    before: formatPublishStateLabel(item.memberSummary.publishState),
    after: formatPublishStateLabel(desiredState),
  };
}

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
  const diff = buildPublishStateDiff(item);
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
            <code>{item.memberSummary.memberId}</code>（公開状態:{" "}
            {formatPublishStateLabel(item.memberSummary.publishState)},
            削除済: {item.memberSummary.isDeleted ? "はい" : "いいえ"}）
          </dd>
          <dt>種別</dt>
          <dd>{NOTE_TYPE_LABEL[item.noteType]}</dd>
          {diff && (
            <>
              <dt>{diff.kind === "visibility" ? "公開状態の変更" : "レコード状態の変更"}</dt>
              <dd data-diff-kind={diff.kind}>
                <span data-diff-side="before">{diff.before}</span>
                <span data-diff-arrow aria-hidden="true">
                  →
                </span>
                <span data-diff-side="after">{diff.after}</span>
              </dd>
            </>
          )}
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
