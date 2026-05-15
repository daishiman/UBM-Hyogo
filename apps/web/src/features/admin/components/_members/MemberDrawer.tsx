// task-15: 1 会員詳細 drawer（identity / answers / audit / notes）
"use client";
import { useEffect, useState } from "react";
import type { AdminMemberDetailView } from "@ubm-hyogo/shared";
import { Drawer } from "../../../../components/ui/Drawer";
import { Button } from "../../../../components/ui/Button";
import { formatJstDateTime } from "../../../../lib/format/datetime";
import { NoteForm } from "./NoteForm";

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
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const notes = data?.notes ?? [];
  const editingNote = editingNoteId
    ? notes.find((note) => note.noteId === editingNoteId)
    : undefined;

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
  }, [memberId, refreshKey]);

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

          <section aria-labelledby="member-notes-heading">
            <div className="flex items-center justify-between">
              <h3
                id="member-notes-heading"
                className="text-xs font-semibold uppercase tracking-wide text-[var(--ubm-color-text-muted)]"
              >
                notes
              </h3>
              {!showNoteForm ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingNoteId(null);
                    setShowNoteForm(true);
                  }}
                >
                  メモを追加
                </Button>
              ) : null}
            </div>
            {notes.length === 0 ? (
              <p className="mt-1 text-[var(--ubm-color-text-muted)]">
                管理者メモはまだありません。
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {notes.map((note) => (
                  <li
                    key={note.noteId}
                    className="rounded border border-[var(--ubm-color-border-default)] p-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap">{note.body}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNoteId(note.noteId);
                          setShowNoteForm(true);
                        }}
                      >
                        編集
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-[var(--ubm-color-text-muted)]">
                      {formatJstDateTime(note.updatedAt)} / {note.updatedBy}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {showNoteForm ? (
              <div className="mt-2">
                <NoteForm
                  memberId={memberId}
                  {...(editingNote
                    ? {
                        noteId: editingNote.noteId,
                        initialBody: editingNote.body,
                      }
                    : {})}
                  onSuccess={() => {
                    setShowNoteForm(false);
                    setEditingNoteId(null);
                    setRefreshKey((k) => k + 1);
                  }}
                  onCancel={() => {
                    setShowNoteForm(false);
                    setEditingNoteId(null);
                  }}
                />
              </div>
            ) : null}
          </section>
        </div>
      )}
    </Drawer>
  );
}
