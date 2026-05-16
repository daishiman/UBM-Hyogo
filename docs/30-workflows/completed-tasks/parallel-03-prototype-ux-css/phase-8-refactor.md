# Phase 8: リファクタリング

> Phase: 8 / 13

---

## 目的

Phase 5 で追加したコードの duplicate / drift を排除する。

---

## 8.1 観点

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `globals.css` の `@layer components` ブロック | G3-1/2/3 が別々の `@layer components` 宣言に散在する場合 | 単一 `@layer components` 内に集約 | layer 重複定義を避け、specificity を明確化 |
| `MemberCard.tsx` の transition utility | Tailwind `transition-colors` 等と CSS layer が二重定義の場合 | CSS layer に統一し、Tailwind 側 utility を削除 | 単一責任 |
| `MemberDetailSections.tsx` の `Section` 型 | inline 型定義のみ | 必要なら同一ディレクトリで type-only export | 再利用性確保（必要時のみ実施、過剰抽象化禁止） |
| `data-visibility` フォールバック | 各 render で `?? "public"` を散在 | render helper 関数 1 つに集約（同ファイル内） | duplicate 抑制（行数増えなければ不要） |

---

## 8.2 検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
```

すべて Green を維持。

---

## DoD

- [ ] CSS layer 重複なし
- [ ] Tailwind utility と CSS layer の二重定義なし
- [ ] テストすべて `completed (exit 0)`
