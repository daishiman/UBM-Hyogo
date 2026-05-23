# Phase 11 — manual smoke log（NON_VISUAL）

[実装区分: 実装仕様書 / 実行済み]

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/services/aliasRecommendation.spec.ts
```

## 実行結果

```
✓ apps/api/src/services/aliasRecommendation.spec.ts (20 tests) 60ms

Test Files  48 passed (48)
Tests       300 passed (300)
Duration    123.85s
```

## 実施情報

| 項目 | 値 |
| --- | --- |
| 実行日時 | 2026-05-17T09:42:03+09:00 |
| Node version | v24.15.0 |
| pnpm version | 10.33.2 |
| OS | darwin |
| Worktree | `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260517-015004-wt-2` |
| exit code | 0 |

## 実行時補足

初回実行は `Host version "0.27.3" does not match binary version "0.25.4"` で Vitest config load 前に失敗した。local `node_modules/@esbuild/darwin-arm64/bin/esbuild` は 0.27.3 であることを確認し、以下で再実行した。

```bash
ESBUILD_BINARY_PATH="$PWD/node_modules/@esbuild/darwin-arm64/bin/esbuild" mise exec -- pnpm --filter @ubm-hyogo/api test -- --run src/services/aliasRecommendation.spec.ts
```

追加レビューで collision HTTP status を `409 stable_key_collision` へ同期したため、D1 contract test を個別実行した。

```bash
ESBUILD_BINARY_PATH="$PWD/node_modules/@esbuild/darwin-arm64/bin/esbuild" pnpm exec vitest run --root=. --config=vitest.d1.config.ts apps/api/src/routes/admin/schema.contract.spec.ts
```

Result: `apps/api/src/routes/admin/schema.contract.spec.ts` 16 tests PASS, exit 0。

## 既知制限

- 大小文字統一・カタカナ↔ひらがな変換・括弧除去・ステミングは意図的に対象外
- response shape / DB schema / endpoint は不変

## 完了確認

- [x] vitest exit 0
- [x] 20 ケース全 PASS
- [x] route contract 16 ケース PASS
- [x] 実行ログを貼り付け済み
