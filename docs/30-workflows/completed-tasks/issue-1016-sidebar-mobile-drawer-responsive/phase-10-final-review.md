# Phase 10 — 最終レビュー（ゲート）

## 0. 前提

本サイクルは **implemented_local_runtime_pending**。AC-1〜AC-10 の実コード / focused test / local screenshot 部分は PASS、staging runtime visual は pending。staging runtime PASS は主張しない。

## 1. 受入条件（AC-1〜AC-10）判定

| AC | 条件 | 状態 | 実装後に満たす根拠 | 検証 Phase |
|----|------|------|---------------------|-----------|
| AC-1 | `SidebarMobileTrigger` クリックで `setDrawerOpen(true)` → drawer open | PASS（focused） | `SidebarMobileTrigger.spec.tsx` | Phase 11 focused Vitest |
| AC-2 | trigger は `md:hidden` / `aria-controls="shell-drawer"` / `aria-expanded` を持つ | PASS（focused） | `SidebarMobileTrigger.spec.tsx` | Phase 11 focused Vitest |
| AC-3 | drawer open=true で `role="dialog"` `aria-modal="true"` `id="shell-drawer"` | PASS（focused + local screenshot） | `SidebarDrawer.spec.tsx` / `shell-drawer-mobile-open.png` | Phase 11 |
| AC-4 | Esc / backdrop クリックで `onClose` | PASS（focused） | `SidebarDrawer.spec.tsx` | Phase 11 focused Vitest |
| AC-5 | route 変化で drawer auto-close | PASS（focused） | `useSidebarState.spec.tsx` | Phase 11 focused Vitest |
| AC-6 | open 時 `<body data-shell-drawer-open="true">` 付与 / close で除去 | PASS（focused + local screenshot） | `SidebarDrawer.spec.tsx` / `shell-drawer-mobile-open.png` | Phase 11 |
| AC-7 | open 時 initial focus が drawer 内最初の focusable へ | PASS（focused） | `SidebarDrawer.spec.tsx` | Phase 11 focused Vitest |
| AC-8 | localStorage 未設定時 md=初期 collapsed / lg=expanded、localStorage 値あれば優先 | PASS（focused） | `useSidebarState.spec.tsx` | Phase 11 focused Vitest |
| AC-9 | 全色 OKLch トークン経由 + typecheck/lint/vitest green | PASS | focused Vitest / typecheck / lint / verify-design-tokens PASS | Phase 9 |
| AC-10 | 375/768/1280px で drawer/collapsed/expanded を screenshot 確認 | PASS（local screenshot） | canonical 4 枚を `outputs/phase-11/screenshots/` に保存 | Phase 11 |

## 2. ブロッカー判定

**なし。** 全 AC が既存 Task A 基盤（context / state / shell）の上に積む UI 実装で達成可能。新 endpoint / D1 schema 変更 / 外部ライブラリ追加なし（INV-1〜6 を全 Phase で順守）。

## 3. Phase 3 MINOR（M-1〜M-3）の最終処理方針

| ID | 指摘 | 最終処理 | 状態 |
|----|------|---------|------|
| M-1 | drawer children と `<aside>` children の共通化余地 | Phase 8 で helper 抽出を不採用。drawer/aside 固有要素があり、抽象化より現状維持が低複雑 | 解消 |
| M-2 | `--ubm-color-overlay-scrim` トークン未確認 | 既存 token + opacity の backdrop で解消。HEX 直書きなし | 解消 |
| M-3 | `is-browser.ts` に matchMedia 正規 getter がない | `browserMatchMedia(query)` を追加し、`useSidebarState` は getter 経由に統一 | 解消 |

## 4. spec 完成度レビュー

| 観点 | 判定 |
|------|------|
| 受入条件と各 Phase の対応 | AC-1〜10 が Phase 4/7/9/11 に 1:1 で紐付く |
| 不変条件（INV-1〜6）の全 Phase 反映 | Phase 2 設計 / Phase 9 QA で検証手順を明示 |
| 1 サイクル完了性（CONST_005/007） | 実コード + tests + local screenshot まで完了。先送りタスクなし |
| 誠実性 | local screenshot は present、staging runtime PASS 非主張、Gate-C pending を明記 |

## 完了条件

- [x] AC-1〜AC-10 を「focused PASS / pending」テーブルで判定
- [x] ブロッカー = なし を明記
- [x] M-1 / M-2 / M-3 の最終処理方針を確定（全て本サイクル内で解消・未タスク化なし）
- [x] runtime / visual PASS を主張しない（implemented_local_runtime_pending の誠実性）
