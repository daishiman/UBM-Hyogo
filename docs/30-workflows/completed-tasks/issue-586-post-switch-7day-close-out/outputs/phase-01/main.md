# Phase 1 — 要件定義 / Gate 整理 / 真の論点

## 真の論点

Issue #549 production switch の close-out として、3 段昇格（`implemented_local_runtime_pending` → `pass_boundary_synced_runtime_pending` → `pass_runtime_synced`）を成立させる。本サイクルでは:

1. Issue #518 HOLD 解除 + hourly schedule 復活
2. hourly post-step 3 点組み込み（leakage grep / fallback rate alert / artifact upload）
3. `cf-audit-log-7day-summary.yml` 新規（168 hourly snapshots aggregation）
4. SSOT 4 ファイル昇格反映
5. production env で `vars.CF_AUDIT_CLASSIFIER=ml` 設定

7 日 evidence 取得は時間経過依存のため close-out コミットで追加する 2 段構成。

## Gate

| Gate | 本サイクル状態 |
| --- | --- |
| Gate-RUNTIME-CLASSIFIER-SET | 通過（`gh api` 経由で production env に `CF_AUDIT_CLASSIFIER=ml` 設定済み） |
| Gate-RUNTIME-7DAY | 未通過（merge 後 168 hour 経過待ち） |
| Gate-LEAKAGE-CLEAN-7DAY | 未通過（時間経過依存） |
| Gate-FALLBACK-RATE | 未通過（時間経過依存） |
