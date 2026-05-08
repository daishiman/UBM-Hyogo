# Issue #549 post-switch 7 day close-out

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手 |
| 親 | `docs/30-workflows/issue-549-cf-audit-ml-production-switch/` |

## 1. なぜこのタスクが必要か（Why）

production switch は merge 時点では完了せず、7 日分の hourly evidence が揃うまで runtime PASS にできない。

## 2. 何を達成するか（What）

168 hourly snapshots、fallback rate、p95 latency、Issue 起票数 baseline 比較、leakage grep clean を揃え、`pass_runtime_synced` へ昇格する。

## 3. どのように実行するか（How）

`outputs/phase-11/evidence/hourly-run-7day.md` に run URL と observation JSON を集約し、SSOT を再同期する。

## 4. 実行手順

1. production switch merge 後の hourly run を 7 日分収集する。
2. fallback rate と leakage grep を日次確認する。
3. 7 日終端サマリを作成し、state を更新する。

## 5. 完了条件チェックリスト

- [ ] 168 snapshots が存在する。
- [ ] leakage grep が 7 日連続 clean。
- [ ] SSOT が `pass_runtime_synced` に更新済み。

## 6. 検証方法

Phase 11 evidence、GitHub Actions run URL、Issue 起票数 baseline 比較を確認する。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| false green | runtime PASS を 168 snapshots 後に限定 |

## 8. 参照情報

- `docs/30-workflows/issue-549-cf-audit-ml-production-switch/outputs/phase-12/implementation-guide.md`

## 9. 備考

Issue #549 は CLOSED 維持。PR 文脈は `Refs #549`。
