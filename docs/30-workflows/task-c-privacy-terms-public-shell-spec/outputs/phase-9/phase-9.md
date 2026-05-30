# Phase 9 — 品質保証

## 1. 自動チェック

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  app/privacy/__tests__/page.spec.tsx \
  app/terms/__tests__/page.spec.tsx
bash scripts/verify-pr-ready.sh
```

全て green であること。

## 2. grep gate

| 観点 | コマンド | 期待 |
|------|---------|------|
| HEX 直書き禁止 | `grep -nE '#[0-9a-fA-F]{3,8}' apps/web/app/{privacy,terms}/page.tsx` | 0 hit |
| `process.env.*` 直接参照禁止 | `grep -n "process\.env" apps/web/app/{privacy,terms}/page.tsx` | 0 hit |
| test suffix 統一 | `find apps/web/app/{privacy,terms} -name "*.test.tsx"` | 0 hit |
| 127.0.0.1 焼き込み禁止 | `grep -n "127\.0\.0\.1" apps/web/app/{privacy,terms}/page.tsx` | 0 hit |

## 3. 本文 / metadata 不変確認

```bash
git diff origin/dev -- apps/web/app/privacy/page.tsx apps/web/app/terms/page.tsx
```

diff 内で:
- `export const metadata` の値変更なし
- `<h1>` / `<h2>` / `<p>` の本文文字列の変更なし
- `<a href="/" data-role="back">トップに戻る</a>` の保存

を確認。

## 4. 視覚整合（任意・Phase 11 で実機確認）

- staging もしくは local dev で `/privacy` / `/terms` を開き、ヘッダのリンクが他公開ページと同等であること、フッタが表示されること、本文が崩れていないことを目視

## 5. ゲート判定

- [ ] 全自動チェック green
- [ ] 全 grep gate 0 hit
- [ ] metadata / 本文 diff 上の意味的変更なし
