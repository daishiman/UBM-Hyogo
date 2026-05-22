---
phase: 8
title: DoD — 19 routes build green + Playwright 4 screens
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 8 — DoD（完了条件）

[実装区分: 実装仕様書]

## 1. 必須 DoD（全件 green が必要）

| # | 条件 | 検証 |
|---|------|------|
| DoD-1 | 19 routes 全 page.tsx が `// serial-05: <route> — blueprint 09X:LLL-MMM` コメント付きで存在 | grep G-1 |
| DoD-2 | `pnpm typecheck` exit 0 | CI |
| DoD-3 | `pnpm lint` exit 0 | CI |
| DoD-4 | `pnpm build`（next build --webpack）exit 0 | CI |
| DoD-5 | `web-unit`（vitest）exit 0 | CI |
| DoD-6 | `playwright-smoke / smoke (chromium)` 19 routes 全件 pass | CI |
| DoD-7 | `playwright-smoke / visual (chromium, 4 screens)` 4 screens snapshot 取得（SW-07 と統合点） | CI / outputs/phase-11 |
| DoD-8 | `verify-design-tokens` exit 0（HEX 0 件） | CI |
| DoD-9 | `verify-test-suffix` exit 0 | CI |
| DoD-10 | adapter 層 unit test が `apps/web/src/lib/adapters/__tests__/` 配下に揃う | local + CI |
| DoD-11 | `apps/api/src/routes/` の diff 0 件（新規 endpoint 禁止） | git diff |
| DoD-12 | `apps/web/src/components/ui/` への新規 primitive 追加 0 件 | git diff |
| DoD-13 | `bash scripts/verify-pr-ready.sh` exit 0 | local + CI |

## 2. 4 screens Playwright visual の対象

| screen | URL | viewport | fixture |
|--------|-----|----------|---------|
| top | `/` | 1280×800 | public stats / recent members fixture |
| members-list | `/members?density=comfortable` | 1280×800 | listMembers fixture |
| member-detail | `/members/<seeded-id>` | 1280×800 | public-member-detail fixture |
| admin-dashboard | `/admin` | 1440×900 | admin-dashboard fixture |

snapshot は Playwright 既定の `apps/web/playwright/tests/visual/*.spec.ts-snapshots/` 配下に保存（既存 spec 群の配置に揃える）。本 SW では snapshot を新規 baseline 化しない（SW-07 で baseline 固定）。

## 3. Evidence 物理存在（Phase 11 と連携）

`outputs/phase-11/` 配下に:

- `playwright-smoke.json`（19 routes 結果サマリ）
- `verify-design-tokens.log`
- `screenshots/`（4 screens, SW-07 と統合）

詳細は Phase 11 で列挙。

## 4. 非 DoD（本 SW では扱わない）

- form 再回答 → 本人更新フローの実装（MVP 仕様外）
- D1 schema 変更
- 新規 API endpoint
- login/profile の route group 物理移動
- visual baseline 固定（SW-07 担当）
- MemberDetail の API response_fields 描画ロジック（SW-06 担当）

## 5. CONST_007 適合確認

本 SW 内で 19 routes 全件を 1 サイクルで bind し終え、未完了 task / 分離 PR 前提の先送りを作らない。
