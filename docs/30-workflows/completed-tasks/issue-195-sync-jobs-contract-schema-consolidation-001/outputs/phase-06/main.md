# Phase 6 — ADR 追記 + owner 表行追加 + 参照リンク追記

## 完了確認
- `_design/sync-jobs-spec.md` に「ADR-001 runtime SSOT 配置」追加（Status: Accepted / Decision: apps/api 維持）
- §2 / §3 / §5 に owner 表（`sync-shared-modules-owner.md`）への 1-hop 参照追加
- §9 変更履歴に 2026-05-04 行追加
- `_design/sync-shared-modules-owner.md` に alias 行 + owner 表行追加（owner: 03a / co-owner: 03b）+ 解消済み未割当節追加

## grep evidence
- `rg -n "ADR-001 runtime SSOT 配置" docs/30-workflows/_design/sync-jobs-spec.md` → L23
- `rg -n "sync-jobs-schema\.ts" docs/30-workflows/_design/sync-shared-modules-owner.md` → L9, L18
- `rg -n "sync-shared-modules-owner" docs/30-workflows/_design/sync-jobs-spec.md` → L53 / L68 / L74 / L122
