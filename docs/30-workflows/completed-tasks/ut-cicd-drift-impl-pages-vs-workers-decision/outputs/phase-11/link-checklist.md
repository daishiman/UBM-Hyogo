# Phase 11 成果物: 同 wave 8 ファイル リンク死活チェックリスト

## 検査対象

| # | ファイル | リンク元 | 死活 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`（新規） | Phase 5 `adr-runbook.md` | **存在確認 OK** | ADR-0001 として正式配置済み |
| 2 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Phase 5 `doc-update-procedure.md` Section A | **存在確認 OK** | 判定表「現状 / 将来 / 根拠リンク / 更新日」反映済み |
| 3 | `CLAUDE.md` | Phase 5 `doc-update-procedure.md` | **存在確認 OK**（L19 / L37 が Workers 表記） | base case (cutover) と整合。任意脚注追加可 |
| 4 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/index.md` | 各 phase-N.md | **存在確認 OK** | Phase 12 で phase 一覧 status 更新 |
| 5 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/artifacts.json` | 実体ファイル | **存在確認 OK + valid JSON** | Phase 12 で phases[*].status 同期 |
| 6 | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/outputs/artifacts.json` | （Phase 12 で生成） | **存在確認 OK + root parity OK** | root `artifacts.json` と `cmp` 0 |
| 7 | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | Phase 5 `doc-update-procedure.md` | **存在確認 OK** | Phase 12 close-out 記録先 |
| 8 | `.claude/skills/task-specification-creator/LOGS/_legacy.md` | Phase 5 `doc-update-procedure.md` | **存在確認 OK** | Phase 12 close-out 記録先 |

## サマリー

| 区分 | 件数 |
| --- | --- |
| 存在確認 OK | 8 |
| 未生成（Phase 12 / Phase 13 で起票・生成） | 0 |
| 死活 NG | 0 |

## 関連タスク文書

| ファイル | 死活 | 備考 |
| --- | --- | --- |
| `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` | 存在確認 OK | ADR Related から参照 |
| `docs/30-workflows/completed-tasks/UT-GOV-006-web-deploy-target-canonical-sync.md` | 存在確認 OK | ADR Related から参照 |

## 完了確認

- [x] 同 wave 8 ファイル死活確認
- [x] 関連タスク 2 件死活確認
- [x] 死活 NG 0 件
