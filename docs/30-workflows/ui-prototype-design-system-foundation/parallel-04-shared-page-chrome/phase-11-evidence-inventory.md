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
| EV-05 | log | `outputs/phase-11/design-tokens.log` | `mise exec -- pnpm verify:tokens 2>&1 \| tee outputs/phase-11/design-tokens.log` | QG-05 |
| EV-06 | log | `outputs/phase-11/test-suffix.log` | `test -z "$(find apps/web -name '*.test.*' -print -quit)" 2>&1 \| tee outputs/phase-11/test-suffix.log` | QG-06 |
| EV-07 | log | `outputs/phase-11/pr-ready.log` | `bash scripts/verify-pr-ready.sh 2>&1 \| tee outputs/phase-11/pr-ready.log` | QG-07 |
| EV-08 | text | `outputs/phase-11/toast-provider-grep.txt` | `find apps/web/app -path '*/__tests__/*' -prune -o -type f \( -name '*.tsx' -o -name '*.ts' \) -print \| xargs rg -n "ToastProvider" > outputs/phase-11/toast-provider-grep.txt` | QG-08 |
| EV-09 | text | `outputs/phase-11/hex-direct-grep.txt` | `grep -rEn "#[0-9a-fA-F]{3,8}\b" apps/web/app/{layout,error,not-found,loading}.tsx > outputs/phase-11/hex-direct-grep.txt \|\| true` | QG-09 |
| EV-10 | json | `outputs/phase-11/screenshot-plan.json` | root/error/not-found/loading の capture URL と viewport を列挙 | VISUAL plan |
| EV-11 | json | `outputs/phase-11/phase11-capture-metadata.json` | browser / viewport / baseUrl / runAt / commit を記録 | VISUAL provenance |
| EV-12 | image | `outputs/phase-11/root-layout.png` | dev server 起動後、ブラウザで `/` を screenshot | root chrome |
| EV-13 | image | `outputs/phase-11/fallback-error.png` | dev server 起動後、`/smoke/error-boundary` を screenshot | error fallback |
| EV-14 | image | `outputs/phase-11/fallback-not-found.png` | dev server 起動後、`/__missing-ui-foundation-route` を screenshot | not-found fallback |
| EV-15 | image | `outputs/phase-11/fallback-loading.png` | dev server 起動後、`/smoke/loading-state` を screenshot | loading fallback |
| EV-16 | markdown | `outputs/phase-11/ui-sanity-visual-review.md` | 4 screenshots の viewport / overlap / token / CTA 状態を人手確認 | visual review |

## 2. 出力ディレクトリ

`docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/outputs/phase-11/`

すべて相対パスは workflow root（`docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/`）からの相対。

## 3. 物理存在チェック

CI gate `phase11-evidence-existence-validator` が以下を検証する:

- EV-01..16 の log/text/json/markdown/image ファイルが Phase 11 ディレクトリに物理存在
- 各ログ末尾に exit code に相当する成功マーカー（コマンドが正常終了している）

EV-12..15（image）は parallel-04 の root fallback visual 必須証跡として本サブワークフローで取得する。加えて serial-07 の `outputs/phase-11/screenshots/{top,members-list,member-detail,admin-dashboard}.png` を全体 visual regression の必須証跡として参照する。

## 4. 取得スクリプト（参考）

```bash
mkdir -p docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/outputs/phase-11
cd <repo-root>

OUT="docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/outputs/phase-11"

mise exec -- pnpm typecheck 2>&1 | tee "$OUT/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$OUT/lint.log"
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/app/__tests__ 2>&1 | tee "$OUT/vitest.log"
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee "$OUT/build.log"
mise exec -- pnpm verify:tokens 2>&1 | tee "$OUT/design-tokens.log"
test -z "$(find apps/web -name '*.test.*' -print -quit)" 2>&1 | tee "$OUT/test-suffix.log"
bash scripts/verify-pr-ready.sh 2>&1 | tee "$OUT/pr-ready.log"
find apps/web/app -path '*/__tests__/*' -prune -o -type f \( -name '*.tsx' -o -name '*.ts' \) -print | xargs rg -n "ToastProvider" > "$OUT/toast-provider-grep.txt"
grep -rEn "#[0-9a-fA-F]{3,8}\b" apps/web/app/layout.tsx apps/web/app/error.tsx apps/web/app/not-found.tsx apps/web/app/loading.tsx > "$OUT/hex-direct-grep.txt" || true
printf '%s\n' '{"targets":["/smoke/ui-primitives","/smoke/error-boundary","/__missing-ui-foundation-route","/smoke/loading-state?preview=loading"],"viewports":["desktop"],"status":"captured"}' > "$OUT/screenshot-plan.json"
printf '%s\n' '{"status":"captured","owner":"parallel-04-shared-page-chrome"}' > "$OUT/phase11-capture-metadata.json"
```

## 5. PR 本文への参照

PR 本文の Phase 11 evidence 表に EV-01..16 を列挙する。

## 6. 参照

- Phase 7 品質ゲート
- `.claude/skills/task-specification-creator/references/phase11-evidence-inventory.md`
- `scripts/verify-pr-ready.sh`
