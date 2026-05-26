---
phase: 7
title: Quality gates
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 7 — Quality gates

[実装区分: 実装仕様書]

## 7.1 Gate 一覧

| Gate | 条件 | 検証コマンド |
|------|------|-------------|
| Gate-A: spec review | Phase 1-13 揃い・canonical 9 headings 順守 | `pnpm verify:phase12-compliance` |
| Gate-B: typecheck/lint | 0 error | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` |
| Gate-C: scrape evidence | `dom-scrape-member.txt` 非空・`data-route-group="member"` 含有 | `grep -c 'data-route-group="member"' .../dom-scrape-member.txt` |
| Gate-D: screenshot evidence | `member-shell.png` 存在・>0 byte | `test -s .../screenshots/member-shell.png` |
| Gate-E: PR ready | verify-pr-ready 0 fail | `bash scripts/verify-pr-ready.sh` |
| Gate-F: ledger update | 親台帳 EV-13 / EV-16 = `present` | grep 確認 |

## 7.2 gate fail 時の戻し

| Gate | fail 原因候補 | 戻し先 |
|------|--------------|--------|
| Gate-B | profile import 修正漏れ | Phase 5 Step 2 |
| Gate-C | mock API レスポンス不足で空 scrape | Phase 6 fixture 拡張 |
| Gate-D | viewport 設定漏れ | Phase 4 spec |
| Gate-E | indexes drift / gate-metadata | Phase 12 補修 |
