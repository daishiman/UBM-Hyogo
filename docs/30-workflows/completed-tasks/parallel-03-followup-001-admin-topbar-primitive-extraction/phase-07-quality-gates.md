---
phase: 7
title: Quality gates — G1..G7
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 7 — Quality gates

[実装区分: 実装仕様書]

## 1. ゲート定義

| ID | ゲート | コマンド | 合格条件 |
| --- | --- | --- | --- |
| G1 | typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| G2 | lint | `mise exec -- pnpm lint` | exit 0 / 0 warning |
| G3 | primitive 単体 spec | `mise exec -- pnpm exec vitest run apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` | 全 case pass |
| G4 | 既存 layout spec（無修正 pass） | `mise exec -- pnpm exec vitest run "apps/web/app/(admin)/layout.spec.tsx"` | 全 case pass・spec ファイル diff なし |
| G5 | web build | `ENVIRONMENT=local SENTRY_ENVIRONMENT=local SENTRY_TRACES_SAMPLE_RATE=0 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 PUBLIC_API_BASE_URL=http://127.0.0.1:8787 INTERNAL_API_BASE_URL=http://127.0.0.1:8787 AUTH_URL=http://127.0.0.1:3000 mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0 |
| G6 | verify-design-tokens | `mise exec -- pnpm verify:tokens` | HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件 |
| G7 | axe critical | G3 内 axe ケース | critical violation 0 |

## 2. ゲート対応 CI

- G1/G2: 標準パイプライン。
- G6: `.github/workflows/verify-design-tokens.yml`（`verify-design-tokens / verify-design-tokens`）。
- G3/G4/G7: web test job。
- visual 非回帰（参考）: `.github/workflows/playwright-visual-full.yml`（admin route baseline）。新規 baseline コミットは不要だが、PR で visual-full が green であることを確認する。

## 3. ゲート失敗時の是正

| 検出 | 是正 |
| --- | --- |
| `bg-[#xxx]` 直書き | `var(--ubm-color-*)` に置換（G6 fail 防止） |
| `*.test.tsx` 検出 | `*.spec.tsx` にリネーム |
| `data-shell="topbar"` 欠落で G4 fail | primitive root の `data-shell` 付与を確認 |
| axe critical | actions placeholder の `aria-hidden` 出し分けを確認 |
| layout spec の diff 発生 | spec を元に戻す（無修正 pass が契約） |

## 4. ゲート通過順

G1 → G2 → G3 → G4 → G5 → G6 → G7 をすべて green にしてから Phase 8（DoD）を判定。
