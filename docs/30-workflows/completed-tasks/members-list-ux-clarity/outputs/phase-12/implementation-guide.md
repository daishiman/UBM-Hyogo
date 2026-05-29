# Implementation Guide

## Part 1 — 中学生レベル

メンバー一覧に「表示の選び方」と「いま効いている条件」を見えるようにした。
ゆったり、密、リストの違いは、棚の並べ方を選ぶボタンのようなもの。
検索やタグを変えたときも、どの条件で何件見えているかをすぐ確認できる。

## Part 2 — 技術者レベル

`SegmentedOption` は `sublabel` と `describedBy` をoptionalで受けるため既存呼び出しを壊さない。
`DensityToggle` はOPTIONS constをSSOTにし、button sublabel、hidden description、HelpHint本文を同じ配列から派生する。
`MemberFilters` はURL queryを正本にしたまま、`totalCount` / `displayedCount` を表示専用propとして受ける。
`SelectedFiltersBar` は `q` / `zone` / `status` / `tag` のみchip化し、`sort` は表示順であり絞り込みではないため除外する。

## Verification commands

```bash
pnpm exec vitest run apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx apps/web/src/components/public/__tests__/SelectedTagsBar.client.spec.tsx apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web verify-design-tokens
```

## Screenshot evidence

- Phase 11 screenshots: `outputs/phase-11/screenshots/`
- Matrix: mobile / tablet / desktop / wide x comfy / dense / list x filtered / empty = 24 PNGs
- Runtime notes: `outputs/phase-11/runtime-notes.md`
