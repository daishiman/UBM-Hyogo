# Phase 12 Main — Issue #749 Primitive Adoption Tracker

## 目的

Phase 11 local evidence と Phase 12 strict 7 outputs を同期し、Issue #749 の primitive adoption tracker を `implemented_local_evidence_captured` として閉じる。commit / push / PR / required-check promotion は Phase 13 user-gated。

## 7 outputs map

| # | ファイル | 状態 |
| --- | --- | --- |
| 1 | `main.md`（本ファイル） | completed |
| 2 | `implementation-guide.md` | completed |
| 3 | `phase12-task-spec-compliance-check.md` | completed |
| 4 | `system-spec-update-summary.md` | completed |
| 5 | `skill-feedback-report.md` | completed |
| 6 | `unassigned-task-detection.md` | completed |
| 7 | `documentation-changelog.md` | completed |

## サマリ

本タスクは parallel-09 で配置済みの 6 primitive 群を completed SCOPE の 19 routes に採用させる tracking task。実装は `apps/web`、`scripts/verify-primitive-adoption.sh`、`.github/workflows/verify-primitive-adoption.yml` に反映済み。

## 検証結果

- [x] Phase 12 strict 7 path existence pre-check: 7/7 present
- [x] `bash scripts/verify-primitive-adoption.sh`: PASS
- [x] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck`: PASS
- [x] focused Vitest 9 files / 144 tests: PASS
- [x] `apps/` 実差分ありを `implemented_local_evidence_captured` へ再分類
- [x] visual harness screenshot: captured（FormField / Breadcrumb / EmptyState / Pagination）
- [x] authenticated admin runtime screenshot: pending_user_approval（資格情報・seed 依存のため Phase 13 以降 user-gated）
