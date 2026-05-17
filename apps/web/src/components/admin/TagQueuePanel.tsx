"use client";
// 06c: TagQueuePanel — 左 queue list + 右 review pane
// 不変条件 #13: tag 直接更新 endpoint なし。queue resolve POST のみ。
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveTagQueue } from "../../lib/admin/api";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";
import { useAdminMutation } from "../../features/admin/hooks/useAdminMutation";

export type TagQueueStatus = "queued" | "reviewing" | "resolved" | "rejected" | "dlq";

export interface TagQueueItem {
  queueId: string;
  memberId: string;
  responseId: string;
  status: TagQueueStatus;
  suggestedTagsJson: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TagQueueListView {
  total: number;
  items: TagQueueItem[];
}

const TERMINAL_STATUSES: ReadonlySet<TagQueueStatus> = new Set(["resolved", "rejected", "dlq"]);

const parseTags = (json: string): string[] => {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
};

interface Props {
  readonly initial: TagQueueListView;
  readonly filter: TagQueueStatus | undefined;
  readonly focusMemberId: string | null;
}

export function TagQueuePanel({ initial, filter, focusMemberId }: Props) {
  const router = useRouter();
  const tagResolveMutation = useAdminMutation<unknown>("/api/admin/tags/queue/resolve", "POST", {
    refreshOnSuccess: false,
    mutationFn: async (payload) => {
      const { queueId, ...body } = payload as {
        queueId: string;
        action: "confirmed" | "rejected";
        tagCodes?: string[];
        reason?: string;
      };
      const r = body.action === "confirmed"
        ? await resolveTagQueue(queueId, { action: "confirmed", tagCodes: body.tagCodes ?? [] })
        : await resolveTagQueue(queueId, { action: "rejected", reason: body.reason ?? "" });
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
  });
  const items = useMemo(() => {
    if (!focusMemberId) return initial.items;
    const focused = initial.items.filter((i) => i.memberId === focusMemberId);
    const others = initial.items.filter((i) => i.memberId !== focusMemberId);
    return [...focused, ...others];
  }, [initial.items, focusMemberId]);

  const [selected, setSelected] = useState<string | null>(items[0]?.queueId ?? null);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const current = items.find((i) => i.queueId === selected) ?? null;
  const currentTags = current ? parseTags(current.suggestedTagsJson) : [];
  const isTerminal = current ? TERMINAL_STATUSES.has(current.status) : false;

  const onConfirm = async () => {
    if (!current) return;
    setBusy(true);
    let ok = true;
    try {
      await tagResolveMutation.trigger(
        {
          queueId: current.queueId,
          action: "confirmed",
          tagCodes: currentTags,
        },
      );
    } catch (e) {
      ok = false;
      setToast(`承認に失敗: ${e instanceof Error ? e.message : "unknown error"}`);
    }
    setBusy(false);
    if (!ok) return;
    setToast("キューを resolved にしました");
    router.refresh();
  };

  const onReject = async () => {
    if (!current) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setToast("却下理由を入力してください");
      return;
    }
    setBusy(true);
    let ok = true;
    try {
      await tagResolveMutation.trigger(
        {
          queueId: current.queueId,
          action: "rejected",
          reason,
        },
      );
    } catch (e) {
      ok = false;
      setToast(`却下に失敗: ${e instanceof Error ? e.message : "unknown error"}`);
    }
    setBusy(false);
    if (!ok) return;
    setRejectReason("");
    setToast("キューを rejected にしました");
    router.refresh();
  };

  const onFilter = (next: TagQueueStatus | "") => {
    const params = new URLSearchParams();
    if (next) params.set("status", next);
    if (focusMemberId) params.set("memberId", focusMemberId);
    router.push(`/admin/tags${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section aria-labelledby="tag-queue-h">
      <h1 id="tag-queue-h">タグキュー</h1>
      <div role="group" aria-label="ステータス絞込">
        {(["", "queued", "reviewing", "resolved", "rejected", "dlq"] as const).map((v) => (
          <button
            key={v || "all"}
            type="button"
            aria-pressed={filter === (v || undefined)}
            onClick={() => onFilter(v as TagQueueStatus | "")}
          >
            {v || "すべて"}
          </button>
        ))}
      </div>
      {focusMemberId && <p>絞込: memberId = <code>{focusMemberId}</code></p>}
      {toast && <p role="status">{toast}</p>}

      <div className="tag-queue-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        <ul aria-label="キュー一覧" data-testid="admin-tag-queue-list">
          {items.length === 0 && (
            <li>
              <EmptyState title="該当するキューはありません" />
            </li>
          )}
          {items.map((it) => (
            <li key={it.queueId}>
              <button
                type="button"
                onClick={() => setSelected(it.queueId)}
                aria-pressed={selected === it.queueId}
              >
                {it.memberId} — {it.status}
                <br />
                <small>{it.createdAt}</small>
              </button>
            </li>
          ))}
        </ul>

        <div aria-label="レビューパネル" data-testid="admin-tag-review-panel">
          {!current && <EmptyState title="左のキューから項目を選択してください。" />}
          {current && (
            <article>
              <h2>queue: {current.queueId}</h2>
              <p>memberId: <code>{current.memberId}</code></p>
              <p>responseId: <code>{current.responseId}</code></p>
              <p>status: <strong>{current.status}</strong></p>
              <p>提案タグ:</p>
              <ul>
                {currentTags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              {current.reason && <p>理由: {current.reason}</p>}
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy || isTerminal || currentTags.length === 0}
              >
                confirmed（提案タグを member_tags に反映）
              </button>
              <FormField name="tag-reject-reason" label="却下理由">
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={busy || isTerminal}
                />
              </FormField>
              <button
                type="button"
                onClick={onReject}
                disabled={busy || isTerminal}
              >
                rejected
              </button>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
