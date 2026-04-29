# Link Checklist（成果物間 / 仕様書内リンク整合）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 区分 | リンク整合チェック表 |
| 作成日 | 2026-04-28 |
| visualEvidence | NON_VISUAL |

## 1. タスク内 outputs リンク

| リンク先 | 存在確認 | 想定参照元 | 判定 |
| --- | --- | --- | --- |
| `outputs/phase-1/main.md` | OK | Phase 2 / 5 / 12 | PASS |
| `outputs/phase-2/main.md` | OK | Phase 3 | PASS |
| `outputs/phase-2/layer-responsibility-table.md` | OK | Phase 3 / 5 / 7 | PASS |
| `outputs/phase-2/comparison-axes.md` | OK | Phase 3 / 5 | PASS |
| `outputs/phase-3/main.md` | OK | Phase 4 / 5 / 7 | PASS |
| `outputs/phase-3/impact-analysis.md` | OK | Phase 5 / 7 / 11 | PASS |
| `outputs/phase-4/main.md` | OK | Phase 5 | PASS |
| `outputs/phase-4/test-scenarios.md` | OK | Phase 5 / 7 / 11 | PASS |
| `outputs/phase-5/main.md` | OK | Phase 6 / 7 / 12 | PASS |
| `outputs/phase-5/comparison.md` | OK | Phase 6 / 7 / 11 / 12 | PASS |
| `outputs/phase-6/main.md` | OK | Phase 7 / 11 | PASS |
| `outputs/phase-7/main.md` | OK | Phase 9 / 10 | PASS |
| `outputs/phase-8/main.md` | OK | Phase 9 | PASS |
| `outputs/phase-9/main.md` | OK | Phase 10 | PASS |
| `outputs/phase-10/main.md` | OK | Phase 11 | PASS |
| `outputs/phase-10/final-review-result.md` | OK | Phase 11 / 12 | PASS |
| `outputs/phase-11/main.md` | OK | Phase 12 | PASS |
| `outputs/phase-11/manual-smoke-log.md` | OK | Phase 12 / 13 | PASS |
| `outputs/phase-11/link-checklist.md` | OK（本ファイル） | Phase 12 | PASS |
| `outputs/phase-12/*` | Phase 12 で作成 | Phase 13 | （Phase 12 完了時に PASS） |
| `outputs/phase-13/*` | スケルトン存在 / blocked | （ユーザー承認後） | BLOCKED（仕様通り） |

## 2. 仕様書ファイル

| リンク先 | 存在確認 | 判定 |
| --- | --- | --- |
| `index.md` | OK | PASS |
| `artifacts.json` | OK | PASS |
| `phase-01.md` 〜 `phase-13.md` | OK | PASS |

## 3. 外部参照（リポジトリ内）

| リンク先 | 存在確認 | 用途 | 判定 |
| --- | --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md` | OK | 4 層階層の正本 | PASS |
| `.claude/skills/task-specification-creator/SKILL.md` | OK | Phase 12 重要仕様 | PASS |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | OK | aiworkflow 正本 | PASS |
| `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md` | OK | 前提タスク Phase 3 結論 | PASS |
| `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md` | OK | 前提タスク影響分析 | PASS |
| `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/unassigned-task-detection.md` | OK | 本タスク起票経緯 | PASS |
| `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md` | OK | 実装手引き | PASS |
| `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md` | OK | ハンドオフ先 | PASS |
| `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001.md` | OK | 並行 deny 検証タスク | PASS |
| `CLAUDE.md` | OK | 設定 / シークレット管理ルール | PASS |

## 4. 識別子表記揺れ

| 識別子 | 統一表記 | 判定 |
| --- | --- | --- |
| タスク ID | `task-claude-code-permissions-project-local-first-comparison-001` | PASS |
| モード値 | `bypassPermissions` | PASS |
| flag | `--dangerously-skip-permissions` | PASS |
| ラッパー | `scripts/cf.sh` | PASS |
| 1Password 注入 | `op run --env-file=.env` | PASS |

## 5. 総合判定

**全リンク PASS（Phase 12 / 13 outputs を除く。Phase 12 完了時に再確認）**

## 6. 参照資料

- `phase-11.md`
- `index.md`
- `artifacts.json`
