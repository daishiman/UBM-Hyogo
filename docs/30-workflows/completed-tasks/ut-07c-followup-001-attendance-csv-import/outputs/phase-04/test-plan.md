# Phase 4 — テスト作成 (RED) — test-plan.md

## 物理作成した test ファイル

| パス | 種別 |
| --- | --- |
| `apps/api/src/routes/admin/attendance-import.contract.spec.ts` | route contract |
| `apps/api/src/use-cases/admin/__tests__/import-attendance-bulk.spec.ts` | service unit |
| `apps/web/app/(admin)/admin/meetings/[id]/__tests__/AttendanceCsvImportPanel.spec.tsx` | UI 単体 |
| `apps/web/src/lib/csv/__tests__/parse-attendance.spec.ts` | CSV parse 単体（補強用） |

> 注意: CLAUDE.md 不変条件 8 に従い `*.spec.ts` / `*.spec.tsx` 規約を遵守。`*.test.*` は使用しない。

## ケース一覧

| # | ファイル | ケース | 期待 |
| --- | --- | --- | --- |
| 1 | contract | dry-run 成功 | 200 + summary、`member_attendance` 0 件、`audit_log` 0 件 |
| 2 | contract | commit 成功 | 200 + `audit_log` row 2 件、`member_attendance` 2 件 |
| 3 | contract | 501 行 | 413 `payload_too_large` |
| 3b | contract | 500 行ちょうど | 200（route の 413 分岐を発火させない） |
| 4 | contract | 未認証 | 401 |
| 5 | contract | non-admin | 403 |
| 5b | contract | session 未存在 | 404 `session_not_found` |
| 5c | contract | invalid JSON | 400 |
| 5d | contract | deleted_member 含む CSV preview | status=`deleted_member` |
| 5e | contract | 1 行でも非 ok があれば commit insert なし | `committed=false`、attendance 0 |
| 6 | service | duplicate 検出 | status=`duplicate` |
| 7 | service | deleted_member 検出（commit でも insert なし） | committed=false、appended=0 |
| 8 | service | unknown_member | status=`unknown_member` |
| 9 | service | invalid (どちらも空) | status=`invalid`, message=`memberId_or_email_required` |
| 9b | service | memberId と email mismatch | status=`invalid`, message=`memberId_email_mismatch` |
| 10 | service | 成功行数 == audit_log 件数 | ok=2 + appended.length=2 |
| 11 | service | dry-run 副作用なし | D1 write 0 / appended=0 |
| - | service | session 未存在 | `SessionNotFoundError` throw |
| 12 | UI | upload→preview 遷移 | step-preview render |
| 13 | UI | preview→confirm | 2nd fetch が `dryRun=false` |
| 14 | UI | 413 受信時 | step-error render「500」を含む |

## mock 戦略

- D1: `setupD1()` が provide する in-memory Miniflare D1。実 SQL を流す
- `requireAdmin`: `adminAuthHeader()` で本物の JWT を sign（`AUTH_SECRET` test 用）
- service unit: `AuditLogProvider` を `vi.fn` で fake 化、append 履歴を assertion に利用
- UI: `global.fetch` を `vi.fn` で mock。`File.text()` は jsdom 環境向けに per-instance で stub

## RED → GREEN 状態

- Phase 4 完了時点: テストファイルは物理作成済。Phase 5 で対象実装を入れた直後に GREEN 化することを確認する
- 本ワークフローでは Phase 5 と Phase 4 を密接にした TDD で進める（route handler / service / UI / repo addition を一気に整合）
