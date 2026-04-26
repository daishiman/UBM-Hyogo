# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09b-parallel-cron-triggers-monitoring-and-release-runbook |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

cron schedule の正本仕様、release runbook（最終版）、incident response runbook（最終版）、6 ドキュメント（共通）を `outputs/phase-12/` に閉じ、09c へ引き渡せる状態にする。

## 実装ガイド Part 1 / Part 2 要件

### Part 1: 初学者・中学生レベル

- [ ] なぜこのタスクが必要かを、日常生活の例え話から説明する
- [ ] 専門用語を使う場合は、その場で短く説明する
- [ ] 何を作るかより先に、困りごとと解決後の状態を書く

### Part 2: 開発者・技術者レベル

- [ ] TypeScript の interface / type 定義を記載する
- [ ] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [ ] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 実行タスク

1. `outputs/phase-12/release-runbook.md` 最終版作成
2. `outputs/phase-12/incident-response-runbook.md` 最終版作成
3. `outputs/phase-12/implementation-guide.md`
4. `outputs/phase-12/system-spec-update-summary.md`
5. `outputs/phase-12/documentation-changelog.md`
6. `outputs/phase-12/unassigned-task-detection.md`
7. `outputs/phase-12/skill-feedback-report.md`
8. `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-05.md | runbook 擬似 |
| 必須 | doc/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/phase-11.md | smoke evidence |
| 必須 | doc/02-application-implementation/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/ | same-wave sync |
| 必須 | doc/02-application-implementation/README.md | 不変条件 |

## 実行手順

### ステップ 1: release-runbook.md 最終版
- Phase 5 擬似コード + Phase 11 evidence を組み合わせ完成版

### ステップ 2: incident-response-runbook.md 最終版

### ステップ 3〜8: 6 ドキュメント作成

### ステップ 9: 09a / 09c に通知

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | PR body に 8 ドキュメントへの link |
| 並列 09a | release runbook に staging URL を取り込み完了 |
| 下流 09c | release runbook を引き渡し |

## 多角的チェック観点（不変条件）

- #1-#15 を `phase12-task-spec-compliance-check.md` で全項目チェック

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | release-runbook 最終版 | 12 | pending | go-live + rollback |
| 2 | incident-response 最終版 | 12 | pending | initial / escalation / postmortem |
| 3 | implementation-guide | 12 | pending | 実装ガイド |
| 4 | system-spec-update-summary | 12 | pending | spec 差分提案 |
| 5 | documentation-changelog | 12 | pending | doc 変更点 |
| 6 | unassigned-task-detection | 12 | pending | 未割当 |
| 7 | skill-feedback-report | 12 | pending | ノウハウ |
| 8 | phase12-task-spec-compliance-check | 12 | pending | 不変条件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | サマリ |
| ランブック | outputs/phase-12/release-runbook.md | go-live + rollback + cron + dashboard |
| ランブック | outputs/phase-12/incident-response-runbook.md | initial / escalation / postmortem |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 更新候補 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | doc 変更 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割当 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | ノウハウ |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 不変条件 |
| メタ | artifacts.json | Phase 12 を completed に更新 |

## 完了条件

- [ ] 8 ドキュメント完成
- [ ] 不変条件 #1-#15 PASS
- [ ] 09c 引き渡し記録あり

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 8 ドキュメント配置
- artifacts.json の phase 12 を completed に更新

## 次 Phase

- 次: 13 (PR 作成)
- 引き継ぎ事項: 8 ドキュメント
- ブロック条件: ドキュメント欠落で次 Phase に進まない

## release-runbook.md 最終版（章立て）

1. 目的
2. 関連 dashboard URL（6 種、`<placeholder>` で実 account id を埋める）
3. go-live フロー（staging → production）
4. rollback 手順（worker / pages / D1 migration / cron）
5. cron 一時停止 / 再開
6. 手動 sync 実行（`POST /admin/sync/*`）
7. リリース後検証チェックリスト（10 ページ smoke の URL 一覧）
8. 連絡先 placeholder（Slack channel / Email）
9. 改訂履歴

## incident-response-runbook.md 最終版（章立て）

1. 重大度定義（P0 / P1 / P2）
2. initial response（5 分以内 / 30 分以内 / 60 分以内のアクション）
3. escalation matrix（重大度 × 対応者 × 通知先 placeholder）
4. cron 一時停止コマンド（runbook redirect）
5. 影響範囲評価（dashboard と sync_jobs SELECT で）
6. mitigation 標準パターン（rollback / cron 停止 / 手動 sync）
7. postmortem template
8. 改訂履歴

## implementation-guide.md

- cron 実装の入口（spec_created なので 03b で実装）
- wrangler.toml `[triggers]` の差分箇所
- sync_jobs running guard 強化のヒント

## system-spec-update-summary.md

| 提案 | 対象 spec | 理由 |
| --- | --- | --- |
| `[env.production.triggers]` の crons 明示 | `specs/15-infrastructure-runbook.md` | env 別 cron 設定の漏れ防止 |
| sync_jobs running guard の SQL 例追記 | `specs/03-data-fetching.md` | 実装者が再現できるように |
| dashboard URL を `placeholder` 表記 | `specs/15-infrastructure-runbook.md` | account id を埋めやすく |

## documentation-changelog.md

- 09b で追加: index.md / artifacts.json / phase-01〜13.md / outputs/phase-*/（runbook 9 種）
- 09b で更新: なし
- 09b で削除: なし

## unassigned-task-detection.md

| 課題 | 取り扱い | 担当 |
| --- | --- | --- |
| Sentry 本接続 + DSN 登録 | 未割当 | TBD |
| Logpush sink 設定 | 未割当 | TBD |
| Slack bot 通知 | 未割当 | TBD |
| postmortem の自動テンプレ生成 | 未割当 | TBD |

## skill-feedback-report.md

- 学んだこと: cron は wrangler.toml `[triggers]` で env 別に必ず定義、sync_jobs running guard は spec/03-data-fetching.md と一致させる、rollback 手順は worker / pages / D1 / cron で 4 種を別々に書く
- 改善提案: cron schedule の単体検証スクリプト追加、Cloudflare Analytics URL を env var 化
- 不要だった作業: Sentry 実接続（placeholder で十分、本接続は別 task）

## phase12-task-spec-compliance-check.md

| 不変条件 | 適合 | 根拠 |
| --- | --- | --- |
| #1 schema 固定しすぎない | PASS | cron sync は schema を D1 へ反映、コード固定なし |
| #2 consent キー統一 | PASS | sync が consent snapshot を反映、UI は 09a で確認済 |
| #3 responseEmail system field | PASS | sync が system field として保存 |
| #4 本人本文 D1 override しない | PASS | 09b は cron / runbook 担当、UI 編集なし |
| #5 apps/web → D1 直接禁止 | PASS | rollback 手順に web D1 操作なし |
| #6 GAS prototype 昇格しない | PASS | cron は Workers Cron Triggers のみ |
| #7 responseId と memberId 混同しない | PASS | 09b は ID 解釈なし |
| #8 localStorage 正本にしない | PASS | runbook 内で localStorage 言及なし |
| #9 /no-access 専用画面に依存しない | PASS | runbook 内で `/no-access` 言及なし |
| #10 Cloudflare 無料枠 | PASS | cron 試算 97 req/day |
| #11 admin は本人本文を直接編集できない | PASS | runbook 内で admin 編集 form 言及なし |
| #12 admin_member_notes view model 混在禁止 | PASS | 09b は API 設計外 |
| #13 tag は admin queue 経由 | PASS | 09b は queue 設計外 |
| #14 schema 変更は /admin/schema | PASS | sync は API 経由のみ |
| #15 attendance 重複防止 / 削除済み除外 | PASS | rollback 後 attendance 整合性 SQL を runbook に含む |

## same-wave sync 通知

- 09a に通知: release runbook 完成、staging URL の埋め込み完了
- 09c に通知: release-runbook.md / incident-response-runbook.md / rollback-procedures.md の引き渡し
