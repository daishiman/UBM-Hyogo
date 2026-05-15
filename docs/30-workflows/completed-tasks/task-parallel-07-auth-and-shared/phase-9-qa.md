# Phase 9: 品質保証

> Phase: 9 / 13
> 名称: 品質保証

---

## 9.1 実行コマンドと期待結果

| # | コマンド | 期待 |
|---|----------|------|
| Q1 | `mise exec -- pnpm typecheck` | exit 0、型エラー 0 |
| Q2 | `mise exec -- pnpm lint` | exit 0、warning 0（既存 baseline 維持） |
| Q3 | `mise exec -- pnpm test` | 全 spec pass、`.spec.tsx` 命名 enforce |
| Q4 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/auth-and-shared.spec.ts` | E1〜E8 pass |
| Q5 | `mise exec -- pnpm test -- --coverage` | 行・分岐 80%+ |
| Q6 | `grep -rnE '#[0-9a-fA-F]{3,8}' apps/web/app/{login,profile,error.tsx,loading.tsx,not-found.tsx}` | 0 件（HEX 直書き 0） |
| Q7 | `grep -rnE 'bg-\[#' apps/web/app/{login,profile}` | 0 件 |
| Q8 | `verify-design-tokens` workflow（CI） | pass |
| Q9 | `verify-test-suffix` workflow（CI） | pass（`.test.tsx` 0 件） |

---

## 9.2 a11y 最終確認

- 全 unit spec で `axe(container)` を実行し violations === 0
- Playwright 側 `@axe-core/playwright` で `/login` / `/profile` / root error の各ページを scan、critical violations 0

---

## 9.3 ローカル smoke

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev
# 別ターミナルで
open http://localhost:3000/login
# devtools で network throttle "Slow 3G" を有効化 → skeleton が見える
# 強制エラー: throw new Error を仕込んだ branch を一時的に push して挙動確認（最終 commit には残さない）
```

---

## 9.4 残課題

QA 段階で検出された問題はすべて Phase 5 / 6 に差し戻して fix。本 Phase は判定のみで、新規実装は行わない。

---

## 9.5 完了判定

Q1〜Q9 すべて green、a11y violations 0、ローカル smoke で UX 確認済み。

---

## 次フェーズへの引き継ぎ

Phase 10 で DoD チェックリストを最終確認する。
