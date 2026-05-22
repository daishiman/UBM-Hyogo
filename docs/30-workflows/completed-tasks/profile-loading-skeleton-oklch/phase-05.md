# Phase 5: 実装手順

## ステップ

### Step 1: utility 実在確認

```bash
rg -n -e "--color-surface-2|--ubm-color-surface-bg-2|bg-surface-2" \
  apps/web/src/styles apps/web/app/profile/loading.tsx
```

- `--color-surface-2: var(--ubm-color-surface-bg-2);` が globals.css に存在することを確認
- Tailwind utility class `bg-surface-2` が `@theme inline` 経由で解決されることを確認
- 解決されない場合のみ Step 2 を実行

### Step 2 (条件付き): utility 最小追加

`bg-surface-2` が Tailwind から認識されない場合、`apps/web/src/styles/globals.css` の `@theme inline` ブロック内に

```css
--color-surface-2: var(--ubm-color-surface-bg-2);
```

が既に存在しているはずなので、`@theme` 構文の場合は変更不要。それでも未解決なら以下を最小追加:

```css
.bg-surface-2 { background-color: var(--color-surface-2); }
```

> 既存 token システムを破壊しないため、`tailwind.config.ts` への colors 追加 PR は本タスクのスコープ外とする。

### Step 3: `loading.tsx` 置換

`apps/web/app/profile/loading.tsx` を Phase 2 の After ブロック全文で上書きする。

### Step 4: `loading.spec.tsx` 作成

`apps/web/app/profile/loading.spec.tsx` を Phase 4 のコード骨格全文で新規作成する。

### Step 5: ローカル確認

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/loading
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## ロールバック手順

問題発生時は `git checkout -- apps/web/app/profile/loading.tsx` で原状復帰、`rm apps/web/app/profile/loading.spec.tsx` で新規ファイル削除。

## 完了条件

- [ ] Step 1 確認ログを Phase 11 evidence に保存
- [ ] Step 3 / Step 4 の差分が `git diff` で確認可能
- [ ] Step 5 のローカル PASS
