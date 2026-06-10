# Phase 5: 実装（コード変更指示書 / TDD Green）

> **本仕様書ではコードを実装しない。後続 `03.実装.md` が本 Phase の指示に従って実装する。**
> 本 Phase は Phase 4 で Red 化したテスト（CB / HK / MSG / CL / MD / DR / API / SH）を green へ転じるための
> 実コード変更を、変更対象ファイル（F1..F9）それぞれについて「Before→After」または「新規ファイル全体構造」で示す。
> `apps/api` / D1 schema / Google Form schema / endpoint surface / fetch URL は一切変更しない（AC-12・不変条件 #1 #5）。

## メタ情報

- task_id: `admin-meeting-bulk-attendance-select`
- 前提: Phase 1（AC-1..AC-12）/ Phase 2（F1..F9・hook 方針・onBulkAdd 戻り値）/ Phase 3（PASS）/ Phase 4（テスト計画）/ SSOT
- 本 Phase の責務: 変更 9 ファイルの関数 / 型 / props シグネチャ・入出力・副作用・エラーハンドリング・検証コマンド・DoD を実装可能粒度で確定する（CONST_005）

## 1. 変更対象ファイル一覧（CONST_005）

| # | パス | 種別 | 責務 |
| --- | --- | --- | --- |
| F1 | `apps/web/src/lib/admin/api.ts` | 編集 | `importAttendance(sessionId, memberIds)` と型 4 種を追加 |
| F2 | `apps/web/src/components/ui/Checkbox.tsx` | 新規 | Checkbox primitive（FormField 互換・tokens 準拠） |
| F3 | `apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts` | 新規 | 選択 Set / toggle / 全選択 / 絞込 / stale 除去 |
| F3b | `apps/web/src/features/admin/components/_meetings/bulk-attendance-message.ts` | 新規 | `bulkFailureMessage(summary)` 純関数 |
| F4 | `apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx` | 新規 | ドロワー内チェックリスト UI（主経路） |
| F5 | `apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx` | 新規 | 大量選択モーダル（補助経路） |
| F6 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 編集 | チェックリスト埋込・モーダル起動・既存単発保持 |
| F7 | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | 編集 | `onBulkAdd` 配線・summary→attended 反映（all-or-nothing） |
| F8 | `apps/web/src/features/admin/components/_meetings/index.ts` | 編集 | 新規 export 追加 |
| F9 | `apps/web/src/styles/globals.css` | 編集 | チェックリスト / モーダル / chip / checkbox CSS（OKLch tokens） |

> 実装順序（依存順）: **F1 → F2 → F3 / F3b（純関数）→ F4 / F5 → F6 → F7 → F8 → F9（CSS）**。
> F1（client）と F2（primitive）と F3b（純関数）を先に置くことで、F4 / F5 の参照先が既に存在する状態を作る。

## 2. 各ファイルの実装仕様

### F1: `apps/web/src/lib/admin/api.ts`（編集 / AC-5）

既存 `removeAttendance`（`/attendances` POST `{memberId, attended:false}`）の **直後** に追加する。
`call<T>(path, method, body)` は本ファイル既存ヘルパー（`/api/admin${path}` へ fetch・`{ok:true,data} | {ok:false,status,error}` を返す）。

**Before（追加位置の現行末尾）:**

```ts
export const removeAttendance = (sessionId: string, memberId: string) =>
  call(`/meetings/${encodeURIComponent(sessionId)}/attendances`, "POST", {
    memberId,
    attended: false,
  });
```

**After（上記直後へ追加）:**

```ts
// admin-meeting-bulk-attendance-select: 一括取込 endpoint を再利用した複数会員同時出席追加。
// 既存 import endpoint（?dryRun=false で commit）を 1 リクエストで叩く。all-or-nothing。
export interface ImportAttendanceSummary {
  total: number;
  ok: number;
  duplicate: number;
  deletedMember: number;
  unknownMember: number;
  invalid: number;
}
export interface ImportAttendanceRowResult {
  index: number;
  status: "ok" | "duplicate" | "deleted_member" | "unknown_member" | "invalid";
  memberId?: string;
  message?: string;
}
export interface ImportAttendanceResponse {
  ok: boolean;
  summary: ImportAttendanceSummary;
  rows: ImportAttendanceRowResult[];
  dryRun: boolean;
  committed: boolean;
}

export const importAttendance = (
  sessionId: string,
  memberIds: ReadonlyArray<string>,
) =>
  call<ImportAttendanceResponse>(
    `/meetings/${encodeURIComponent(sessionId)}/attendance/import?dryRun=false`,
    "POST",
    { rows: memberIds.map((memberId) => ({ memberId })) },
  );
```

- **入力**: `sessionId: string`（未 encode・関数内で encodeURIComponent）・`memberIds: ReadonlyArray<string>`。
- **出力**: `Promise<{ok:true,status,data:ImportAttendanceResponse} | {ok:false,status,error,data?}>`（`call` の戻り型）。
- **副作用**: 単一 fetch（`?dryRun=false` で API 側が commit）。N 件でも 1 リクエスト。
- **エラーハンドリング**: 通信失敗 → `call` が `{ok:false,status:0,error}`。HTTP 非 2xx → `{ok:false,status,error}`。
  HTTP 200 で `committed:false`（業務的失敗）は `{ok:true,data:{committed:false,...}}`（成功扱い・呼び出し側 F7 が committed を判定）。
- **検証**: T7（API-1..6）。`mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts`。
- **DoD**: API-1..6 GREEN・typecheck PASS。

### F2: `apps/web/src/components/ui/Checkbox.tsx`（新規 / AC-1 / AC-11）

**新規ファイル全体構造:**

```tsx
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  readonly label?: ReactNode;
  readonly describedBy?: string;
}

export function Checkbox({ label, describedBy, className, ...props }: CheckboxProps) {
  const input = (
    <input
      {...props}
      type="checkbox"
      aria-describedby={props["aria-describedby"] ?? describedBy}
      className="ui-checkbox__input"
    />
  );
  if (label === undefined) {
    return input;
  }
  return (
    <label className={cn("ui-checkbox", className)}>
      {input}
      <span className="ui-checkbox__label">{label}</span>
    </label>
  );
}
```

- **props**: `label?`（省略時は input のみ・呼び出し側が `aria-label` 付与）・`describedBy?`・残りは `<input>` 互換（`checked` / `onChange` / `disabled` / `id` / `name` / `aria-label` 等）。
- **副作用**: なし（制御は呼び出し側）。
- **エラーハンドリング**: なし（presentational）。
- **色**: HEX 直書き禁止。class（`ui-checkbox` / `ui-checkbox__input` / `ui-checkbox__label`）のみ。色は F9 CSS で `var(--color-*)` / `accent-color` に委譲（AC-11）。
- **検証**: T1（CB-1..5）。`mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/ui/__tests__/Checkbox.spec.tsx`。
- **DoD**: CB-1..5 GREEN・grep gate（`bg-[#` / `#[0-9a-f]{3,6}` 直書きなし）PASS。

### F3b: `apps/web/src/features/admin/components/_meetings/bulk-attendance-message.ts`（新規 / AC-7）

**新規ファイル全体構造:**

```ts
import type { ImportAttendanceSummary } from "../../../../lib/admin/api";

// admin-meeting-bulk-attendance-select: all-or-nothing 失敗時の内訳メッセージ純関数。
// [WEEKGRD-02] 例外を投げず必ず文字列を返す。
export function bulkFailureMessage(summary: ImportAttendanceSummary): string {
  const parts: string[] = [];
  if (summary.duplicate > 0) parts.push(`出席済 ${summary.duplicate}`);
  if (summary.deletedMember > 0) parts.push(`削除済 ${summary.deletedMember}`);
  if (summary.unknownMember > 0) parts.push(`不明 ${summary.unknownMember}`);
  if (summary.invalid > 0) parts.push(`不正 ${summary.invalid}`);
  if (parts.length === 0) {
    return "追加できませんでした。選択を見直してください";
  }
  return `追加できませんでした（${parts.join(" / ")}）。選択を見直してください`;
}
```

- **入力**: `summary: ImportAttendanceSummary`（F1 型を再利用）。
- **出力**: 文字列。`duplicate`→「出席済」/`deletedMember`→「削除済」/`unknownMember`→「不明」/`invalid`→「不正」の固定順で 0 件は省略。
- **副作用**: なし（純関数）。
- **検証**: T3（MSG-1..7）。
- **DoD**: MSG-1..7 GREEN。

### F3: `apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts`（新規 / AC-2 / AC-4 / AC-9）

**新規ファイル全体構造（SSOT §4 / Phase 2 §2.2 確定値）:**

```ts
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MemberCandidate } from "./MeetingAttendanceDrawer";

export interface UseBulkAttendanceSelection {
  query: string;
  setQuery: (q: string) => void;
  selectableCandidates: ReadonlyArray<MemberCandidate>;
  selectedIds: ReadonlySet<string>;
  toggle: (memberId: string) => void;
  selectAllFiltered: () => void;
  clear: () => void;
  selectedCount: number;
}

export function useBulkAttendanceSelection(
  candidates: ReadonlyArray<MemberCandidate>,
  attended: ReadonlySet<string>,
): UseBulkAttendanceSelection {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const notAttended = useMemo(
    () => candidates.filter((c) => !attended.has(c.memberId)),
    [candidates, attended],
  );

  const selectableCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notAttended;
    return notAttended.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.memberId.toLowerCase().includes(q),
    );
  }, [notAttended, query]);

  const toggle = useCallback((memberId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const c of selectableCandidates) next.add(c.memberId);
      return next;
    });
  }, [selectableCandidates]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  // [FB-STATE-DETAIL-002] attended が他経路で変化したら既出席 id を選択から除く
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => !attended.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [attended]);

  return {
    query,
    setQuery,
    selectableCandidates,
    selectedIds,
    toggle,
    selectAllFiltered,
    clear,
    selectedCount: selectedIds.size,
  };
}
```

- **入力**: `candidates`（未削除会員全件）・`attended`（当該 session の出席 Set）。
- **出力**: `UseBulkAttendanceSelection`（SSOT §4 シグネチャ厳守）。
- **副作用**: hook 内 `useState` のみ。**API 呼び出しは持たない**（送信は親 = 責務分離）。stale 除去 effect 1 個。
- **検証**: T2（HK-1..10）。
- **DoD**: HK-1..10 GREEN・typecheck PASS。

### F4: `apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx`（新規 / AC-1..4 / AC-7）

**props 型:**

```tsx
export interface BulkAttendanceChecklistProps {
  readonly sessionId: string;
  readonly candidates: ReadonlyArray<MemberCandidate>;
  readonly attended: ReadonlySet<string>;
  readonly onBulkAdd: (memberIds: ReadonlyArray<string>) => Promise<boolean>;
  readonly onOpenModal: () => void;
}
```

**実装方針（UI 構成）:**

- `"use client"`。`useBulkAttendanceSelection(candidates, attended)` を使用。
- 検索: `FormField name={`bulk-attendance-search-${sessionId}`} label="会員を検索"` 配下に `Input`（`data-testid={`bulk-attendance-search-${sessionId}`}` / `value={query}` / `onChange={(e)=>setQuery(e.target.value)}`）。不変条件 #9 遵守。
- 候補リスト: `selectableCandidates` を map し各行 `Checkbox`（`aria-label={c.fullName}` / `checked={selectedIds.has(c.memberId)}` / `onChange={()=>toggle(c.memberId)}` / `data-testid={`bulk-attendance-option-${sessionId}`}` / `data-member={c.memberId}` / label に `{c.fullName} ({c.memberId})`）。出席済は `selectableCandidates` に含まれないため本リストに出ない（重複表示回避）。
- 空状態: `selectableCandidates.length === 0` の時「追加できる会員がいません」を表示し submit ボタンを出さない（または disabled）。
- アクション行（`bulk-attendance__actions`）:
  - 「選択した {selectedCount} 名を一括追加」`Button variant="primary"`（`data-testid={`bulk-attendance-submit-${sessionId}`}` / `disabled={selectedCount===0}` / onClick=`handleSubmit`）。
  - 「全選択」`Button variant="soft"`（`onClick={selectAllFiltered}`）。
  - 「選択解除」`Button variant="ghost"`（`onClick={clear}`）。
  - 「人数が多い時はこちら」`Button variant="ghost"`（`onClick={onOpenModal}`）。
- `handleSubmit`:

```tsx
const handleSubmit = async () => {
  if (selectedCount === 0) return;
  const committed = await onBulkAdd([...selectedIds]);
  if (committed) clear();
};
```

- **副作用**: 親 `onBulkAdd` 呼び出し（true 戻りで `clear()`、false 戻りで選択保持＝AC-7）。
- **エラーハンドリング**: 送信失敗の判定とトーストは親 Shell（checklist は committed boolean のみ見る）。
- **検証**: T4（CL-1..12）。
- **DoD**: CL-1..12 GREEN。

### F5: `apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx`（新規 / AC-8 / AC-9）

**props 型:**

```tsx
export interface BulkAttendanceModalProps {
  readonly open: boolean;
  readonly sessionId: string;
  readonly candidates: ReadonlyArray<MemberCandidate>;
  readonly attended: ReadonlySet<string>;
  readonly onBulkAdd: (memberIds: ReadonlyArray<string>) => Promise<boolean>;
  readonly onClose: () => void;
}
```

**実装方針:**

- `"use client"`。`open === false` の時 `return null`。
- overlay: `<div role="presentation" className="bulk-attendance-modal__overlay" onClick={onClose}>` の中に `<div role="dialog" aria-modal="true" aria-label="会員を一括選択" className="bulk-attendance-modal__panel" data-testid={`bulk-attendance-modal-${sessionId}`} onClick={(e)=>e.stopPropagation()}>`（`ConfirmDialog` の backdrop パターンを参照）。
- 同じ `useBulkAttendanceSelection(candidates, attended)` を別 instance で使用（AC-9）。
- 内容: 検索 `FormField` + `Input`（`data-testid={`bulk-attendance-modal-search-${sessionId}`}`）・スクロール可能な候補リスト（`bulk-attendance-modal__list`）・「全選択」`Button`（主アクション昇格）・「選択解除」`Button`・「選択した {selectedCount} 名を一括追加」`Button variant="primary"`（`data-testid={`bulk-attendance-modal-submit-${sessionId}`}` / `disabled={selectedCount===0}`）・「閉じる」`Button`（`onClick={onClose}`）。
- `handleSubmit` は F4 と同一構造（`if (await onBulkAdd([...selectedIds])) clear()`）。
- **副作用**: 親 `onBulkAdd` / `onClose`。
- **検証**: T5（MD-1..7）。
- **DoD**: MD-1..7 GREEN。

### F6: `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx`（編集 / AC-1 / AC-8 / AC-10）

**Before（props interface）:**

```ts
interface Props {
  readonly meeting: MeetingItem;
  readonly candidates: ReadonlyArray<MemberCandidate>;
  readonly attended: ReadonlySet<string>;
  readonly onAddAttendance: (memberId: string) => Promise<void> | void;
  readonly onRemoveAttendance: (memberId: string) => void;
  readonly onUpdateMeeting: (patch: {
    title: string;
    heldOn: string;
    note: string | null;
  }) => Promise<void> | void;
  readonly onSoftDelete: () => void;
}
```

**After（props に required prop 追加）:**

```ts
interface Props {
  readonly meeting: MeetingItem;
  readonly candidates: ReadonlyArray<MemberCandidate>;
  readonly attended: ReadonlySet<string>;
  readonly onAddAttendance: (memberId: string) => Promise<void> | void;
  readonly onRemoveAttendance: (memberId: string) => void;
  readonly onUpdateMeeting: (patch: {
    title: string;
    heldOn: string;
    note: string | null;
  }) => Promise<void> | void;
  readonly onSoftDelete: () => void;
  // admin-meeting-bulk-attendance-select: 複数会員同時出席追加（committed を返す）
  readonly onBulkAddAttendance: (memberIds: ReadonlyArray<string>) => Promise<boolean>;
}
```

**変更点:**

1. import 追加: `import { BulkAttendanceChecklist } from "./BulkAttendanceChecklist";` / `import { BulkAttendanceModal } from "./BulkAttendanceModal";`。
2. 関数引数の分解に `onBulkAddAttendance` を追加。
3. modal 開閉の局所 state: `const [modalOpen, setModalOpen] = useState(false);`（既存 `useState` import を流用）。
4. 既存の単一 select + 「出席を追加」`<div role="group" aria-label="出席追加">`（行 84-115）は**そのまま保持**（AC-10）。その直後（出席者リスト `attended.size > 0` ブロックの**前**）にチェックリストを配置:

```tsx
<BulkAttendanceChecklist
  sessionId={meeting.sessionId}
  candidates={candidates}
  attended={attended}
  onBulkAdd={onBulkAddAttendance}
  onOpenModal={() => setModalOpen(true)}
/>
<BulkAttendanceModal
  open={modalOpen}
  sessionId={meeting.sessionId}
  candidates={candidates}
  attended={attended}
  onBulkAdd={onBulkAddAttendance}
  onClose={() => setModalOpen(false)}
/>
```

- **副作用**: modal 開閉の局所 state のみ。
- **検証**: T6（DR-1..5）。
- **DoD**: DR-1..5 GREEN（既存 DR-1/DR-2 含む）。

### F7: `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx`（編集 / AC-5 / AC-6 / AC-7）

**Before（import 行 11-14）:**

```ts
import {
  addAttendance,
  updateMeeting,
} from "../../../../lib/admin/api";
```

**After:**

```ts
import {
  addAttendance,
  importAttendance,
  updateMeeting,
} from "../../../../lib/admin/api";
import { bulkFailureMessage } from "./bulk-attendance-message";
```

**新規 `onBulkAdd`（既存 `onAdd` 関数定義の直後に追加）:**

```ts
const onBulkAdd = async (
  sessionId: string,
  memberIds: ReadonlyArray<string>,
): Promise<boolean> => {
  const fresh = memberIds.filter((id) => !attended[sessionId]?.has(id));
  if (fresh.length === 0) {
    setToast("追加対象がありません");
    return false;
  }
  if (fresh.length > 500) {
    setToast("一度に追加できるのは 500 名までです");
    return false;
  }
  const res = await importAttendance(sessionId, fresh);
  if (!res.ok) {
    setToast(`一括追加に失敗: ${res.error}`);
    return false;
  }
  const { summary, committed } = res.data;
  if (!committed) {
    setToast(bulkFailureMessage(summary));
    return false;
  }
  setAttended((s) => {
    const next = { ...s };
    const cur = new Set(next[sessionId] ?? []);
    for (const id of fresh) cur.add(id);
    next[sessionId] = cur;
    return next;
  });
  setToast(`${summary.ok} 名の出席を追加しました`);
  return true;
};
```

**`MeetingAttendanceDrawer` への prop 配線（renderRowExtra 内）:**

```tsx
<MeetingAttendanceDrawer
  meeting={m}
  candidates={candidates}
  attended={attended[m.sessionId] ?? new Set<string>()}
  onAddAttendance={(memberId) => onAdd(m.sessionId, memberId)}
  onRemoveAttendance={(memberId) =>
    confirm.openConfirm("remove", { sessionId: m.sessionId, memberId })
  }
  onUpdateMeeting={(patch) => onUpdate(m.sessionId, patch)}
  onSoftDelete={() => confirm.openConfirm("delete", { sessionId: m.sessionId })}
  onBulkAddAttendance={(memberIds) => onBulkAdd(m.sessionId, memberIds)}
/>
```

- **入力**: `sessionId` / `memberIds`。**出力**: `Promise<boolean>`（committed）。UI（F4 / F5）は `if (await onBulkAdd(ids)) clear()`。
- **副作用**: `importAttendance`（単一 fetch）・`setAttended`（committed 時のみ）・`setToast`。
- **エラーハンドリング**:
  - `fresh.length === 0` / `> 500` → 送信前ガード（toast・false）。
  - `res.ok === false`（通信 / HTTP 失敗）→ 失敗 toast・false。
  - HTTP 200 `committed:false` → `bulkFailureMessage` toast・attended 不変・false（AC-7）。
  - HTTP 200 `committed:true` → `summary.ok` 件を attended に add・成功 toast・true（AC-6）。
- **mutation 抽象に関する判断**: import は HTTP 200 で業務失敗（`committed:false`）を返すため `useAdminMutation`（throw 前提の `unwrap`）に適合しない。既存 `removeAttendance` も Shell 内 raw 構築の前例があり、Shell 直呼びを許容する（Phase 8 §不変条件 #10 で注記）。
- **検証**: T8（SH-1..7）。
- **DoD**: SH-1..7 GREEN（回帰 SH-6 / SH-7 含む）。

### F8: `apps/web/src/features/admin/components/_meetings/index.ts`（編集）

**Before（末尾近辺）:**

```ts
export { MeetingAttendanceDrawer } from "./MeetingAttendanceDrawer";
export type { MemberCandidate } from "./MeetingAttendanceDrawer";
```

**After（直後に追加）:**

```ts
export { MeetingAttendanceDrawer } from "./MeetingAttendanceDrawer";
export type { MemberCandidate } from "./MeetingAttendanceDrawer";
export { BulkAttendanceChecklist } from "./BulkAttendanceChecklist";
export { BulkAttendanceModal } from "./BulkAttendanceModal";
export { useBulkAttendanceSelection } from "./useBulkAttendanceSelection";
export type { UseBulkAttendanceSelection } from "./useBulkAttendanceSelection";
export { bulkFailureMessage } from "./bulk-attendance-message";
```

- **検証**: typecheck PASS（循環参照なし）。
- **DoD**: import 解決成功・既存 export 維持。

### F9: `apps/web/src/styles/globals.css`（編集 / AC-11）

`@layer components` 末尾（既存 `.admin-meeting-drawer` 近辺の規約に合わせる）へ追加。**色は `var(--color-*)` トークンのみ・HEX 直書き / `bg-[#xxx]` 禁止**。

| クラス | 役割 | 主プロパティ（トークンのみ） |
| --- | --- | --- |
| `.ui-checkbox` | label 行（input + テキスト） | `display:inline-flex; gap` / `align-items:center` |
| `.ui-checkbox__input` | checkbox 本体 | `accent-color: var(--color-accent)`（既存 accent トークン） |
| `.ui-checkbox__label` | label テキスト | `color: var(--color-text)` |
| `.bulk-attendance` | チェックリストコンテナ | `display:flex; flex-direction:column; gap` |
| `.bulk-attendance__list` | 候補リスト | `max-block-size; overflow-y:auto`（横スクロールなし） |
| `.bulk-attendance__option` | 各行 | hover 背景 `var(--color-surface-hover)`（既存 surface トークン） |
| `.bulk-attendance__actions` | アクション行 | `display:flex; flex-wrap:wrap; gap` |
| `.bulk-attendance__count` | 件数バッジ | `color / background` を既存トークンで |
| `.bulk-attendance-modal__overlay` | モーダル背景 | `position:fixed; inset:0; background: var(--color-overlay)`（既存 dialog overlay トークン流用） |
| `.bulk-attendance-modal__panel` | モーダルパネル | `background: var(--color-surface); max-block-size; overflow-y:auto` |
| `.bulk-attendance-modal__list` | モーダル内候補リスト | `overflow-y:auto`（大領域） |

- **検証**: `mise exec -- pnpm verify:tokens` + grep gate（`#[0-9a-fA-F]{3,6}` / `bg-[#` が新規追加行に無い）。
- **DoD**: `verify:tokens` PASS・grep gate 0 hit。
- **注**: 流用トークン名（`--color-accent` / `--color-surface-hover` / `--color-overlay` 等）は実装時に既存 `tokens.css` / `globals.css` の実在変数を grep で確認し、最も近い既存トークンを採用する（新規トークンは増やさない）。

## 3. 実装順序と各ステップの検証

| 手順 | 対象 | ステップ後の検証 |
| --- | --- | --- |
| 1 | F1 `api.ts` `importAttendance` + 型 | T7（API-1..6） |
| 2 | F2 `Checkbox.tsx` | T1（CB-1..5） |
| 3 | F3b `bulk-attendance-message.ts` | T3（MSG-1..7） |
| 4 | F3 `useBulkAttendanceSelection.ts` | T2（HK-1..10） |
| 5 | F4 `BulkAttendanceChecklist.tsx` | T4（CL-1..12） |
| 6 | F5 `BulkAttendanceModal.tsx` | T5（MD-1..7） |
| 7 | F6 `MeetingAttendanceDrawer.tsx` | T6（DR-1..5） |
| 8 | F7 `MeetingsClientShell.tsx` | T8（SH-1..7） |
| 9 | F8 `index.ts` | typecheck |
| 10 | F9 `globals.css` | `verify:tokens` / grep gate |

各ステップ後の最小検証:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
```

## 4. 全体 DoD（Definition of Done）

- [ ] AC-1..AC-10 対応の T1..T8 ケース全 GREEN。
- [ ] `mise exec -- pnpm typecheck` PASS。
- [ ] `mise exec -- pnpm lint` PASS。
- [ ] `mise exec -- pnpm verify:tokens` PASS（AC-11）。
- [ ] `git diff --name-only -- apps/api packages` が空（AC-12）。
- [ ] 既存 `MeetingAttendanceDrawer.spec.tsx` の DR-1 / DR-2 が GREEN 維持。
- [ ] 新規 test は `.spec.ts(x)` のみ（不変条件 #8）。

## 5. 成果物（Phase 5）

| 成果物 | パス |
| --- | --- |
| 実装指示書（本書） | `phase-5-implementation.md` |
| 実装サマリ | `outputs/phase-5/implementation-summary.md` |

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 要件定義書 | `phase-1-requirements.md` | AC-1..AC-12 |
| 共有コンテキスト（SSOT） | `outputs/phase-1/shared-context.md` | F1..F9・シグネチャ・API 契約 |
| 設計書 | `phase-2-design.md` | アーキ・hook 方針・onBulkAdd 戻り値・CSS 設計 |
| 設計レビュー | `phase-3-design-review.md` | PASS・mutation 直呼び許容判断 |
| テスト計画 | `phase-4-test-plan.md` | T1..T8 ケース表 |
