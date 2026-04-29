# Skill Feedback Report — coverage-80-enforcement

3 観点（テンプレ改善 / ワークフロー改善 / ドキュメント改善）テーブル必須。改善点なしでも「観察事項なし」で行を埋める。

## task-specification-creator skill へのフィードバック

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善 | NON_VISUAL implementation で 3 段階 PR（仕組み導入 / 内容追加 / hard 化）を表現するパターンが phase-template-phase13 に直接表現されておらず、本タスクで pr1/pr2/pr3 runbook を独自に構成した | 「鶏卵問題回避の N 段階 PR」テンプレを `phase-template-phase13-detail.md` に追加候補。`pr1-runbook.md` / `pr2-runbook.md` / `pr3-runbook.md` の標準成果物セクションを定義 |
| ワークフロー改善 | Phase 12 implementation-guide の Part 1（中学生レベル）/ Part 2（開発者技術詳細）構成が `phase-12-documentation-guide.md` で明確化されており、coverage 系の例え話（通信簿 / 上履きチェック類似）に容易に展開できた | Part 1 の例え話パターン集（governance / quality / infra）を `references/part1-analogy-catalog.md` として独立化する候補 |
| ドキュメント改善 | `coverage-standards.md` に coverage-guard.sh のような新設スクリプトへの参照を追記する設計が、既存の「強制経路」セクションに自然に乗った | 新設 script を skill に登録する流れ（filename / I/O / exit code / 強制経路位置）のチェックリスト化候補 |

## aiworkflow-requirements skill へのフィードバック

| 観点 | フィードバック | 改善提案 |
| --- | --- | --- |
| テンプレ改善 | `quality-requirements-advanced.md` の package 別差分閾値テーブルが、ユーザー決定の一括変更（80% 一律）に対して L125-144 行のピンポイント diff で更新可能だった | quality 系の閾値テーブルに「全 package 一律 / package 別差分」の切替指針コメントを冒頭に明記する候補 |
| ワークフロー改善 | `pnpm indexes:rebuild` の正規経路（post-merge 廃止後）が CLAUDE.md / lefthook-operations.md と整合しており、本タスクの Phase 13 PR③ 後の手順に明記できた | 観察事項なし（既に整合） |
| ドキュメント改善 | `quality-requirements-advanced.md` ↔ `coverage-standards.md` ↔ `codecov.yml` ↔ `vitest.config.ts` の 4 系正本リンクが topic-map で辿りにくい | topic-map に「coverage threshold 4 系正本」の cluster 見出しを追加候補（U-5 と連動） |

## 横断観察

| 観点 | 内容 |
| --- | --- |
| 一貫性 | Phase 12 必須 5 タスク + index + compliance check の 7 ファイル構成が ut-gov-001 と同一パターンで再利用できた |
| 網羅性 | 既存正本（aiworkflow-requirements / coverage-standards / codecov.yml）の二重正本 drift リスクを Step 2 = REQUIRED で吸収 |
| 改善余地 | 3 段階 PR 段取りの自動化（PR① merge 後 N 週間で PR③ リマインダ Issue 自動作成）は U-4 として formalize 候補 |
