# ADR: runtime-smoke-staging を required status check に昇格させる判断条件

- Status: Accepted（本サイクルでは optional のまま、30 日連続 PASS 後に再評価）
- Date: 2026-05-08
- Related: Issue #571 / ADR-runtime-smoke-secret-injection

## Context

`runtime-smoke-staging` は staging deploy 後に attendanceProvider runtime contract を回帰検出する CI gate である。本 ADR は **required status check に昇格させるかどうか** を扱う。required にすれば PR は smoke PASS 無しで merge できなくなり、品質ゲートが強化される一方、偽陽性 / staging 側の一時障害で merge queue を全停止させるリスクが発生する。

## Decision

**本サイクルでは optional**（required にしない）。

- branch protection の `required_status_checks` に `runtime-smoke-staging` を追加しない
- `dev` / `main` ブランチ保護設定は現行維持（CLAUDE.md「ブランチ戦略」に整合）

## Promotion criteria（昇格条件）

以下 3 点を **全て** 満たした時点で再評価する:

1. **30 日連続 PASS**: staging への dev push 由来の smoke run が 30 日間 1 件も failure していない
2. **failure 偽陽性率 < 2%**: staging 一時障害 / 外部依存 timeout など、コード起因でない failure が 30 日累計で 2% 未満
3. **redaction grep gate violation 0**: artifact / Slack post / workflow log に secret leak 候補が 30 日間 0 hit

## Escape valve（偽陽性回避）

- dev push の head commit message に `[skip runtime-smoke]` を含めた場合、`backend-ci.yml` の `runtime-smoke-staging` reusable workflow call を skip する。merge queue では非推奨だが、staging 障害時の緊急 merge 経路として残す
- `workflow_dispatch` で手動再実行が常に可能

## Rollback Conditions

required 昇格後に以下のいずれかが発生したら即時 optional へ戻す:

- staging 一時障害で merge queue を 1 時間以上 block
- 偽陽性率 > 5%/週

## Notes

- 30 日 PASS 観測は別サイクルの G5（promotion-ready gate）で実施
- production 環境への smoke 自動実行は **staging required 昇格後** に別 Issue として起票
