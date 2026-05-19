# Phase 1 — 要件定義

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07C-FU-001 |
| GitHub Issue | #312 |
| 親タスク | UT-07C (meeting attendance 単一 add/remove + audit_log) |
| 作成日 | 2026-05-18 |

## ゴール

admin が CSV upload で大量の meeting attendance を、`upload → dry-run preview → confirm` の 3 ステップ wizard で一括登録できるようにする。誤投入を防ぐため行別エラー (`ok` / `duplicate` / `deleted_member` / `unknown_member` / `invalid`) を preview 段階で可視化し、commit 経路では成功行ごとに audit_log を 1 record 出力する。

## スコープ

### 含む

| # | 項目 |
| --- | --- |
| 1 | `apps/api/src/routes/admin/attendance.ts` への新 endpoint `POST /admin/meetings/:sessionId/attendance/import` 追加 |
| 2 | query `dryRun=true|false` 切替 |
| 3 | `apps/api/src/use-cases/admin/import-attendance-bulk.ts` 新規 service |
| 4 | `apps/api/src/repository/attendance.ts` への `listExistingAttendanceMemberIds` 追加 |
| 5 | 行別判定 5 種 (`ok` / `duplicate` / `deleted_member` / `unknown_member` / `invalid`) |
| 6 | audit_log 統合: 成功行ごと `action='attendance.import.add'` 1 record |
| 7 | D1 batch insert を `ATTENDANCE_BIND_CHUNK_SIZE = 80` で分割 |
| 8 | import 上限 500 行 / 超過 413 |
| 9 | admin UI 3 ステップ wizard (`AttendanceCsvImportPanel.tsx`) |
| 10 | CSV parse はクライアント側 (`papaparse`)、API は parse 済 JSON 配列を受ける |
| 11 | 既存 `MeetingAttendancePanel` sibling 配置 (既存 panel は変更しない) |
| 12 | email lookup の NFKC + lowercase 正規化 |
| 13 | `memberId` と `email` 同時指定時の mismatch を `invalid` + `memberId_email_mismatch` で表す |

### 含まない

| # | 項目 |
| --- | --- |
| 1 | 新 D1 schema / 新テーブル |
| 2 | Google Form schema 変更 |
| 3 | 単一 add/remove endpoint の挙動変更 (後方互換維持) |
| 4 | attendance 一括 **削除** API |
| 5 | multipart/form-data によるサーバ側 CSV parse |
| 6 | 親 UT-07C の AC 再検証 |

## 既存 endpoint surface inventory (apps/api/src/routes/admin/attendance.ts)

| Method | Path | 目的 |
| --- | --- | --- |
| GET | /admin/meetings/:sessionId/attendance/candidates | 出席候補リスト |
| POST | /admin/meetings/:sessionId/attendance | 単一 add (201 / 409 / 422 / 404) |
| DELETE | /admin/meetings/:sessionId/attendance/:memberId | 単一 remove (200 / 404) |

本タスクで上記 3 endpoint は **変更しない**。新規 4 つ目として `POST /admin/meetings/:sessionId/attendance/import` を追加する。

## 命名規則

| 種別 | 規則 | 例 |
| --- | --- | --- |
| TypeScript symbol | camelCase | `importAttendanceBulk` / `listExistingAttendanceMemberIds` |
| ファイル名 (apps/api) | kebab-case | `import-attendance-bulk.ts` |
| ファイル名 (apps/web component) | PascalCase | `AttendanceCsvImportPanel.tsx` |
| ファイル名 (apps/web lib) | kebab-case | `parse-attendance.ts` |
| test ファイル | `*.spec.ts` / `*.spec.tsx` (CLAUDE.md 不変条件 8) | `attendance-import.contract.spec.ts` |
| audit_log action | `<domain>.<action>` | `attendance.import.add` |

## implementation_mode 判定

`new`。既存に bulk import service / route / UI のいずれも存在しないため。

## タスク分類

`implementation / VISUAL`。admin UI の 3 ステップ wizard が新規追加されるため Phase 11 で VISUAL evidence (4 screenshot) を取得する。

## 非機能要件

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| import 上限 | 500 行 | メモリ上突合 / Worker CPU budget |
| dry-run latency | p95 < 2s | 500 行 + lookup ≦ 4 D1 query |
| commit latency | p95 < 4s | + chunk insert (`ATTENDANCE_BIND_CHUNK_SIZE = 80`) |
| 可観測性 | audit_log 件数 == 成功行数 | Phase 4 case#10 で test 担保 |
| エラー応答 | 401 / 403 / 413 / 400 / 500 | AC-4 |

## 不変条件

1. 親 UT-07C の単一 add/remove API surface を破壊しない
2. CLAUDE.md 不変条件 5 (apps/web から D1 直接アクセス禁止)
3. CLAUDE.md 不変条件 8 (`*.spec.{ts,tsx}` のみ)
4. CLAUDE.md `apps/web` env 参照は `getEnv()` 経由のみ
5. UI prototype alignment workflow の「新 endpoint 追加禁止」制約は本タスクには適用されない（別系統）
