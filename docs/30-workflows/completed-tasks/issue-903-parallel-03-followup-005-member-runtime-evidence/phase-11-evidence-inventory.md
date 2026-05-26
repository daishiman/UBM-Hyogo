---
phase: 11
title: Evidence inventory
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 11 — Evidence inventory

[実装区分: 実装仕様書]

## Phase 11 evidence file inventory

| Classification | Path | Status | Notes |
|----------------|------|--------|-------|
| typecheck log | `outputs/phase-11/typecheck.log` | present | `pnpm --filter @ubm-hyogo/web typecheck` PASS |
| lint log | `outputs/phase-11/lint.log` | present | `pnpm --filter @ubm-hyogo/web lint` PASS |
| profile unit log | `outputs/phase-11/profile-unit.log` | present | profile move 影響範囲 20 files / 113 tests PASS |
| Playwright scrape log | `outputs/phase-11/playwright-member-scrape.log` | present | `parallel-03-member-shell-scrape.spec.ts` 1 passed |
| DOM scrape (member) | `outputs/phase-11/dom-scrape-member.txt` | present | 親 parallel-03 outputs/phase-11/ 直下と同一ファイルを本 spec 配下にも複写済み。trace header + data-* 行 |
| screenshot (member) | `outputs/phase-11/screenshots/member-shell.png` | present | 1280x800 1 枚 |
| parent ledger diff | `outputs/phase-11/parent-ledger-ev13-ev16-diff.txt` | present | EV-13/EV-16 = present 昇格 diff |
| verify-pr-ready log | `outputs/phase-11/verify-pr-ready.log` | n/a | commit / push / PR 前 gate。Phase 13 は user approval 後 |

## Evidence trace

各 evidence は本 sub-workflow `outputs/phase-11/` 配下に保存する。`dom-scrape-member.txt` と `screenshots/member-shell.png` は親 `parallel-03-appshell-layouts/outputs/phase-11/` 配下にも複製し、親台帳 EV-13 / EV-16 を `present` に昇格する根拠とする。

status 語彙は `present` / `pending` / `n/a` のみ。commit / push / PR は Phase 13 user gate のため本 Phase 11 evidence では `n/a` とする。
