# Phase 06 — 異常系検証 (実行結果)

[実装区分: 実装仕様書]

## 状態

`PENDING_RUNTIME_EXECUTION` — 異常系シナリオの机上評価は spec_created で完了。runtime での実発生時は
本ファイルに事象 / 対応 / 結果を追記する。

## 異常系評価結果（机上）

| ID | シナリオ | 期待動作 | 評価 |
| --- | --- | --- | --- |
| E-01 | Workers cutover が rollback された | 削除中止・dormant 期間 reset | DESIGNED (runbook 停止条件 #1) |
| E-02 | custom domain attachment 残存 | 削除前に detach、不可なら中止 | DESIGNED (runbook 停止条件 #2) |
| E-03 | Cloudflare API token 401 | exit code 伝播 → 削除中止 → token 再取得 | DESIGNED (scripts/cf.sh の set -euo pipefail で伝播) |
| E-04 | Pages project not found | pre-flight Step 1 のリストで project name 再確認 | DESIGNED (runbook Step 1) |
| E-05 | 削除コマンド部分成功 | 中間状態を redacted で記録 → smoke 先行 → user 再承認 | DESIGNED (runbook 「部分成功時のリカバリ」) |
| E-06 | 観察期間中の Workers 5xx 率超過 | 削除中止・閾値 5xx>0.5% 24h 連続 | DESIGNED (runbook 停止条件 #3 と dormant-period-log.md) |
| E-07 | redaction check で 1 件以上検出 | commit 前修正 → 再 grep 0 件 | DESIGNED (Phase 9 redaction gate) |
| E-08 | user 承認文言なし | 削除中止・承認再依頼 | DESIGNED (runbook 停止条件 #4) |

## 停止条件 (runbook 転記済み)

1. Workers cutover 完了 evidence なし / rollback 済み
2. custom domain attachment 空状態が確認できていない
3. dormant 観察期間 ≥ 2 週間が完了していない
4. user 明示承認文言が記録されていない
5. redaction check が 0 件で PASS していない

## 部分成功時のリカバリ方針 (runbook 転記済み)

1. `bash scripts/cf.sh pages project list` で現状取得 → `deletion-evidence.md` に追記
2. Workers production smoke を先行実行
3. user に状態提示 → 再承認を得てから次手順
4. 自動 retry は禁止

## 残課題

- runtime で実発生した異常系は本ファイル末尾に「事象 / 対応 / 結果」3 列で追記する
