# Phase 11 link-checklist — ワークフロー内リンク健全性チェック

## チェック結果

Phase 11 は NON_VISUAL かつ secret 実投入前のテンプレート確認であるため、ここではファイル参照の存在と外部正本への到達性だけを検証する。`manual-smoke-log.md` と Phase 13 evidence の実行結果は、ユーザー承認後に置換する。

| # | from | to | 種別 | 判定 |
| --- | --- | --- | --- | --- |
| 1 | index.md | phase-01.md〜phase-13.md | 内部 phase | OK |
| 2 | index.md | outputs/phase-01/main.md〜outputs/phase-13/main.md | 内部 outputs | OK |
| 3 | artifacts.json | outputs/artifacts.json | mirror parity | OK |
| 4 | artifacts.json | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md | Phase 11 outputs | OK |
| 5 | artifacts.json | outputs/phase-12/main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md | Phase 12 outputs | OK |
| 6 | artifacts.json | outputs/phase-13/main.md / deploy-runbook.md / rollback-runbook.md / secret-list-evidence-staging.txt / secret-list-evidence-production.txt | Phase 13 outputs | OK (evidence は placeholder) |
| 7 | index.md | ../unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | 親仕様 | OK |
| 8 | index.md / phase-05.md / phase-12.md | apps/api/src/jobs/sheets-fetcher.ts | 外部実装 | OK |
| 9 | phase-12 review | apps/api/src/jobs/sync-sheets-to-d1.ts | 外部実装 | OK |
| 10 | index.md / phase-NN.md | apps/api/wrangler.toml | 外部実装 | OK |
| 11 | index.md / phase-NN.md | scripts/cf.sh | 外部実装 | OK |
| 12 | phase-NN.md | CLAUDE.md（Cloudflare CLI / secret 管理） | 外部仕様 | OK |
| 13 | phase-12.md | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | 正本反映先 | OK |
| 14 | phase-12.md | .claude/skills/aiworkflow-requirements/references/environment-variables.md | 正本反映先 | OK |
| 15 | phase-12.md | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 正本反映先 | OK |
| 16 | phase-NN.md | .claude/skills/task-specification-creator/references/phase-template-core.md | 構造正本 | OK |

## Broken サマリー

| 項目 | 値 |
| --- | --- |
| Broken 件数 | 0 |
| 注意 | `outputs/phase-11/manual-smoke-log.md` と `outputs/phase-13/secret-list-evidence-*.txt` は実投入前 placeholder。リンクとしては OK、実 evidence としては未取得 |

## 実行済み確認コマンド

```bash
cd docs/30-workflows/ut-25-cloudflare-secrets-production-deploy
for f in phase-{01..13}.md outputs/phase-{01..13}/main.md artifacts.json outputs/artifacts.json; do
  test -e "$f"
done

ls outputs/phase-11/{main,manual-smoke-log,link-checklist}.md
ls outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md
ls outputs/phase-13/{main,deploy-runbook,rollback-runbook}.md \
  outputs/phase-13/secret-list-evidence-staging.txt \
  outputs/phase-13/secret-list-evidence-production.txt

test -e ../../../CLAUDE.md
test -e ../../../scripts/cf.sh
test -e ../../../apps/api/wrangler.toml
test -e ../../../apps/api/src/jobs/sheets-fetcher.ts
test -e ../../../apps/api/src/jobs/sync-sheets-to-d1.ts
test -e ../../../.claude/skills/task-specification-creator/references/phase-template-core.md
```
