# unassigned task detection

## 検出結果
本タスク完了時点で、対応することで問題が生じる恐れのある **大きな未タスクは検出されない**。
以下は本タスクスコープ外として明示的に除外した項目で、必要時に別 unassigned-task として起票する。

| 項目 | 状態 | 起票要否 |
| --- | --- | --- |
| Logpush API の有料 plan 契約後の実取得 | 制限により本タスクで取得せず | 必要時起票 (現状の dashboard fallback で運用可) |
| shellcheck の CI 自動実行 | CI 未整備 | 全 shell script の品質を上げるなら別タスクで `pnpm lint:shell` 整備を検討 |
| staging 環境の同等 diff | スコープ外 (production diff のみ) | 必要時起票 |
| 旧 Worker (`ubm-hyogo-web`) 物理削除 | スコープ外 (read-only) | UT-06-FU-A-PROD-ROUTE-SECRET-001 完了時の運用判断に委ねる |

## 結論
新規 unassigned task の起票なし。
