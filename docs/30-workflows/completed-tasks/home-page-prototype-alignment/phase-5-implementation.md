# Phase 5 — 実装

## 目的

task-01 を先に実装し、同一 `legacy-public.css` 編集を安定させた後、task-02 を実装する。

## 実装順序

1. `apps/web/src/styles/legacy-public.css` 末尾に task-01 marker block を追加する。
2. `apps/web/src/components/public/CallToActionCTA.tsx` から BEM-like className を除去し、data-role に置換する。
3. `apps/web/src/styles/legacy-public.css` の既存 CTA selector を data-role selector に書き換える。
4. `CallToActionCTA.component.spec.tsx` を更新する。

## 完了条件

- ✅ 共有 CSS の編集順序が task-01 → task-02 で守られていること
- ✅ HEX / arbitrary color を追加していないこと
- ✅ 新規 CSS の `letter-spacing` は 0 以上に統一し、負値を残していないこと
