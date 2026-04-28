# Phase 11 — 手動 smoke 総括

## 結論

**Smoke PASS（代替 evidence による）**

- repository 層（5 ファイル）: vitest 29 件全 PASS
- 型 / lint / boundary lint: 全 EXIT=0
- AC-1〜AC-11: 11/11 充足（AC-5 のみ dep-cruiser バイナリ導入を 09a に申し送り、暫定で `scripts/lint-boundaries.mjs` 代替で実証）
- 不変条件 #5 / #6 / #11 / #12: 構造で阻止されていることを test / grep / 型レベルで確認

## 実行サマリー

| カテゴリ | コマンド | 結果 |
| --- | --- | --- |
| unit test | `pnpm exec vitest run apps/api/src/repository` | 6 files / 29 tests PASS / 5.19s |
| typecheck | `pnpm typecheck` | 5 workspaces OK |
| lint | `pnpm lint` (boundary lint + tsc-noEmit) | 全 OK |
| boundary lint | `node scripts/lint-boundaries.mjs` | EXIT=0、違反 0 |

詳細は `manual-evidence.md` と `evidence/*.txt` 参照。

## phase-11.md からの差分（背景）

phase-11.md は staging D1 が利用可能な前提で書かれているが、本リポジトリでは staging 未配備（09a 担当）。そのため:

1. wrangler / 実 D1 が必要な S-1 / S-2 / S-3 / S-8 を **代替手段（in-memory miniflare D1 + DDL inspection + workspace typecheck）** で成立させた。
2. dep-cruiser バイナリも未導入（Phase 10 から 09a / Wave 2 統合 PR に申し送り済）。代替に `scripts/lint-boundaries.mjs` を `pnpm lint` の前段で実行し、apps/web からの D1 / apps/api / integrations-google 直接 import を禁止トークンとして検出している。
3. config 定義（`.dependency-cruiser.cjs`）は完成済みのため、09a で `dependency-cruiser` を入れた瞬間に S-5 / S-6 が即時実行可能。

## 申し送り

| 項目 | 申し送り先 | 内容 |
| --- | --- | --- |
| dep-cruiser バイナリ導入 | 09a（staging）/ Wave 2 統合 PR | `pnpm add -D dependency-cruiser`、CI に `pnpm depcruise` 追加 |
| staging D1 への 5 テーブル smoke | 09a | seed-admin-smoke.sql 投入、`SELECT name FROM sqlite_master ...` 確認 |
| `__fixtures__/` の prod build 除外 | 00 foundation / Wave 2 統合 | `tsconfig.build.json` 分割 or vitest 専用 include |
| miniflare D1 singleton の並列性 | 02c 保守 | `_setup.ts` のテスト並行性、必要なら scoped DB 化 |

## blocker

なし。Phase 12（ドキュメント更新）に進める。

## 次 Phase

- Phase 12: implementation-guide / system-spec-update-summary / changelog / unassigned / skill-feedback / compliance-check の 6 種を作成
