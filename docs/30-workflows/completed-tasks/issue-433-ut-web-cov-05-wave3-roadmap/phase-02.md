# Phase 2: 用語・ドメイン定義

## 目的

wave-3 roadmap で使用する用語をユビキタス言語として固定し、層別集計・gap マッピング・スコアリングで使う語彙を統一する。

## 用語定義

| 用語 | 定義 |
| --- | --- |
| layer | coverage 集計の自然単位。`admin component` / `public component` / `hook` / `lib` / `use-case` / `route handler` / `shared module` の 7 つ |
| wave | 同時並列実装タスク群の単位。layer とは独立 |
| gap-class | gap の分類: `LINE_GAP`（行未到達）/ `BRANCH_GAP`（分岐未到達）/ `FUNCTION_GAP`（関数未呼出）/ `INTEGRATION_DELEGATED`（unit から integration / e2e へ委譲）/ `OBSOLETE`（dead code 候補） |
| delegation-target | gap の解消先: `unit` / `integration` / `e2e` / `manual-smoke` / `obsolete-removal` |
| coverage-source | 数値出力元: `vitest --coverage` の `coverage-summary.json` / `coverage-final.json` |
| layer 集計テンプレート | layer × line% / branch% / function% / file count / uncovered file 数 の表 |
| gap マッピング表 | layer × file × line% × branch% × function% × gap-class × delegation-target |
| wave-3 候補タスク | slug + 概要 + 推定規模（S/M/L）+ 優先度スコア（業務影響 × 実装規模 × dependency）+ 委譲先 |
| NON_VISUAL backlog | UI screenshot を伴わず、integration / e2e で担保すべき動線（例: Auth.js cookie session 経由） |
| scoring axis | wave-3 候補の優先度評価軸（後述 Phase 3 で rubric 化） |
| backlog label | wave-2 Phase 12 成果物から抽出した残作業分類。`BACKLOG_INTEGRATION` / `BACKLOG_GAP` / `BACKLOG_DEAD_CODE` / `BACKLOG_TOOLING` の 4 値 |
| roadmap | `wave-3-roadmap.md` 自体。layer 集計 + gap マッピング + 候補リスト + 採用基準を含む |
| active workflow 索引 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` |
| indexes drift | `pnpm indexes:rebuild` 後の `.claude/skills/aiworkflow-requirements/indexes/` 配下に未コミット差分が残ること |

## 変更対象ファイル一覧（CONST_005）

なし（用語定義のみ。outputs に保存）

## enum 定義

| enum | 値 |
| --- | --- |
| gap-class | `LINE_GAP` / `BRANCH_GAP` / `FUNCTION_GAP` / `INTEGRATION_DELEGATED` / `OBSOLETE` |
| delegation-target | `unit` / `integration` / `e2e` / `manual-smoke` / `obsolete-removal` |
| backlog label | `BACKLOG_INTEGRATION` / `BACKLOG_GAP` / `BACKLOG_DEAD_CODE` / `BACKLOG_TOOLING` |

## 入力 / 出力 / 副作用

- 入力: 元 unassigned-task spec、index.md、wave-2 タスクの語彙
- 出力: `outputs/phase-02/main.md`、`outputs/phase-02/glossary.md`
- 副作用: なし

## テスト方針

- 用語が Phase 3〜13 で一貫して使われているかを Phase 12 compliance check で確認
- gap-class / delegation-target は enum として固定（追加時は本 Phase へ戻る）

## ローカル実行・検証コマンド

```bash
test -f docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-02/glossary.md
```

## 完了条件 / DoD

- [ ] 全用語が `glossary.md` に enum 値とともに記録
- [ ] 用語と AC-1〜5 の対応が `outputs/phase-02/main.md` に記載
- [ ] `gap-class` / `delegation-target` の値が後続 Phase で固定参照される

## 出力

- outputs/phase-02/main.md
- outputs/phase-02/glossary.md

## 参照資料

- docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/index.md
- docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md §4.1〜4.3

## メタ情報

- Phase: 2
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- glossary と enum を固定し、後続 Phase の用語 drift を防ぐ。

## 成果物/実行手順

- `outputs/phase-02/main.md` と `outputs/phase-02/glossary.md` を作成する。

## 統合テスト連携

- NON_VISUAL。Phase 12 compliance で enum 一貫性を確認する。
