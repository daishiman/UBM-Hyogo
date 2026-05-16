// task-15: 1 会員詳細 drawer（identity / answers / audit / notes）
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminMemberDetailView } from "@ubm-hyogo/shared";
import { Drawer } from "../../../../components/ui/Drawer";
import { formatJstDateTime } from "../../../../lib/format/datetime";

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
        <div className="flex flex-col gap-4 text-sm">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]">
              identity (system field)
            </h3>
            <dl className="mt-1 space-y-1">
              <div className="flex gap-2">
                <dt className="w-32 text-[var(--ubm-color-text-muted)]">memberId</dt>
                <dd className="font-mono">{data.identityMemberId}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 text-[var(--ubm-color-text-muted)]">responseEmail</dt>
                <dd>{maskEmail(data.identityEmail)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]">
              status
            </h3>
            <dl className="mt-1 space-y-1">
              <div className="flex gap-2">
                <dt className="w-32 text-[var(--ubm-color-text-muted)]">publicConsent</dt>
                <dd>{data.status.publicConsent}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 text-[var(--ubm-color-text-muted)]">rulesConsent</dt>
                <dd>{data.status.rulesConsent}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 text-[var(--ubm-color-text-muted)]">publishState</dt>
                <dd>{data.status.publishState}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 text-[var(--ubm-color-text-muted)]">isDeleted</dt>
                <dd>{String(data.status.isDeleted)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]">
              audit log
            </h3>
            <ul className="mt-1 max-h-48 overflow-y-auto space-y-1">
              {data.audit.length === 0 ? (
                <li className="text-[var(--ubm-color-text-muted)]">なし</li>
              ) : (
                data.audit.map((a, i) => (
                  <li key={`${a.occurredAt}-${i}`} className="flex flex-col gap-0.5 border-b border-[var(--ubm-color-border-default)] pb-1">
                    <span className="text-xs text-[var(--ubm-color-text-muted)]">
                      {formatJstDateTime(a.occurredAt)} — {a.actor}
                    </span>
                    <span>{a.action}{a.note ? ` (${a.note})` : ""}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="border-t border-[var(--ubm-color-border-default)] pt-4">
            <Link
              href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}
              className="inline-flex items-center text-sm font-medium text-[var(--ubm-color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
            >
              タグ管理へ
            </Link>
          </section>
        </div>
      )}
    </Drawer>
  );
}
