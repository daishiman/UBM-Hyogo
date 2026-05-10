# Unassigned Task Detection

## already_formalized

- `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-01.md` — 本タスクで formalize 済 → `docs/30-workflows/issue-586-post-switch-7day-close-out/` に昇格。再起票しない
- 親 #549 の `unassigned-task-detection.md` で formalize 済の FU-03-D-FOLLOWUP-02〜05 — 再リンクのみ
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-03-ml-anomaly.md` — 90 日 baseline / モデル学習・選定の親候補（別タスク）

## new_unassigned

本サイクル新規起票候補（D+7 runtime 結果依存のため、現時点では formalize しない）:

- `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-01-RECOVERY` — D+7 で snapshots 不足だった場合の 2 周目 7 日観測（再走 sub-task）
- `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-01-METRICS-DASH` — 7day summary 出力を可視化するダッシュボード（FU-03-D-FOLLOWUP-03 Slack 通知と重複しない範囲）

> 本サイクルでは skill feedback の defer は解消済み（`phase-template-phase11.md` / `phase-12-documentation-guide.md` / LOGS に same-wave 反映）。`new_unassigned` 2 件は D+7 runtime 異常が発生した場合に初めて実体化する条件付き recovery / dashboard 候補であり、今回の実装完了を阻害する未タスクではない。
