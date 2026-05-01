# Phase 11 出力: 手動 smoke サマリ

## 1. NON_VISUAL 判定と screenshot N/A 根拠

- 本タスクは `metadata.docs_only = true`、`metadata.visualEvidence = "NON_VISUAL"`、`metadata.workflow_state = "spec_created"`
- 09b は Workers Cron Triggers の正本仕様 / 監視 placeholder / runbook を docs として固定するタスクで、コード / wrangler.toml の実体変更を伴わない
- ランタイム挙動の実測は **09a（staging deploy）/ 09c（production deploy）** または別 task に委譲する
- 結論: **screenshot は不要（N/A）**。代わりに「実行予定コマンド」と「期待出力」を `manual-smoke-log.md` にテンプレ形式で残す

## 2. 本 Phase の成果物

| ファイル | 内容 |
| --- | --- |
| `main.md` | 本 summary |
| `manual-smoke-log.md` | cron triggers list / rollback / sync_jobs 確認 SQL の実行予定テンプレ |
| `link-checklist.md` | 6 dashboard URL placeholder + 09a / 09c 引き渡しリンク |

## 3. manual evidence checklist（NON_VISUAL）

- [x] screenshot N/A 根拠（本セクション 1）
- [x] cron triggers list の実行予定コマンド（manual-smoke-log § 1）
- [x] rollback / rollforward 手順（manual-smoke-log § 2）
- [x] 6 dashboard URL placeholder（link-checklist）
- [x] sync_jobs SELECT 実行予定 SQL（manual-smoke-log § 3）
- [x] attendance 重複確認 SQL（manual-smoke-log § 4、不変条件 #15）
- [x] runbook 走破 checklist（manual-smoke-log § 5: cron-deployment / release / incident）

## 4. 09a / 09c との連携

| 連携先 | 内容 |
| --- | --- |
| 09a（同 wave 並列） | staging URL / sync_jobs id 整合性確認。09a の Phase 11 outputs を参照し、本 link-checklist で URL を verify |
| 09c（下流） | rollback 手順の信頼性を引き渡す。9c Phase 1 で本 manual-smoke-log の実行予定コマンドが `bash scripts/cf.sh` 経由で動作することを確認 |

## 5. 不変条件への対応

- #5: rollback 試走で apps/web 経由 D1 操作なし（manual-smoke-log § 2 の rollback 手順は apps/api 経由のみ）
- #10: dashboard で staging req 数を確認（link-checklist の ANALYTICS_URL_API_STAGING を click）
- #15: rollback 後 attendance 整合性 SQL を manual-smoke-log § 4 に明記

## 6. 完了条件

- [x] NON_VISUAL 判定と根拠
- [x] manual-smoke-log.md
- [x] link-checklist.md
- [x] runbook 走破 checklist（manual-smoke-log § 5）

## 7. 次 Phase への引き継ぎ

- Phase 12 で release-runbook / incident-response-runbook 最終版作成時、本 evidence を「過去実績テンプレ」として参照
- Phase 13 PR 作成時、本 manual-smoke-log を change-summary に link
