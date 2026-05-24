# Phase 6 — テスト拡充

## 目的

CSS selector 追加と CTA DOM contract 変更に対して、最小の focused verification を追加する。

## 方針

- CTA は Testing Library assertion で `data-role` を検証する。
- CSS rule は `verify:tokens` と browser visual evidence に委譲する。
- snapshot 更新は不要。構造差分は明示 assertion で確認する。

## 完了条件

- ✅ `pnpm --filter @ubm-hyogo/web test -- CallToActionCTA.component` 相当の regression guard を追加済み
- ✅ `mise exec -- pnpm --filter @ubm-hyogo/web test` PASS（873 PASS / 1 skipped）
