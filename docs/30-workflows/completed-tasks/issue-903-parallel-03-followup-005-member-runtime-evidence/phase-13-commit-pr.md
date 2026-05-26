---
phase: 13
title: Commit & PR draft
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 13 — Commit & PR draft

[実装区分: 実装仕様書]

## 13.1 commit 計画（1 commit を推奨）

```
feat(issue-903): member AppShell runtime evidence (EV-13/EV-16) + move /profile under (member) route group

- move apps/web/app/profile/** -> apps/web/app/(member)/profile/**
  (route group does not affect URL; /profile URL unchanged)
- adjust static-invariants.runtime.spec.ts paths (S-01/S-02/S-04/S-04b)
- add apps/web/playwright/tests/parallel-03-member-shell-scrape.spec.ts
- capture dom-scrape-member.txt + screenshots/member-shell.png
- promote parent parallel-03 ledger EV-13 / EV-16 to present
- resolves followup-002 R-07 (delegated EV ownership gap)
```

## 13.2 PR draft

**Base branch**: `dev`

**Title**:

```
feat(issue-903): member AppShell runtime evidence (EV-13/EV-16) + /profile under (member) group
```

**Body**:

```
## Summary

- `/profile` を `apps/web/app/(member)/profile/` 配下へ移動（route group は URL に影響しないため `/profile` の URL は不変）
- member AppShell layout の data-* 契約（`data-theme="warm"` / `data-route-group="member"` / `data-shell` / `data-route` / `data-testid="member-shell"`）を runtime DOM scrape で検証する `parallel-03-member-shell-scrape.spec.ts` を追加
- `dom-scrape-member.txt`（trace header + data-* 行）と `screenshots/member-shell.png`（1280x800）を取得
- 親 `parallel-03-appshell-layouts/phase-11-evidence-inventory.md` の EV-13 / EV-16 を `pending` → `present` に昇格
- followup-002 R-07（委譲 EV の宙吊り）を根本解消

## Why

issue #903 が指摘した「委譲先（serial-05 / serial-07 / UT-DSF-07）が EV-13/EV-16 を取得責務として保持していない」状況を、serial-05 完了を待たず先行解消する。`/profile` が既に member 認証画面として動作している事実を活かし、`(member)` route group 配下へ移動するだけで scrape 対象 child route を成立させる。

## Test plan

- [ ] `mise exec -- pnpm typecheck` 0 error
- [ ] `mise exec -- pnpm lint` 0 error
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- profile static-invariants` pass
- [ ] `pnpm --filter @ubm-hyogo/web exec playwright test parallel-03-member-shell-scrape.spec.ts --project=desktop-chromium` pass
- [ ] `grep -c 'data-route-group="member"' .../dom-scrape-member.txt` >= 1
- [ ] `test -s .../screenshots/member-shell.png`
- [ ] `bash scripts/verify-pr-ready.sh` 0 fail

## Scope notes

- 既存 `/profile` の内部実装（page / components / lib）は **無変更**（move のみ）
- 新規 API endpoint / D1 schema 変更なし
- 新規 primitive 追加なし
- full chrome multi-viewport baseline は引き続き serial-07 / UT-DSF-07 (#829) の責務
```

## 13.3 ユーザー承認ゲート

commit / push / PR 作成は **ユーザー指示まで実行禁止**。本 spec は draft 段階。
