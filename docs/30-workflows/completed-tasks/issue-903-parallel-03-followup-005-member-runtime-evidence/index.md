---
title: issue-903 — parallel-03-followup-005 member AppShell runtime evidence (EV-13/EV-16)
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
github_issue: 903
github_issue_state: OPEN
parent_workflow: docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/
predecessor_workflow: docs/30-workflows/completed-tasks/parallel-03-followup-002-admin-runtime-evidence/
---

# issue-903 — parallel-03-followup-005 member AppShell runtime evidence (EV-13/EV-16)

[実装区分: 実装仕様書]

## 概要

issue #903（`parallel-03-followup-005-member-runtime-evidence`, **実状 OPEN** — ユーザー認識「CLOSED」と相違）を **current code に最適化して実装完了**。followup-002 が admin で確立した runtime DOM scrape パターンを member shell に適用し、親 parallel-03 台帳の EV-13（member DOM scrape）と EV-16（member screenshot）を `pending` → `present` に昇格した。

## issue #903 調査結論（2026-05-25 時点 current code）

| 観点 | 結論 |
|------|------|
| `(member)` route group 内 child route | **実装済み**（`apps/web/app/(member)/profile/`）|
| `/profile` route | URL は維持し、物理配置を `apps/web/app/(member)/profile/page.tsx` へ移動済み |
| serial-05 委譲先での EV-13/EV-16 オーナーシップ | `serial-05-page-routes-blueprint-binding/phase-11-evidence-inventory.md` に EV-13 記載なし（**宙吊り状態継続**）|
| serial-07 委譲先での EV-16 | `serial-07-regression-evidence/phase-08-dod.md` の screenshot set に `(member)` group 無し（**宙吊り状態継続**）|
| `parallel-03-member-shell-scrape.spec.ts` | **作成済み / PASS** |
| 親 `outputs/phase-11/dom-scrape-member.txt` | **作成済み** |

→ 「既に解決済み」ではなかった followup-002 R-07（委譲 EV の宙吊り）を、**本タスクで根本解決した。**

## 現コードへの最適化方針（issue 原案からの差分）

issue 原案は「serial-05 の `(member)` 配下 child route land」を **強ブロッカー**としていたが、現状 serial-05 完了見込みが立っていない。`/profile` が `apps/web/app/profile/` に既に存在し、内容上は member 認証画面である事実に基づき、次の最適化を行う:

- **`/profile` を `apps/web/app/(member)/profile/` へ移動する**（route group は URL に影響しない仕様のため `/profile` の URL は不変）
- これにより `(member)/layout.tsx`（`data-theme="warm"` / `data-route-group="member"` / `data-testid="member-shell"` 契約属性）が `/profile` 描画時に適用され、EV-13 scrape 対象が成立する
- serial-05 完了を待たず、本タスク 1 サイクルで EV-13/EV-16 を `present` に昇格できる

## スコープ（1 実装サイクル / CONST_007）

- 移動: `apps/web/app/profile/**` → `apps/web/app/(member)/profile/**`（page.tsx / error.tsx / loading.tsx / not-found.tsx / _components / _lib / __tests__）
- 新規: `apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts`
- 新規: 親 `parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt`（EV-13）
- 新規: 親 `parallel-03-appshell-layouts/outputs/phase-11/screenshots/member-shell.png`（EV-16）
- 編集: 親 `parallel-03-appshell-layouts/phase-11-evidence-inventory.md`（EV-13/EV-16=present）

## 不変条件

1. 既存 API endpoint surface のみ利用（追加・変更禁止）
2. OKLch トークン正本化（HEX / `bg-[#xxx]` 禁止）
3. プロトタイプ正本順位（新規 primitive 追加禁止）
4. `apps/web` から D1 直接アクセス禁止

## Phase 一覧

- [phase-01-requirements.md](./phase-01-requirements.md)
- [phase-02-architecture.md](./phase-02-architecture.md)
- [phase-03-task-breakdown.md](./phase-03-task-breakdown.md)
- [phase-04-interface-contract.md](./phase-04-interface-contract.md)
- [phase-05-implementation-guide.md](./phase-05-implementation-guide.md)
- [phase-06-test-strategy.md](./phase-06-test-strategy.md)
- [phase-07-quality-gates.md](./phase-07-quality-gates.md)
- [phase-08-dod.md](./phase-08-dod.md)
- [phase-09-risks.md](./phase-09-risks.md)
- [phase-10-local-verification.md](./phase-10-local-verification.md)
- [phase-11-evidence-inventory.md](./phase-11-evidence-inventory.md)
- [phase-12-compliance-check.md](./phase-12-compliance-check.md)
- [phase-13-commit-pr.md](./phase-13-commit-pr.md)
