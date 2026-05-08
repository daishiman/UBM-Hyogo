# Unassigned Task Detection

## 判定

新規未タスク 4 件。理由はいずれも外部依存 Gate 待ちであり、今回サイクルで完了させると production 観測・モデル選定・本番切替の整合性が破綻する。

| ID | 理由 | 実施時期 | 場所 |
| --- | --- | --- | --- |
| U-FIX-CF-ACCT-01-DERIV-04-FU-03-A | 90 日 threshold baseline runtime 観測待ち | Issue #408 hourly run 90 日後 | `docs/30-workflows/unassigned-task/issue-515-90day-baseline-observation.md` |
| U-FIX-CF-ACCT-01-DERIV-04-FU-03-B | redacted production feature export は Gate-A 後でないとデータ不足 | Gate-A 達成後 | `docs/30-workflows/unassigned-task/issue-515-redacted-feature-export.md` |
| U-FIX-CF-ACCT-01-DERIV-04-FU-03-C | ML モデル選定は 90 日 dataset が必要。2026-05-08 に Issue #548 workflow として仕様化済み | Gate-A/B/C 判定後 | successor: `docs/30-workflows/issue-548-ml-model-selection/` |
| U-FIX-CF-ACCT-01-DERIV-04-FU-03-D | production switch は model artifact と rollback approval が必要 | offline replay 勝利後 | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-production-classifier-switch.md` |
