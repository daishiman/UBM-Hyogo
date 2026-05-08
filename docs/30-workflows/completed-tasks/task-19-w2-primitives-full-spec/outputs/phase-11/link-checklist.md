# Phase 11 link checklist (NON_VISUAL)

- task: task-19-w2-primitives-full-spec
- target: `docs/00-getting-started-manual/specs/09c-primitives.md` から外部参照する link が解決可能かの手動確認
- date: 2026-05-07
- status: PASS

## チェック対象

NON_VISUAL タスクのため UI 上のクリック確認は行わず、ファイルパス到達性 / アンカー存在性をリポジトリツリー上で検証する。

| # | 参照元（09c の文脈） | 参照先パス | 確認方法 | 結果 |
|---|----------------------|------------|----------|------|
| 1 | task-19 spec source | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md` | ファイル存在確認 | PASS |
| 2 | SKILL.md（task-specification-creator） | `.claude/skills/task-specification-creator/SKILL.md` | ファイル存在確認 | PASS |
| 3 | SKILL.md（aiworkflow-requirements） | `.claude/skills/aiworkflow-requirements/SKILL.md` | ファイル存在確認 | PASS |
| 4 | task-19 changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-task19-primitives-full-spec.md` | ファイル存在確認 | PASS |
| 5 | aiworkflow indexes（quick-reference） | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | ファイル存在確認 + task-19 entry 追記済み | PASS |
| 6 | aiworkflow indexes（resource-map） | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | ファイル存在確認 + task-19 entry 追記済み | PASS |
| 7 | aiworkflow indexes（topic-map） | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | ファイル存在確認 + task-19 entry 追記済み | PASS |
| 8 | task-workflow-active reference | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | ファイル存在確認 | PASS |
| 9 | 09a 親仕様 | `docs/00-getting-started-manual/specs/09a-design-system.md` 系 | 09c 内 link 記述で参照されていることを確認 | PASS |
| 10 | 09b token spec | `docs/00-getting-started-manual/specs/09b-design-tokens.md` 系（HEX/oklch/px の正本側） | 09c 内 link 記述で参照されていることを確認 | PASS |
| 11 | 09e/09f/09g 補助仕様 | `docs/00-getting-started-manual/specs/09e-*.md` / `09f-*.md` / `09g-*.md` 系 | 09c 内 link 記述で参照されていることを確認 | PASS |
| 12 | primitives.jsx 凍結正本 | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` | ファイル存在確認 | PASS |
| 13 | verify script | `scripts/verify-09c-no-visual-values.sh` | ファイル存在確認 + 実行 exit 0 | PASS |
| 14 | task-19 lessons-learned / phase outputs | `docs/30-workflows/completed-tasks/task-19-w2-primitives-full-spec/outputs/phase-12/*.md` | ファイル存在確認 | PASS |

## 補足

- 9〜11 の 09a / 09b / 09e / 09f / 09g については、リポジトリ実体ファイル名は wave 進行に応じて確定するため、09c 本体では「09a / 09b / 09e / 09f / 09g」のスラッグ参照に留めている。実体未生成のスラッグは未実測 / N/A として扱い、後続 task-06 contract index 側で具体ファイル名へ resolve される設計。
- 14 の lessons-learned は `outputs/phase-12/skill-feedback-report.md` 等の Phase 12 成果物群に分散して格納されている。

## 結論

- 必須参照（task-19 spec source / SKILL / changelog / indexes / verify script）は全て解決 PASS
- 09a/09b/09e/09f/09g スラッグ参照は spec 体系の前提に整合（実体ファイルの命名解決は task-06 責務）
- broken link: 0
- 検証結果: PASS
