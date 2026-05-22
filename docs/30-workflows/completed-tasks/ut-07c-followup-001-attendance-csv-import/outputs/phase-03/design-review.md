# Phase 3 — 設計レビュー

## GO / NO-GO 判定

**GO** — Phase 4 (RED テスト作成) に進入する。

## 判定根拠

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| API surface 確定 | OK | `POST /admin/meetings/:sessionId/attendance/import?dryRun=` + zod schema 確定 |
| service signature | OK | `importAttendanceBulk(db, sessionId, rows, options)` で型決定 |
| UI state machine | OK | 6 状態以下 (`idle/parsing/preview/confirming/done/error`) |
| 不変条件 5（apps/web から D1 直アクセス禁止）| OK | CSV parse はクライアント、D1 access は `apps/api` 経由のみ |
| 不変条件 8（`*.spec.ts` 強制）| OK | test ファイル 3 本すべて `*.spec.{ts,tsx}` |
| 既存 UT-07C endpoint surface | OK | 単一 add/remove 経路は **変更しない**（新規追加のみ） |
| 親タスク状態 | OK | UT-07C 単一 add/remove + audit_log は実装済 |

## 依存マトリクス

| 依存元 | 依存先 | 状態 |
| --- | --- | --- |
| 本タスク | `apps/api/src/repository/attendance.ts` 既存 | 追加 export のみ。既存関数変更なし |
| 本タスク | `apps/api/src/repository/auditLog.ts` (`AuditLogProvider`) | 既存 interface を再利用。変更なし |
| 本タスク | `apps/api/src/middleware/require-admin.ts` | 既存。変更なし |
| 本タスク | `apps/api/src/middleware/repository-providers.ts` (`writeTagNoteProviderMiddleware`) | 既存。変更なし |
| 本タスク | `apps/web/app/(admin)/admin/meetings/[id]/page.tsx` | 1 component 追加のみ |

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| D1 batch 部分失敗（chunk 単位で 1 つ失敗） | dry-run は副作用なし。commit は **全行 preflight ok の場合のみ** insert に進む。chunk 単位の例外は service が re-throw して route が 500 化、UI は再試行可能として表示 |
| audit_log の件数不整合 | 「成功行 == audit_log row 数」を Phase 4 case#10 で test 担保 |
| papaparse bundle size 増 | gzipped ~45KB。Phase 7 で web build を実行し regressions の有無を coverage-report.md に記録（絶対閾値は本タスクでは設定しない） |
| 500 行超過時のクライアント UX | クライアント側で 500 警告 + API 側 413 の 2 段防御 |
| email 大文字小文字 / 全角差 | service / parse 両方で NFKC + lowercase 正規化 |
| `memberId` と `email` が別 member を指す不整合 | `invalid` + `message='memberId_email_mismatch'` で明示分類（Phase 4 case#9b） |
| deleted_member の誤登録 | `member_status.is_deleted = 1` → `deleted_member` 分類で reject。Phase 4 case#7 / Phase 6 F11 で担保 |

## Gate-A 通過判定

`evidence_path = outputs/phase-03/design-review.md` を Gate-A の evidence として採用する。Phase 4 進入条件 (設計確定 + GO 判定) を満たすため、本ファイル commit と同時に Gate-A 通過と扱う。

## 残課題（Phase 4 以降で扱う）

- Phase 5: `apps/web/package.json` に `papaparse` / `@types/papaparse` を `dependencies` / `devDependencies` として追加
- Phase 7: web build / bundle check
- Phase 11: VISUAL evidence 4 screenshot を localhost で取得
- Phase 12: `docs/00-getting-started-manual/specs/01-api-schema.md` admin endpoint 表に新 endpoint 追記
