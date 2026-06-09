# Phase 2: 設計

- task_id: `admin-meeting-bulk-attendance-select`
- 前提: [phase-1-requirements.md](phase-1-requirements.md) / [outputs/phase-1/shared-context.md](outputs/phase-1/shared-context.md)（SSOT）

## 1. アーキテクチャ概要（責務境界）

```
page.tsx (server, 不変)
  └─ MeetingsClientShell (状態 owner: attended/meetings/toast)         [F7 編集]
       ├─ onBulkAdd(sessionId, memberIds) を新規定義 → importAttendance + summary 反映
       └─ MeetingTimeline → renderRowExtra
            └─ MeetingAttendanceDrawer (presentational)               [F6 編集]
                 ├─ 既存: 編集details / 単一select単発追加 / 出席者リスト(削除)   ← 保持(AC-10)
                 ├─ BulkAttendanceChecklist (主経路 UI)                [F4 新規]
                 │    └─ useBulkAttendanceSelection (選択ロジック)      [F3 新規]
                 │    └─ Checkbox primitive                            [F2 新規]
                 └─ 「人数が多い時はこちら」→ BulkAttendanceModal       [F5 新規]
                      └─ useBulkAttendanceSelection (同一 hook を別 instance)
                      └─ Checkbox primitive
```

**状態所有権**:
- `attended` / `meetings` / `toast` の唯一の owner は `MeetingsClientShell`（既存方針維持）。
- **選択状態（selectedIds / query）は各 bulk UI の局所状態**（`useBulkAttendanceSelection` が hook 内 `useState` で保持）。Shell には持ち上げない（選択は一時的・送信後破棄のため局所が適切）。
- 送信結果（summary）は Shell の `onBulkAdd` が受けて `attended` に反映（write は Shell に集約）。

## 2. コンポーネント設計

### 2.1 F2: Checkbox primitive — `apps/web/src/components/ui/Checkbox.tsx`

```tsx
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  readonly label?: ReactNode;     // 省略時は aria-label を呼び出し側が付与
  readonly describedBy?: string;
}

export function Checkbox({ label, describedBy, className, id, ...props }: CheckboxProps) {
  // label あり: <label class="ui-checkbox"><input.../><span>label</span></label>
  // label なし: <input class="ui-checkbox__input" ...>（呼び出し側 aria-label 必須）
}
```

- `type="checkbox"` 固定。`ui-checkbox` / `ui-checkbox__input` / `ui-checkbox__label` クラス。
- 色は OKLch トークンのみ（accent-color / border に既存 `--color-*` 変数）。HEX 直書き禁止（AC-11）。
- FormField 互換（`id` / `name` / `aria-describedby` を受ける）。ただし checklist の各行は label 直結のため FormField を必須にしない（FormField は単一フィールド用）。検索 input は FormField 経由（不変条件 #9）。

### 2.2 F3: `useBulkAttendanceSelection.ts`（選択ロジック・両 UI 共有）

シグネチャは SSOT §4 を正本。実装方針:

```ts
export function useBulkAttendanceSelection(candidates, attended) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // 未出席のみ → 候補母集合
  const notAttended = useMemo(
    () => candidates.filter((c) => !attended.has(c.memberId)), [candidates, attended]);

  // query 絞込（fullName / memberId の部分一致・大文字小文字無視・trim）
  const selectableCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notAttended;
    return notAttended.filter(
      (c) => c.fullName.toLowerCase().includes(q) || c.memberId.toLowerCase().includes(q));
  }, [notAttended, query]);

  const toggle = useCallback((memberId: string) => {
    setSelectedIds((prev) => { const next = new Set(prev);
      next.has(memberId) ? next.delete(memberId) : next.add(memberId); return next; });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds((prev) => { const next = new Set(prev);
      for (const c of selectableCandidates) next.add(c.memberId); return next; });
  }, [selectableCandidates]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  // attended が変化(他経路で出席追加)した時、既出席になった id は選択から除く(stale 防止)
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => !attended.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [attended]);

  return { query, setQuery, selectableCandidates, selectedIds, toggle,
           selectAllFiltered, clear, selectedCount: selectedIds.size };
}
```

- **stale 防止**（[FB-STATE-DETAIL-002]）: `attended` prop 変化で既出席 id を選択集合から除去する effect を持つ。
- 純粋に局所 state のみ。副作用（API 呼び出し）は持たない（送信は親が担当 = 責務分離）。

### 2.3 F4: `BulkAttendanceChecklist.tsx`（ドロワー主経路）

props:
```ts
interface BulkAttendanceChecklistProps {
  readonly sessionId: string;
  readonly candidates: ReadonlyArray<MemberCandidate>;
  readonly attended: ReadonlySet<string>;
  readonly onBulkAdd: (memberIds: ReadonlyArray<string>) => Promise<void> | void;
  readonly onOpenModal: () => void;     // 大量選択モーダル起動
}
```
UI 構成:
- 検索 `FormField` + `Input`（`data-testid={`bulk-attendance-search-${sessionId}`}`）。
- 未出席候補リスト: 各行 `Checkbox`（`aria-label={fullName}`・`data-testid={`bulk-attendance-option-${sessionId}`}`・`data-member`）。出席済は本リストに出さない（attended 除外）。出席済は既存の出席者リストに表示済み（重複表示回避）。
- 件数情報: 候補 0 件時は `AdminEmptyState` 相当の「追加できる会員がいません」。
- アクション行: 「選択した {selectedCount} 名を一括追加」`Button`（`data-testid={`bulk-attendance-submit-${sessionId}`}`・`disabled={selectedCount===0}`）+ 「全選択」+「選択解除」+「人数が多い時はこちら」リンク（`onOpenModal`）。
- 送信: `await onBulkAdd([...selectedIds]); 成功時 clear()`（成功/失敗の判定とトーストは親 Shell。checklist は送信後 selectedCount に応じ表示更新。clear は送信成功を親が示す形にせず、checklist 側は送信後常に clear する設計とし、失敗時の再選択は AC-7 の「選択保持」を満たすため **親が committed:false を返したら checklist は clear しない**）。

> **clear タイミングの確定**: `onBulkAdd` は `Promise<{committed:boolean}>` 互換ではなく `Promise<void>`。失敗時保持(AC-7)を満たすため、**hook の clear は親からの指示で行う**。実装簡素化のため `onBulkAdd` の戻り値を `Promise<boolean>`（committed）に変更し、checklist は `if (await onBulkAdd(ids)) clear()` とする。→ SSOT のシグネチャを `onBulkAdd: (ids) => Promise<boolean>` に確定（committed を返す）。

### 2.4 F5: `BulkAttendanceModal.tsx`（補助経路・大量選択）

- `ConfirmDialog` 同様の overlay パターン（既存 `apps/web/src/components/ui/` の dialog primitive を流用。無ければ `role="dialog" aria-modal="true"` の自前 overlay）。
- props は checklist とほぼ同一（`onClose` 追加）。同じ `useBulkAttendanceSelection` を使用（AC-9）。
- 違い: 全画面に近い大領域・スクロール可能なリスト・「全選択（絞込結果）」を主アクションに昇格・件数バッジ大きめ。
- `data-testid={`bulk-attendance-modal-${sessionId}`}`。

### 2.5 F6: `MeetingAttendanceDrawer.tsx` 変更

- 既存の単一 select + 単発「出席を追加」は**保持**（AC-10。素早い 1 名追加の最短経路として有用）。その下に区切り、`BulkAttendanceChecklist` を配置。
- props に `onBulkAddAttendance: (memberIds) => Promise<boolean>` を追加（required）。modal 開閉は drawer の局所 `useState<boolean>` で管理し、`BulkAttendanceModal` を条件描画。
- 既存 `MeetingAttendanceDrawer.spec.tsx`（T5）は新 prop 追加に伴い更新（`onBulkAddAttendance: vi.fn(async()=>true)` を渡す）。

### 2.6 F7: `MeetingsClientShell.tsx` 変更

`onBulkAdd` を追加:
```ts
const onBulkAdd = async (sessionId: string, memberIds: ReadonlyArray<string>): Promise<boolean> => {
  const fresh = memberIds.filter((id) => !attended[sessionId]?.has(id));
  if (fresh.length === 0) { setToast("追加対象がありません"); return false; }
  if (fresh.length > 500) { setToast("一度に追加できるのは 500 名までです"); return false; }
  let res; try { res = await importAttendance(sessionId, fresh); }
  catch (e) { setToast(`一括追加に失敗: ${getMessage(e)}`); return false; }
  if (!res.ok) { setToast(`一括追加に失敗: ${res.error}`); return false; }
  const { summary, committed } = res.data;
  if (!committed) {
    setToast(bulkFailureMessage(summary)); // 「追加できませんでした（出席済 X / 削除済 Y / 不明 Z）」
    return false;
  }
  setAttended((s) => { const next = { ...s }; const cur = new Set(next[sessionId] ?? []);
    for (const id of fresh) cur.add(id); next[sessionId] = cur; return next; });
  setToast(`${summary.ok} 名の出席を追加しました`);
  return true;
};
```
- `importAttendance` は `@/lib/admin/api` から import（F1）。useAdminMutation を介す場合は `mutationFn` でラップ（不変条件 #10）。**設計判断**: 一括取込は冪等でなく retry 不要・既存 `addAttendanceMutation` と同じく `useAdminMutation` でラップして統一する（`bulkAddMutation = useAdminMutation(..., {refreshOnSuccess:false, mutationFn: p => unwrap(importAttendance(...))})`）。ただし `committed:false` も HTTP 200 のため、`unwrap` ではなく生の `{ok,data}` を見る必要がある → **`importAttendance` の結果を直接使い、mutation ラップは任意**。実装簡素のため Shell 内で直接 `importAttendance` を呼ぶ（既存 `removeAttendance` も Shell 内 raw 構築の前例あり）。不変条件 #10 は「mutation は useAdminMutation 経由を標準」だが、200 で業務的失敗を返す本 API は mutation 抽象に合わないため Shell 直呼びを許容し、その旨を Phase 8 で注記。
- `bulkFailureMessage(summary)`: 純関数。`meetingStats.ts` か新規 `bulk-attendance-message.ts` に置き unit test 可能にする（[WEEKGRD-02] 純関数は例外を投げず文字列返却）。

### 2.7 状態引き渡しテーブル（[Feedback W1-02b-2]）

| state | owner | 引き渡し先 | 同期タイミング |
| --- | --- | --- | --- |
| `attended` | Shell | Drawer → Checklist/Modal（hook 入力） | API 成功時 Shell が更新 → props 伝播 |
| `selectedIds` / `query` | useBulkAttendanceSelection（局所） | UI 内のみ | toggle/setQuery 即時、attended 変化で stale 除去 |
| modal open | Drawer 局所 useState | Modal の表示制御 | リンク click で true、onClose で false |

## 3. CSS 設計（F9 / OKLch トークンのみ）

`globals.css` の `@layer components` 末尾に追加（既存 `.admin-meeting-drawer` 近辺の規約に合わせる）:

| クラス | 役割 |
| --- | --- |
| `.bulk-attendance` | チェックリストコンテナ（縦 flex / gap） |
| `.bulk-attendance__list` | スクロール可能な候補リスト（max-block-size + overflow-y:auto） |
| `.bulk-attendance__option` | 各行（Checkbox + 氏名）。hover 背景 = 既存 surface トークン |
| `.bulk-attendance__actions` | アクション行（flex wrap） |
| `.bulk-attendance__count` | 選択件数バッジ |
| `.ui-checkbox` / `.ui-checkbox__input` / `.ui-checkbox__label` | primitive |
| `.bulk-attendance-modal` / `__overlay` / `__panel` | モーダル（既存 dialog トークン流用） |

- 色は `var(--color-...)` のみ。寸法は既存 spacing スケール。`accent-color: var(--color-accent...)` 等。

## 4. 既存パターン再利用（[FB-SDK-07-1] 再利用優先）

- 選択 Set + toggle + 全選択 + concurrency は `useSchemaDiffBulkSelection.ts` が前例。ただし本タスクは **1 リクエストの import endpoint** を使うため concurrency loop は不要（よりシンプル）。命名・hook 構造の参考にとどめる。
- overlay は `ConfirmDialog` パターンを参照。

## 5. ライブラリ選定

- 新規外部ライブラリ追加なし（既存 React / 既存 primitive のみ）。
- node-only パッケージの renderer import なし（[Feedback W1-02b-4] 該当なし）。

## 6. 成果物（Phase 2）

| 成果物 | パス |
| --- | --- |
| 設計書（本書） | `phase-2-design.md` |
| アーキテクチャ設計 | `outputs/phase-2/architecture-design.md` |
| API 利用仕様（再利用契約） | `outputs/phase-2/api-specification.md` |

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 要件定義書 | `phase-1-requirements.md` | AC-1..AC-12 |
| 共有コンテキスト | `outputs/phase-1/shared-context.md` | SSOT（シグネチャ・契約） |
| 受け入れ基準 | `outputs/phase-1/acceptance-criteria.md` | 各 AC の検証方法 |
