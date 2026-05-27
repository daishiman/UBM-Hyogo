---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 11
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 11 — Evidence inventory（NON_VISUAL）

本タスクは `visualEvidence: NON_VISUAL`。スクリーンショット evidence は不要。代わりに **docs-only evidence**（配分表 / SA 分離 policy / project 切替 trigger / runbook / 計算 walkthrough / link checklist / secret grep log）を集約する。

## 1. Evidence inventory（spec_created 段階）

| # | Path | 種別 | Status | 配置時期 |
| --- | --- | --- | --- | --- |
| 1 | `outputs/phase-11/quota-allocation-table.md` | AC-1 配分表 | pending | 実装サイクル |
| 2 | `outputs/phase-11/sa-separation-policy.md` | AC-2 SA 分離 policy | pending | 実装サイクル |
| 3 | `outputs/phase-11/project-switch-trigger.md` | AC-3 切替 trigger | pending | 実装サイクル |
| 4 | `outputs/phase-11/ops-runbook.md` | AC-4 runbook 雛形 | pending | 実装サイクル |
| 5 | `outputs/phase-11/manual-smoke-log.md` | AC-1 余裕率計算 | pending | 実装サイクル |
| 6 | `outputs/phase-11/link-checklist.md` | 検証 #2 | pending | 実装サイクル |
| 7 | `outputs/phase-11/secret-grep-log.md` | AC-5 grep gate | pending | 実装サイクル |
| 8 | `outputs/phase-11/phase-11.md` | 本ファイル / inventory | present | spec_created |

## 2. Visual evidence

**該当なし**（`NON_VISUAL`）。`outputs/phase-11/screenshots/` のような視覚 evidence ディレクトリは作成しない。

## 3. spec_created 段階の Status 説明

- `present`: 本 spec で物理配置済。
- `pending`: 実装サイクル時に追加配置する sub-doc。Phase 5 執筆手順に従う。
- `n/a`: 該当なし。

## 4. 検証コマンド一覧（実装サイクル時に実行）

```bash
# secret grep（AC-5）
grep -rE '(AIza|ya29\.|sk-[A-Za-z0-9]|-----BEGIN PRIVATE KEY-----)' \
  docs/30-workflows/issue-265-forms-api-quota-sa-governance/

grep -rE '"private_key"|"client_email"\s*:\s*"[^o]' \
  docs/30-workflows/issue-265-forms-api-quota-sa-governance/

grep -rE '\b[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com\b' \
  docs/30-workflows/issue-265-forms-api-quota-sa-governance/

# link check（test -f で参照先存在確認）
for p in \
  apps/api/wrangler.toml \
  apps/api/src/jobs/sync-forms-responses.ts \
  apps/api/src/sync/sheets-client.ts \
  packages/integrations/google \
  docs/30-workflows/unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md \
  docs/30-workflows/completed-tasks/ut-03-sheets-api-auth-setup \
  docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap \
  CLAUDE.md; do
  test -e "$p" && echo "OK $p" || echo "MISS $p"
done
```

## 5. Phase 12 への引き継ぎ

Phase 12 では本 inventory を `## 4. Phase 11 evidence file inventory` に転記する。Status 列は **lowercase の `present` / `pending` / `n/a`** で統一する。
