---
phase: 8
title: Definition of Done — AppShell 3 系統の完了基準
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 8 — Definition of Done

[実装区分: 実装仕様書]

## 1. 必須 DoD

| # | 基準 | 検証方法 |
|---|------|---------|
| DoD-01 | 3 layout が build green | `pnpm --filter @ubm-hyogo/web build` exit 0 |
| DoD-02 | 3 layout のすべての route で wrapper に `data-theme` / `data-route-group` / `data-testid` が付与される | layout spec の assertion |
| DoD-03 | 3 layout の chrome 要素に `data-shell` / `data-route` が付与される | layout spec の assertion |
| DoD-04 | parallel-01 / parallel-02 の selector がブラウザ上で当たる（chrome が描画される） | serial-07 visual evidence |
| DoD-05 | Admin layout の二段防御（未認証 / non-admin redirect）が回帰しない | Admin layout spec の 3 分岐 + `middleware.spec.ts` regression |
| DoD-06 | 既存 primitive（`PublicHeader` / `PublicFooter` / `AdminSidebar` / `MemberHeader` / `SignOutButton`）の API は変更されていない | `git diff` で primitive ファイルに変更なし |
| DoD-07 | layout spec 3 本が green、axe critical 0 | `pnpm --filter @ubm-hyogo/web test` |
| DoD-08 | `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-design-tokens.sh` / `bash scripts/verify-test-suffix.sh` exit 0 | Phase 7 G1-G6 |
| DoD-09 | layout 内に HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` がない | verify-design-tokens grep |
| DoD-10 | layout 内に D1 binding 直接アクセスがない | `grep -rE "DB|D1" apps/web/app/.*layout.tsx` で hit なし |

## 2. 各 route で chrome が継承されることの確認

### 2.1 chrome 継承の意味

Next.js App Router の layout は **route group 内の全 page で自動的に親 layout** となる。本サブワークフローの完了により以下が成立する:

| route | 親 layout chain | 期待 chrome |
|-------|----------------|------------|
| `/` | root → (public) | warm theme + PublicHeader + PublicFooter |
| `/(public)/members` | root → (public) | 同上 |
| `/(public)/members/[id]` | root → (public) | 同上 |
| `/(public)/register` | root → (public) | 同上 |
| `/privacy` | root → (public は通らない、root 直下) | root 既定（parallel-04 で fallback chrome を定義） |
| `/terms` | 同上 | 同上 |
| `/login` | root → (member) | warm theme + MemberHeader |
| `/profile` | root → (member 経由ではなく root 直下) | （現状 `/profile` は member group 外。serial-05 で再配置を検討） |
| `/(admin)/admin` 及び以下 8 routes | root → (admin) | cool theme + AdminSidebar + AdminTopbar |

`/privacy` / `/terms` / `/profile` の group 配置整理は **本サブワークフローのスコープ外**（serial-05 で扱う）。本 sub-workflow では現状 group 配置を前提に DoD を成立させる。

## 3. 段階的 DoD（並列 step 完了時）

| step | 段階 DoD |
|------|---------|
| S-01 完了 | DoD-02 / DoD-03 / DoD-07 の Public 部分が green |
| S-02 完了 | DoD-02 / DoD-03 / DoD-05 / DoD-07 の Admin 部分が green |
| S-03 完了 | DoD-02 / DoD-03 / DoD-07 の Member 部分が green |
| 全 step 完了 | DoD-01 / DoD-04 / DoD-06 / DoD-08 / DoD-09 / DoD-10 |

## 4. DoD を満たさない場合の取扱い

| 失敗パターン | 対処 |
|-------------|------|
| layout spec が axe violation を吐く | layout 側で `aria-label` 補強。primitive を改変しない |
| build が `webpack` boundary 違反で fail | "use client" の漏れ / Server Component で client API 使用を確認 |
| verify-design-tokens fail | 違反箇所を `var(--ubm-color-*)` に置換 |
| Admin layout redirect spec が fail | `vi.mock("next/navigation", ...)` の `redirect` mock が `throw` する pattern を採用 |
| middleware.spec.ts regression | middleware を触っていないか確認。触っていれば revert |

## 5. 完了宣言の形式

Phase 11 evidence inventory に以下を記録した上で Phase 13 で PR 化:

- 3 layout の diff 範囲（`git diff dev...HEAD --stat -- 'apps/web/app/(*)/layout.tsx'`）
- 3 layout spec 実行ログ
- typecheck / lint / build / verify-design-tokens / verify-test-suffix の exit 0 ログ
- （serial-07 が走るならば）Playwright 4 screens visual snapshot 参照
