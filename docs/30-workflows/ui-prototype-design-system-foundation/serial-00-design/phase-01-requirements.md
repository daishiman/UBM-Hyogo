---
phase: 1
title: 要件定義 — プロトタイプ正本を全画面に反映する仕組みの要件
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-00-design
status: completed
taskType: implementation
visualEvidence: VISUAL
implementation_mode: greenfield-foundation
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 1. 解決すべき要件

プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）の見た目（背景・サーフェス階層・カードの陰影・余白リズム・タイポスケール・配色の雰囲気）が **全画面で機械的に再現される仕組み**を整える。

### 1.1 機能要件

| ID | 要件 | 根拠 |
|----|------|------|
| FR-01 | `apps/web/src/styles/globals.css` の `@layer components` に page background / surface / card / typography rhythm の既定 selector を実装する | プロトタイプ `styles.css` の page-level 規則の翻訳 |
| FR-02 | `apps/web/app/layout.tsx`（root）に ToastProvider と `data-theme` 既定値を配置する | parallel-08 spec L37-90 |
| FR-03 | `app/(public)/layout.tsx` / `app/(admin)/layout.tsx` / `app/(member)/layout.tsx` の 3 つの AppShell を実装する | 09e/f/g blueprint 共通 chrome |
| FR-04 | プロトタイプの selector 規則（tag pill / member card hover / `[data-visibility]` marker）を globals.css に転記する | `improvements/parallel-03-prototype-ux-css/spec.md:25-62` |
| FR-05 | 19 routes 全 page.tsx を 09e/f/g blueprint + primitives で実装する | SCOPE.md 19 routes 表 |
| FR-06 | `app/error.tsx` / `not-found.tsx` / `loading.tsx` の共通 chrome 派生 fallback を実装する | Next.js error boundary 規約 |
| FR-07 | `/(public)/members/[id]/page.tsx` で API `GET /public/members/:id` の response_fields → MemberDetail カードに描画する | 09e blueprint L339-L472 |
| FR-08 | Playwright visual evidence（4 screens 最小）と verify-design-tokens CI gate green を取得する | CLAUDE.md required status check 候補 |

### 1.2 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | OKLch トークン正本性を維持。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止 |
| NFR-02 | `apps/web` から D1 binding 直接アクセス禁止 |
| NFR-03 | 既存 API endpoint surface のみ接続。新規 endpoint 追加禁止 |
| NFR-04 | 既存 primitives の API を変更しない。新規 primitive を生やさない |
| NFR-05 | Cloudflare Workers 互換 build（`next build --webpack`）が green |
| NFR-06 | `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` が exit 0 |
| NFR-07 | テスト suffix は `*.spec.{ts,tsx}` のみ |

### 1.3 ステークホルダー観点（要件レビュー）

| 系統 | 観点 |
|------|------|
| システム系 | 設計トークンが既に正本化されているのに画面に出ない理由を「page-level chrome 規則 + AppShell + page.tsx」の 3 段で解消する。新規層を増やすのではなく既存 4 層設計（prototype → spec → bridge → 実装）の **「実装」層の空白を埋める** |
| 戦略・価値系 | ユーザーが「全画面の雰囲気が反映されていない」と感じる主因はページ自体の不在。実装層を埋めれば既存基盤がそのまま機能する |
| 問題解決系 | 真の論点は「primitive の組み立て場所（page.tsx）と global chrome 規則の不在」。primitives を増やしたり token を増やすことではない |

## 2. 不変条件

CLAUDE.md「UI prototype alignment / MVP recovery」セクションの不変条件 1〜4 を継承する。

1. 既存 API endpoint のみ接続
2. OKLch トークン正本化
3. プロトタイプ正本順位（primitives + tokens + rhythm をデザイン言語の正本とする）
4. D1 直接アクセス禁止

## 3. スコープ境界

### IN

- `apps/web/src/styles/globals.css` 拡張
- `apps/web/app/` 配下の layout.tsx / page.tsx / error.tsx / not-found.tsx / loading.tsx 新規・編集
- 既存 primitives の use site 追加（API 変更なし）
- Playwright visual spec 追加

### OUT

- `apps/api/` の endpoint 追加・変更
- D1 schema / migrations 変更
- 既存 primitives の props 変更
- 新規 primitive 作成（既存 13 個で組み立てる）
- Google Form schema 変更
- プロトタイプ自体の編集

## 4. 受け入れ条件（タスク完了基準）

`SCOPE.md` の DoD 1〜7 を満たすこと。

## 5. 参照

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-prototype-ux-css/spec.md`
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-08-shared-foundation/spec.md`
- `docs/00-getting-started-manual/specs/09a-prototype-map.md`
- `docs/00-getting-started-manual/specs/09b-design-tokens.md`
- `docs/00-getting-started-manual/specs/09c-primitives.md`
- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`
- `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`
- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md`
- `docs/00-getting-started-manual/claude-design-prototype/styles.css`
- `docs/00-getting-started-manual/claude-design-prototype/pages-*.jsx`
- `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx`
- `apps/web/src/styles/tokens.css`
- `apps/web/src/styles/globals.css`
- `apps/web/src/components/ui/`
