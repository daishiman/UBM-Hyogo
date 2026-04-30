"use client";
// 06c: MemberDrawer
// 不変条件 #4 / #11: profile 本文 (businessOverview / selfIntroduction 等) の input/textarea を持たない
// 不変条件 #12: 管理メモはこのドロワー内のみ表示
// 不変条件 #13: タグ編集は /admin/tags?memberId へのリンクのみ
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AdminMemberDetailView, PublishState } from "@ubm-hyogo/shared";
import {
  patchMemberStatus,
  postMemberNote,
  deleteMember,
  restoreMember,
} from "../../lib/admin/api";

const PUBLISH_OPTIONS: PublishState[] = ["public", "member_only", "hidden"];

interface Props {
  readonly memberId: string;
  readonly onClose: () => void;
  readonly onMutated: () => void;
}

export function MemberDrawer({ memberId, onClose, onMutated }: Props) {
  const [view, setView] = useState<AdminMemberDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingPublish, setPendingPublish] = useState<PublishState | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/members/${encodeURIComponent(memberId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as AdminMemberDetailView;
        if (alive) setView(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "load failed");
      }
    })();
    return () => {
      alive = false;
    };
  }, [memberId]);

  const onConfirmStatus = async () => {
    if (pendingPublish === null) return;
    const r = await patchMemberStatus(memberId, { publishState: pendingPublish });
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setPendingPublish(null);
    onMutated();
    onClose();
  };

  const onPostNote = async () => {
    if (!noteBody.trim()) return;
    const r = await postMemberNote(memberId, noteBody.trim());
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setNoteBody("");
    onMutated();
  };

  const onDelete = async () => {
    const reason = deleteReason.trim();
    if (!reason) return;
    const r = await deleteMember(memberId, reason);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setConfirmDelete(false);
    setDeleteReason("");
    onMutated();
    onClose();
  };

  const onRestore = async () => {
    const r = await restoreMember(memberId);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    onMutated();
    onClose();
  };

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-drawer-h"
      className="member-drawer"
      data-testid="member-drawer"
    >
      <header>
        <h2 id="member-drawer-h">会員詳細: {memberId}</h2>
        <button type="button" onClick={onClose} aria-label="閉じる">×</button>
      </header>

      {error && <p role="alert">{error}</p>}
      {!view && !error && <p>読み込み中…</p>}

      {view && (
        <>
          <section aria-label="基本情報">
            <p>email: {view.identityEmail}</p>
            <p>publishState: <strong>{view.status.publishState}</strong></p>
            <p>publicConsent: {view.status.publicConsent}</p>
            <p>rulesConsent: {view.status.rulesConsent}</p>
            <p>削除: {view.status.isDeleted ? "削除済み" : "—"}</p>
          </section>

          <section aria-label="公開状態の変更">
            <h3>公開状態</h3>
            <fieldset>
              <legend>publishState</legend>
              {PUBLISH_OPTIONS.map((p) => (
                <label key={p} style={{ marginRight: 8 }}>
                  <input
                    type="radio"
                    name="publish"
                    checked={pendingPublish === p}
                    onChange={() => setPendingPublish(p)}
                  />
                  {p}
                </label>
              ))}
            </fieldset>
            {pendingPublish !== null && (
              <div role="dialog" aria-label="変更確認">
                <p>{pendingPublish} に変更しますか？</p>
                <button type="button" onClick={onConfirmStatus}>確定</button>
                <button type="button" onClick={() => setPendingPublish(null)}>キャンセル</button>
              </div>
            )}
          </section>

          <section aria-label="管理メモ" data-testid="admin-notes-section">
            <h3>管理メモ</h3>
            <p className="hint">本人には表示されません（管理者のみ）。</p>
            <label>
              新規メモ
              <textarea
                aria-label="管理メモ本文"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
              />
            </label>
            <button type="button" onClick={onPostNote} disabled={!noteBody.trim()}>
              メモを保存
            </button>
          </section>

          <section aria-label="タグ編集導線">
            <h3>タグ</h3>
            <p>タグ編集はキュー経由でのみ可能です。</p>
            <Link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}>
              タグキューで編集
            </Link>
          </section>

          <section aria-label="本人による更新">
            <h3>本人更新導線</h3>
            <p>profile 本文の管理者編集は提供されません。本人にこちらから再回答を依頼してください。</p>
            {view.profile.editResponseUrl ? (
              <a href={view.profile.editResponseUrl} target="_blank" rel="noreferrer">
                Google Form 編集を開く
              </a>
            ) : (
              <p>Google Form 編集URLは未取得です。</p>
            )}
          </section>

          <section aria-label="監査ログ">
            <h3>監査ログ（直近 50 件）</h3>
            <ul>
              {view.audit.map((a, i) => (
                <li key={i}>
                  {a.occurredAt} — {a.action} ({a.actor})
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="削除操作">
            <h3>論理削除</h3>
            {!confirmDelete ? (
              <>
                <button type="button" onClick={() => setConfirmDelete(true)}>論理削除する</button>
                {view.status.isDeleted && (
                  <button type="button" onClick={onRestore}>復元する</button>
                )}
              </>
            ) : (
              <div role="dialog" aria-label="削除確認">
                <p>{memberId} を論理削除します。よろしいですか？</p>
                <label>
                  削除理由
                  <input
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    required
                  />
                </label>
                <button type="button" onClick={onDelete} disabled={!deleteReason.trim()}>
                  削除実行
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)}>キャンセル</button>
              </div>
            )}
          </section>
        </>
      )}
    </aside>
  );
}
