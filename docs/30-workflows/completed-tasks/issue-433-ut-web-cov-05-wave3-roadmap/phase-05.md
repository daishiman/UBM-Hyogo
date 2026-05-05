# Phase 5: coverage 数値計測

## 目的

`apps/web` / `apps/api` / `packages/*` で `vitest --coverage` を実行し、`coverage-summary.json` を取得する。Phase 6 集計の input を確定する。

## 実行コマンド

```bash
# apps/web
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage

# apps/api
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage

# packages（ワークスペース全体）
mise exec -- pnpm --filter @ubm-hyogo/shared test:coverage
mise exec -- pnpm --filter @ubm-hyogo/integrations test:coverage
```

> パッケージ名は `package.json` の現行値（`@ubm-hyogo/web` / `@ubm-hyogo/api` / `@ubm-hyogo/shared` / `@ubm-hyogo/integrations`）を正とする。各 package は root `vitest.config.ts` を `--root=../.. --config=vitest.config.ts` で参照するため、存在しない `apps/*/vitest.config.ts` を前提にしない。

## 取得対象

各パッケージの `coverage/coverage-summary.json` を以下の名前で保存する:

- `outputs/phase-05/coverage-summary-web.json`
- `outputs/phase-05/coverage-summary-api.json`
- `outputs/phase-05/coverage-summary-packages.json`（`packages/shared` と `packages/integrations` を array で集約）

## 変更対象ファイル一覧（CONST_005）

なし（読取・JSON 保存のみ。リポジトリ実体（src）は変更しない）

## 入力 / 出力 / 副作用

- 入力: 各 vitest config、テストコード現状
- 出力: 上記 coverage-summary JSON 3 点 + `outputs/phase-05/main.md` + `coverage-run-commands.md`
- 副作用: 各パッケージの `coverage/` ディレクトリが生成されるが gitignore 配下のためコミット対象外

## テスト方針

- 3 パッケージとも exit 0 であること
- JSON が parse 可能 (`jq . file > /dev/null`)
- `total.lines.pct` / `total.branches.pct` / `total.functions.pct` フィールドが存在

## ローカル実行・検証コマンド

```bash
for f in coverage-summary-web.json coverage-summary-api.json coverage-summary-packages.json; do
  jq '.total | {lines: .lines.pct, branches: .branches.pct, functions: .functions.pct}' \
    docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/outputs/phase-05/$f
done
```

## 完了条件 / DoD

- [ ] 3 つの coverage-summary JSON が outputs に保存
- [ ] 各 JSON の `total.lines.pct` / `branches.pct` / `functions.pct` が抽出可能
- [ ] 実行コマンドと exit code が `outputs/phase-05/coverage-run-commands.md` に記録

## 出力

- outputs/phase-05/main.md
- outputs/phase-05/coverage-run-commands.md
- outputs/phase-05/coverage-summary-web.json
- outputs/phase-05/coverage-summary-api.json
- outputs/phase-05/coverage-summary-packages.json

## 参照資料

- vitest.config.ts
- apps/web/package.json
- apps/api/package.json
- packages/shared/package.json
- packages/integrations/package.json
- CLAUDE.md「よく使うコマンド」

## メタ情報

- Phase: 5
- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- current package scripts で coverage JSON を取得する。

## 成果物/実行手順

- `outputs/phase-05/main.md`、`coverage-run-commands.md`、coverage summary JSON を保存する。

## 統合テスト連携

- NON_VISUAL。`test:coverage` scripts の exit 0 と JSON parse を確認する。
