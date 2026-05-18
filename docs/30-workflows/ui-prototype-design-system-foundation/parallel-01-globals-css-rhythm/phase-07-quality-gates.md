---
phase: 7
title: 品質ゲート — typecheck / lint / build / verify-design-tokens / verify-pr-ready
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-01-globals-css-rhythm
status: spec_created
---

# Phase 7 — 品質ゲート

[実装区分: 実装仕様書]

## 1. ゲート一覧

| Gate | コマンド | 期待 | 失敗時の典型原因 |
|------|---------|------|------------------|
| G1 typecheck | `mise exec -- pnpm typecheck` | exit 0 | 本 SW は CSS のみで TS 影響なし。失敗時はワークスペース全体の事前破損 |
| G2 lint | `mise exec -- pnpm lint` | exit 0 | stylelint 等が globals.css を検査する場合、追加規則の syntax / order 違反 |
| G3 build | `mise exec -- pnpm build` | exit 0 | `next build --webpack` で CSS bundle 失敗。未定義 `--ubm-*` 参照、`@layer` 構文崩れ |
| G4 verify-design-tokens | `mise exec -- pnpm exec tsx scripts/verify-design-tokens.ts`（既存 CI） | exit 0 | HEX 直書き / `bg-[#` 検出 |
| G5 verify-pr-ready | `bash scripts/verify-pr-ready.sh` | exit 0 | docs-only gate / gate-metadata / verify:phase12-compliance / indexes drift |

## 2. 各ゲートの通過条件

### G1 typecheck
- 本 SW で TS ファイル変更は無いため通過しない場合は事前破損
- 通過条件: `apps/web` / `apps/api` 双方の `tsc --noEmit` が exit 0

### G2 lint
- 通過条件: ESLint / Stylelint（設定されていれば）が exit 0
- 本 SW の CSS 追加が attribute selector のみで spec 違反を起こさない設計

### G3 build
- 通過条件: `apps/web` の `next build --webpack` が exit 0
- 確認ポイント: 本 SW が参照する `--ubm-*` トークンすべてが `tokens.css` で defined
- Cloudflare Workers 互換 bundle に CSS が正しく載ること（OpenNext build 内で確認）

### G4 verify-design-tokens
- 通過条件: 既存 CI workflow `verify-design-tokens` が green
- 検査対象: `apps/web/src/**/*.{ts,tsx,css}`
- 本 SW 追加分の HEX 直書き 0 件、`bg-[#` 0 件、`text-[#` 0 件

### G5 verify-pr-ready
- 通過条件: `bash scripts/verify-pr-ready.sh` exit 0
- 内部で `gate-metadata:validate` / `verify:phase12-compliance` / `indexes:rebuild` drift を検査
- 本 SW では Phase 12 canonical 9 headings と Phase 11 evidence 表が整っていることが条件

## 3. ゲート実行順序

```
G1 typecheck ─┐
G2 lint      ─┼─→ G3 build ─→ G4 verify-design-tokens ─→ G5 verify-pr-ready
              ┘
```

G1/G2 は並列実行可、G3 以降は前段成功が前提。

## 4. ローカル先行検証（pre-push）

`lefthook.yml` の pre-push hook（`verify-indexes-up-to-date` / `verify-gate-metadata`）がローカルで先行ブロックする。CI 失敗を待たずローカルで気づける。

## 5. ゲート評価記録

各ゲート結果は Phase 11 evidence inventory に下記ファイルとして保存:

| Gate | evidence ファイル |
|------|------------------|
| G1 | `outputs/phase-11/typecheck.log` |
| G2 | `outputs/phase-11/lint.log` |
| G3 | `outputs/phase-11/build.log` |
| G4 | `outputs/phase-11/verify-design-tokens.log` |
| G5 | `outputs/phase-11/verify-pr-ready.log` |
