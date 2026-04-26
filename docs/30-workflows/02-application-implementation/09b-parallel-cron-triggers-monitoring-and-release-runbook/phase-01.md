# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

「Workers Cron Triggers の正本定義」「監視 placeholder 配置」「release runbook + incident response runbook + rollback 手順」を 1 タスクで束ねる単一責務を、09a（staging deploy）と 09c（production deploy）から分離した上で固定する。

## 実行タスク

1. 上流（08a 契約 / 08b E2E / 05a observability）からの引き継ぎ確認
2. cron schedule の正本（`*/15` + `0 3`）と二重起動防止の仕様引用
3. release runbook と incident response runbook の章立てを scope 化
4. 09a で得られる staging URL / sync_jobs id を release runbook に取り込む経路を設計
5. 09c へ release runbook を渡す通路を設計

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/_design/phase-2-design.md | Wave 9b scope / AC |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | cron schedule 正本 |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | sync_jobs running 確認 / 部分失敗運用 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | 無料枠 |
| 参考 | docs/05a-parallel-observability-and-cost-guardrails/ | observability placeholder |

## 実行手順

### ステップ 1: 上流 AC 引き継ぎ確認
- 08a の sync API contract test 結果
- 08b の Playwright で sync 後の dashboard 表示確認
- 05a (infra) の Cloudflare Analytics URL placeholder

### ステップ 2: 真の論点と依存境界
- 真の論点を `outputs/phase-01/main.md` に記述
- 依存境界: 09a / 09b / 09c の重複なし

### ステップ 3: 4 条件判定 + open question

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | scope を Mermaid + cron schedule design に展開 |
| Phase 4 | verify suite に sync_jobs 二重起動防止を含める |
| Phase 7 | AC matrix の base |
| Phase 10 | GO/NO-GO 判定の根拠 |
| 並列 09a | staging URL / sync_jobs id を release runbook に流用 |
| 下流 09c | release runbook を production deploy で使用 |

## 多角的チェック観点（不変条件）

- 不変条件 #5: rollback 手順で apps/web に D1 操作を含めない設計
- 不変条件 #6: cron 定義は Workers Cron Triggers のみ（GAS apps script trigger 不採用）
- 不変条件 #10: cron 頻度試算で 100k req/day 内
- 不変条件 #15: rollback 時に attendance データ整合性保持

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC 引き継ぎ確認 | 1 | pending | 08a/08b/05a (infra) |
| 2 | scope と依存境界の確定 | 1 | pending | 09a/09c との境界 |
| 3 | AC リストアップ | 1 | pending | AC-1〜AC-9 |
| 4 | 4 条件 仮判定 | 1 | pending | Phase 10 で確定 |
| 5 | open question 列挙 | 1 | pending | Phase 3 へ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | scope / 真の論点 / 4 条件 / open question |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 完了条件

- [ ] AC 9 件が記述
- [ ] 上流 AC 引き継ぎ状況が記載
- [ ] 4 条件が仮判定済み
- [ ] open question 3 件未満

## タスク100%実行確認【必須】

- 全実行タスクが completed
- main.md 配置済み
- artifacts.json の phase 1 を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: scope / AC / 4 条件 / open question
- ブロック条件: 上流 AC 未達 5 件以上で NO-GO 候補

## 真の論点

- Cron 頻度を `*/15` で良いか、`*/30` に減らして無料枠余裕を増やすか
- Sentry / Logpush の placeholder を 09b で配置するか、別 task で切り出すか
- release runbook を 09b の outputs/phase-12 に置くか、`doc/01-infrastructure-setup` の運用 task に置くか（→ phase-2-design.md に従い 09b/outputs/phase-12 に置く）
- incident response の Slack channel / Email 等の通知先を spec に書くか（→ 平文 secret は書かない、placeholder のみ）

## 依存境界

- 09b が触る: `apps/api/wrangler.toml` の `[triggers]` 設計、Cloudflare Analytics / Sentry / Logpush placeholder、release runbook、incident response runbook、rollback 手順
- 09b が触らない: staging deploy 本体（09a）、production deploy 本体（09c）、Slack / Email の実値登録

## 価値とコスト

- 初回価値: production deploy 後に sync が止まらない仕組み + 障害時の対応手順
- 初回で払わないコスト: Sentry の有料 plan 加入、Logpush の有料 sink 接続、Slack bot 構築

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | runbook で incident 復旧時間を短縮できるか | PASS |
| 実現性 | wrangler.toml + spec_created で 1 営業日完了か | PASS |
| 整合性 | 09a / 09c との scope 重複なし | PASS |
| 運用性 | rollback / cron 一時停止が誰でも実行可能か | TBD（Phase 5 で runbook 完成後 PASS） |
