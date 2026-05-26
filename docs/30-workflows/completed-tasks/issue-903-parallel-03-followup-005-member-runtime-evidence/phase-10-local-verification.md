---
phase: 10
title: Local verification
workflow_id: ui-prototype-design-system-foundation
sub_workflow: issue-903-parallel-03-followup-005-member-runtime-evidence
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL
implementation_mode: code_change_plus_evidence
---

# Phase 10 — Local verification

[実装区分: 実装仕様書]

## 10.1 検証コマンド順序

```bash
# 1. 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 2. 既存 unit（profile move 影響範囲）
mise exec -- pnpm --filter @ubm-hyogo/web test -- profile static-invariants

# 3. Playwright scrape + screenshot（webServer 自動起動）
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/parallel-03-member-shell-scrape.spec.ts \
  --project=desktop-chromium --reporter=line

# 4. evidence 確認
grep -c 'data-route-group="member"' \
  docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-member.txt
test -s docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/screenshots/member-shell.png && echo OK

# 5. compliance gate
mise exec -- pnpm verify:phase12-compliance
bash scripts/verify-pr-ready.sh
```

## 10.2 期待結果サマリ

| 観点 | 期待 |
|------|------|
| typecheck | 0 error |
| lint | 0 error |
| profile unit | 既存 pass 維持 |
| static-invariants | 4 ケース pass |
| Playwright scrape | 1 spec pass |
| dom-scrape-member.txt | `data-route-group="member"` 1 件以上 |
| member-shell.png | 非空 |
| verify-pr-ready | 0 fail |
