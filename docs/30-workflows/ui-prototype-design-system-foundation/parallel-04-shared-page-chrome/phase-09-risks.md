---
phase: 9
title: リスク分析と緩和策
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-04-shared-page-chrome
status: spec_created
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 9 — リスク分析と緩和策

[実装区分: 実装仕様書]

## 1. リスク一覧

| ID | リスク | 影響 | 発生確率 | 緩和策 |
|----|-------|------|---------|-------|
| R-01 | 既存 `app/layout.tsx` が他 PR で並行編集されコンフリクト | merge 衝突 | 中 | 編集前に `git fetch origin dev` → ローカル dev 同期 → 作業ブランチに dev を取り込んでから着手 |
| R-02 | ToastProvider が parallel-03（route group layout）で再 wrap される | Provider 二重・state 不整合 | 中 | Phase 4 §5 で「再 wrap 禁止」を明文化。parallel-03 仕様レビュー時に grep 検証（QG-08） |
| R-03 | hydration mismatch（`<html data-theme>` 変更時に SSR/CSR 差分） | hydration error | 低 | `data-theme` は文字列リテラル固定。`Date.now()` 等を root layout に入れない |
| R-04 | `viewport.themeColor` の OKLch 表現が古い browser で無視される | 視覚差のみ（機能影響なし） | 中 | 受容する。HEX フォールバックは入れない（HEX 禁止の不変条件と衝突するため） |
| R-05 | `next build --webpack` が Cloudflare Workers bundle で `Toast.tsx` の `"use client"` を解決失敗 | build fail | 低 | Toast.tsx は既存稼働実績あり。本サブワークフローで Provider 利用方法を変えないため新規リスク低 |
| R-06 | logger import path 変更（相対 → `@/lib/logger`）で他参照が壊れる | typecheck fail | 低 | grep `from "../src/lib/logger"` と `from "../../src/lib/logger"` を事前確認し、本サブワークフロー範囲外は触らない |
| R-07 | Card primitive の `CardFooter` が未 export | typecheck fail | 低 | Phase 5 §2.4 の代替（`<div className="ui-card-content flex gap-3">`）を用意済み |
| R-08 | parallel-01 で `ui-card-*` class 命名が後で変わる | loading.tsx の skeleton class 名再修正 | 中 | 当面は `bg-surface-2` トークンで暫定実装し、parallel-01 完了後に置換 |
| R-09 | `app/error.tsx` の error boundary がテスト環境（jsdom）で再現できない | unit test 強度低下 | 中 | Phase 6 §3.2 のように **直接 render** に切替えて契約検証する |
| R-10 | `metadata.title` を object 形式に変えると既存 page 側の `metadata = { title: "..." }` 直書き挙動が変わる | page タイトル不整合 | 低 | template は `"%s | UBM Hyogo"` のため既存 page の string title はそのまま展開される（後方互換） |
| R-11 | `(public)/members/[id]/not-found.tsx` 等の route-scoped fallback と root `not-found.tsx` で重複定義 | route-scoped が優先される（Next 仕様）。混乱 | 低 | 既存 route-scoped fallback は触らない / Phase 1 §4 OUT で明示 |
| R-12 | OpenNext Cloudflare bundle が SC/CC 境界を誤判定 | runtime error | 低 | `app/error.tsx` の `"use client"` を冒頭固定。route group layout 側でも directive 漏れがないか parallel-03 で確認 |
| R-13 | `verify-design-tokens` gate が `oklch(...)` リテラル（viewport.themeColor）を誤検出 | CI fail | 低 | gate スクリプトは HEX 直書きのみ検出する設計。OKLch リテラルは許容（CLAUDE.md NFR-01 と整合） |

## 2. 編集戦略（既存 layout.tsx がある場合）

| 既存状態 | 編集方針 |
|---------|--------|
| 既存 layout.tsx が tracked かつ最新 | Edit ツールで 5 step を段階適用（Phase 3 G1-1..G1-5） |
| 既存 layout.tsx を他作業で大幅変更している | 作業ブランチで dev を取り込み conflict 解消 → 再度 Phase 5 §1 の構造に整える |
| 既存 layout.tsx が削除されている | Phase 5 §1.3 のコードで新規作成 |

## 3. ToastProvider 重複防止チェック

CI / pre-push どちらでも:

```bash
grep -rln "ToastProvider" apps/web/app/
# 期待: apps/web/app/layout.tsx のみ
```

route group layout が後続で追加された場合、レビュー時に上記 grep の件数が 1 を超えないことを確認する。

## 4. hydration mismatch 防止チェック

- root layout に `useEffect` / `useState` / `Date.now()` / `Math.random()` を入れない
- Toast の中身（toasts 配列）は Client 側で初期化されるが、SSR で render される時の初期 DOM は空配列 → `<div aria-live="polite">` のみ。CSR 側でも初期 mount 時は空配列を維持するため hydration 一致

## 5. リスク対応の検証 timing

| timing | 対応 |
|-------|------|
| 編集前 | R-01（dev 同期） / R-06（grep）/ R-07（Card.tsx 確認） |
| 編集中 | R-03 / R-12（SC/CC 境界） |
| 編集後 | R-02 / R-04 / R-08（grep / build / token gate） |
| PR レビュー時 | R-10 / R-11 |
