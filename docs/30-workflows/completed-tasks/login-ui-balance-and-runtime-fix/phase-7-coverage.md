# Phase 7 — カバレッジ確認

## 対象 / 目標

| 対象 | 目標 | 計測コマンド |
| ---- | ---- | ------------ |
| `apps/web/app/api/auth/magic-link/route.ts` | line 100% / branch 100% | `pnpm --filter @repo/web exec vitest run apps/web/app/api/auth/magic-link/route.route.spec.ts --coverage` |
| `apps/web/app/api/auth/magic-link/verify/route.ts` | line 100% / branch 100% | 同上 verify |
| `apps/web/src/styles/auth.css` | N/A（CSS は visual で担保） | playwright visual |
| `apps/web/src/styles/legacy-public.css` | N/A | 同上 + 既存 public route の visual smoke |
| `docs/00-getting-started-manual/claude-design-prototype/index.html` | N/A（docs assets） | manual curl + ブラウザ |

## concern → test matrix

| concern | T-C-01 | T-C-02 | T-C-03 | T-C-05 | T-C-06 |
| ------- | :----: | :----: | :----: | :----: | :----: |
| getAuthEnv() 正常 + URL | ✓ | ✓ | – | – | – |
| trailing slash 正規化 | – | ✓ | – | – | – |
| 未設定 → fallback | – | – | ✓ | – | – |
| env unset fallback | – | – | ✓ | ✓ | – |
| 空文字 → fallback | – | – | – | – | ✓ |

verify route も同 matrix（T-C-04 系列）。

## dependency edge

| 上流 | 下流 | edge test |
| ---- | ---- | --------- |
| Workers binding | `getAuthEnv()` | env.ts 既存 spec で担保（本タスク追加なし） |
| `getAuthEnv()` | `resolveApiBase()` | T-C-01..06 |
| `resolveApiBase()` | `fetch(upstream)` | T-C-01..06 |

## 既存カバレッジへの影響

- 既存 `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` は変更なし → coverage 不変。
- `apps/web/src/styles/*.css` は CSS のため統計対象外。
- 新規 grep gate は shell スクリプト（テスト coverage 統計対象外、CI で exit code 確認）。

## ギャップ

- `scripts/serve-prototype.sh` の自動テストはなし（Phase 11 manual curl で代替）。理由: 1 回限りの dev tool で CI 価値低。
- `wrangler.toml` の env 設定確認は手動（既存）。
