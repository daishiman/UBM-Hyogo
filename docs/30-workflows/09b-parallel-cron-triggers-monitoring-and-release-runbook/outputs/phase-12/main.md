# Phase 12 出力: ドキュメント更新 サマリ

## 1. 目的

cron schedule の正本仕様、release runbook 最終版、incident response runbook 最終版、skill 必須 7 成果物を `outputs/phase-12/` に閉じ、09c へ引き渡せる状態にする。

## 2. 成果物 10 件

| # | ファイル | 種別 | 用途 |
| --- | --- | --- | --- |
| 1 | `main.md`（本ファイル） | サマリ | Phase 12 全体のナビ |
| 2 | `release-runbook.md` | ランブック（最重要） | go-live + rollback + cron 制御 + dashboard URL |
| 3 | `incident-response-runbook.md` | ランブック（最重要） | initial / escalation / postmortem |
| 4 | `runbook-diff-plan.md` | 計画 | same-wave / downstream / UT21-U05 分離 |
| 5 | `implementation-guide.md` | 実装ガイド | Part 1 中学生レベル + Part 2 開発者レベル |
| 6 | `system-spec-update-summary.md` | spec 差分提案 | references/* への昇格候補 |
| 7 | `documentation-changelog.md` | 変更履歴 | 09b で追加/更新/削除した doc |
| 8 | `unassigned-task-detection.md` | 未割当 | Sentry / Logpush / Slack / postmortem テンプレ自動化 |
| 9 | `skill-feedback-report.md` | ノウハウ | 学んだこと / 改善提案 / 不要だった作業 |
| 10 | `phase12-task-spec-compliance-check.md` | 不変条件 #1-#15 | 各不変条件の判定 |

## 3. 09c 引き渡し記録

- 09c-serial-production-deploy-and-post-release-verification の Phase 1 で `release-runbook.md` を参照
- 09c の Phase 5 production deploy 中で `rollback-procedures.md` + `cron-deployment-runbook.md` を参照
- 09c の Phase 11 で `incident-response-runbook.md` の postmortem template を将来参照

## 4. 同 wave 09a への通知

- 09a の Phase 12 で本 release-runbook の dashboard URL に staging 実 URL を埋める準備が整ったことを通知
- DRY 化された env var 命名規則（`ANALYTICS_URL_API_*` 等）が 09a / 09c で一致

## 5. 不変条件 #1-#15 PASS check

詳細は `phase12-task-spec-compliance-check.md` 参照。

| 不変条件 | 判定（要点のみ） |
| --- | --- |
| #1〜#4 | 09b は cron / runbook 担当のため schema / consent / responseEmail / 本人本文には触れない（PENDING または PASS）|
| #5 | rollback 手順に apps/web 経由 D1 操作なし（PASS） |
| #6 | cron 設計が Workers Cron Triggers のみ（PASS） |
| #7〜#9 | 09b は ID 解釈 / localStorage / `/no-access` 設計外（PASS） |
| #10 | cron 121 req/day < 100k（PASS） |
| #11〜#14 | 09b は admin 編集 / view model / queue / schema endpoint 設計外（PASS） |
| #15 | rollback 後 attendance 整合性 SQL 必須（PASS） |

## 6. 完了条件

- [x] skill 必須 7 成果物（5〜10）配置
- [x] 09b 固有 runbook 3 件（2: release / 3: incident / 4: diff plan）配置
- [x] 不変条件 #1-#15 PASS check
- [x] 09c 引き渡し記録あり

## 7. 次 Phase（13）への引き継ぎ

- Phase 13 PR 作成は **ユーザー承認必須**（artifacts.json `user_approval_required: true`）
- 本 Phase 12 で完成した成果物一式を change-summary に link

> **注意**: 本タスクの執行ポリシーに従い Phase 13 は実行しない。
