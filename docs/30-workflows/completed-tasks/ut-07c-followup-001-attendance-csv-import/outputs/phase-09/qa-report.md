# Phase 9 — QA Report

## 実行コマンド & 結果

| コマンド | 結果 |
| --- | --- |
| `mise exec -- pnpm typecheck` | PASS（apps/api / apps/web / packages/* 全 Done） |
| `mise exec -- pnpm lint` | PASS（apps/api / apps/web / packages/* 全 Done） |
| `mise exec -- pnpm --filter @ubm-hyogo/api test` | PASS — 318 passed in 49 files |
| `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.d1.config.ts apps/api/src/routes/admin/attendance-import.contract.spec.ts` | PASS — 10 passed |
| `mise exec -- pnpm --filter @ubm-hyogo/web test` | PASS — 633 passed / 1 skipped in 92 files |

## 追加 spec の最終件数

| spec | 件数 |
| --- | --- |
| `apps/api/src/routes/admin/attendance-import.contract.spec.ts` | 10 |
| `apps/api/src/use-cases/admin/__tests__/import-attendance-bulk.spec.ts` | 12 |
| `apps/web/app/(admin)/admin/meetings/[id]/__tests__/AttendanceCsvImportPanel.spec.tsx` | 5 |
| `apps/web/src/lib/csv/__tests__/parse-attendance.spec.ts` | 6 |
| 合計 | 33 |

## 不変条件 / セキュリティ チェック

| 項目 | 状態 |
| --- | --- |
| CLAUDE.md 不変条件 5（apps/web から D1 直接アクセスなし） | 維持（fetch 経由のみ） |
| 不変条件 8（`*.spec.{ts,tsx}` 命名） | 維持 |
| email 正規化（NFKC + trim + lowercase）の単一実装 | `apps/api/src/lib/email.ts` に集約 |
| 部分コミット禁止（commit && every(ok) のみ insert） | 維持 |
| audit_log per-success-row | 維持（service case#10 で件数整合確認） |
| 500 行上限 | route handler で 413 を先行返却 |
| auth: requireAdmin / non-admin / unauth | contract case#4 / #5 で網羅 |
| 大文字 email / 全角 email | parse / service の F5 で正規化確認 |

## 既知の制約

- D1 batch insert は sequential prepare/bind/run（既存 attendance route の単発 insert と同じ scheme）。chunk size 80 は `ATTENDANCE_BIND_CHUNK_SIZE` 定数。
- VISUAL evidence (Phase 11) は手動 admin login が必要なため、本 task では skeleton のみ作成し、実際の screenshot は Gate-C で別途取得する。

## 判定

Gate-B（implementation review）通過条件である「typecheck / lint / test 全 GREEN + 仕様適合」を満たす。
