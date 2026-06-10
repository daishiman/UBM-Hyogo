# 共有コンテキスト (SSOT) — admin-meeting-bulk-attendance-select

> 全 Phase / 全 SubAgent はこの SSOT を正本とする。値の重複定義を避け、衝突時は本書を優先する。

## 0. タスク要約

開催日 / 出席管理（`/(admin)/admin/meetings`）のドロワーで、出席者を 1 名ずつ追加していた UI を
**複数会員同時選択 → 一括追加** に是正する。配置はドロワー内維持。ユーザー選択により
**(1) ドロワー内チェックリスト** と **(2) 大量選択モーダル** の 2 経路を提供。
**既存の一括取込 API を再利用し apps/web のみで完結（API/D1/Form 非変更）。**

## 1. 再利用する API 契約（変更しない）

### 1.1 一括取込 endpoint（本タスクの主役）

```
POST /api/admin/meetings/:sessionId/attendance/import?dryRun=false
Content-Type: application/json
Body: { "rows": [ { "memberId": "TEST-MEM-04" }, { "memberId": "..." } ] }   // email も可だが本UIはmemberId固定
```

レスポンス（200）:
```jsonc
{
  "ok": true,
  "summary": { "total": 5, "ok": 5, "duplicate": 0, "deletedMember": 0, "unknownMember": 0, "invalid": 0 },
  "rows": [ { "index": 0, "status": "ok", "memberId": "TEST-MEM-04" }, ... ],
  "dryRun": false,
  "committed": true
}
```

- `dryRun` 既定は **true**（`attendance.ts:124` `dryRun = dryRunParam !== "false"`）。commit するには **明示的に `?dryRun=false`** を付ける。
- **commit は all-or-nothing**: `commit && rows.length>0 && rows.every(status==='ok')` の時のみ INSERT。1 件でも非 ok → `committed:false`・副作用ゼロ・`rows` に失敗内訳。
- row status: `ok | duplicate | deleted_member | unknown_member | invalid`。payload 内重複は `duplicate`（message `duplicate_in_payload`）。
- エラー: invalid_json(400) / invalid_payload(400) / payload_too_large(413, `IMPORT_MAX_ROWS=500`) / session_not_found(404)。
- 成功行ごとに audit_log（`action='attendance.import.add'`）が 1 件記録される（API 側責務・web 関与なし）。

### 1.2 既存（回帰対象・変更しない）

- 単発追加: `lib addAttendance(sessionId, memberId)` → `POST /api/admin/meetings/:sessionId/attendances {memberId, attended:true}`。
- 削除: DELETE `/api/admin/meetings/:sessionId/attendance/:memberId`。
- web proxy: `apps/web/app/api/admin/[...path]/route.ts`（catch-all・追加不要）。
- web client の汎用 `call<T>(path, method, body)` は `lib/admin/api.ts:25` で `fetch('/api/admin'+path,...)` を行い `{ok:true,data} | {ok:false,status,error}` を返す。

## 2. 現行 UI 構造（変更前）

| 要素 | 場所 |
| --- | --- |
| route | `apps/web/app/(admin)/admin/meetings/page.tsx`（server: meetings + members 並列 fetch → `MeetingsClientShell` へ） |
| 状態 owner | `MeetingsClientShell.tsx`: `attended: Record<sessionId, Set<memberId>>`, `meetings`, `toast`, `selectedId` |
| 一覧 | `MeetingTimeline.tsx`（行クリックで `onSelect` → `renderRowExtra` がドロワー描画） |
| ドロワー | `MeetingAttendanceDrawer.tsx`: 編集 details + 単一 select 出席追加 + 出席者リスト（削除付き） |
| 候補 props | `candidates: ReadonlyArray<{memberId, fullName}>`（非削除会員全件） |

`MeetingAttendanceDrawer` props（現行・維持しつつ拡張）:
```ts
interface Props {
  readonly meeting: MeetingItem;
  readonly candidates: ReadonlyArray<MemberCandidate>;        // {memberId, fullName}
  readonly attended: ReadonlySet<string>;
  readonly onAddAttendance: (memberId: string) => Promise<void> | void;     // 既存単発（保持）
  readonly onRemoveAttendance: (memberId: string) => void;
  readonly onUpdateMeeting: (patch: {title:string;heldOn:string;note:string|null}) => Promise<void>|void;
  readonly onSoftDelete: () => void;
  // 追加:
  readonly onBulkAddAttendance: (memberIds: ReadonlyArray<string>) => Promise<void> | void;  // 新規
}
```

## 3. 新規/変更ファイル一覧（CONST_005）

| # | パス | 種別 | 責務 |
| --- | --- | --- | --- |
| F1 | `apps/web/src/lib/admin/api.ts` | 編集 | `importAttendance(sessionId, memberIds)` 追加 |
| F2 | `apps/web/src/components/ui/Checkbox.tsx` | 新規 | Checkbox primitive（FormField 互換・tokens 準拠） |
| F3 | `apps/web/src/features/admin/components/_meetings/useBulkAttendanceSelection.ts` | 新規 | 選択 Set / toggle / 全選択 / 絞込 / 送信ロジック |
| F4 | `apps/web/src/features/admin/components/_meetings/BulkAttendanceChecklist.tsx` | 新規 | ドロワー内チェックリスト UI（主経路） |
| F5 | `apps/web/src/features/admin/components/_meetings/BulkAttendanceModal.tsx` | 新規 | 大量選択モーダル（補助経路） |
| F6 | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` | 編集 | チェックリスト埋込・モーダル起動導線・既存単発保持 |
| F7 | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` | 編集 | `onBulkAdd` 配線・summary→attended 反映（all-or-nothing） |
| F8 | `apps/web/src/features/admin/components/_meetings/index.ts` | 編集 | 新規 export 追加（必要時） |
| F9 | `apps/web/src/styles/globals.css` | 編集 | チェックリスト/モーダル/chip CSS（OKLch tokens） |
| T1 | `.../components/ui/__tests__/Checkbox.spec.tsx` | 新規 | Checkbox primitive test |
| T2 | `.../_meetings/__tests__/useBulkAttendanceSelection.spec.ts` | 新規 | hook test |
| T3 | `.../_meetings/__tests__/BulkAttendanceChecklist.spec.tsx` | 新規 | checklist test |
| T4 | `.../_meetings/__tests__/BulkAttendanceModal.spec.tsx` | 新規 | modal test |
| T5 | `.../_meetings/__tests__/MeetingAttendanceDrawer.spec.tsx` | 編集 | 既存 + 多選択 case 追加 |
| T6 | `.../lib/admin/__tests__/api.attendance-import.spec.ts` | 新規（or 既存集約） | importAttendance client test |

> コード成果物は `outputs/` に置かない（命名規約 §0）。すべてプロジェクト配置。

## 4. 主要シグネチャ（設計確定値・Phase 2 で詳細化）

```ts
// F1: web client
export const importAttendance = (
  sessionId: string,
  memberIds: ReadonlyArray<string>,
): Promise<
  | { ok: true; data: ImportAttendanceResponse }
  | { ok: false; status: number; error: string }
> =>
  call(
    `/meetings/${encodeURIComponent(sessionId)}/attendance/import?dryRun=false`,
    "POST",
    { rows: memberIds.map((memberId) => ({ memberId })) },
  );

export interface ImportAttendanceSummary {
  total: number; ok: number; duplicate: number;
  deletedMember: number; unknownMember: number; invalid: number;
}
export interface ImportAttendanceRowResult {
  index: number;
  status: "ok" | "duplicate" | "deleted_member" | "unknown_member" | "invalid";
  memberId?: string; message?: string;
}
export interface ImportAttendanceResponse {
  ok: boolean;
  summary: ImportAttendanceSummary;
  rows: ImportAttendanceRowResult[];
  dryRun: boolean;
  committed: boolean;
}

// F3: hook
export interface UseBulkAttendanceSelection {
  query: string;
  setQuery: (q: string) => void;
  selectableCandidates: ReadonlyArray<MemberCandidate>;   // attended を除外 + query 絞込
  selectedIds: ReadonlySet<string>;
  toggle: (memberId: string) => void;
  selectAllFiltered: () => void;     // 現在の絞込結果のうち未出席を全選択
  clear: () => void;
  selectedCount: number;
}
export function useBulkAttendanceSelection(
  candidates: ReadonlyArray<MemberCandidate>,
  attended: ReadonlySet<string>,
): UseBulkAttendanceSelection;
```

## 5. all-or-nothing UX 設計（重要）

1. チェックリスト/モーダルの選択対象は **未出席会員のみ**（attended を除外）。→ 通常 duplicate は起きない。
2. 送信は `importAttendance(sessionId, [...selectedIds])`（1 リクエスト）。
3. `committed:true` → `summary.ok` 件を attended に add、toast `「N 名の出席を追加しました」`、選択 clear。
4. `committed:false` → attended 不変。`rows` を集計し toast 例: `「追加できませんでした（出席済 2 / 削除済 1）。選択を見直してください」`。選択は保持。
5. 選択件数 > 500 → 送信前にガード、toast `「一度に追加できるのは 500 名までです」`。

## 6. 不変条件チェックリスト

- [ ] AC-12: `git diff --name-only -- apps/api packages` が空。
- [ ] AC-11: HEX 直書き 0（`verify:tokens` PASS）。
- [ ] #5: web から D1 binding 直アクセスなし（API 経由のみ）。
- [ ] #9: form input は FormField 経由（検索 input / Checkbox）。
- [ ] #10: mutation は `@/features/admin/hooks/useAdminMutation` 経由。
- [ ] #8: 新規 test は `.spec.ts(x)` のみ。

## 7. 検証コマンド（全 Phase 共通）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__ \
  apps/web/src/components/ui/__tests__/Checkbox.spec.tsx \
  apps/web/src/lib/admin/__tests__/api.attendance-import.spec.ts
git diff --name-only -- apps/api packages   # 空であること（AC-12）
pnpm verify:phase12-compliance
pnpm gate-metadata:validate --require-gates-for-changed \
  docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/artifacts.json \
  docs/30-workflows/completed-tasks/admin-meeting-bulk-attendance-select/outputs/artifacts.json
```
