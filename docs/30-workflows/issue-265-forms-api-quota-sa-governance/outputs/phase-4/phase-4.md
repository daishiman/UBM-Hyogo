---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 4
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 4 — テスト戦略（docs-only 検証）

docs-only タスクのため、unit / integration / e2e は対象外。代わりに **3 つの検証** を機械的に走らせる。

## 1. grep gate（実値非混入）

`outputs/phase-11/secret-grep-log.md` に下記の grep 結果（0 件）を残す。

| # | コマンド | 期待 |
| --- | --- | --- |
| 1 | `grep -rE '(AIza\|ya29\\.\|sk-[A-Za-z0-9]\|-----BEGIN PRIVATE KEY-----)' docs/30-workflows/issue-265-forms-api-quota-sa-governance/` | 0 件 |
| 2 | `grep -rE '"private_key"\|"client_email"\s*:\s*"[^o]' docs/30-workflows/issue-265-forms-api-quota-sa-governance/` | 0 件 |
| 3 | `grep -rE '\b[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com\b' docs/30-workflows/issue-265-forms-api-quota-sa-governance/` | 0 件 |
| 4 | `grep -rnE 'op://' docs/30-workflows/issue-265-forms-api-quota-sa-governance/` | >0 件（op 参照は意図的に多数） |

## 2. link checker

`outputs/phase-11/link-checklist.md` に下記参照リンクの存在を `test -f` で記録する。

| 参照先 | 期待 |
| --- | --- |
| `apps/api/wrangler.toml` | 存在 |
| `apps/api/src/jobs/sync-forms-responses.ts` | 存在 |
| `apps/api/src/sync/sheets-client.ts` | 存在 |
| `packages/integrations/google/` | 存在 |
| `docs/30-workflows/unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md` | 存在 |
| `docs/30-workflows/completed-tasks/ut-03-sheets-api-auth-setup/` | 存在 |
| `docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/` | 存在 |
| `CLAUDE.md` | 存在 |

## 3. 計算 walkthrough（quota 余裕率）

`outputs/phase-11/manual-smoke-log.md` に余裕率を手計算で残す。

### 計算前提

- per-project 500 req / 100s
- cron `*/5 * * * *` = 100 秒中 1.67 回稼働（5min = 300s / 100s = 3 windows / 1 cron 起動）
- 1 cron で `forms.responses.list` を batch 100 件取得 → 概ね 1 req（ページネーション 0-2 回）
- 余裕率 = 設計上限 ÷ quota 上限 = (1〜3 req / 100s) ÷ 500 = **0.2〜0.6%**

→ 70% を大幅に下回り AC-1 充足。

## 4. CI / Gate との連動

- 本 spec は `verify:phase12-compliance` / `gate-metadata:validate` の docs-only gate に乗せる。
- `outputs/phase-12/phase12-task-spec-compliance-check.md` で canonical 9 headings 自己チェック。
- `artifacts.json` の `Gate-B` / `Gate-C` は Phase 11 evidence path に紐付け。

## 5. 失格条件（fail-fast）

| # | 条件 | 検出方法 |
| --- | --- | --- |
| F-1 | secret-grep #1〜#3 のいずれかが ≥ 1 件 | Phase 11 secret-grep-log |
| F-2 | link checker が 1 つでも欠落 | Phase 11 link-checklist |
| F-3 | quota 余裕率計算が 70% 超 | Phase 11 manual-smoke-log |
| F-4 | canonical 9 headings 自己チェックで FAIL | Phase 12 compliance-check |
