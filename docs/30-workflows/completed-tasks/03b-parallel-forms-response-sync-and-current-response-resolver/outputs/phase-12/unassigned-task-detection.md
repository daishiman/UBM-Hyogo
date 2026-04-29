# 未割当責務の検出（unassigned task detection）

本タスクの Phase 1〜10 のレビューで「本タスクの scope out だが、誰かが必ず引き取る必要がある」
責務を抽出し、引き取り候補と状態を記録する。Phase 13 PR description の Notes 節 / follow-up issue
の素材となる。

## 検出表

| # | 検出項目 | 引き取り候補 task | 状態 | 備考 |
|---|---------|------------------|------|------|
| 1 | `responseEmail` 変更時の identity 統合（同一人物が別メールで再回答） | 04c-parallel-admin-backoffice-api-endpoints | 確認要 | admin 手動 merge UI が必要。本タスクは `EMAIL_CONFLICT` error code を準備するに留まる |
| 2 | 退会済 identity の current_response 表示制御 | 04a (public) / 04b (self) | 引き取り済み | 公開非表示・self では閲覧可 等のフィルタ責務。本タスクは `member_status.is_deleted` フラグを正しく更新するのみ |
| 3 | sync 共通モジュール（`_shared/ledger.ts` / `_shared/sync-error.ts`）の owner | 03a と本 03b の共同保守 | 確認要 | owner が誰かを明示する必要。`_design/` 配下に owner 表を追加すべき |
| 4 | `member_responses.response_email` UNIQUE 制約の DDL 上の明文化 | 01a-parallel-d1-database-schema-migrations-and-tag-seed | 確認要 | 0001 で UNIQUE 済みだが spec / DDL コメント上は曖昧。01a 側で正式宣言を |
| 5 | consent 撤回時の公開ディレクトリ即時非表示 | 04a-parallel-public-directory-api-endpoints | 引き取り済み | `publicConsent='consented'` を AND 条件に追加 |
| 6 | 旧 `ruleConsent` 文字列の lint rule 実装 | linting 共通 task / リポジトリルートの ESLint 設定 | 確認要 | custom ESLint rule で API / DB / コードに登場しないことを CI で担保すべき |
| 7 | sync_jobs `job_type` enum / `metrics_json` schema の集約 | 03a / 03b 共同 spec（`_design/` 配下） | 確認要 | 並列 wave で job_type を増やすたびに整合性が崩れるリスク |
| 8 | production deploy 時の Google Forms secrets 設定 | staging / production deploy 手順 | 確認要 | WebCrypto signer は実装済み。`GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_FORM_ID` の環境設定が必要 |
| 9 | per-sync write cap（200）超過時のオペ通知 | observability / runbook 整備 task | 確認要 | 現状は次回 cron で継続するのみ。連続超過時のアラートが未定義 |
| 10 | sync_jobs ロック TTL（10 分）超過時のリカバリ手順 | 15-infrastructure-runbook 改訂 | 確認要 | TTL 切れで stuck したロックの手動解除手順を runbook に明記したい |
| 11 | E2E fixture と本タスク `__fixtures__/` の統合 | 08b-parallel-e2e-test-fixtures-and-coverage | 引き取り済み（予定） | 08b 着手時にこちらの fixture を流用 |

## 引き取り済み（本タスク責務外で他 task に閉じる）

- #2 / #5 / #8 / #11

## 確認要（owner 未確定）

- #1 / #3 / #4 / #6 / #7 / #9 / #10

## アクション提案

1. Phase 13 の PR description「Notes / follow-up」節に上記「確認要」7 件を列挙する。
2. follow-up GitHub issue を作成（`gh issue create` で 1 件にまとめても、責務単位で分割しても可）。
3. `_design/` 配下に sync 共通モジュール owner 表を追加する task（#3 / #7）を別途起票。

## 完了条件への寄与

- 検出 11 件すべてに引き取り候補を提示済み（owner 未確定でも候補を 1 つは挙げる）
- 引き取り済みは status「引き取り済み」、未確定は「確認要」と明記
