# Phase 8: リファクタリング

## 対象 / Before / After / 理由（FB RT-03）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `CallToActionCTA.tsx` の class 命名 | 実装直後の class 名 | BEM 風に `call-to-action-cta__inner` / `__copy` 等で統一 | 既存 `RegisterCallout` の class 命名と整合 |
| `legacy-public.css` の新規 block 配置 | `@layer components` 末尾に追加 | 既存 `[data-component="register-callout"]` block の直後に配置 | dark / light variant が隣接して読みやすくなる |
| 重複定数 | （なし。事前 grep で hardcode 重複ゼロを確認済） | — | — |

## navigation drift

なし（HomePage に section 追加のみ、route 変更なし）。

## 完了条件

- [ ] テストが全件 GREEN のまま
- [ ] `pnpm typecheck` / `pnpm lint` PASS

## 成果物

`outputs/phase-8/refactor.md`
