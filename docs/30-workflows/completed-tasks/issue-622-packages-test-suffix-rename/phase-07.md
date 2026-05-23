# Phase 7 — 整合性検証

## 7.1 vitest.config.ts

- ルート `vitest.config.ts` L46: `"packages/**/src/**/*.{test,spec}.{ts,tsx}"`
- `.spec.ts` は既に include に含まれるため **変更不要**

## 7.2 package.json scripts

- `packages/shared/package.json` の `scripts.test` は `vitest run` 想定（個別 path 言及なし）。Phase 11 で grep 確認
- `packages/integrations/package.json`、`packages/integrations/google/package.json` も同様
- 個別 path 言及があれば commit B / C で修正

## 7.3 .github/workflows/*.yml

```bash
rg "packages/.*\.test\." .github/workflows/
```

期待: 0 件。検出されたら Phase 11 で修正。

## 7.4 docs / skill references

```bash
rg "packages/.*\.test\." docs/ .claude/skills/ -g '!**/outputs/**'
```

historical reference（過去 PR / 過去 spec 内の言及）は残置可。ただし「現在の正本仕様」を示すドキュメントは spec に更新する。

## 7.5 jest / vitest 以外の参照

- Cloudflare worker bundle / next.config では test ファイルは参照されない（typecheck/lint で検出される）
- Storybook / Playwright も `packages/` 配下を直接参照しない

## 7.6 整合性 gate（Phase 11 evidence で取得）

| Gate | コマンド | 期待 |
| --- | --- | --- |
| G-1 | `find packages -name '*.test.ts' \| wc -l` | 0 |
| G-2 | `find packages -name '*.spec.ts' \| wc -l` | 28 |
| G-3 | `rg "packages/.*\.test\." .github/` | 0 件 |
| G-4 | `rg "packages/.*\.test\." -g '!**/node_modules/**' -g '!docs/30-workflows/**' -g '!.claude/**'` | 0 件（コード/CI/設定範囲のみ） |
| G-5 | `mise exec -- pnpm typecheck` exit 0 | 新規エラー 0 |
| G-6 | `mise exec -- pnpm lint` exit 0 | 新規エラー 0 |
| G-7 | `mise exec -- pnpm -r test` exit 0 | baseline と同件数 PASS |
