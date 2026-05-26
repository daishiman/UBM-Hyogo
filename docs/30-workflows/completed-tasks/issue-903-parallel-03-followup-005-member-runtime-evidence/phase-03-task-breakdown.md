---
phase: 3
title: Task breakdown
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 3 — Task breakdown

[実装区分: 実装仕様書]

## 3.1 サブタスク（1 実装サイクル内・CONST_007 順守）

| ID | サブタスク | 種別 | 依存 |
|----|-----------|------|------|
| T-01 | `apps/web/app/profile/**` を `apps/web/app/(member)/profile/**` へ git mv | code | なし |
| T-02 | `(member)/profile/` 配下の相対 import パス調整（深さ +1） | code | T-01 |
| T-03 | `apps/web/src/__tests__/static-invariants.runtime.spec.ts` の `app/profile` path 参照を `app/(member)/profile` へ更新 | code | T-01 |
| T-04 | `parallel-03-member-shell-scrape.spec.ts` を admin spec の複製ベースで作成 | code | T-01 |
| T-05 | scrape 実行 → `dom-scrape-member.txt` 生成 | evidence | T-04 |
| T-06 | screenshot 実行 → `member-shell.png` 生成 | evidence | T-04 |
| T-07 | 親 `phase-11-evidence-inventory.md` の EV-13 / EV-16 を `present` 昇格 | docs | T-05, T-06 |
| T-08 | `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` | gate | T-07 |

## 3.2 未タスク化判定

なし。すべて本サイクル内で完了させる。

委譲を維持する residual:

- serial-07 / UT-DSF-07 (#829) が追加する `(member)` full chrome multi-viewport baseline（本タスクは 1280x800 1 枚のみ）

## 3.3 並列化可能ペア

- T-05 と T-06 は同一 spec 内に統合可能（1 回の Playwright 実行で DOM scrape + screenshot を両方取得）
