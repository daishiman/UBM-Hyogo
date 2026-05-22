# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 1.1 目的

parallel-09 で実装した 5 primitive（`FormField` / `EmptyState` / `Pagination` / `Icon` / `Breadcrumb`）の Vitest component test に `jest-axe` を統合し、real axe-core a11y rule violation 0 件確認を追加する。aria 属性 assertion は axe で代替できる proxy assertion と component 固有 contract assertion に再分類し、後者は残す。

## 1.2 ステークホルダ要件

| ID | 要件 | 出典 |
| --- | --- | --- |
| REQ-1 | 5 primitive で `axe(container)` が違反 0 件であることを Vitest spec が保証する | issue #748 受入条件 |
| REQ-2 | axe rule baseline（color-contrast 等）が明示 enable/disable 管理されている | issue #748 AC-2 |
| REQ-3 | proxy assertion のうち real a11y check で代替可能なものは削除または axe test に置換し、固有契約（例: `aria-current` 値、`aria-describedby` 連結、disabled click guard）は残す | issue #748 AC-4 |
| REQ-4 | jsdom false positive rule は disable 理由をコメントで明記 | issue #748 AC-3 |
| REQ-5 | `pnpm --filter web test` が green、CI も通過 | issue #748 AC-6 |
| REQ-6 | リポジトリ内既存の axe 利用 pattern と整合させ、独自の matcher 導入や setupFiles 追加を回避する | 既存 admin spec 規約 |

## 1.3 非機能要件

- 5 primitive 合計の test 時間増は **+2 秒以内** に収める（axe は 1 件あたり 50〜200ms 程度）
- 既存 test の green は維持する（regression なし）
- TypeScript strict / `pnpm typecheck` が green

## 1.4 受入基準（AC）

issue #748 の AC-1〜AC-6 は canonical 方針へ読み替えて採用する。`toHaveNoViolations()` / `expect.extend` は Jest matcher 型 augmentation を増やすため採用せず、既存 admin component spec と同じ `results.violations.toHaveLength(0)` pattern を正とする。

- AC-1: 5 primitive / 7 axe scenarios が `axe(container)` の違反 0 件で green
- AC-5: `vitest.setup.ts` 追加ではなく、共有 helper `apps/web/src/test/axe.ts` と inline assertion pattern で統一する
- AC-6: local `pnpm --filter web test` は Phase 11 evidence として取得する。CI green は Phase 13 user-gated PR 作成後に確認する
- AC-7: 共有 axe runner が `apps/web/src/test/axe.ts` に存在し、`configureAxe` で rule baseline を明示的に管理する
- AC-8: `expect.extend(toHaveNoViolations)` を追加せず、既存 inline pattern (`results.violations.toHaveLength(0)`) で統一する
