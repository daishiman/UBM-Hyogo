# link checklist — 仕様書間参照リンク健全性チェック

> spec walkthrough で確認した参照リンクの OK / Broken 状態を一覧化する。
> 対象は本ワークフロー内（index.md / phase-NN.md / outputs / artifacts.json）と上流（親仕様 / design.md / Phase 12 implementation-guide.md）。

## メタ

| 項目 | 値 |
| --- | --- |
| 確認日 | 2026-04-28 |
| 確認者 | worktree branch: `task-20260428-223418-wt-1`（solo 開発） |
| 確認方法 | spec walkthrough（手動）+ ファイル存在 ls / md 内 link 目視 |

## 1. ワークフロー内リンク

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| 1 | index.md | phase-01.md / phase-02.md / phase-03.md | OK（Phase 1〜3 = completed） |
| 2 | index.md | phase-04.md 〜 phase-13.md | OK（Phase 4〜13 = pending、phase-11/12/13.md 本タスクで新規作成） |
| 3 | index.md | outputs/phase-01/main.md / phase-02/main.md / phase-03/main.md | OK |
| 4 | index.md | outputs/phase-11/{main,manual-smoke-log,link-checklist}.md | OK（本ファイル群で新規作成） |
| 5 | index.md | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report}.md | OK（Phase 12 で新規作成） |
| 6 | index.md | outputs/phase-13/main.md + branch-protection-{snapshot,payload,rollback,applied}-{dev,main}.json + apply-runbook.md | OK（Phase 13 で新規作成・実 JSON は実走後生成） |
| 7 | artifacts.json | phases[].file / phases[].outputs[] | OK（13 phases 全件、`{branch}` サフィックス分離維持） |
| 8 | phase-01.md | outputs/phase-01/main.md | OK |
| 9 | phase-02.md | outputs/phase-02/main.md | OK |
| 10 | phase-03.md | outputs/phase-03/main.md | OK |
| 11 | phase-11.md | outputs/phase-11/{main,manual-smoke-log,link-checklist}.md | OK（本タスクで新規作成） |

## 2. 上流（親仕様 / design.md / 草案 PR）への参照

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| 12 | index.md / phase-NN.md | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | OK（親仕様） |
| 13 | index.md / phase-02.md | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md | OK（草案 JSON 正本） |
| 14 | index.md / phase-12.md | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/implementation-guide.md | OK |
| 15 | index.md | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md | OK（U-1 検出ログ） |
| 16 | phase-NN.md | CLAUDE.md（ブランチ戦略章 / solo 運用ポリシー） | OK（grep 検証ターゲット） |
| 17 | phase-NN.md | https://docs.github.com/en/rest/branches/branch-protection | OK（外部 URL） |
| 18 | index.md | https://github.com/daishiman/UBM-Hyogo/issues/144 | OK（GitHub Issue #144） |

## 3. テンプレ / スキル参照

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| 19 | phase-NN.md | .claude/skills/task-specification-creator/SKILL.md | OK |
| 20 | phase-NN.md | .claude/skills/task-specification-creator/references/phase-template-core.md | OK |
| 21 | phase-11.md | .claude/skills/task-specification-creator/references/phase-template-phase11.md | OK |
| 22 | phase-11.md | .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md | OK |
| 23 | phase-12.md | .claude/skills/task-specification-creator/references/phase-12-spec.md | OK |
| 24 | phase-12.md | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | OK |
| 25 | phase-13.md | .claude/skills/task-specification-creator/references/phase-template-phase13.md | OK |

## 4. 兄弟タスク（参考実例）

| # | 参照元 | 参照先 | 状態 |
| --- | --- | --- | --- |
| 26 | phase-11.md / phase-12.md / phase-13.md | docs/30-workflows/skill-ledger-a1-gitignore/phase-{11,12,13}.md | OK（フォーマット参考） |

## 5. mirror parity / `.gitkeep` チェック

| # | 確認項目 | 状態 |
| --- | --- | --- |
| 27 | `outputs/phase-11/screenshots/` が存在しないこと（NON_VISUAL 整合） | OK（作成していない） |
| 28 | dev / main `{branch}` サフィックス分離（bulk 化禁止）が artifacts.json `phases[13].outputs` で維持 | OK |

## サマリ

| 状態 | 件数 |
| --- | --- |
| OK | 28 |
| Broken | 0 |
| 確認未了 | 0 |

> Broken 0 件のため Phase 12 への引き継ぎブロッカーなし。
