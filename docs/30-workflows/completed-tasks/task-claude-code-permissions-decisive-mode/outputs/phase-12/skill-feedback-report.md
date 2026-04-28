# Skill Feedback Report

`task-specification-creator` および `aiworkflow-requirements` の運用観点から、本タスクで気付いた改善提案を記録する。Blocker は無し。

## 1. テンプレート改善提案

### 1.1 「設定ファイル変更タスク」専用 TC 定型化

設定ファイル変更タスクでは毎回ほぼ同じ TC が必要となるため、テンプレ化候補を提示する。

| 定型 TC | 内容 |
| --- | --- |
| TC-S-INIT | 起動直後の effective mode / config 表示 |
| TC-S-RELOAD | reload / 別 session での値維持 |
| TC-S-CROSS-PROJECT | 別プロジェクトでの階層適用差分 |
| TC-S-ALLOW | whitelist 効果（prompt なし） |
| TC-S-DENY | deny 効果（block） |
| TC-S-INVALID | 不正値 / typo の挙動 |
| TC-S-DUP | 多重定義（alias / settings）の grep 検出 |

→ skill にこのプリセットを `templates/test-scenarios-config-change.md` として持たせると、Phase 4/6 の手戻りが減る。

## 2. ワークフロー改善提案

### 2.1 NON_VISUAL + 設定変更タスクの Phase 6〜8 軽量化

- UI 変更なし / 実装変更なし（spec_created）の組み合わせでは、Phase 6（テスト拡充）・Phase 7（カバレッジ）・Phase 8（リファクタ）が形式的になりがち。
- 提案: `taskType: docs-only && visualEvidence: NON_VISUAL && workflow: spec_created` の組み合わせの場合、Phase 6〜8 は「該当なし宣言ブロック」を必須とし、独自成果物を強制しない軽量レーンを定義する。
- 既存の `outputs/phase-{6,7,8}/main.md` がほぼ「該当なし宣言」になっている事実をエビデンスとして記録。

### 2.2 spec_created タスクの Phase 11 テンプレ自動生成

- TC 一覧と結果記録フォーマットは設定変更タスクで再利用可能。
- skill 側に generator を持たせ、Phase 4 で設計した TC ID 列から `manual-smoke-log.md` を自動生成すると一貫性が上がる。

## 3. ドキュメント改善提案

### 3.1 階層優先順位を再利用可能 reference として切り出し

- 本タスクの `implementation-guide.md` Part 2 にある「階層優先順位」は、他タスク（worktree / hooks / governance）でも参照頻度が高い。
- 提案: `aiworkflow-requirements/references/claude-code-settings-hierarchy.md` として独立 reference 化し、本タスクおよび後続タスクから topic-map 経由で参照する。
- 既存の `claude-code-config.md` の追記方針とも整合する。

### 3.2 NON_VISUAL 判定 checklist の reference 化

- `screenshots/` を作らない / `screenshots/.gitkeep` を置かない / 主証跡が CLI テキストである、という NON_VISUAL 規約を reference 化する。
- 設定変更タスクは大半が NON_VISUAL になるため再利用効果が大きい。

## 4. Blocker

なし。本タスクは現行の skill 規約のもとで完遂可能。

## 5. 適用優先度

| 提案 | 優先度 | 適用先 |
| --- | --- | --- |
| 1.1 TC 定型化 | MEDIUM | task-specification-creator |
| 2.1 Phase 6〜8 軽量化 | MEDIUM | aiworkflow-requirements |
| 2.2 Phase 11 generator | LOW | task-specification-creator |
| 3.1 階層 reference 切り出し | HIGH | aiworkflow-requirements |
| 3.2 NON_VISUAL reference | MEDIUM | aiworkflow-requirements |
