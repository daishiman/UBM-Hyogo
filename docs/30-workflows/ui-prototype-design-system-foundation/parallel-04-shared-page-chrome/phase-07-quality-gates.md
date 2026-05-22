---
phase: 7
title: 品質ゲート
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. ゲート一覧

| ID | ゲート | 実行コマンド | 合格条件 |
|----|-------|------------|---------|
| QG-01 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| QG-02 | lint | `mise exec -- pnpm lint` | exit 0 |
| QG-03 | unit test (本 sub) | `mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/app/__tests__` | 全 spec PASS |
| QG-04 | build (webpack) | `mise exec -- pnpm --filter @ubm-hyogo/web build` | Next.js build success |
| QG-05 | verify-design-tokens（HEX 直書き 0 件） | `mise exec -- pnpm verify:tokens` | exit 0 |
| QG-06 | test suffix grep（`*.test.*` 不在） | `test -z "$(find apps/web -name '*.test.*' -print -quit)"` | exit 0 |
| QG-07 | verify-pr-ready（PR pre-flight） | `bash scripts/verify-pr-ready.sh` | exit 0 |
| QG-08 | grep 検証: ToastProvider 単一配置 | `find apps/web/app -path '*/__tests__/*' -prune -o -type f \( -name '*.tsx' -o -name '*.ts' \) -print \| xargs rg -n "ToastProvider"` | runtime source は `app/layout.tsx` の import / render のみ |
| QG-09 | grep 検証: HEX 直書きなし | `grep -rEn "#[0-9a-fA-F]{3,8}\\b" apps/web/app/{layout,error,not-found,loading}.tsx` | 0 件 |
| QG-10 | grep 検証: `*.test.*` 不在 | `grep -rln "\\.test\\.\\(ts\\|tsx\\)" apps/web/app/` | 0 件 |

## 2. ゲート失敗時の対応指針

| 失敗 | 推定原因 | 対応 |
|------|---------|-----|
| QG-01 typecheck | root fallback の相対 import 未解決 | `app/` から `../src/*` への相対 path を確認 |
| QG-02 lint | 未使用 import / quote style | `pnpm lint --fix` |
| QG-03 unit | jsdom が `<html>` を render できない | layout spec は export 値のみ検証する形に縮退 |
| QG-04 build | viewport export 形式不正 | Next 公式の Viewport 型に合わせる |
| QG-05 design-tokens | HEX 直書き混入 | QG-09 grep で特定 |
| QG-07 pr-ready | gate-metadata / phase12 compliance 失敗 | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` |

## 3. CI required status check 候補（参考）

- `verify-design-tokens` （task-18 由来 / CLAUDE.md に明示済み）
- `test suffix grep`
- `typecheck` / `lint`
- `playwright-smoke` は serial-07 担当のため本サブワークフロー単独では走らない

## 4. 段階的検証順序（推奨）

```bash
# 1. local fast 検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 2. unit
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/app/__tests__

# 3. token / suffix gate
mise exec -- pnpm verify:tokens
test -z "$(find apps/web -name '*.test.*' -print -quit)"

# 4. build
mise exec -- pnpm --filter @ubm-hyogo/web build

# 5. runtime source grep
find apps/web/app -path '*/__tests__/*' -prune -o -type f \( -name '*.tsx' -o -name '*.ts' \) -print | xargs rg -n "ToastProvider"

# 6. PR pre-flight
bash scripts/verify-pr-ready.sh
```

## 5. 参照

- Phase 6 テスト方針
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- `scripts/verify-pr-ready.sh`
