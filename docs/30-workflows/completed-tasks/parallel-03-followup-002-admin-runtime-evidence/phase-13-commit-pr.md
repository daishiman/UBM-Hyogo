---
phase: 13
title: PR 作成 — commit draft / PR draft（user 承認後のみ実行）
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-followup-002-admin-runtime-evidence
status: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: verify_existing
---

# Phase 13 — Commit / PR

[実装区分: 実装仕様書]

> **CONST_002 / CONST_006**: commit / push / PR 作成は **user の明示承認後のみ** 実行する。本 spec 段階では一切実行しない。base ブランチは **`dev`**（production リリース時のみ `main`）。

## 1. PR に含めるファイル一覧（実装後の想定）

| 種別 | パス |
|------|------|
| 新規 | `apps/web/playwright/tests/parallel-03-admin-shell-scrape.spec.ts` |
| 編集 | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/phase-11-evidence-inventory.md`（EV-12=present + EV-13/15/16 委譲注記） |
| 生成 | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-11/dom-scrape-admin.txt` |
| 新規（spec 一式） | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-followup-002-admin-runtime-evidence/**` |

## 2. commit message draft

```
test(parallel-03): capture admin AppShell runtime DOM evidence (EV-12)

- add parallel-03-admin-shell-scrape.spec.ts (admin fixture + mock API)
- scrape data-(theme|route-group|shell|route|testid) from /admin
- promote parent EV-12 inventory pending -> present, optimize grep pattern
- delegate EV-13 (member scrape) to serial-05, EV-15/16 (screenshots) to serial-07 (#829)

Refs #833

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

## 3. PR draft

- **base**: `dev`
- **title**: `test(parallel-03): admin AppShell runtime DOM evidence (EV-12) — issue #833 optimized`
- **body 要点**:
  - issue #833（CLOSED）を current code に最適化した縮小スコープ実装。
  - parallel-03 の data-* 契約（PR #835 merge 済み）が runtime DOM に出力されることを Playwright scrape で evidence 化。
  - status 語彙を `captured`（validator invalid）→ `present` に是正、grep パターンを current 実属性へ最適化。
  - EV-13/15/16 は serial-05 / serial-07 (#829) へ委譲（理由を親台帳に明記）。
  - 視覚証跡: NON_VISUAL（DOM scrape = text evidence）。screenshot 不要。
  - リスク: Phase 9 R-01..R-07 を参照。
- **issue #833 の扱い**: CLOSED のまま。本 PR は再 open しない（Refs として参照のみ）。

## 4. PR 前チェック（CLAUDE.md「PR作成の完全自律フロー」準拠）

```bash
git status --porcelain          # 空であること
git diff dev...HEAD --name-only # PR 対象ファイル一覧
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

> screenshot は無いため PR 本文にスクリーンショット専用セクションを作らない（NON_VISUAL）。
