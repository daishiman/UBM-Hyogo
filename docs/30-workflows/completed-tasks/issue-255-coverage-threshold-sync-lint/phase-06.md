# Phase 6: 唯一の変更 diff

> 本ワークフローは同一サイクルで実装まで完了した。ここでは生成した diff と設計要点を記録する。

## 6.1 追加 / 編集ファイル一覧（CONST_005）

| 区分 | パス | LOC 目安 |
| --- | --- | --- |
| 新規 | `scripts/coverage-threshold-lint.ts` | ~180 |
| 新規 | `scripts/__tests__/coverage-threshold-lint.spec.ts` | ~140 |
| 新規 | `.github/workflows/coverage-threshold-lint.yml` | ~40 |
| 編集 | `package.json` | +1 行 |
| 編集 | `docs/30-workflows/issue-255-coverage-threshold-sync-lint/index.md` | （本タスクで既記載） |

## 6.2 `scripts/coverage-threshold-lint.ts` 実装要点

| 項目 | 実装 |
| --- | --- |
| entrypoint | `tsx scripts/coverage-threshold-lint.ts` / `#!/usr/bin/env tsx` |
| programmatic API | `lintCoverageThresholds(options)` と alias `runLint(options)` |
| result union | `ok=true` / `errorKind="drift"` / `errorKind="parse"` の discriminated union |
| SSOT parser | `### カバレッジ閾値設定` セクション内の `apps/` / `packages/` 行から `%` 数値を抽出し、単一値であることを検証 |
| executor parser | `THRESHOLD=<number>` を抽出し、行末 comment を許容 |
| Codecov parser | `target:` のみ抽出する。`threshold:` は Codecov の許容誤差であり coverage gate 閾値ではないため無視 |
| optional source | `codecov.yml` 不在時は 2-source、存在時は 3-source |
| JSON mode | `--json` 指定時の stdout は JSON のみ。human-readable OK/DRIFT 行は出さない |
| exit code | OK=0 / drift=1 / parse or arg error=2 |

## 6.3 `package.json` 編集

```diff
   "scripts": {
+    "lint:coverage-threshold": "tsx scripts/coverage-threshold-lint.ts",
```

## 6.4 `.github/workflows/coverage-threshold-lint.yml`

```yaml
name: coverage-threshold-lint
on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]
permissions:
  contents: read
jobs:
  coverage-threshold-lint:
    name: coverage-threshold-lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup project
        uses: ./.github/actions/setup-project
      - name: Verify coverage threshold sources
        run: pnpm lint:coverage-threshold
```

## 6.5 ビルドパイプライン擬似コード

```
PR open / push ─▶ checkout ─▶ setup-project ─▶ lint:coverage-threshold
                                                              ┌─ exit 0 ─▶ green ─▶ mergeable
                                                              ├─ exit 1 ─▶ red ─▶ DRIFT (PR block)
                                                              └─ exit 2 ─▶ red ─▶ parse error (runbook)
```
