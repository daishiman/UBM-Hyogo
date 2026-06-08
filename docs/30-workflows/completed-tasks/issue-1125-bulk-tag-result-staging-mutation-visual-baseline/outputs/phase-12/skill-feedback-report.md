# Skill Feedback Report

task-specification-creator / aiworkflow-requirements への改善フィードバック。観点: テンプレ改善 / ワークフロー改善 / ドキュメント改善。改善が軽微でも本ファイルは strict-7 として必須出力。

## 1. ワークフロー改善 — D1 remote の BEGIN/COMMIT 拒否制約を seed 系タスクの Phase 2 必須チェックにする（最大の学び）

Cloudflare D1 remote は `wrangler d1 execute --remote --file` で全文を暗黙アトミックバッチ実行するため、SQL 中の明示 `BEGIN TRANSACTION;` / `COMMIT;` を **拒否する**（local miniflare では通るためローカル検証だけでは気づけない。reference: `reference_d1_remote_no_sql_transaction`・test-accounts seed で実証済み）。本タスクは参照モデル issue-1081 seed が `BEGIN/COMMIT` を含むのをそのままコピーすると staging 投入で失敗するため、明示トランザクション除去を Phase 2 / Phase 5 の必須遵守事項として明記した。

- 提案: **staging D1 へ remote SQL を流すタスク**では「seed/cleanup SQL に `BEGIN TRANSACTION` / `COMMIT` を含めない」を Phase 2 設計レビューの必須チェック項目（DoD）として skill reference にテンプレ化する。既存 seed をコピー流用する際の落とし穴として明文化する。

## 2. ワークフロー改善 — staging mutation visual baseline は seed→capture→cleanup の trap 境界を runner に集約する設計パターン

result baseline は実 mutation = 共有 staging D1 への破壊的副作用を伴う。これを安全化するため「副作用の所有権を shell runner に集約し、Playwright spec は UI 操作 + screenshot にのみ責務を持つ」「synthetic prefix 限定」「`trap 'cleanup || true; ...' EXIT` で成功・失敗・中断いずれの経路でも cleanup を走らせ残存 0 を検証」という 3 段（guard → seed → capture → trap cleanup）の定型が再現性高く適用できた。

- 提案: **mutation を伴う authenticated staging visual baseline タスク**の設計テンプレートとして「seed/capture/cleanup の trap 境界を runner に集約する」パターンを skill reference に追加する。参照モデルは issue-1081 `runtime-tag-bulk.sh`（curl mutation）と本タスク `capture-bulk-tag-result.sh`（Playwright UI mutation）の差分（mutation 駆動方式のみ差し替え・guard / run_d1 / count_by_table / trap / redact は共通）。

## 3. テンプレ改善 — mutation 副作用の有無でスコープ境界を引く判断の定型化

read-only baseline（picker 表示）と mutation を要する baseline（result summary）を、共有 staging D1 への副作用有無で機械的に分割できた（issue-1077 が picker、本タスクが result）。さらに本タスク内でも、UI で再現可能な `skipped`（退会済み member）を in-scope、UI で再現不可な `notFound`（未登録 tag）を代替担保済み scope-out、と機械的に切り分けられた。

- 提案: 「visual baseline タスクでは (a) mutation 副作用の有無、(b) UI 操作だけで状態を自然発生させられるか、の 2 軸でスコープ境界を引く」をチェックリスト化する。UI 再現不可な状態は local fixture + component spec へ委譲し、current gap ではなく代替担保済み scope-out として記録する。

## 4. ドキュメント改善 — canonical screenshot 名の SSOT 一元化

`toHaveScreenshot` arg / artifacts.json `canonical_screenshots` / phase-11 / implementation-guide / seed SQL の tag label などで識別子が分散しがちだった。artifacts.json `canonical_screenshots` を SSOT とし他を参照させる運用、および synthetic prefix `e2e_test_issue1125_` を seed SQL / cleanup SQL / spec / runner で一致させる運用で drift を防げた。

- 提案: phase12-compliance §4 evidence inventory の Path は artifacts SSOT から導出する旨、および synthetic fixture identifier（prefix / tag label / member id）は seed SQL を SSOT として spec / runner に伝播させる旨を skill に明記する。
