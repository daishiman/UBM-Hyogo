"use client";
/**
 * Tag assignment queue の resolve drawer。
 *
 * 不変条件 #13: tag 書き込みは tagQueueResolve workflow 経由のみ。
 * 本 component の mutation は POST /api/admin/tags/queue/:queueId/resolve に限定し、
 * `tagQueueResolveBodySchema` で client / server 双方検証する。
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { tagQueueResolveBodySchema } from "@ubm-hyogo/shared";
import { useAdminMutation } from "../../features/admin/hooks/useAdminMutation";
import { browserDocument } from "../../lib/is-browser";
import type { TagQueueStatus } from "./TagQueuePanel";
import { TAG_QUEUE_STATUS_TOKEN, TERMINAL_TAG_QUEUE_STATUSES } from "./_tagQueueStatus";

export interface TagsQueueResolveDrawerProps {
  readonly queueId: string;
  readonly memberId: string;
  readonly suggestedTags: readonly string[];
  readonly status: TagQueueStatus;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onResolved?: (queueId: string) => void;
}

export interface TagQueueResolveResponse {
  readonly ok: boolean;
  readonly result?: {
    readonly status: "resolved" | "rejected";
    readonly tagCodes?: readonly string[];
    readonly idempotent: boolean;
    readonly memberId: string;
    readonly resolvedAt: string;
  };
}

type Action = "confirmed" | "rejected";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function TagsQueueResolveDrawer({
  queueId,
  memberId,
  suggestedTags,
  status,
  open,
  onClose,
  onResolved,
}: TagsQueueResolveDrawerProps) {
  const headingId = useId();
  const errorId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const isTerminal = TERMINAL_TAG_QUEUE_STATUSES.has(status);
  const canConfirm = suggestedTags.length > 0;

  const [action, setAction] = useState<Action>(canConfirm ? "confirmed" : "rejected");
  const [tagCodes, setTagCodes] = useState<string[]>(() => [...suggestedTags]);
  const [reason, setReason] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const submittedActionRef = useRef<Action>(action);

  // queueId 変化で state を初期化（drawer 再利用時の leakage 防止）
  useEffect(() => {
    setAction(canConfirm ? "confirmed" : "rejected");
    setTagCodes([...suggestedTags]);
    setReason("");
    setClientError(null);
  }, [queueId, canConfirm, suggestedTags]);

  const statusToken = TAG_QUEUE_STATUS_TOKEN[status];

  const { trigger, isLoading } = useAdminMutation<TagQueueResolveResponse>(
    `/api/admin/tags/queue/${encodeURIComponent(queueId)}/resolve`,
    "POST",
    {
      successMessage: (data) =>
        data.result?.idempotent
          ? "既に処理済です"
          : (data.result?.status ?? submittedActionRef.current) === "confirmed"
            ? "承認しました"
            : "却下しました",
      onSuccess: () => {
        onResolved?.(queueId);
        onClose();
      },
    },
  );

  // ESC で close
  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    doc.addEventListener("keydown", handler);
    return () => doc.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // initial focus + return focus
  useEffect(() => {
    if (!open) return;
    const doc = browserDocument();
    if (!doc) return;
    previousFocusRef.current = (doc.activeElement as HTMLElement | null) ?? null;
    const node = dialogRef.current;
    if (node) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }
    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  // focus trap (Tab / Shift+Tab)
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const node = dialogRef.current;
    if (!node) return;
    const focusables = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const doc = browserDocument();
    const active = (doc?.activeElement as HTMLElement | null) ?? null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  const toggleTag = (code: string) => {
    setTagCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const buildBody = useMemo(() => {
    return () => {
      if (action === "confirmed") {
        return { action: "confirmed" as const, tagCodes };
      }
      return { action: "rejected" as const, reason: reason.trim() };
    };
  }, [action, tagCodes, reason]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTerminal) return;
    const body = buildBody();
    const parsed = tagQueueResolveBodySchema.safeParse(body);
    if (!parsed.success) {
      setClientError(
        action === "confirmed"
          ? "少なくとも 1 つのタグを選択してください"
          : "却下理由を入力してください",
      );
      return;
    }
    setClientError(null);
    submittedActionRef.current = action;
    try {
      await trigger(parsed.data);
    } catch {
      // toast / error は hook が処理
    }
  };

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={clientError ? errorId : undefined}
      onKeyDown={onKeyDown}
      data-testid="admin-tag-resolve-drawer"
    >
      <h2 id={headingId}>キュー解決: {queueId}</h2>
      <p>
        memberId: <code>{memberId}</code>
      </p>
      <p>
        <span
          data-testid="admin-tag-status-badge"
          style={{ background: statusToken.tokenVar, padding: "2px 8px", borderRadius: 6 }}
        >
          {statusToken.label}
        </span>
      </p>

      <form onSubmit={onSubmit}>
        <fieldset disabled={isTerminal}>
          <legend>対応</legend>
          <label>
            <input
              type="radio"
              name="action"
              value="confirmed"
              checked={action === "confirmed"}
              onChange={() => setAction("confirmed")}
              disabled={!canConfirm}
            />
            承認
          </label>
          <label>
            <input
              type="radio"
              name="action"
              value="rejected"
              checked={action === "rejected"}
              onChange={() => setAction("rejected")}
            />
            却下
          </label>
        </fieldset>

        {action === "confirmed" && (
          <fieldset disabled={isTerminal}>
            <legend>反映するタグ</legend>
            {suggestedTags.length === 0 && <p>提案タグはありません</p>}
            {suggestedTags.map((t) => (
              <label key={t}>
                <input
                  type="checkbox"
                  checked={tagCodes.includes(t)}
                  onChange={() => toggleTag(t)}
                />
                {t}
              </label>
            ))}
          </fieldset>
        )}

        {action === "rejected" && (
          <label>
            却下理由
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isTerminal}
              aria-describedby={clientError ? errorId : undefined}
            />
          </label>
        )}

        {clientError && (
          <p id={errorId} role="alert" data-testid="admin-tag-resolve-error">
            {clientError}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={isTerminal || isLoading}
            aria-disabled={isTerminal || isLoading}
          >
            送信
          </button>
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
