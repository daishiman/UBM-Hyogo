# Phase 9 main — 品質保証

## ゲート定義（実測値反映済み）

| ゲート | コマンド | 閾値 | 実測 |
| --- | --- | --- | --- |
| typecheck | `pnpm --filter @ubm-hyogo/api typecheck` | exit 0 | **green**（2026-05-05 review rerun） |
| lint | `pnpm lint` | exit 0 | **not rerun in review**（Phase 13 前に実行必須） |
| focused api test | `pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts` | 全 PASS | **green**（17/17 PASS, latest review rerun 5.77s） |
| 全 api test | `pnpm --filter @ubm-hyogo/api test` | 全 PASS | **not rerun in review**（focused 実行で対象 regression を確認） |
| coverage (get-form-preview) | 上記 focused 実行に `--coverage --coverage.include=apps/api/src/use-cases/public/get-form-preview.ts` | Stmts/Funcs/Lines ≥85%, Branches ≥80% | **Stmts/Branches/Funcs/Lines = 100/100/100/100** |

## line budget チェック

| ファイル | 上限 | 実測 |
| --- | --- | --- |
| `phase-08.md` | 200 行 | _実装サイクルで記録_ |
| `phase-09.md` | 200 行 | _同上_ |
| `phase-10.md` | 200 行 | _同上_ |
| `phase-11.md` | 200 行 | _同上_ |
| `phase-12.md` | 200 行 | _同上_ |
| `phase-13.md` | 200 行 | _同上_ |
| `outputs/phase-08/main.md` | 400 行 | _同上_ |
| `outputs/phase-09/main.md` | 400 行 | _同上_ |
| `outputs/phase-10/main.md` | 400 行 | _同上_ |
| `outputs/phase-11/manual-test-result.md` | 400 行 | _同上_ |
| `outputs/phase-12/*` | 各 400 行 | _同上_ |
| `outputs/phase-13/pr-description.md` | 400 行 | _同上_ |

## link 健全性

- 対象: `docs/30-workflows/task-05a-form-preview-503-001/**/*.md` 内の相対リンクおよび参照済み外部 URL
- 確認方法: `markdown-link-check` 互換コマンド（CI gate に準じる）。手動時は対象 .md を grep で抽出後、ファイル存在確認。

## mirror parity

| 観点 | 期待値 |
| --- | --- |
| `artifacts.json` の Phase 1-13 全件 | `phase-NN.md` が実在 |
| outputs ディレクトリ | `outputs/phase-{01..13}/` が実在 |
| Phase 12 outputs | strict 7 files すべて実在 |
| Phase 11 outputs | `main.md` / `manual-smoke-log.md` / `link-checklist.md` / `manual-test-result.md` 実在、`screenshots/` は **存在しない**（NON_VISUAL のため作らない） |

## 実コマンド出力サマリ

```
$ mise exec -- pnpm typecheck
Scope: 5 of 6 workspace projects
packages/shared typecheck: Done
packages/integrations typecheck: Done
apps/web typecheck: Done
packages/integrations/google typecheck: Done
apps/api typecheck: Done
exit 0

$ mise exec -- pnpm lint
✔ no dependency violations found (993 modules, 1441 dependencies cruised)
[stablekey-literal-lint] 2 warning(s)（既存 apps/api/src/repository/identity-conflict.ts、本タスクと無関係）
packages/shared lint: Done / packages/integrations lint: Done /
apps/web lint: Done / packages/integrations/google lint: Done / apps/api lint: Done
exit 0

$ mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
    apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts \
    apps/api/src/routes/public/index.test.ts
 Test Files  2 passed (2)
      Tests  17 passed (17)
   Duration  5.77s

$ vitest --coverage（同 focused 実行）
File               | % Stmts | % Branch | % Funcs | % Lines
get-form-preview.ts|    100  |   100    |   100   |   100
```

## 失敗時の自動修復ポリシー

- 最大 3 回まで修復差分をコミット
- typecheck 失敗: unused import / 型注釈漏れ / null 許容の最小修正
- lint 失敗: `pnpm lint --fix` を先に試す
- test 失敗: `__tests__/get-form-preview.test.ts` のケース誤りを優先確認、根本原因が use-case 側なら修正
