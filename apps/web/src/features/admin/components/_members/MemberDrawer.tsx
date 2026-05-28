// followup-003 Lane C: プロトタイプ準拠 drawer (pages-admin.jsx L278-363)
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminMemberDetailView, PublishState } from "@ubm-hyogo/shared";
import { Drawer } from "../../../../components/ui/Drawer";
import { KVList } from "../../../../components/ui/KVList";
import { formatJstDateTime } from "../../../../lib/format/datetime";
import { useAdminMutation } from "../../hooks/useAdminMutation";
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

// 仕様書: tags-queue endpoint の write surface 整備が別タスクのため UI のみ
const ALL_TAGS: ReadonlyArray<string> = [
  "経営者",
  "個人事業主",
  "学生",
  "新規参加",
  "アカデミー",
  "0→1",
  "1→10",
  "10→100",
  "メンター",
  "若手",
  "女性経営者",
  "スタートアップ",
  "支援機関",
  "OB",
];

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
        <MemberAvatar memberId={memberId} fullName={fullName} size="md" />
        <div className="flex min-w-0 flex-1 flex-col">
          <strong className="truncate text-base text-[var(--ubm-color-text-primary)]">
            {fullName}
          </strong>
          <span className="truncate font-mono text-xs text-[var(--ubm-color-text-muted)]">
            {maskEmail(detail.identityEmail)} · {profile.responseId}
          </span>
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
        <div className="mt-2 flex flex-wrap gap-2">
          {ALL_TAGS.map((t) => {
            const selected = profile.tags.some((mt) => mt.label === t);
            return (
              <TagPill
                key={t}
                selected={selected}
                disabled
                title="タグ編集は別タスクで対応予定"
              >
                {t}
              </TagPill>
            );
          })}
        </div>
        <Link
          href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}
          className="mt-3 inline-flex items-center text-sm font-medium text-[var(--ubm-color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
        >
          タグ管理へ
        </Link>
      </section>

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
