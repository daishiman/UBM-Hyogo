---
title: parallel-03-followup-002 — admin AppShell runtime evidence (EV-12)
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
github_issue: 833
github_issue_state: CLOSED
parent_workflow: docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/
---

# parallel-03-followup-002 — admin AppShell runtime evidence (EV-12)

[実装区分: 実装仕様書]

## 概要

issue #833（`parallel-03-followup-002`, CLOSED）を **current code に最適化した縮小スコープ実装**。parallel-03（AppShell layouts, PR #835 merged）で実装済みの admin AppShell の data-* 契約属性が、production-equivalent な runtime DOM に実際に出力されることを Playwright scrape で確認し、親 workflow の Phase 11 evidence inventory の EV-12 を `pending` → `present` に昇格した。

## issue #833 調査結論

| 観点 | 結論 |
|------|------|
| 機能コード（data-* 契約） | parallel-03 / PR #835 で **実装済み** |
| CI ブロック | 起きていない（`pending` は valid status のため gate fail しない） |
| 原 issue の status 指示（`captured`） | validator invalid → **`present` に最適化** |
| 原 issue の grep パターン | current 実属性と不一致 → `data-(theme\|route-group\|shell\|route\|testid)=` に最適化 |
| EV-15/16（screenshot） | serial-07 / UT-DSF-07 (#829) と重複 → **委譲** |
| EV-13（member scrape） | member child route 欠如 → serial-05 へ **委譲** |

→ 「完全に不要」ではないが「原 issue のままでは不正確」。**EV-12 admin DOM scrape の取得 + 台帳語彙の最適化**に縮小して根本解決する（user 承認済みスコープ）。

## スコープ（1 実装サイクル / CONST_007）

- 新規: `apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts`
- 新規: 親 `parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt`（EV-12 runtime DOM scrape）
- 編集: 親 `parallel-03-appshell-layouts/phase-11-evidence-inventory.md`（EV-12=present + 委譲注記）
- production code 無変更（`implementation_mode: verify_existing`）

## Phase 一覧

| Phase | ファイル | 内容 |
|-------|---------|------|
| 1 | phase-01-requirements.md | 要件 / current facts / issue 乖離 / 委譲表 / AC |
| 2 | phase-02-architecture.md | 再利用 / data flow / status 語彙 / リスク |
| 3 | phase-03-task-breakdown.md | S-01..04 / 4 条件評価 |
| 4 | phase-04-interface-contract.md | spec シグネチャ / TC-01..08 |
| 5 | phase-05-implementation-guide.md | spec 全文 / 親台帳 before-after / 委譲注記 |
| 6 | phase-06-test-strategy.md | TC-09..11 fail path / 非重複 |
| 7 | phase-07-quality-gates.md | concern×evidence カバレッジ |
| 8 | phase-08-dod.md | refactor 表 / DoD-1..8 / 検証コマンド |
| 9 | phase-09-risks.md | R-01..07 |
| 10 | phase-10-local-verification.md | コマンド集 / AC 対応 |
| 11 | phase-11-evidence-inventory.md | evidence 台帳（NON_VISUAL）/ 委譲 |
| 12 | phase-12-compliance-check.md | canonical 9 見出し compliance |
| 13 | phase-13-commit-pr.md | commit / PR draft（user 承認後のみ） |

## 不変条件

1. 既存 API endpoint surface のみ（mock API 経由 scrape）
2. OKLch トークン正本化（HEX 直書き禁止 / TC-07）
3. プロトタイプ正本順位（新 primitive なし）
4. `apps/web` から D1 直接アクセス禁止
5. status 語彙は `present`/`pending`/`n/a` のみ（`captured` 禁止）
