"use client";
// 06c: MeetingPanel — 追加 form + 開催日一覧 + attendance 編集
// 不変条件 #15:
//   - candidates は server で isDeleted=true 除外済 (filterCandidates も同責務)
//   - 既出席メンバーは disabled
//   - 422 受信時は Toast でエラー表示
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMeeting,
  addAttendance,
  removeAttendance,
} from "../../lib/admin/api";

export interface MeetingItem {
  sessionId: string;
  title: string;
  heldOn: string;
  note: string | null;
  createdAt: string;
  attendance?: Array<{
    memberId: string;
    assignedAt?: string;
    assignedBy?: string;
  }>;
}
export interface MeetingsListView {
  total: number;
  items: MeetingItem[];
}
export interface MemberCandidate {
  memberId: string;
  fullName: string;
}

// 不変条件 #15: UI 側 filter 二重防御
export function filterCandidates<T extends { isDeleted?: boolean }>(members: T[]): T[] {
  return members.filter((m) => m.isDeleted !== true);
}

interface Props {
  readonly meetings: MeetingsListView;
  readonly candidates: MemberCandidate[];
}

export function MeetingPanel({ meetings, candidates }: Props) {
  const router = useRouter();
  const initialAttended = () =>
    Object.fromEntries(
      meetings.items.map((m) => [
        m.sessionId,
        new Set((m.attendance ?? []).map((a) => a.memberId)),
      ]),
    );
  const [title, setTitle] = useState("");
  const [heldOn, setHeldOn] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 各 session ごとに { memberId -> 既出席 } を維持（API初期値 + 楽観 UI）
  const [attended, setAttended] = useState<Record<string, Set<string>>>(initialAttended);
  const [pickedMember, setPickedMember] = useState<Record<string, string>>({});

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(heldOn)) return;
    setBusy(true);
    const r = await createMeeting({ title: title.trim(), heldOn, note: note.trim() || null });
    setBusy(false);
    if (!r.ok) {
      setToast(`開催追加に失敗: ${r.error}`);
      return;
    }
    setToast("開催日を追加しました");
    setTitle("");
    setHeldOn("");
    setNote("");
    router.refresh();
  };

  const onAdd = async (sessionId: string) => {
    const memberId = pickedMember[sessionId];
    if (!memberId) return;
    if (attended[sessionId]?.has(memberId)) {
      setToast("この会員は既に出席登録されています");
      return;
    }
    const r = await addAttendance(sessionId, memberId);
    if (!r.ok) {
      if (r.status === 422) setToast("削除済み会員は登録できません");
      else if (r.status === 409) setToast("この会員は既に出席登録されています");
      else setToast(`登録に失敗: ${r.error}`);
      return;
    }
    setAttended((s) => {
      const next = { ...s };
      const cur = new Set(next[sessionId] ?? []);
      cur.add(memberId);
      next[sessionId] = cur;
      return next;
    });
    setToast("出席を追加しました");
  };

  const onRemove = async (sessionId: string, memberId: string) => {
    const r = await removeAttendance(sessionId, memberId);
    if (!r.ok) {
      setToast(`削除に失敗: ${r.error}`);
      return;
    }
    setAttended((s) => {
      const next = { ...s };
      const cur = new Set(next[sessionId] ?? []);
      cur.delete(memberId);
      next[sessionId] = cur;
      return next;
    });
    setToast("出席を削除しました");
  };

  return (
    <section aria-labelledby="meetings-h">
      <h1 id="meetings-h">開催日 / 出席管理</h1>
      {toast && <p role="status">{toast}</p>}

      <form onSubmit={onCreate} aria-label="開催日追加">
        <h2>開催日を追加</h2>
        <label>
          タイトル
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          開催日 (YYYY-MM-DD)
          <input
            type="date"
            value={heldOn}
            onChange={(e) => setHeldOn(e.target.value)}
            required
          />
        </label>
        <label>
          メモ
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="submit" disabled={busy}>追加</button>
      </form>

      <h2>開催日一覧 ({meetings.total} 件)</h2>
      <ul>
        {meetings.items.map((m) => {
          const here = attended[m.sessionId] ?? new Set<string>();
          const picked = pickedMember[m.sessionId] ?? "";
          const pickedAlreadyAttended = picked !== "" && here.has(picked);
          return (
            <li key={m.sessionId}>
              <article>
                <h3>{m.heldOn} — {m.title}</h3>
                {m.note && <p>{m.note}</p>}
                <div role="group" aria-label="出席追加">
                  <label>
                    会員を選択
                    <select
                      value={picked}
                      onChange={(e) =>
                        setPickedMember((s) => ({ ...s, [m.sessionId]: e.target.value }))
                      }
                    >
                      <option value="">— 選択 —</option>
                      {candidates.map((c) => (
                        <option
                          key={c.memberId}
                          value={c.memberId}
                          disabled={here.has(c.memberId)}
                        >
                          {c.fullName} ({c.memberId})
                          {here.has(c.memberId) ? " — 出席済" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => onAdd(m.sessionId)}
                    disabled={!picked || pickedAlreadyAttended}
                    data-testid={`add-attendance-${m.sessionId}`}
                  >
                    出席を追加
                  </button>
                </div>
                {here.size > 0 && (
                  <div>
                    <h4>出席者</h4>
                    <ul>
                      {[...here].map((mid) => (
                        <li key={mid}>
                          {mid}{" "}
                          <button type="button" onClick={() => onRemove(m.sessionId, mid)}>
                            削除
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
