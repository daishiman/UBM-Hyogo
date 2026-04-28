# Phase 12 タスク仕様書遵守チェックリスト — forms-schema-sync-and-stablekey-alias-queue

## 1. テンプレ準拠（Phase 1〜13）

各 phase ファイルが必須セクション（メタ情報 / 目的 / 実行タスク / 参照資料 / 実行手順 / 統合テスト連携 / 多角的チェック観点 / サブタスク管理 / 成果物 / 完了条件 / タスク100%実行確認 / 次 Phase）を満たすか。

| Phase | 必須セクション網羅 | 追加セクション網羅 | 判定 |
| --- | --- | --- | --- |
| 1 | OK | true issue / 依存境界 / 価値とコスト / 4 条件 / AC ドラフト | PASS |
| 2 | OK | Mermaid / env / dependency matrix / module 設計 | PASS |
| 3 | OK | alternative 4 案 / PASS-MINOR-MAJOR | PASS |
| 4 | OK | unit / contract / E2E / authorization / verify suite | PASS |
| 5 | OK | runbook + 擬似コード + sanity check | PASS |
| 6 | OK | failure cases（401 / 403 / 422 / 5xx / 部分失敗） | PASS |
| 7 | OK | AC マトリクス（Phase 1 AC × Phase 4 検証 × Phase 5 実装） | PASS |
| 8 | OK | Before / After（命名・型・path 正規化） | PASS |
| 9 | OK | free-tier + secret hygiene + a11y | PASS |
| 10 | OK | GO / NO-GO 判定 / blocker 列挙 | PASS |
| 11 | OK | manual evidence template + dry-run 手順 | PASS |
| 12 | OK | 7 成果物（implementation-guide / spec-update / changelog / unassigned / skill-feedback / compliance / main） | PASS |
| 13 | OK | approval gate / change-summary / PR template | PASS |

## 2. Phase 12 サブタスク（本フェーズ）

| # | サブタスク | 成果物 | 状態 |
| --- | --- | --- | --- |
| 1 | implementation-guide | `implementation-guide.md`（Part 1 中学生 + Part 2 技術者） | completed |
| 2 | system-spec-update-summary | `system-spec-update-summary.md`（変更なしを明記 + 整合性チェック） | completed |
| 3 | documentation-changelog | `documentation-changelog.md`（42 ファイル列挙） | completed |
| 4 | unassigned-task-detection | `unassigned-task-detection.md`（10 件 引き取り先明記） | completed |
| 5 | skill-feedback-report | `skill-feedback-report.md`（4 提案） | completed |
| 6 | phase12-compliance-check | 本書 | completed |

## 3. Part 1 / Part 2 要件チェック（implementation-guide）

### Part 1（初学者・中学生レベル）
- [x] なぜこのタスクが必要かを、日常生活の例え話から説明する（鋳型 / 永続ラベル）
- [x] 専門用語を使う場合は、その場で短く説明する（専門用語ミニ辞典）
- [x] 何を作るかより先に、困りごとと解決後の状態を書く（before → after 順）

### Part 2（開発者・技術者レベル）
- [x] TypeScript の interface / type 定義を記載する（`SchemaSyncDeps`, `FlattenedQuestion` 等）
- [x] API シグネチャ、使用例、エラーハンドリング、エッジケースを記載する
- [x] 設定可能なパラメータ、定数、実行コマンド、検証コマンドを一覧化する

## 4. 不変条件カバレッジ（guide 内）

| 不変条件 | 言及箇所 |
| --- | --- |
| #1 stableKey 直書き禁止 | Part 2「禁止事項」 + AC-7 トレース |
| #5 D1 直アクセスは apps/api のみ | Part 2「アーキテクチャ」 |
| #6 GAS 排除 | Part 2「禁止事項」 |
| #7 responseId / memberId 分離 | system-spec-update-summary §3 |
| #10 無料枠 | Part 2「運用」/ エッジケース |
| #14 schema 集約 | Part 2「下流タスク連携」 |

## 5. 完了条件（Phase 12）

- [x] 7 成果物すべて生成済み（main + 6 子ドキュメント）
- [x] spec 影響「変更なし」を明記
- [x] compliance check が phase-01〜13 すべてに対して PASS
- [x] artifacts.json の phase 12 を `completed` に更新（後続ステップで実施）

## 6. 総合判定

**PASS** — Phase 12 完了条件を全て満たす。
