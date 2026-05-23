---
phase: 7
title: 品質ゲート — CI required checks と grep gate
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. CI required checks（本 SW で green を要求）

| Gate | tool | 失敗条件 |
|------|------|--------|
| `pnpm typecheck` | tsc | 型エラー 1 件以上 |
| `pnpm lint` | eslint | 違反 1 件以上 |
| `pnpm build` (`next build --webpack`) | Next.js | build fail |
| `web-unit` | vitest | adapter / smoke 失敗 |
| `playwright-smoke / smoke (chromium)` | playwright | 19 routes いずれかが 200/redirect 期待を外れる |
| `verify-design-tokens / verify-design-tokens` | grep | HEX 直書き 1 件以上 |
| `verify-test-suffix` | grep | `*.test.{ts,tsx}` 1 件以上 |
| `verify-phase12-compliance` | script | Phase 12 canonical heading 不整合 |
| `gate-metadata:validate` | zod | artifacts.json schema 違反 |
| `indexes:rebuild` drift | script | indexes 差分 |

## 2. grep gate（本 SW 専用）

`rg` を正本コマンドにする。shell glob の展開差と、19 routes 外の smoke / harness page を誤検出する問題を避けるため、G-1 は対象 route list を固定する。

```bash
SERIAL05_ROUTE_FILES=(
  apps/web/app/page.tsx
  'apps/web/app/(public)/members/page.tsx'
  'apps/web/app/(public)/members/[id]/page.tsx'
  'apps/web/app/(public)/register/page.tsx'
  apps/web/app/privacy/page.tsx
  apps/web/app/terms/page.tsx
  apps/web/app/login/page.tsx
  apps/web/app/profile/page.tsx
  'apps/web/app/(admin)/admin/page.tsx'
  'apps/web/app/(admin)/admin/members/page.tsx'
  'apps/web/app/(admin)/admin/tags/page.tsx'
  'apps/web/app/(admin)/admin/meetings/page.tsx'
  'apps/web/app/(admin)/admin/schema/page.tsx'
  'apps/web/app/(admin)/admin/requests/page.tsx'
  'apps/web/app/(admin)/admin/identity-conflicts/page.tsx'
  'apps/web/app/(admin)/admin/audit/page.tsx'
)
```

| ID | 規則 | 検出コマンド |
|----|------|------------|
| G-1 | page.tsx 冒頭コメント `// serial-05: <route> — blueprint 09X:LLL-MMM` が対象 16 page routes に存在（fallback 3 は別確認） | `for f in "${SERIAL05_ROUTE_FILES[@]}"; do test -f "$f" && rg -q '^// serial-05: .+ — blueprint 09[efg]:' "$f" || { echo "missing serial-05 marker: $f"; exit 1; }; done` |
| G-2 | `D1Database` / `env.DB` を `apps/web/app/` `apps/web/src/` で 0 件 | `! rg -n 'D1Database|env\.DB' apps/web/app apps/web/src` |
| G-3 | `process.env\.` の page.tsx 内 0 件 | `! rg -n 'process\.env\.' apps/web/app` |
| G-4 | HEX 直書き 0 件 | `! rg -n '#[0-9a-fA-F]{3,8}' apps/web/app apps/web/src` |
| G-5 | `bg-[#` / `text-[#` 0 件 | `! rg -n 'bg-\[#|text-\[#' apps/web/app apps/web/src` |
| G-6 | localhost endpoint 焼き込み 0 件 | `! rg -n '127\.0\.0\.1:8888' apps/web/app apps/web/src` |
| G-7 | 新規 primitive が `apps/web/src/components/ui/` に追加されていない | `test -z "$(git diff --name-only dev...HEAD -- apps/web/src/components/ui)"` |
| G-8 | 新規 API endpoint が追加されていない | `test -z "$(git diff --name-only dev...HEAD -- apps/api/src/routes)"` |

## 3. PR pre-flight

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh   # gate-metadata:validate + verify:phase12-compliance + indexes:rebuild drift
```

3 回まで自動修復、超えた場合は調査を要する。

## 4. 失敗時の切り分けフロー

```
typecheck 失敗
  → adapter の型 mismatch → 既存 API 型を最優先で踏襲
  → searchParams Promise 化未対応 → await を加える
lint 失敗
  → pnpm lint --fix で自動修復 → 残違反のみ手修正
build 失敗
  → OpenNext Workers 互換: Turbopack 残骸が無いか確認
playwright 失敗
  → AppShell が未注入（SW-03 未完了）→ 依存 SW を完了させる
verify-design-tokens 失敗
  → HEX を OKLch トークンへ置換
```

## 5. ゲートのスキップ禁止

- `--no-verify` は使わない（CLAUDE.md sync-merge 例外を除く）
- merge commit は本 SW では生まない（feature ブランチ内の直列コミットのみ）
