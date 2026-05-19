---
phase: 7
title: 品質ゲート
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. ローカル必須ゲート

| Gate | コマンド | 期待 |
|------|---------|------|
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0 |
| design-token grep | `grep -rEn 'bg-\[#\|text-\[#\|border-\[#' apps/web/src` | 0 hit |
| selector 重複 grep | `grep -nE 'parallel-02 G3-[123]' apps/web/src/styles/globals.css` | start/end ペアが 3 セット (= 6 hit) |
| PR pre-flight | `bash scripts/verify-pr-ready.sh` | exit 0 |

## 2. CI 必須ゲート

| Gate | workflow | 期待 |
|------|---------|------|
| `verify-design-tokens` | `.github/workflows/verify-design-tokens.yml` | green |
| `playwright-smoke / smoke (chromium)` | `.github/workflows/playwright-smoke.yml` | green |
| `playwright-smoke / visual (chromium, 4 screens)` | 同上 | green |
| `verify-indexes-up-to-date` | `.github/workflows/verify-indexes.yml` | green |
| `verify-phase12-compliance` | task-specification-creator gate | green |
| `gate-metadata-validate` | artifacts.json zod schema | green |

## 3. quality gate 失敗時の対応

| 失敗 gate | 想定原因 | 対応 |
|-----------|---------|------|
| typecheck | (本件は CSS のみのため通常 fail しない) | 別 step の不整合を疑う |
| lint | CSS の stylelint 違反 (もし設定あり) | 該当行を修正 |
| verify-design-tokens | HEX 直書きが混入 | grep で該当箇所を特定し token 化 |
| visual snapshot diff | baseline 未更新 / token 値変化 | 意図変更なら `--update-snapshots`、意図外なら CSS 修正 |
| a11y violation | `aria-selected` の使い方が不正 | markup 側 (依存サブワークフロー) で修正 |

## 4. レビュー観点 (self-review checklist)

- [ ] 追加 selector がすべて `var(--ubm-*)` 経由
- [ ] HEX / `bg-[#xxx]` などの直書きなし
- [ ] マーカーコメントが start/end ペアで完備 (G3-1/G3-2/G3-3 × 2 = 6 行)
- [ ] 既存 parallel-09 規則を変更していない
- [ ] `@layer components` の閉じ括弧位置が正しい (115 + 追加行)
- [ ] `prefers-reduced-motion` 規則が transition を無効化できる位置にある
