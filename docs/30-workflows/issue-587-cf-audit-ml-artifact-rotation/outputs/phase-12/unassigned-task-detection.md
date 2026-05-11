# Unassigned Task Detection — Issue #587

## already_formalized

| ID / path | 説明 |
| --- | --- |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-02.md` | 本タスク #587 の起票元。本仕様書で formalize 済み。重複起票しない |

## new_unassigned（4 件）

| ID | タイトル | 起票先 path |
| --- | --- | --- |
| U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-A | 次世代 ML model 学習・選定（artifact 自体の再学習） | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-02-a.md` |
| U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-B | 自動 rotation スケジューラ（cron / scheduled workflow による定期 canary） | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-02-b.md` |
| U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-C | rotation evidence の長期保管（artifact retention 90 日 → R2 への copy） | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-02-c.md` |
| U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-02-D | candidate path の op vault entry 自動 lifecycle（promotion 後 PROD → PREVIOUS 自動退避） | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-fu-02-d.md` |

各エントリのテンプレ必須 4 セクション（苦戦箇所 / リスクと対策 / 検証方法 / スコープ）を同 same-wave で実体起票済み。

## 重複防止

- 親 #549 phase-12 で起票済みの `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FOLLOWUP-01`（7 日完走 close-out）は本タスクで再起票しない
- `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FOLLOWUP-03`（Slack / メール通知拡張）は親 #549 起票済み。本タスクで再起票しない
- `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FOLLOWUP-04`（Gate metadata 構造化）/ `FOLLOWUP-05`（evidence path 予約フォーマット）は親 #549 起票済み。本タスクで参照のみ
