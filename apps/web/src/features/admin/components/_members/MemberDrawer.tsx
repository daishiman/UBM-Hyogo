// followup-001 T-5.6: drawer をプロトタイプ構成に刷新。
// head: Avatar + 名前 + email mono + responseId
// body: VISIBILITY セクション / TAGS セクション / FORM RESPONSE KVList / DELETED ブロック
// foot: 退会処理(danger) / 閉じる / 保存(primary)
// mutation は useAdminMutation 経由（不変条件 #10）、入力は FormField 経由（#9）
"use client";
import { useEffect, useState } from "react";
import type { AdminMemberDetailView } from "@ubm-hyogo/shared";
import { Avatar } from "../../../../components/ui/Avatar";
import { Button } from "../../../../components/ui/Button";
import { Chip } from "../../../../components/ui/Chip";
import { Drawer } from "../../../../components/ui/Drawer";
import { FormField } from "../../../../components/ui/FormField";
import { KVList } from "../../../../components/ui/KVList";
import { Switch } from "../../../../components/ui/Switch";
import { Textarea } from "../../../../components/ui/Textarea";
import { useAdminMutation } from "../../hooks/useAdminMutation";
import { stringHashHue, toMemberDetail, type MemberDetail } from "../../adapters/members-view-model";

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
  const [view, setView] = useState<AdminMemberDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memo, setMemo] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setView(null);
    setError(null);
    fetch(`/api/admin/members/${encodeURIComponent(memberId)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as AdminMemberDetailView;
        if (!cancelled) setView(j);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "fetch failed");
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const detail: MemberDetail | null = view ? toMemberDetail(view) : null;
  const isPublic = view ? view.status.publishState === "public" : false;

  const publishMutation = useAdminMutation<{ ok: boolean }>(
    `/api/admin/members/${encodeURIComponent(memberId)}/publish`,
    "PATCH",
    {
      refreshOnSuccess: true,
      successMessage: () => "✓ 公開状態を更新しました",
    },
  );

  const deleteMutation = useAdminMutation<{ ok: boolean }>(
    `/api/admin/members/${encodeURIComponent(memberId)}`,
    "DELETE",
    {
      refreshOnSuccess: true,
      successMessage: () => "✓ 退会処理しました",
      onSuccess: () => onClose(),
    },
  );

  const saveMutation = useAdminMutation<{ ok: boolean }>(
    `/api/admin/members/${encodeURIComponent(memberId)}`,
    "PATCH",
    {
      refreshOnSuccess: true,
      successMessage: () => "✓ 保存しました",
      onSuccess: () => onClose(),
    },
  );

  return (
    <Drawer open onClose={onClose} title="会員詳細">
      {error ? (
        <p role="alert" className="text-sm text-[var(--ubm-color-danger)]">
          読み込み失敗: {error}
        </p>
      ) : !view || !detail ? (
        <p role="status" className="text-sm text-[var(--ubm-color-text-muted)]">
          読み込み中…
        </p>
      ) : (
        <div className="flex flex-col gap-5 text-sm" data-component="member-drawer">
          {/* drawer head */}
          <div className="flex items-center gap-3" data-component="drawer-head">
            <Avatar
              name={view.profile.summary.fullName}
              memberId={view.identityMemberId}
              hue={stringHashHue(view.identityMemberId)}
              size="lg"
            />
            <div className="flex flex-col">
              <span className="text-base font-semibold text-[var(--ubm-color-text-primary)]">
                {view.profile.summary.fullName}
              </span>
              <span className="font-mono text-xs text-[var(--ubm-color-text-muted)]">
                {maskEmail(view.identityEmail)} · {detail.responseId}
              </span>
            </div>
          </div>

          {/* drawer body */}
          <div className="flex flex-col gap-5" data-component="drawer-body">
            {/* VISIBILITY */}
            <section data-component="section-visibility">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-muted)]">
                VISIBILITY
              </div>
              <div
                className="mt-2 flex flex-col gap-3 rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] p-3"
                data-component="card-flat"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--ubm-color-text-primary)]">
                      サイト公開
                    </span>
                    <span className="text-xs text-[var(--ubm-color-text-muted)]">
                      メンバー一覧や詳細ページに掲載
                    </span>
                  </div>
                  <Switch
                    checked={isPublic}
                    label="サイトに公開"
                    disabled={publishMutation.isLoading}
                    onChange={(next) => {
                      void publishMutation.trigger({ publishState: next ? "public" : "hidden" });
                    }}
                  />
                </div>
                <div className="border-t border-[var(--ubm-color-border-default)]" />
                <FormField name="admin-memo" label="管理者メモ" helper="本人には見えません">
                  <Textarea
                    rows={3}
                    placeholder="管理者用メモ..."
                    value={memo}
                    onChange={(e) => setMemo(e.currentTarget.value)}
                  />
                </FormField>
              </div>
            </section>

            {/* TAGS */}
            <section data-component="section-tags">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-muted)]">
                TAGS
              </div>
              <div
                className="mt-2 flex flex-wrap gap-2 rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel-2)] p-3"
                data-component="card-flat"
              >
                {detail.tags.length === 0 ? (
                  <span className="text-xs text-[var(--ubm-color-text-muted)]">
                    タグはまだ付与されていません
                  </span>
                ) : (
                  detail.tags.map((t) => <Chip key={t.code}>{t.label}</Chip>)
                )}
              </div>
            </section>

            {/* FORM RESPONSE */}
            <section data-component="section-form-response">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-text-muted)]">
                FORM RESPONSE
              </div>
              <div className="mt-2">
                <KVList
                  items={[
                    { key: "回答ID", value: detail.responseId },
                    { key: "送信日時", value: detail.submittedAt },
                    { key: "UBM区画", value: detail.ubmZone ?? "—" },
                    { key: "ステータス", value: detail.ubmMembershipType ?? "—" },
                    { key: "お住まい", value: detail.location ?? "—" },
                    { key: "職業", value: detail.occupation ?? "—" },
                    { key: "ビジネス概要", value: detail.businessOverview ?? "—" },
                  ]}
                />
              </div>
            </section>

            {/* DELETED block (条件付き) */}
            {view.status.isDeleted ? (
              <section data-component="section-deleted">
                <div
                  className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-danger)] bg-[var(--ubm-color-surface-panel-2)] p-3"
                  data-component="card-flat"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ubm-color-danger)]">
                    DELETED
                  </div>
                  <div className="mt-2 text-xs text-[var(--ubm-color-text-secondary)]">
                    退会日: {detail.deletedAt ?? "—"}
                    {detail.deletedReason ? ` · 理由: ${detail.deletedReason}` : ""}
                  </div>
                  <div className="mt-3">
                    <Button variant="ghost" size="sm" disabled title="MVP 範囲外">
                      復元する
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          {/* drawer foot */}
          <div
            className="flex items-center gap-2 border-t border-[var(--ubm-color-border-default)] pt-3"
            data-component="drawer-foot"
          >
            {!view.status.isDeleted ? (
              <Button
                variant="danger"
                disabled={deleteMutation.isLoading}
                onClick={() => {
                  void deleteMutation.trigger({});
                }}
              >
                退会処理（論理削除）
              </Button>
            ) : null}
            <div className="flex-1" />
            <Button variant="ghost" onClick={onClose}>
              閉じる
            </Button>
            <Button
              variant="primary"
              disabled={saveMutation.isLoading}
              onClick={() => {
                void saveMutation.trigger({ adminMemo: memo });
              }}
            >
              保存
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
