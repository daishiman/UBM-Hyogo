# Phase 10: 最終レビュー

## GO/NO-GO 判定: GO（local implementation 済み・runtime gate 待ち）

## acceptance criteria 充足見込み

| AC | 充足手段 | 判定 |
| --- | --- | --- |
| AC-1 | Reporting-Endpoints / Report-To ヘッダ set | GO |
| AC-2 | CSP_REPORT_GROUP 単一定数 | GO |
| AC-3 | report-uri 併記 | GO |
| AC-4 | reportEndpoint 未設定で未出力 | GO |
| AC-5 | getPublicEnv 経由のみ | GO |
| AC-6 | apps/api / D1 不変 | GO |
| AC-7 | runbook 文書化 | GO |

## blocker 確認

| 候補 blocker | 状態 |
| --- | --- |
| 受信先未定 | 解消（Sentry CSP endpoint 確定） |
| 実 Sentry URL の払い出し | 実装時に Sentry プロジェクト設定で取得（公開値）。仕様化は完了 |
| 不変条件抵触 | なし（apps/web のみ） |

## 残課題（scope out / 後続）

- CSP enforce 切替（U-AWSHH-001）= 本タスク完了後に着手。
- 内製受信（apps/api + D1）= 不採用。必要になれば別タスク。

## 次フェーズ引き継ぎ

Phase 11 で staging 到達確認手順とプライバシーレビューを実施する（実行時）。
