[実装区分: 実装仕様書]

# Phase 2 Output: 設計

仕様本体: `../../phase-02.md`

## Detector / 例外 / 失敗メッセージ 確定

- Detector 1: schema-qualified / quoted `UPDATE schema_questions ... SET stable_key` representative forms（error）
- Detector 2: `/\.update\(\s*schemaQuestions\s*\)[\s\S]{0,500}?\.set\(\s*\{[\s\S]{0,400}?\b(stable_key|stableKey)\b/`（error）
- Detector 3: `/(?<!function\s)\bupdateStableKey\s*\(/`（warning 固定）
- EXCEPTION_GLOBS: phase-02.md 参照
- 失敗 message template: phase-02.md 参照

## dependency matrix

| モジュール | owner | co-owner |
| --- | --- | --- |
| `scripts/lint-stable-key-update.mjs` | 本タスク | future AST guard 強化（必要時のみ） |
| `lefthook.yml` | 本タスク | task-git-hooks-lefthook-and-post-merge |

## 状態

`completed`
