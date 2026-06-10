# Phase 1: 要件定義

- task_id: `admin-meeting-bulk-attendance-select`
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `edit`

## 1. 実装区分判定（CONST_004）

| 判定軸 | 評価 |
| --- | --- |
| 目的が「動作させる/改善する」を含むか | はい（複数選択 → 一括追加という新規操作を**動作**させる） |
| ファイル変更・関数追加・UI 変更を伴うか | はい（新規コンポーネント / hook / Checkbox primitive / CSS / web client 関数） |
| ドキュメント・調査・合意のみで完結するか | いいえ |

→ **[実装区分: 実装仕様書]**（CONST_004 デフォルト）。docs-only 例外には該当しない。

## 2. タスク分類（[Feedback 3] 対応・Phase 11 で再参照）

- **UI task**（VISUAL）。admin 画面の操作 UI を可視に変更する。Phase 11 は screenshot 証跡を取る（runtime は user-gated）。

## 3. 配置場所の分析（ユーザー要望「配置が最適か」への回答）

### 3.1 情報設計上の所有関係

- 出席レコードは `member_attendance(member_id, session_id, ...)` で **開催日（session）に従属**する子情報。
- 既存 UI は「開催日一覧 → 行クリックで該当 session のドロワー展開 → その中で出席編集」という **session-scoped な局所配置**を採用済み（`MeetingsClientShell.tsx:255-277`）。
- これは情報設計として正しい（出席は session の文脈で編集するのが自然）。**配置（開催日ドロワー内）は変更しない。**

### 3.2 真の論点

- 課題は「配置」ではなく「**1 件ずつの操作コスト**」。会員 N 人を登録するのに N 回の (select → click) が必要。
- → 配置を維持したまま **操作方式を一括化** することが最小かつ本質的な是正。

### 3.3 ユーザー意思決定（AskUserQuestion 回答）

- 質問「複数会員を一括出席追加する UI の操作方式・配置」に対し **「両方（ドロワー簡易チェックリスト + 大量選択モーダル）」** を選択。
- → ドロワー内チェックリスト（主経路）と大量選択モーダル（補助経路）の 2 つを実装・保守する。

## 4. 前提コード検証（FB-01 / Issue #1065 gate: 設計前提に引用する契約は実コードを Read 済み）

| 前提 | 検証結果 | anchor |
| --- | --- | --- |
| 出席追加 UI は単一 select | 確認（`<select>` + 単発ボタン） | `MeetingAttendanceDrawer.tsx:84-115` |
| 出席状態 owner | `MeetingsClientShell` の `attended: Record<sessionId, Set<memberId>>` | `MeetingsClientShell.tsx:62-70` |
| 候補会員 source | `/admin/members` の非削除会員 `{memberId, fullName}` を props 注入 | `app/(admin)/admin/meetings/page.tsx:13-38` |
| 単発追加経路（現行） | `lib addAttendance` → `POST /api/admin/meetings/:id/attendances {memberId, attended:true}`（`meetings.ts` plural toggle） | `lib/admin/api.ts:556-561` / `apps/api/.../meetings.ts:200` |
| 削除経路（現行） | DELETE `/api/admin/meetings/:sessionId/attendance/:memberId`（`attendance.ts`） | `MeetingsClientShell.tsx:103-119` / `attendance.ts:177-199` |
| 一括取込 endpoint | **存在 + mount 済み**。`POST /admin/meetings/:sessionId/attendance/import` body `{rows:[{memberId?,email?}]}` query `?dryRun`（既定 true）。返却 `{ok,summary,rows,dryRun,committed}` | `attendance.ts:120-175` / `index.ts:283` |
| 一括取込 commit 条件 | **all-or-nothing**: `commit && rows.length>0 && rows.every(status==='ok')` の時のみ INSERT。1 件でも非 ok なら committed=false で副作用ゼロ | `import-attendance-bulk.ts:247-264` |
| 行分類ステータス | `ok / duplicate / deleted_member / unknown_member / invalid`。payload 内重複も `duplicate(duplicate_in_payload)` | `import-attendance-bulk.ts:27-39,230-244` |
| web proxy | catch-all `app/api/admin/[...path]/route.ts` が `/api/admin/*` を転送。import endpoint へ追加 proxy 不要で到達 | `apps/web/app/api/admin/[...path]/route.ts` |
| Checkbox primitive | **不在**（`ui/` は `Select.tsx` のみ） → 新規 `Checkbox.tsx` が必要 | `apps/web/src/components/ui/`（ls 実測） |
| 上限 | `IMPORT_MAX_ROWS = 500` | `import-attendance-bulk.ts:20` |

> **訂正記録**: 初回コード調査 SubAgent は `meetings.ts` のみを見て「一括 endpoint は存在しない」と報告したが、`attendance.ts` の直接 Read により **存在・mount 済み**を確認。本仕様は実コードを正本とする（FB-01）。

## 5. 命名規則の実測（[FB-SDK-07-4] 命名一貫性）

| 対象 | 既存規約（実測） | 本タスクの採用 |
| --- | --- | --- |
| `_meetings/` 配下コンポーネント | PascalCase `.tsx`（`MeetingAttendanceDrawer` 等） | `BulkAttendanceModal.tsx`（PascalCase） |
| hook | camelCase `useXxx.ts`（例: `useSchemaDiffBulkSelection.ts`） | `useBulkAttendanceSelection.ts` |
| web client 関数 | camelCase（`addAttendance` / `removeAttendance` / `updateMeeting`） | `importAttendance` |
| primitive | PascalCase（`Select.tsx` / `Input.tsx` / `Button.tsx` / `FormField.tsx`） | `Checkbox.tsx` |
| test | `__tests__/<Name>.spec.ts(x)`（不変条件 #8: `.spec` のみ） | 同型 |
| data-testid | `<action>-<sessionId>`（`attendance-select-${sessionId}` 等） | `bulk-attendance-*-${sessionId}` |

## 6. Acceptance Criteria（AC-1..AC-12 / 正本）

- **AC-1**: 開催日ドロワー内に、出席していない候補会員を**複数同時に選択**できるチェックリスト UI がある（各候補にチェックボックス）。
- **AC-2**: チェックリストは会員名 / memberId で**インクリメンタル検索（絞り込み）**できる。
- **AC-3**: 「選択した N 名を一括追加」ボタンがあり、ラベルに**選択件数 N が反映**される。選択 0 件時は disabled。
- **AC-4**: 既に出席済みの会員はチェック不可（disabled）かつ「出席済」表示。チェックリストの選択対象は fresh（未出席）会員のみ。
- **AC-5**: 一括追加実行時、`POST /api/admin/meetings/:sessionId/attendance/import?dryRun=false` に `{rows: selected.map(id=>({memberId:id}))}` を 1 リクエストで送る（N 回の単発 POST をしない）。
- **AC-6**: 一括追加成功（`committed:true`）時、`summary.ok` 件の会員を attended state に反映し、`「N 名の出席を追加しました」` を toast 表示。選択はクリアする。
- **AC-7**: 一括追加が `committed:false`（all-or-nothing で未 commit）の場合、**1 件も attended に追加せず**、`summary` から失敗理由（duplicate/deleted_member/unknown_member/invalid）を集計したメッセージを toast 表示し、選択は保持して再操作可能にする。
- **AC-8**: 「人数が多い時はこちら」導線から**全画面モーダル**を開ける。モーダルは検索 / 全選択（絞込結果に対する）/ 選択解除 / 「選択した N 名を一括追加」を持つ。
- **AC-9**: モーダルの一括追加も AC-5..AC-7 と同一の API 契約・状態反映を共有する（重複ロジックを `useBulkAttendanceSelection` に集約）。
- **AC-10**: 既存の単発「出席を追加」「出席者の削除」機能は**回帰なし**で従来通り動作する。
- **AC-11**: 新規 Checkbox primitive は `apps/web/src/components/ui/Checkbox.tsx` に置き、color は OKLch トークン（`tokens.css` / `globals.css` 既存変数）のみ使用。HEX 直書き・`bg-[#xxx]` 禁止（UI prototype alignment 不変条件 #2、CI `verify-design-tokens`）。
- **AC-12**: `apps/api` / `packages` / Google Form schema は非変更（`git diff --name-only -- apps/api packages` が空）。新 endpoint / D1 migration / shared 型変更なし。

> AC-1..AC-9 = 新規多選択機能、AC-10 = 回帰防止、AC-11..AC-12 = 不変条件遵守。

## 7. 非機能・制約

- 不変条件 #5（D1 直接アクセス禁止 / web は API 経由のみ）、#9（admin form input は FormField 経由標準）、#10（admin mutation は `@/features/admin/hooks/useAdminMutation` 経由標準）を遵守。
- 既存 `useAdminMutation`（`@/features/admin/hooks/useAdminMutation`）を一括取込にも使用する（legacy `@/lib/useAdminMutation` 不使用）。
- 上限 500 件（`IMPORT_MAX_ROWS`）。選択数がこれを超える場合は送信前にガードし toast 警告。

## 8. 成果物（Phase 1）

| 成果物 | パス |
| --- | --- |
| 要件定義書（本書） | `phase-1-requirements.md` |
| 受け入れ基準 | `outputs/phase-1/acceptance-criteria.md` |
| スコープ定義 | `outputs/phase-1/scope-definition.md` |
| 共有コンテキスト（SSOT） | `outputs/phase-1/shared-context.md` |

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に以下のシステム仕様を確認し、既存設計との整合性を確保すること。

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| API schema | `.claude/skills/aiworkflow-requirements/references/api-*.md` | attendance / meetings の endpoint 契約 |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | admin primitive / form 規約 |
| design tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch トークン正本 |

### 現行コード anchor

| 系統 | パス |
| --- | --- |
| route owner | `apps/web/app/(admin)/admin/meetings/page.tsx` |
| 出席 UI | `apps/web/src/features/admin/components/_meetings/MeetingAttendanceDrawer.tsx` |
| 状態 owner | `apps/web/src/features/admin/components/_meetings/MeetingsClientShell.tsx` |
| web client | `apps/web/src/lib/admin/api.ts` |
| API（再利用 endpoint） | `apps/api/src/routes/admin/attendance.ts` / `apps/api/src/use-cases/admin/import-attendance-bulk.ts` |
| bulk 選択前例 | `apps/web/src/components/admin/hooks/useSchemaDiffBulkSelection.ts` |
