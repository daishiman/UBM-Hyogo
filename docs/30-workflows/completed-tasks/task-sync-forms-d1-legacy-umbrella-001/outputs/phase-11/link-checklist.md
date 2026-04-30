# Phase 11 Link Checklist（参照元 → 参照先 / 状態）

## 目的

本タスク内成果物から外部（specs / completed-tasks / 02-application-implementation / `.claude/skills/aiworkflow-requirements/references` / `.claude/skills/task-specification-creator`）への cross-reference をすべて列挙し、参照先 path / id が解決することを確認する。docs-only / NON_VISUAL のため、本リスト＋ rg / ls の整合性確認が manual smoke の主証跡となる。

## 参照リンク表

| # | 参照元 | 参照先 | 種別 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | `index.md` / `phase-01.md` | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 元仕様 | OK |
| 2 | `index.md` / `outputs/phase-02/responsibility-mapping.md` | `docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | schema sync 正本 | OK |
| 3 | `index.md` / `outputs/phase-02/responsibility-mapping.md` | `docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | response sync 正本 | OK |
| 4 | `index.md` / `phase-04.md` | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/` | admin endpoint 正本 | OK |
| 5 | `index.md` / `phase-05.md` | `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/` | cron / runbook 正本 | OK |
| 6 | `index.md` / `phase-05.md` | `docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/index.md` | sync_jobs 正本 | OK |
| 7 | `index.md` | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | admin sync endpoint 正本 | OK |
| 8 | `phase-04.md` / `phase-05.md` | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | D1 / deployment current facts | OK |
| 9 | `phase-04.md` / `phase-06.md` | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | D1 PRAGMA 制約 | OK |
| 10 | `index.md` / `phase-01.md` | `docs/00-getting-started-manual/specs/00-overview.md` | 3 層構成 | OK |
| 11 | `index.md` / `phase-02.md` / `phase-04.md` | `docs/00-getting-started-manual/specs/01-api-schema.md` | Forms schema / `responseId` / `publicConsent` / `rulesConsent` | OK |
| 12 | `index.md` / `phase-03.md` / `phase-04.md` | `docs/00-getting-started-manual/specs/03-data-fetching.md` | sync_jobs / cursor / current response / consent snapshot | OK |
| 13 | `index.md` / `phase-04.md` / `phase-06.md` / `phase-09.md` | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 WAL 非対応 / PRAGMA 制約 | OK |
| 14 | `index.md` / `phase-09.md` | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | admin gate（`/admin/sync/*` 権限境界） | OK |
| 15 | `index.md` / 各 phase | `CLAUDE.md`（不変条件 #1 / #5 / #6 / #7） | プロジェクト方針 | OK |
| 16 | `phase-04.md` / `phase-05.md` / `phase-09.md` | `.claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js` | 監査スクリプト | OK |
| 17 | `phase-09.md` | `.claude/skills/task-specification-creator/references/unassigned-task-required-sections.md` | 必須 9 セクション定義 | OK |
| 18 | `phase-11.md` | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | NON_VISUAL 縮約テンプレ | OK |
| 19 | `phase-11.md` | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | 代替証跡定義 | OK |
| 20 | `index.md` / `phase-02.md`（参考） | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` | admin sync UI prototype | OK（参考） |
| 21 | `index.md`（参考） | `docs/00-getting-started-manual/claude-design-prototype/data.jsx` | sample 同期データ構造 | OK（参考） |
| 22 | `index.md` | `phase-01.md`〜`phase-13.md`（task 内自己参照） | Phase 仕様 | OK |
| 23 | `artifacts.json` | `outputs/phase-11/{main,manual-smoke-log,link-checklist,manual-evidence-bundle}.md` | Phase 11 必須 outputs | OK |

## 検証コマンド

```bash
for p in \
  docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md \
  docs/30-workflows/completed-tasks/02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary/index.md \
  docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md \
  .claude/skills/aiworkflow-requirements/references/api-endpoints.md \
  .claude/skills/aiworkflow-requirements/references/task-workflow.md \
  .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md \
  docs/00-getting-started-manual/specs/00-overview.md \
  docs/00-getting-started-manual/specs/01-api-schema.md \
  docs/00-getting-started-manual/specs/03-data-fetching.md \
  docs/00-getting-started-manual/specs/08-free-database.md \
  docs/00-getting-started-manual/specs/13-mvp-auth.md \
  CLAUDE.md \
  .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  .claude/skills/task-specification-creator/references/unassigned-task-required-sections.md \
; do test -e "$p" && echo "OK $p" || echo "MISS $p"; done
```

期待: 全行 `OK`。`MISS` が出た場合は対応 phase の outputs を再生成。

## 状態凡例

| 状態 | 意味 |
| --- | --- |
| OK | 参照先が存在する |
| MISS | 参照先が存在しない（Phase 12 で更新が必要） |
| TBD | 参照先が未確定（spec_created 段階では発生しない想定） |

## 結論

全 23 件の cross-reference が解決可能（OK）。manual smoke のリンク健全性チェックは **PASS**。
