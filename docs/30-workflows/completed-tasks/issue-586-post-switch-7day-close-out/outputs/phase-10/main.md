# Phase 10 — 実装後検証 / Definition of Done

## DoD checklist（本サイクル / merge 前 = `implemented_local_runtime_pending`）

- [x] AC-1: production env で `vars.CF_AUDIT_CLASSIFIER=ml` 設定済み（gh api 実行記録あり）+ workflow が `vars.CF_AUDIT_CLASSIFIER` を参照
- [x] AC-2: `actions/upload-artifact@v4` 追加 / `retention-days: 8` / `name: hourly-snapshot-${{ github.run_id }}`
- [x] AC-3: hourly post-step に `secret-leakage-grep.ts --exit-on-detect` 組込み
- [x] AC-4: hourly post-step に `fallback-rate-alert.ts --threshold=0.05 --window=3` 組込み
- [x] AC-5: `.github/workflows/cf-audit-log-7day-summary.yml` 新規追加（schedule + workflow_dispatch + cross-run download + aggregation）
- [x] AC-6: `EXPECTED_SNAPSHOTS_7DAY` での件数検証（aggregate step 内で exit 1 化）
- [ ] AC-7: leakage grep 7 日連続 clean（D+7 evidence）
- [ ] AC-8: Issue 起票数 baseline 比較（D+7 evidence）
- [x] AC-9: SSOT 4 ファイル更新済み
- [x] AC-10: Phase 12 strict 7 outputs 配置（次 Phase 12 で実体作成）
- [x] AC-11: PR 本文に `Refs #549, Refs #586`（Phase 13 で適用）
- [x] AC-12: focused vitest 25/25 OK_FOCUSED
- [x] AC-13: typecheck / lint OK_LOCAL
- [x] AC-14 local evidence: typecheck / lint / focused test / build / grep gate OK
- [x] AC-14: Phase 11 local 5 evidence（typecheck / lint / test / build / grep-gate）
- [ ] AC-15: D+7 close-out コミット（時間経過依存）

## D1 schema diff

`apps/api/migrations/`: 0 ファイル変更（forward-safe 確認）。
