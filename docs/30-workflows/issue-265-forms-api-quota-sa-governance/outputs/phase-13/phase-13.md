---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 13
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 13 — クロージング

本 phase は **本 spec 配置完了後** のクロージング手順を定義する。実施は別サイクル（実装サイクル時 / PR 作成サイクル）で行う。

## 1. completed-tasks 移動条件（go gate）

すべて満たした時点で移動可能:

- Phase 11 sub-doc 7 件（quota-allocation-table / sa-separation-policy / project-switch-trigger / ops-runbook / manual-smoke-log / link-checklist / secret-grep-log）の物理配置完了
- secret grep gate #1〜#3 が 0 件
- link checker でリンク全 OK
- quota 余裕率 ≤ 70%（数値固定）
- `pnpm gate-metadata:validate` green
- `pnpm verify:phase12-compliance` green
- `pnpm indexes:rebuild` idempotent（md5 不変）
- issue #265 が CLOSED 状態維持

## 2. completed-tasks 移動コマンド

```bash
git mv docs/30-workflows/issue-265-forms-api-quota-sa-governance \
       docs/30-workflows/completed-tasks/issue-265-forms-api-quota-sa-governance
```

## 3. 起票元 unassigned-task への consumed trace

**対象**: `docs/30-workflows/unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md`

**操作**: ファイル先頭に `consumed: true` / `canonical_workflow: issue-265-forms-api-quota-sa-governance` / `consumed_at: <date>` / `issue_refs: ["#265"]` の frontmatter を追記。本文「申し送り先」テーブル直下に canonical_workflow 参照行を 1 行追加。

**削除しない**（履歴トレース保持）。

## 4. stale ref 補修対象

| # | 参照元 | 補修方針 |
| --- | --- | --- |
| 1 | `unassigned-task/U-UT01-06-gcp-quota-allocation-handoff.md` | consumed trace 追記 |
| 2 | `completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` の MINOR-M-Q-01 | consumed trace 行追記 |
| 3 | `completed-tasks/ut-03-sheets-api-auth-setup/` 配下の U-UT01-06 言及 | grep で発見 → standalone 化済の旨を併記 |
| 4 | `completed-tasks/issue-265-forms-api-quota-sa-governance/`（移動後） | 内部 self-ref をすべて移動先 path に更新 |
| 5 | `docs/30-workflows/LOGS.md` | クロージング 1 行記録（任意） |

## 5. artifacts.json 最終更新

| Gate | spec_created | closeout |
| --- | --- | --- |
| Gate-A | completed | completed |
| Gate-B | pending | completed（Phase 11 sub-doc 全配置後） |
| Gate-C | pending | completed（grep gate green 後） |

`workflow_state` を `spec_created` → `closed` に更新。

## 6. PR 作成（user-gated）

- base: `dev`
- title: `docs(issue-265): Forms API quota / SA governance spec`
- body: `.claude/commands/ai/diff-to-pr.md` テンプレに従う。実装 / commit / push / PR は user-gated。

## 7. Issue クローズ

issue #265 は既に CLOSED（2026-05-26）。本 spec は CLOSED 状態を維持しつつ補完文書として残す。再オープン不要。

## 8. 本 spec で実施した作業

| # | 作業 | 状態 |
| --- | --- | --- |
| 1 | 24 ファイル新規配置 | DONE |
| 2 | canonical 9 headings 自己チェック | PASS |
| 3 | strict 7 物理配置 | PASS |
| 4 | unassigned task 0 件確定 | DONE |
| 5 | CLAUDE.md / specs 不変判断 | DONE |
| 6 | implementation-guide で Phase 13 手順を文書化 | DONE |
| 7 | 実装 / commit / push / PR | **未実施**（user-gated） |
