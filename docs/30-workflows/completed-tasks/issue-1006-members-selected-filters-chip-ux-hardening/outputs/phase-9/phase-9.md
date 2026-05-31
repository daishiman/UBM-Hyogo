# Phase 9: 品質保証

- Task ID: TASK-MEMBERS-SELECTED-FILTERS-CHIP-UX-HARDENING-001

## 1. 自動チェックチェックリスト

以下 4 コマンドを順に実行し、すべて green であることをゲートとする。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  apps/web/src/components/public/__tests__/SelectedFiltersBar.client.spec.tsx \
  apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

| # | コマンド | 期待 | 対応 AC |
|---|---|---|---|
| 1 | `typecheck` | エラー 0（新規 props `tagLabels?` / `onEmpty?` の型整合） | — |
| 2 | `vitest run`（2 spec） | 全 test green | AC-1〜AC-5 |
| 3 | `lint` | 違反 0（`--fix` で解消できない違反は手修正） | — |
| 4 | `verify-design-tokens` | fail 0（HEX 直書き・`bg-[#xxx]`・`text-[#xxx]` 検出ゼロ） | AC-7 |

## 2. grep gate

| 観点 | コマンド | 期待 |
|---|---|---|
| HEX 直書き禁止（CSS） | `grep -nE '#[0-9a-fA-F]{3,8}' apps/web/src/styles/legacy-public.css` | 本 Task 追加ブロックに 0 hit（既存 hit は対象外、新規 media query は `var(--ubm-...)` のみ） |
| HEX 直書き禁止（tsx） | `grep -nE '#[0-9a-fA-F]{3,8}' apps/web/src/components/public/SelectedFiltersBar.client.tsx apps/web/src/components/public/MemberFilters.client.tsx` | 0 hit |
| selector scope 限定 | `grep -n 'max-width:640px' apps/web/src/styles/legacy-public.css` | media query 配下の selector が `[data-component="selected-filters-bar"]` に閉じていること |
| test suffix 規約 | `find apps/web/src/components/public/__tests__ -name 'SelectedFiltersBar.client.test.tsx' -o -name 'MemberFilters.client.test.tsx'` | 0 hit（`*.spec.tsx` のみ・不変条件 #8） |

## 3. ファイル削除 N/A（[FB-UI-02-1]）

本 Task はプロダクト実装 3 ファイル、focused spec 2 ファイル、visual evidence spec 1 ファイルの追加/編集であり、ファイル削除は無い。よってファイル削除に関する確認項目（参照切れ・import 残骸の掃除）は **N/A**。

## 4. mirror parity スコープ外

`.claude` / `.agents` の mirror parity 検証は本 Task のスコープ外（本 Task は skill を変更しない）。

## 5. 不変条件チェック

| 不変条件 | コマンド / 確認 | 期待 |
|---|---|---|
| API/D1/Form 変更ゼロ（AC-6） | `git diff origin/dev --name-only -- apps/api` | 0 件（`apps/api` に変更が無い） |
| D1 schema 変更ゼロ | `git diff origin/dev --name-only -- 'apps/api/**/migrations/**'` | 0 件 |
| `*.spec.tsx` 規約（#8） | §2 の test suffix grep | `*.test.tsx` 0 hit |
| selector scope 限定 | §2 の selector grep | data-component 配下に閉じる |
| 変更ファイルの実装スコープ | `git diff origin/dev --name-only -- apps/web` | SelectedFiltersBar.client.tsx / MemberFilters.client.tsx / legacy-public.css / 2 focused spec / 1 visual evidence spec |

## 6. ゲート判定

- [ ] 自動チェック 4 コマンド全 green（typecheck / 2 spec / lint / verify-design-tokens）
- [ ] grep gate 全項目期待通り（HEX 0・selector scope 限定・test suffix 規約）
- [ ] `apps/api` / D1 migration 差分 0 件（AC-6）
- [ ] 変更ファイルが指定 web 実装 3 件 + focused spec 2 件 + visual evidence spec 1 件に閉じている
- [ ] ファイル削除 N/A・mirror parity スコープ外 を確認
