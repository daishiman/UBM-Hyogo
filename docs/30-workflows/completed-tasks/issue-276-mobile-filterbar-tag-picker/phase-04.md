# Phase 4: テスト作成（Vitest / Playwright）

[実装区分: 実装仕様書]

## メタ情報

| Phase | 4 |
| 前提 | Phase 1-3 完了 |
| 後続 | Phase 5 |

## 目的

TDD として実装より先にテストを作成し、AC-1〜AC-9 を検証する failing test set を整える。

## 変更対象ファイル

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx` | 新規 | TagPicker 単体 |
| `apps/web/src/components/public/__tests__/SelectedTagsBar.client.spec.tsx` | 新規 | SelectedTagsBar 単体 |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 編集 | topTags 連携 |
| `apps/web/playwright/tests/members-filter-mobile.spec.ts` | 新規 | mobile viewport E2E |
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 編集 or 新規 | topTags 集計 |
| `apps/api/src/routes/public/index.contract.spec.ts` | 編集 | response 形拡張 |
| `packages/shared/src/zod/viewmodel.spec.ts` | 編集 | topTags zod parse 検証 |
| fixture JSON (Phase 2 で特定) | 編集 | topTags 値追加 |

## テストケース

### `TagPicker.spec.tsx`
- 候補が降順 count で並ぶ（AC-1）
- 候補クリックで `onToggle` が code 引数付きで呼ばれる（AC-2）
- selected.length >= max で未選択候補は `aria-disabled="true"`、hint 文言を表示（AC-3）
- selected に含まれる code の chip は `aria-checked="true"`

### `SelectedTagsBar.spec.tsx`
- 削除 button で `onRemove(code)` 呼び出し
- `clear-all` button で `onClearAll()` 呼び出し
- selected.length === 0 で `clear-all` は非表示

### `MemberFilters.spec.tsx`
- `topTags` prop を渡したとき TagPicker に降順で渡る
- tag chip クリックで `router.replace` に `tag=...` が append される
- 既選択 5 件状態で 6 件目クリックしても URL が変化しない（AC-3 補強）
- `clear-all` 後 `/members` に router.replace（AC-5）

### Playwright `members-filter-mobile.spec.ts`
- `await page.setViewportSize({ width: 375, height: 812 })`
- `/members?tag=ai&tag=design` 訪問でスクリーンショット
- mobile で `[data-component="filters-summary-mobile"]` が表示され `[data-component="member-filters"]` が初期 collapsed
- summary クリックで expand、tag chip クリックで URL 反映、reload で復元（AC-4 / AC-6）

### API 側
- `list-public-members.spec.ts`: 公開 member 限定で tag 集計、降順 + code asc tiebreaker、上限 20 件
- `index.contract.spec.ts`: response に `topTags: []` が含まれる（fixture）
- `viewmodel.spec.ts`: `topTags` 欠落で parse 失敗

## ローカル実行コマンド

```bash
mise exec -- pnpm typecheck   # まだ未実装のため fail することを確認
mise exec -- pnpm --filter @ubm-hyogo/shared test
mise exec -- pnpm --filter @ubm-hyogo/web test -- TagPicker
mise exec -- pnpm --filter @ubm-hyogo/api test -- list-public-members
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-filter-mobile --reporter=line
```

この時点で全テストが **fail** することを Phase 4 完了条件とする（TDD red）。

## 統合テスト連携

`outputs/phase-04/integration-test-map.md` に Web↔API contract spec のテスト一覧を記述。

## 成果物

- `outputs/phase-04/main.md`
- `outputs/phase-04/integration-test-map.md`
- 上記テストコード（実コードは各 spec ファイル）

## 完了条件

- [ ] 全テストファイルが新規作成 or 編集された
- [ ] `pnpm typecheck` または各 test 実行で fail が確認できた（red 状態）
- [ ] fixture 更新が完了

## タスク100%実行確認【必須】

- [ ] AC-1〜AC-6 に対応するテストケースが揃った
- [ ] mobile viewport テストが Playwright config に組み込まれている

## 次Phase

Phase 5 へ。
