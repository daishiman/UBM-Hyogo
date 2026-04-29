# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-parallel-forms-response-sync-and-current-response-resolver |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 11（手動 smoke） |
| 次 Phase | 13（PR 作成） |
| 状態 | pending |

## 目的

実装ガイド / system spec sync / changelog / unassigned 検出 / skill feedback / phase12 compliance check の 6 成果物を生成し、後続タスク（04a / 04b / 04c / 07a / 07c / 08b）へ引き継ぐ。

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

1. `outputs/phase-12/implementation-guide.md` を作成（中学生レベル概念 + 技術者レベル詳細）。
2. `outputs/phase-12/system-spec-update-summary.md` を作成（specs/ への影響）。
3. `outputs/phase-12/documentation-changelog.md` を作成（本タスクで触る doc 一覧）。
4. `outputs/phase-12/unassigned-task-detection.md` を作成（未割当責務の検出）。
5. `outputs/phase-12/skill-feedback-report.md` を作成（task-spec-skill / sync-skill の改善案）。
6. `outputs/phase-12/phase12-task-spec-compliance-check.md` を作成（テンプレ準拠チェック）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01〜11/main.md | 全 phase の出力 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | spec 整合 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | spec 整合 |
| 必須 | docs/30-workflows/02-application-implementation/_templates/phase-template-app.md | テンプレ |
| 参考 | docs/30-workflows/02-application-implementation/README.md | 不変条件 |
| 参考 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/phase-12.md | 並列タスクと記述整合 |

## 実行手順

### ステップ 1: implementation-guide
- 後述「中学生レベル概念」「技術者レベル詳細」を本文に収める。

### ステップ 2: system-spec-update-summary
- 03-data-fetching.md / 01-api-schema.md は本タスクで変更しない（仕様準拠）。
- もし spec 変更が条件を満たす場合は明記。

### ステップ 3: documentation-changelog
- 新規生成: 本タスク 15 ファイル
- 変更: なし（specs は触らない）

### ステップ 4: unassigned-task-detection
- responseEmail 変更時の admin 操作 → 04c で確認
- 退会時の current_response 取扱い → 04b / 07c の責務確認

### ステップ 5: skill-feedback-report
- task-spec 生成スキルへのフィードバック（並列 wave で共通モジュールを Phase 8 で必ず明示する仕組み、PII 配慮 checklist の標準化）

### ステップ 6: phase12-compliance-check
- テンプレ準拠：phase-01〜13 が必須セクションを満たすかチェック表

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | change-summary.md の元素材 |
| Wave 9b | release runbook に implementation-guide のリンク掲載 |
| 後続全 wave | unassigned で検出された責務の引き取り先決定 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| consent キー | #2 | guide で `publicConsent` / `rulesConsent` 統一を再強調 |
| responseEmail | #3 | guide で system field 区別を再強調 |
| 上書き禁止 | #4 | guide で profile 編集禁止 |
| 排他 | sync_jobs | guide に lock 仕様を残す |
| 無料枠 | #10 | guide に cron */15 + per sync write 200 の根拠 |
| GAS 排除 | #6 | guide に GAS 同期は本番に持ち込まない明記 |
| PII | secret hygiene | guide に log redact を残す |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide | 12 | pending | 2 part 構造 |
| 2 | system-spec-update-summary | 12 | pending | spec 変更なしを記録 |
| 3 | documentation-changelog | 12 | pending | 15 ファイル |
| 4 | unassigned-task-detection | 12 | pending | responseEmail 変更運用 / 退会後 current |
| 5 | skill-feedback-report | 12 | pending | spec gen への提案 |
| 6 | phase12-compliance-check | 12 | pending | テンプレ準拠表 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | 12 サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec 影響 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | doc 変更ログ |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未割当検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | skill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | テンプレ準拠 |
| メタ | artifacts.json | phase 12 を `completed` に更新 |

## 完了条件

- [ ] 6 成果物すべて生成済み
- [ ] spec 影響が「変更なし」の場合でも明記
- [ ] compliance check が phase-01〜13 すべてに対して PASS

## タスク100%実行確認【必須】

- [ ] サブタスク 6 件すべて completed
- [ ] 6 成果物すべて存在
- [ ] artifacts.json の phase 12 が `completed`

## 次 Phase

- 次: 13（PR 作成）
- 引き継ぎ事項: change-summary 素材
- ブロック条件: 6 成果物いずれか欠落

## Part 1 中学生レベル概念説明

- Google Form は **質問用紙の鋳型**、ここに回答が一件ずつ届く。
- 同期 job は 15 分に 1 回、Google Form の回答箱を覗いて、新しい回答を **会員カード台帳**（`member_responses` / `member_identities`）に書き写す。
- 同じ人（同じメールアドレス）が 2 回回答したら、**新しい方の回答** を「いま使う回答」として `current_response_id` に記録する。古い方も履歴として残す。
- 「公開していい？」「規約読んだ？」の答え（`publicConsent` / `rulesConsent`）は、**新しい回答の答え** を会員ステータス台帳（`member_status`）に転記する。退会済みの人は転記しない。
- 知らない質問（フォームに新しく追加された質問）が来たら、回答カードの **おまけ欄**（`extra field row (`response_fields.stable_key=__extra__:<questionId>`)`）に保管しつつ、**未処理ボックス**（`schema_diff_queue`）にも入れて、後で管理者が名札を付けられるようにする。
- 同じ作業が二重に走らないように、作業ノート（`sync_jobs`）に「いま実行中」と書いてからスタートする。

## Part 2 技術者レベル詳細

| 項目 | 詳細 |
| --- | --- |
| task root | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver |
| key outputs | outputs/phase-02/sync-flow.mermaid, outputs/phase-04/test-matrix.md, outputs/phase-05/sync-runbook.md, outputs/phase-05/pseudocode.md, outputs/phase-06/failure-cases.md, outputs/phase-07/ac-matrix.md |
| upstream | 02a (identities/responses/fields/status repo) / 02b (schema_questions / schema_diff_queue repo) / 01b (Forms client) |
| downstream | 04a (公開) / 04b (会員 self) / 04c (admin endpoint) / 07a (tag queue trigger) / 07c (audit) |
| sync entry | `apps/api/src/sync/responses/forms-response-sync.ts: runResponseSync(env, opts)` |
| endpoint | `POST /admin/sync/responses` (admin only)、`?fullSync=true` で cursor 無視 |
| cron | 15 分毎 (`*/15 * * * *`) |
| ledger | `sync_jobs` (job_type=response_sync, status=running/succeeded/failed, metrics_json に cursor 保存) |
| 共通モジュール | 03a と共通: `_shared/ledger.ts` / `_shared/sync-error.ts` / `packages/shared/src/types/brand.ts` |
| 不変条件 | #1, #2, #3, #4, #5, #6, #7, #10, #14 |
| consent 正規化 | `'同意する' / '同意します' / 'yes'` → `consented`、`'同意しない' / 'no'` → `declined`、その他 → `unknown` |
| 旧名処理 | 入力に `ruleConsent` (旧名) があれば `rulesConsent` (新名) に正規化、内部に旧名を持ち込まない |
| current 切替 | `submittedAt` 最新を採用、タイ時は `responseId` desc |
| 退会済 | `member_status.is_deleted=true` のとき consent snapshot を skip |
| per sync write 上限 | 200 row（無料枠保護、超過時は次回 cron で継続） |

## system spec 更新概要

- `03-data-fetching.md` / `01-api-schema.md` の更新は不要（本タスクは仕様準拠）。
- もし `member_responses.response_email` UNIQUE 制約が 01a / 02a の DDL に未定義であれば、対応 task で migration 追加要請。

## documentation-changelog

| ファイル | 変更内容 |
| --- | --- |
| index.md（本 task） | 新規 |
| artifacts.json | 新規 |
| phase-01.md 〜 phase-13.md | 新規 |
| outputs/phase-XX/*.md | 新規 |

specs/ への変更: なし

## unassigned-task-detection

| 検出項目 | 引き取り候補 | 状態 |
| --- | --- | --- |
| `responseEmail` 変更時の identity 統合 | 04c-parallel-admin-backoffice-api-endpoints | 確認要（admin 手動 merge UI が必要） |
| 退会済 identity の current_response 表示制御 | 04a (public) / 04b (self) | 引き取り済（公開非表示・自分のみ閲覧可等） |
| sync 共通モジュール（`_shared/ledger.ts` / `_shared/sync-error.ts`） | 03a と共同保守 | 確認要（owner を明示する必要） |
| `member_responses.response_email` UNIQUE 制約 | 01a-parallel-d1-database-schema-migrations-and-tag-seed | 確認要 |
| consent 撤回時の公開ディレクトリ即時非表示 | 04a-parallel-public-directory-api-endpoints | 引き取り済（filter で `publicConsent='consented'` を AND） |
| 旧 `ruleConsent` 文字列の lint rule 実装 | linting 共通 task | 確認要（custom ESLint rule） |

## skill-feedback-report

- spec gen 段階で「並列タスクとの共有モジュール owner」を index.md の dependency matrix に列追加する案。
- PII 配慮 checklist（log redact / metrics_json に PII 入れない / archive 期間）をテンプレに standard セクション化する案。
- consent 正規化の語句（`'同意する'` 等）を spec で正本化し、各タスクが独自に持たない構造化提案。
- 並列 Wave で共通する `sync_jobs` ledger の挙動（job_type enum, metrics_json schema）を `_design/` 配下に共有 spec を切る案。

## phase12-task-spec-compliance-check

| Phase | 必須セクション網羅 | 追加セクション網羅 | 判定 |
| --- | --- | --- | --- |
| 1 | OK | true issue / 依存境界 / 価値とコスト / 4 条件 | PASS |
| 2 | OK | Mermaid (cursor 含む) / env / dependency matrix / module 設計 | PASS |
| 3 | OK | alternative 4 案 / PASS-MINOR-MAJOR | PASS |
| 4 | OK | verify suite / fixture 5 種 | PASS |
| 5 | OK | runbook 7 章 + 擬似コード 7 関数 | PASS |
| 6 | OK | failure cases 19 件 / retry 戦略 | PASS |
| 7 | OK | AC matrix (AC-1〜AC-10) | PASS |
| 8 | OK | naming/type/endpoint Before/After + 共通モジュール | PASS |
| 9 | OK | free-tier + secret hygiene + a11y + PII | PASS |
| 10 | OK | GO/NO-GO + 並列契約整合 | PASS |
| 11 | OK | manual evidence template + 再回答 / unknown / cursor シナリオ | PASS |
| 12 | OK | 6 成果物 | PASS |
| 13 | OK | approval gate / change-summary / PR template | PASS |
