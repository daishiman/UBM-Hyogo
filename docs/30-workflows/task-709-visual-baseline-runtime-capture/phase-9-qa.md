[実装区分: 実装仕様書]

# Phase 9: 品質保証

## 目的

typecheck / lint / playwright / yaml 構文の最終 PASS 確認。

## 1. 実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# yaml 構文
yq '.' .github/workflows/playwright-visual-full.yml > /dev/null

# baseline 件数
ls apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/*.png | wc -l   # 51

# CI 2 連続 PASS (Phase 5 Step 5 結果)
gh run list \
  --workflow=playwright-visual-full.yml \
  --branch=task/709-visual-baseline-runtime-capture \
  --limit=2 \
  --json conclusion,headSha,databaseId
```

## 2. 期待結果

- `pnpm typecheck`: 0 errors
- `pnpm lint`: 0 errors
- yaml parse: 0 errors
- baseline file count: 51
- CI 2 run: 両方 `success`
- 各 viewport の job (3 件 × 2 run = 6 job) すべて `success`

## 3. evidence

`outputs/phase-9/qa.md` に各コマンドの実出力を貼り付け（実装時に追記）。

## 4. 成果物

- 本ファイル `phase-9-qa.md`
- `outputs/phase-9/qa.md`（実行時生成）
