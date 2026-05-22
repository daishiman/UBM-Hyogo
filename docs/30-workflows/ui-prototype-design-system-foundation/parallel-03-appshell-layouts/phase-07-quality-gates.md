---
phase: 7
title: 品質ゲート — typecheck / lint / build / verify-design-tokens
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. ゲート一覧（ローカル / CI 共通）

| Gate | コマンド | 目的 | 失敗時の対処 |
|------|----------|------|-------------|
| G1 typecheck | `mise exec -- pnpm typecheck` | TypeScript strict mode 維持 | Phase 5 スケルトンの型不整合を最小差分で修正 |
| G2 lint | `mise exec -- pnpm lint` | ESLint / Prettier 規約 | `pnpm lint --fix` → 残違反を手修正 |
| G3 web build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | OpenNext Workers 互換 build | Next.js 16 webpack の boundary 違反確認（"use client" 漏れ等） |
| G4 web test | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 3 layout spec + 既存 spec regression | 該当 spec 単体で再実行・mock 確認 |
| G5 verify-design-tokens | `bash scripts/verify-design-tokens.sh` | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` reject | 違反箇所を `var(--ubm-color-*)` に置換 |
| G6 verify-test-suffix | `bash scripts/verify-test-suffix.sh` | `*.test.tsx` を reject | `*.spec.tsx` にリネーム |
| G7 verify-pr-ready | `bash scripts/verify-pr-ready.sh` | Phase 12 compliance / gate-metadata / indexes drift | `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` 参照 |

## 2. ゲート実行順序

```
G1 (typecheck) → G2 (lint) → G3 (build) → G4 (test) → G5 (design-tokens) → G6 (test-suffix) → G7 (pr-ready)
```

G1 / G2 が失敗する場合 G3 以降は skip 可能（fail-fast）。

## 3. CI required status checks との整合

CLAUDE.md「Governance / CODEOWNERS」セクションで `dev` / `main` の required status check に以下が含まれる:

- `verify-design-tokens / verify-design-tokens`（G5 と同一）
- `playwright-smoke / smoke (chromium)`（serial-07 の責務）
- `playwright-smoke / visual (chromium, 4 screens)`（serial-07 の責務）

本サブワークフローは **G5 を満たす layout class 規律** が責務であり、Playwright check は serial-07 で取得する。

## 4. 性能ゲート

- AppShell SSR 時間に明示的な閾値はない（Server Component のみで I/O は `getSession()` の cookie + JWT decode のみ）
- Admin layout の `getSession()` を **1 layout 内で 1 回**に限定（page で重複呼び出しせず session を context で共有するか、page 側で再取得しても OK だが二重 D1 read は発生しない）

## 5. アクセシビリティゲート

- axe-core critical / serious 違反 0（Phase 6 §7）
- WCAG 2.2 AA 相当の contrast を tokens 経由で保証（parallel-01 の責務）
- 本 layout 側では `<header>` / `<main>` / `<aside>` / `<footer>` の landmark を必ず使う

## 6. セキュリティゲート

| 項目 | 確認 |
|------|------|
| D1 直接アクセス禁止 | layout 内に `D1` / `DB` import なし |
| Server Action の追加 | 本サブワークフローでは作らない |
| 環境変数の直接参照 | `process.env.*` 直接参照禁止。`getSession()` / `getEnv()` 経由のみ |
| CSP / SRI | root layout の責務（parallel-04） |

## 7. 回帰ゲート

| 既存挙動 | 検証方法 |
|---------|---------|
| `/admin` 未認証 → `/login?next=/admin` | Admin layout spec で `redirect` mock 呼び出しを検証 |
| `/admin` non-admin → `/login?gate=forbidden` | 同上 |
| `/admin` admin → render | 同上 |
| 既存 `middleware.spec.ts` | 既存 spec が green を維持 |

## 8. ゲート実行ログの保管

Phase 11 evidence inventory に以下を記録:

- G1-G6 の最終 exit code（0 を確認）
- G3 build の output size 差分（前 commit との比較は任意）
- G4 test の suite 数 / pass 数 / coverage line %
