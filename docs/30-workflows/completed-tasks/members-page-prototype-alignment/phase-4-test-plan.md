# Phase 4: テスト計画

## 1. テスト追加マトリクス

| ファイル | 種別 | テストケース |
|---|---|---|
| `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx`（新規 or 編集） | unit (vitest + @testing-library/react) | TC-DT-1: `role="radiogroup"` + 3 `role="radio"` が描画される / TC-DT-2: `value="dense"` で該当 radio に `aria-checked="true"` / TC-DT-3: ArrowRight キーで次の radio に focus 遷移 / TC-DT-4: クリック時 `router.replace` が `density` query を更新（mock） |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx`（編集） | unit | TC-MF-1: `data-component="member-filters"` 配下に form が描画 / TC-MF-2: クリアボタンが `hasFilters=false` で disabled / TC-MF-3: active-tags が `<ul data-role="active-tags">` で render |
| `apps/web/src/components/public/__tests__/MemberCard.spec.tsx`（新規 or 編集） | unit | TC-MC-1: `data-density="comfy"` 時 Avatar size=lg / TC-MC-2: `data-density="dense"` 時 Avatar size=md / TC-MC-3: nickname なしの member で nickname element が出力されない |
| `apps/web/playwright/tests/members-prototype-alignment.spec.ts`（新規） | smoke (Playwright) | TC-SM-1: `/members` 200 / TC-SM-2: header に `role="banner"` + 「ログイン」リンク存在 / TC-SM-3: page-head に「メンバー一覧」h1 / TC-SM-4: DensityToggle に 3 radio / TC-SM-5: filter form に `role="search"` |

## 2. 実行コマンド

```bash
# unit
mise exec -- pnpm --filter @ubm-hyogo/web test -- --run src/components/public/__tests__/DensityToggle.client.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- --run src/components/public/__tests__/MemberFilters.client.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- --run src/components/public/__tests__/MemberCard.spec.tsx

# playwright smoke (localhost dev)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-prototype-alignment.spec.ts
```

## 3. visual evidence

- Phase 11 で staging（または localhost）の `/members` を 3 density × desktop/mobile = 6 枚 screenshot
- 保存先: `docs/30-workflows/members-page-prototype-alignment/outputs/phase-11/screenshots/`

## 4. 完了条件

- 追加対象テストファイルと TC が網羅されている
- 実行コマンドが動作可能（既存 vitest / playwright runner で実行できる）
