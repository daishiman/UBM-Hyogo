// followup-003 Lane C: プロトタイプ準拠 drawer (pages-admin.jsx L278-363)
// issue-982: TAGS セクションを編集可能化（MemberTagsEditor）。
"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { AdminMemberDetailView, PublishState } from "@ubm-hyogo/shared";
import { Drawer } from "../../../../components/ui/Drawer";
import { KVList } from "../../../../components/ui/KVList";
import { formatJstDateTime } from "../../../../lib/format/datetime";
import { useAdminMutation } from "../../hooks/useAdminMutation";
import {
  fetchMemberTags,
  type AdminTagRef,
  type MemberTagsResult,
} from "../../api/members";
import { buildMemberPhotoVariants } from "../../../../lib/admin/image-resize";
import { MemberAvatar } from "./MemberAvatar";
import { MemberPublishSwitch } from "./MemberPublishSwitch";
import { MemberStateChipRow } from "./MemberStateChip";
import { TagPill } from "../_shared/TagPill";
import { MemberDiagnosticsPanel } from "./MemberDiagnosticsPanel";

export interface MemberDrawerProps {
  readonly memberId: string;
  readonly onClose: () => void;
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  if (user.length <= 1) return `${user}***@${domain}`;
  return `${user[0]}***@${domain}`;
}

export function MemberDrawer({ memberId, onClose }: MemberDrawerProps) {
  const [data, setData] = useState<AdminMemberDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`/api/admin/members/${encodeURIComponent(memberId)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as AdminMemberDetailView;
        if (!cancelled) setData(j);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "fetch failed");
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return (
    <Drawer open onClose={onClose} title="会員詳細">
      {error ? (
        <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">
          読み込み失敗: {error}
        </p>
      ) : !data ? (
        <p role="status" className="text-sm text-[var(--ubm-color-text-muted)]">
          読み込み中…
        </p>
      ) : (
        <MemberDrawerBody
          memberId={memberId}
          detail={data}
          onUpdated={(patch) =>
            setData((prev) => (prev ? { ...prev, ...patch } : prev))
          }
        />
      )}
    </Drawer>
  );
}

interface MemberDrawerBodyProps {
  readonly memberId: string;
  readonly detail: AdminMemberDetailView;
  readonly onUpdated: (patch: Partial<AdminMemberDetailView>) => void;
}

function MemberDrawerBody({ memberId, detail, onUpdated }: MemberDrawerBodyProps) {
  const profile = detail.profile;
  const summary = profile.summary;
  const fullName = summary.fullName ?? "(名前なし)";

  return (
    <div className="flex flex-col gap-4 text-sm">
      {/* drawer-head */}
      <header className="flex items-center gap-3 border-b border-[var(--ubm-color-border-default)] pb-3">
        <MemberAvatar
          memberId={memberId}
          fullName={fullName}
          photoUrl={detail.photoUrl}
          photoThumbUrl={detail.photoThumbUrl}
          size="md"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <strong className="truncate text-base text-[var(--ubm-color-text-primary)]">
            {fullName}
          </strong>
          <span className="truncate font-mono text-xs text-[var(--ubm-color-text-muted)]">
            {maskEmail(detail.identityEmail)} · {profile.responseId}
          </span>
          <PhotoUploadAffordance memberId={memberId} hasPhoto={!!detail.photoUrl} />
        </div>
        <MemberStateChipRow
          publishState={detail.status.publishState}
          isDeleted={detail.status.isDeleted}
        />
      </header>

      {/* VISIBILITY */}
      <section
        aria-labelledby="drawer-visibility-heading"
        className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] p-3"
      >
        <h3
          id="drawer-visibility-heading"
          className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]"
        >
          公開設定
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm">サイトに公開する</span>
          <MemberPublishSwitch
            memberId={memberId}
            publishState={detail.status.publishState}
            isDeleted={detail.status.isDeleted}
            onSuccess={(next: PublishState) =>
              onUpdated({
                status: { ...detail.status, publishState: next },
              })
            }
          />
        </div>
        <div className="mt-3 border-t border-[var(--ubm-color-border-default)] pt-3">
          <NotificationOptOutToggle
            memberId={memberId}
            initial={detail.status.notificationOptOut}
            onUpdated={(next) =>
              onUpdated({
                status: { ...detail.status, notificationOptOut: next },
              })
            }
          />
        </div>
      </section>

      {/* TAGS */}
      <MemberTagsEditor memberId={memberId} />

      {/* FORM RESPONSE */}
      <section
        aria-labelledby="drawer-form-heading"
        className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] p-3"
      >
        <h3
          id="drawer-form-heading"
          className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]"
        >
          フォーム回答
        </h3>
        <div className="mt-2">
          <KVList
            items={[
              { key: "回答ID", value: <span className="font-mono">{profile.responseId}</span> },
              {
                key: "送信日時",
                value: profile.lastSubmittedAt
                  ? formatJstDateTime(profile.lastSubmittedAt)
                  : "—",
              },
              { key: "UBM区画", value: summary.ubmZone ?? "—" },
              { key: "ステータス", value: summary.ubmMembershipType ?? "—" },
              { key: "お住まい", value: summary.location ?? "—" },
              { key: "職業", value: summary.occupation ?? "—" },
              {
                key: "編集URL",
                value: profile.editResponseUrl ? (
                  <Link
                    href={profile.editResponseUrl}
                    className="text-[var(--ubm-color-accent)] hover:underline"
                  >
                    開く
                  </Link>
                ) : (
                  "—"
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* identity / status: 互換のため dt/dd で残す（既存テスト依存） */}
      <section aria-labelledby="drawer-identity-heading" className="text-xs">
        <h3
          id="drawer-identity-heading"
          className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]"
        >
          identity (system field)
        </h3>
        <dl className="mt-1 space-y-1">
          <div className="flex gap-2">
            <dt className="w-32 text-[var(--ubm-color-text-muted)]">memberId</dt>
            <dd className="font-mono">{detail.identityMemberId}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-32 text-[var(--ubm-color-text-muted)]">responseEmail</dt>
            <dd>{maskEmail(detail.identityEmail)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-32 text-[var(--ubm-color-text-muted)]">notificationOptOut</dt>
            <dd>{String(detail.status.notificationOptOut)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-32 text-[var(--ubm-color-text-muted)]">isDeleted</dt>
            <dd>{String(detail.status.isDeleted)}</dd>
          </div>
        </dl>
      </section>

      {/* DELETED */}
      {detail.status.isDeleted ? (
        <section
          aria-labelledby="drawer-deleted-heading"
          className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-danger)] bg-[var(--ubm-color-danger-soft)] p-3"
        >
          <h3
            id="drawer-deleted-heading"
            className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-danger)]"
          >
            退会済み
          </h3>
          <p className="mt-1 text-sm text-[var(--ubm-color-text-secondary)]">
            この会員は論理削除されています。復元する場合は管理者にお問い合わせください。
          </p>
        </section>
      ) : null}

      {/* audit log */}
      <section className="text-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]">
          audit log
        </h3>
        <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto">
          {detail.audit.length === 0 ? (
            <li className="text-[var(--ubm-color-text-muted)]">なし</li>
          ) : (
            detail.audit.map((a, i) => (
              <li
                key={`${a.occurredAt}-${i}`}
                className="flex flex-col gap-0.5 border-b border-[var(--ubm-color-border-default)] pb-1"
              >
                <span className="text-xs text-[var(--ubm-color-text-muted)]">
                  {formatJstDateTime(a.occurredAt)} — {a.actor}
                </span>
                <span>
                  {a.action}
                  {a.note ? ` (${a.note})` : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <MemberDiagnosticsPanel memberId={memberId} />
    </div>
  );
}

interface MemberTagsEditorProps {
  readonly memberId: string;
}

/**
 * issue-982: drawer 内で tag を追加 / 削除できる編集 UI。
 *   - drawer open 時に GET /admin/members/:id/tags で { assigned, available } を取得。
 *   - pill click で楽観更新し、POST / DELETE を useAdminMutation 経由で発火、失敗時は rollback。
 */
function MemberTagsEditor({ memberId }: MemberTagsEditorProps) {
  const [assigned, setAssigned] = useState<AdminTagRef[]>([]);
  const [available, setAvailable] = useState<AdminTagRef[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);
  const rollbackRef = useRef<AdminTagRef[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMemberTags(memberId)
      .then((res: MemberTagsResult) => {
        if (cancelled) return;
        setAssigned(res.assigned);
        setAvailable(res.available);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "fetch failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const assign = useAdminMutation<MemberTagsResult>(
    `/api/admin/members/${encodeURIComponent(memberId)}/tags`,
    "POST",
    {
      idempotencyKey: () => crypto.randomUUID(),
      successMessage: "✓ タグを追加しました",
      onSuccess: (res) => {
        if (res?.assigned) setAssigned(res.assigned);
      },
      onError: () => setAssigned(rollbackRef.current),
      refreshOnSuccess: false,
    },
  );

  const unassign = useAdminMutation<void>(
    `/api/admin/members/${encodeURIComponent(memberId)}/tags`,
    "DELETE",
    {
      idempotencyKey: () => crypto.randomUUID(),
      treat404AsSuccess: "silent",
      successMessage: "✓ タグを削除しました",
      onError: () => setAssigned(rollbackRef.current),
      refreshOnSuccess: false,
    },
  );

  const onToggle = (tag: AdminTagRef): void => {
    if (pendingTagId) return; // 二重発火防止
    const selected = assigned.some((a) => a.tagId === tag.tagId);
    rollbackRef.current = assigned;
    setPendingTagId(tag.tagId);
    if (selected) {
      setAssigned((cur) => cur.filter((a) => a.tagId !== tag.tagId));
      void unassign
        .trigger(
          undefined,
          `/api/admin/members/${encodeURIComponent(memberId)}/tags/${encodeURIComponent(tag.tagId)}`,
        )
        .catch(() => {})
        .finally(() => setPendingTagId(null));
    } else {
      setAssigned((cur) => [...cur, tag]);
      void assign
        .trigger({ tagId: tag.tagId })
        .catch(() => {})
        .finally(() => setPendingTagId(null));
    }
  };

  return (
    <section
      aria-labelledby="drawer-tags-heading"
      className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] p-3"
    >
      <h3
        id="drawer-tags-heading"
        className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]"
      >
        タグ
      </h3>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-[var(--ubm-color-danger)]">
          タグの読み込み失敗: {error}
        </p>
      ) : loading ? (
        <p role="status" className="mt-2 text-sm text-[var(--ubm-color-text-muted)]">
          読み込み中…
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {available.map((t) => {
            const selected = assigned.some((a) => a.tagId === t.tagId);
            return (
              <TagPill
                key={t.tagId}
                selected={selected}
                disabled={pendingTagId === t.tagId}
                onClick={() => onToggle(t)}
              >
                {t.label}
              </TagPill>
            );
          })}
        </div>
      )}
      <Link
        href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}
        className="mt-3 inline-flex items-center text-sm font-medium text-[var(--ubm-color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
      >
        タグ管理へ
      </Link>
    </section>
  );
}

interface PhotoUploadAffordanceProps {
  readonly memberId: string;
  readonly hasPhoto: boolean;
}

// issue-983: admin による member 写真の差し替え / 削除 affordance（invariant #10: useAdminMutation 経由）。
function PhotoUploadAffordance({ memberId, hasPhoto }: PhotoUploadAffordanceProps) {
  const endpoint = `/api/admin/members/${encodeURIComponent(memberId)}/photo`;

  const { trigger: upload, isLoading: uploading } = useAdminMutation<{ ok: boolean }>(
    endpoint,
    "POST",
    {
      successMessage: "✓ 写真を更新しました",
      refreshOnSuccess: true,
      // multipart/form-data は JSON 既定経路では送れないため mutationFn で送出する。
      mutationFn: async (payload: unknown) => {
        // issue-1030: 送信前にブラウザ Canvas で display/thumb variant を生成する（無料枠）。
        // Canvas 非対応時は original_fallback（display = 原 File・thumb なし）。
        const variants = await buildMemberPhotoVariants(payload as File);
        const formData = new FormData();
        formData.append("display", variants.display);
        if (variants.thumb) formData.append("thumb", variants.thumb);
        formData.append("contentHash", variants.contentHash);
        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
          credentials: "same-origin",
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return (await res.json()) as { ok: boolean };
      },
    },
  );

  const { trigger: remove, isLoading: removing } = useAdminMutation<{ ok: boolean }>(
    endpoint,
    "DELETE",
    {
      successMessage: "✓ 写真を削除しました",
      refreshOnSuccess: true,
    },
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    upload(file).catch(() => {});
    e.currentTarget.value = "";
  };

  const isLoading = uploading || removing;

  return (
    <div className="flex items-center gap-1">
      <label
        className={[
          "cursor-pointer rounded px-2 py-1 text-xs",
          "border border-[var(--ubm-color-border-default)]",
          "bg-[var(--ubm-color-surface-panel-2)] text-[var(--ubm-color-accent)]",
          "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ubm-color-accent)]",
          isLoading ? "pointer-events-none opacity-50" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-disabled={isLoading}
      >
        {uploading ? "アップロード中…" : "写真を変更"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isLoading}
          data-testid="photo-upload-input"
        />
      </label>
      {hasPhoto ? (
        <button
          type="button"
          onClick={() => remove({}).catch(() => {})}
          disabled={isLoading}
          className={[
            "rounded px-2 py-1 text-xs",
            "border border-[var(--ubm-color-border-default)]",
            "text-[var(--ubm-color-danger)]",
            isLoading ? "opacity-50" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="写真を削除"
        >
          {removing ? "削除中…" : "削除"}
        </button>
      ) : null}
    </div>
  );
}

interface NotificationOptOutToggleProps {
  readonly memberId: string;
  readonly initial: boolean;
  readonly onUpdated: (next: boolean) => void;
}

function NotificationOptOutToggle({
  memberId,
  initial,
  onUpdated,
}: NotificationOptOutToggleProps) {
  const [checked, setChecked] = useState<boolean>(initial);
  const { trigger, isLoading } = useAdminMutation<{
    ok: boolean;
    memberId: string;
    notificationOptOut: boolean;
  }>(
    `/api/admin/members/${encodeURIComponent(memberId)}/notification-pref`,
    "PATCH",
    {
      successMessage: (data) =>
        data.notificationOptOut
          ? "✓ 通知をオプトアウトしました"
          : "✓ 通知を再開しました",
      onSuccess: (data) => {
        setChecked(data.notificationOptOut);
        onUpdated(data.notificationOptOut);
      },
      refreshOnSuccess: false,
    },
  );

  return (
    <div className="flex items-center gap-2">
      <input
        id={`notif-opt-out-${memberId}`}
        type="checkbox"
        checked={checked}
        disabled={isLoading}
        onChange={(e) => {
          const next = e.currentTarget.checked;
          setChecked(next);
          trigger({ notificationOptOut: next }).catch(() => {
            setChecked(!next);
          });
        }}
        aria-label="通知をオプトアウト"
        className="h-4 w-4"
      />
      <label
        htmlFor={`notif-opt-out-${memberId}`}
        className="text-sm text-[var(--ubm-color-text-secondary)]"
      >
        通知をオプトアウト
      </label>
    </div>
  );
}
