[実装区分: 実装仕様書]

# Phase 4 — テスト計画

## 1. 目的

`verify-design-tokens` の `colorLiteralExcludes` に Next.js App Router の **route handler convention**（`opengraph-image/route.tsx` 等）を追加した修正が、以下を満たすことを検証する。

1. Issue #806 で追加された `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` が drift 検出されないこと。
2. 既存の本物の HEX 直書き drift は引き続き検出されること（regression guard）。
3. ローカル / GitHub Actions の `verify-design-tokens` job が green になること。

## 2. 検証観点

| ID | 観点 | 期待結果 |
|----|------|----------|
| V1 | `mise exec -- pnpm verify:tokens` をローカル実行 | exit 0 / `forbidden-color-literal` drift 0 件 |
| V2 | `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` の HEX (#1e3a8a / #3b82f6 / #ffffff) | drift 検出されない |
| V3 | `apps/web/src/components/**/*.tsx` 内に HEX 直書きを意図的に置いた fixture | drift 検出される |
| V4 | GitHub Actions `verify-design-tokens / verify-design-tokens` workflow | green |
| V5 | `pnpm typecheck` / `pnpm lint` | exit 0 |

## 3. 追加 unit test 仕様

テストファイル: `scripts/verify-design-tokens.spec.ts`（**既存ファイルに追記**）

> ファイル命名規約: `*.spec.ts` のみ（CLAUDE.md 不変条件 #8）。既存ファイルが本仕様準拠なのでそのまま追記する。

### Test cases（`describe('verify-design-tokens — colorLiteralExcludes', ...)` 配下）

| Case | 入力 (fixture path) | HEX 内容 | 期待結果 |
|------|---------------------|----------|----------|
| C-EX-1 | `<tmp>/apps/web/app/foo/opengraph-image/route.tsx` | `color: '#1e3a8a'` | drift 0 件 |
| C-EX-2 | `<tmp>/apps/web/app/foo/icon/route.tsx` | `background: '#ffffff'` | drift 0 件 |
| C-EX-3 | `<tmp>/apps/web/app/foo/twitter-image/route.tsx` | `color: '#3b82f6'` | drift 0 件 |
| C-EX-4 | `<tmp>/apps/web/app/foo/apple-icon/route.tsx` | `color: '#000000'` | drift 0 件 |
| C-EX-5 | `<tmp>/apps/web/src/components/Foo.tsx` | `color: '#3b82f6'` | `reason: 'forbidden-color-literal'` を 1 件以上含む（regression guard） |
| C-EX-6 | `<tmp>/apps/web/app/foo/opengraph-image.tsx`（既存 root convention） | `color: '#1e3a8a'` | drift 0 件（既存挙動の維持確認） |

### テスト戦略

- `node:fs/promises` + `node:os.tmpdir()` で一時ディレクトリにフィクスチャを作成 → `scanForbiddenColorLiterals(roots, excludes)` を呼び出す。
- そのため `scripts/verify-design-tokens.ts` の `scanForbiddenColorLiterals` および `DEFAULTS.colorLiteralExcludes` を **`export`** する必要がある（Phase 5 Step 1 で対応）。
- 各 case は独立した tmpdir で実行（並列実行に耐える）。

## 4. 実行コマンド

```bash
# unit test 単発
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts

# 統合検証
mise exec -- pnpm verify:tokens
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 5. 受け入れ基準

- V1〜V5 すべて期待結果通り。
- C-EX-1〜C-EX-6 すべて pass。
- 既存 C1〜C7 ケースが regression しない。
