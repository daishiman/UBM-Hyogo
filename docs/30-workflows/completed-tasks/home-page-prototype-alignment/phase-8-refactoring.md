# Phase 8 — リファクタリング

## 目的

task-01 / task-02 実装後、過剰な selector 重複や className 残存を除去する。

## 確認項目

- `call-to-action-cta__*` className が TSX から消えていること
- task-01 marker block が既存 CTA selector rewrite と混在していないこと
- `legacy-public.css` と `globals.css` の責務境界が維持されていること

## 完了条件

- ✅ 追加した selector の責務が marker block または既存 CTA 領域に閉じていること
- ✅ `CallToActionCTA.tsx` から `call-to-action-cta__*` / `cta-button--accent` が消えていること
