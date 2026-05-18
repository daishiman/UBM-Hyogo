---
phase: 11
title: Evidence Inventory
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 11 — Evidence Inventory

[実装区分: 実装仕様書]

## 1. 取得 evidence 一覧（最小 set）

| evidence ID | 種別 | パス | 取得方法 | 用途 |
|-------------|-----|------|---------|------|
| EV-01 | log | `outputs/phase-11/typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/typecheck.log` | QG-01 |
| EV-02 | log | `outputs/phase-11/lint.log` | `mise exec -- pnpm lint 2>&1 \| tee outputs/phase-11/lint.log` | QG-02 |
| EV-03 | log | `outputs/phase-11/vitest.log` | `mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/app/__tests__ 2>&1 \| tee outputs/phase-11/vitest.log` | QG-03 |
| EV-04 | log | `outputs/phase-11/build.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 \| tee outputs/phase-11/build.log` | QG-04 |
| EV-05 | log | `outputs/phase-11/design-tokens.log` | `mise exec -- pnpm verify:design-tokens 2>&1 \| tee outputs/phase-11/design-tokens.log` | QG-05 |
| EV-06 | log | `outputs/phase-11/test-suffix.log` | `mise exec -- pnpm verify:test-suffix 2>&1 \| tee outputs/phase-11/test-suffix.log` | QG-06 |
| EV-07 | log | `outputs/phase-11/pr-ready.log` | `bash scripts/verify-pr-ready.sh 2>&1 \| tee outputs/phase-11/pr-ready.log` | QG-07 |
| EV-08 | text | `outputs/phase-11/toast-provider-grep.txt` | `grep -rln "ToastProvider" apps/web/app/ > outputs/phase-11/toast-provider-grep.txt` | QG-08 |
| EV-09 | text | `outputs/phase-11/hex-direct-grep.txt` | `grep -rEn "#[0-9a-fA-F]{3,8}\b" apps/web/app/{layout,error,not-found,loading}.tsx > outputs/phase-11/hex-direct-grep.txt \|\| true` | QG-09 |
| EV-10 | image | `outputs/phase-11/fallback-not-found.png` | dev server 起動後、ブラウザで `/__missing-ui-foundation-route` を screenshot | VISUAL evidence |

## 2. 出力ディレクトリ

`docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/outputs/phase-11/`

すべて相対パスは workflow root（`docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/`）からの相対。

## 3. 物理存在チェック

CI gate `phase11-evidence-existence-validator` が以下を検証する:

- EV-01..09 の log/text ファイルが Phase 11 ディレクトリに物理存在
- 各ログ末尾に exit code に相当する成功マーカー（コマンドが正常終了している）

EV-10（image）は VISUAL workflow の必須証跡とする。加えて serial-07 の `outputs/phase-11/screenshots/{top,members-list,member-detail,admin-dashboard}.png` を全体 visual regression の必須証跡として参照する。

## 4. 取得スクリプト（参考）

```bash
mkdir -p docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/outputs/phase-11
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4

OUT="docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/outputs/phase-11"

mise exec -- pnpm typecheck 2>&1 | tee "$OUT/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$OUT/lint.log"
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/app/__tests__ 2>&1 | tee "$OUT/vitest.log"
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee "$OUT/build.log"
mise exec -- pnpm verify:design-tokens 2>&1 | tee "$OUT/design-tokens.log"
mise exec -- pnpm verify:test-suffix 2>&1 | tee "$OUT/test-suffix.log"
bash scripts/verify-pr-ready.sh 2>&1 | tee "$OUT/pr-ready.log"
grep -rln "ToastProvider" apps/web/app/ > "$OUT/toast-provider-grep.txt"
grep -rEn "#[0-9a-fA-F]{3,8}\b" apps/web/app/layout.tsx apps/web/app/error.tsx apps/web/app/not-found.tsx apps/web/app/loading.tsx > "$OUT/hex-direct-grep.txt" || true
```

## 5. PR 本文への参照

PR 本文の Phase 11 evidence 表に EV-01..10 を列挙する。

## 6. 参照

- Phase 7 品質ゲート
- `.claude/skills/task-specification-creator/references/phase11-evidence-inventory.md`
- `scripts/verify-pr-ready.sh`
