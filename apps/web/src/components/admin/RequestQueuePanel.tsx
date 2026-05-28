"use client";
// step-07: admin/requests panel — useConfirmDialog + 抽出 components 統合
// 親 spec: docs/30-workflows/step-07-requests-approve-reject/
//
// 不変条件 #4 / #5 / #11: D1 直接アクセスは行わず、admin gate 配下の proxy 経由で
// `/admin/requests/:noteId/resolve` を呼ぶ。HTML5 <dialog> による二段確認を使う。
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveAdminRequest } from "../../lib/admin/api";
import { EmptyState } from "../ui/EmptyState";
import { Pagination } from "../ui/Pagination";
import {
  FetchAuthedError,
  useAdminMutation,
} from "../../features/admin/hooks/useAdminMutation";
import { useConfirmDialog } from "../../features/admin/hooks/useConfirmDialog";
import { RequestQueueDetail } from "./RequestQueueDetail";
import {
  RequestConfirmDialog,
  type RequestConfirmKind,
} from "./RequestConfirmDialog";

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
  readonly showHeading?: boolean;
}

const NOTE_TYPE_LABEL: Record<RequestNoteType, string> = {
  visibility_request: "公開停止/再公開",
  delete_request: "退会",
};

export function RequestQueuePanel({ initial, type, showHeading = true }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial.items);
  const [selectedId, setSelectedId] = useState<string | null>(
    items[0]?.noteId ?? null,
  );
  const [toast, setToast] = useState<string | null>(null);

  const current = useMemo(
    () => items.find((i) => i.noteId === selectedId) ?? null,
    [items, selectedId],
  );

  const resolveMutation = useAdminMutation<unknown>(
    "/api/admin/requests/resolve",
    "POST",
    {
      refreshOnSuccess: false,
      mutationFn: async (payload) => {
        const { noteId, ...body } = payload as {
          noteId: string;
          resolution: "approve" | "reject";
          resolutionNote?: string;
        };
        const r = await resolveAdminRequest(noteId, body);
        if (!r.ok) throw new FetchAuthedError(r.status, r.error);
        return r.data;
      },
    },
  );

  const performResolution = async (
    targetItem: RequestQueueItem | null,
    kind: "approve" | "reject" | null,
    note: string,
  ) => {
    if (!targetItem || !kind) return;
    try {
      await resolveMutation.trigger({
        noteId: targetItem.noteId,
        resolution: kind,
        ...(note ? { resolutionNote: note } : {}),
      });
    } catch (e) {
      if (e instanceof FetchAuthedError && e.status === 409) {
        setToast("他の管理者が既に処理済みです。一覧を再読込します");
        confirm.closeConfirm();
        router.refresh();
        return;
      }
      if (e instanceof FetchAuthedError && e.status === 404) {
        setToast("対象が見つかりません");
        confirm.closeConfirm();
        router.refresh();
        return;
      }
      setToast(
        `処理に失敗しました: ${e instanceof Error ? e.message : "unknown error"}`,
      );
      return;
    }
    setToast(kind === "approve" ? "依頼を承認しました" : "依頼を却下しました");
    setItems((prev) => {
      const next = prev.filter((item) => item.noteId !== targetItem.noteId);
      setSelectedId(next[0]?.noteId ?? null);
      return next;
    });
    confirm.closeConfirm();
    router.refresh();
  };

  // RequestConfirmDialog owns note input/validation; useConfirmDialog owns
  // action kind + target context so stale selections cannot change the target.
  const confirm = useConfirmDialog(async (kind, note, context) => {
    if (kind !== "approve" && kind !== "reject") return;
    await performResolution(context as RequestQueueItem | null, kind, note);
  });

  const handleDialogSubmit = async (note: string) => {
    const targetItem = confirm.context as RequestQueueItem | null;
    const kind = confirm.kind;
    if (kind !== "approve" && kind !== "reject") return;
    await performResolution(targetItem, kind, note);
  };

  const onFilter = (next: RequestNoteType) => {
    router.push(`/admin/requests?type=${next}`);
  };

  const onNextPage = () => {
    if (!initial.nextCursor) return;
    router.push(
      `/admin/requests?type=${type}&cursor=${encodeURIComponent(initial.nextCursor)}`,
    );
  };

  const dialogKind: RequestConfirmKind | null =
    confirm.kind === "approve" || confirm.kind === "reject"
      ? confirm.kind
      : null;
  const dialogItem = confirm.context as RequestQueueItem | null;
  const isDestructive =
    dialogKind === "approve" &&
    dialogItem?.noteType === "delete_request";
  const destructiveMessage =
    dialogKind === "approve" && dialogItem
      ? dialogItem.noteType === "delete_request"
        ? "退会依頼を承認すると、当該会員は論理削除されます（公開ディレクトリから削除）。この操作は取り消しできません。"
        : "公開状態を依頼内容に応じて変更します。会員へ即時反映されます。"
      : undefined;

  return (
    <section
      aria-labelledby={showHeading ? "admin-requests-h" : undefined}
      aria-label={showHeading ? undefined : "依頼キュー"}
    >
      {showHeading ? <h1 id="admin-requests-h">依頼キュー</h1> : null}
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

      <div className="admin-requests-grid">
        <ul aria-label="依頼一覧">
          {items.length === 0 && (
            <li>
              <EmptyState title="未処理の依頼はありません" />
            </li>
          )}
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

        <RequestQueueDetail
          item={current}
          type={type}
          onApprove={() => current && confirm.openConfirm("approve", current)}
          onReject={() => current && confirm.openConfirm("reject", current)}
          busy={resolveMutation.isLoading}
        />
      </div>

      {initial.nextCursor && (
        <Pagination
          current={1}
          hasPrev={false}
          hasNext={Boolean(initial.nextCursor)}
          onPrev={() => {}}
          onNext={onNextPage}
          nextLabel="次の依頼ページ"
          nextAriaLabel="次の依頼ページ"
        />
      )}

      <RequestConfirmDialog
        kind={dialogKind}
        open={confirm.open}
        onClose={confirm.closeConfirm}
        onSubmit={handleDialogSubmit}
        busy={resolveMutation.isLoading}
        isDestructive={isDestructive}
        {...(destructiveMessage ? { destructiveMessage } : {})}
      />
    </section>
  );
}
