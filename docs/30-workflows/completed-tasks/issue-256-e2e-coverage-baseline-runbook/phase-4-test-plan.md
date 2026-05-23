# Phase 4 — テスト計画 (TDD RED)

`[実装区分: 実装仕様書]`

## 1. テスト対象

| 対象 | テストファイル | テスト種別 |
|------|--------------|-----------|
| `scripts/measure-coverage-exclude-ratio.ts` | `scripts/__tests__/measure-coverage-exclude-ratio.spec.ts` | unit (vitest) |
| `apps/web/app/loading.tsx` (exclude 解除後) | `apps/web/app/__tests__/error.component.spec.tsx` | existing component regression (vitest + RTL) |
| `apps/web/app/not-found.tsx` (exclude 解除後) | `apps/web/app/__tests__/error.component.spec.tsx` | existing component regression (vitest + RTL) |

## 2. テストケース

### 2.1 measure-coverage-exclude-ratio.spec.ts

| TC | ケース | 入力 | 期待 |
|----|--------|------|------|
| TC-01 | exclude 0 件 | mock vitest.config (exclude=[]) + 10 files | ratio=0, status='ok' |
| TC-02 | exclude 100% | exclude=['apps/web/app/**/*.tsx'] + 10 files | ratio=1.0, status='warn' |
| TC-03 | threshold 境界 (30%) | excluded=3 / total=10 | ratio=0.3, status='warn' (>= threshold) |
| TC-04 | threshold 直下 (29%) | excluded=29 / total=100 | ratio=0.29, status='ok' |
| TC-05 | glob 未マッチ | targetGlob にマッチする file 0 | total_files=0, ratio=0, status='ok' (division by zero guard) |
| TC-06 | カスタム threshold | threshold=0.5, excluded=0.4 | status='ok' |
| TC-07 | --out で markdown 出力 | --out=/tmp/foo.md | ファイル生成、内容に ratio% を含む |
| TC-08 | vitest.config.ts に exclude セクションがない | mock config | excluded_count=0, ratio=0 |
| TC-09 | test spec を母集団から除外 | app source + `*.spec.tsx` | denominator は production-like source のみ |

### 2.2 loading / not-found existing component regression

| TC | ケース | 期待 |
|----|--------|------|
| TC-L01 | `Loading` render | stale token / arbitrary token class が出力されない |
| TC-N01 | `NotFound` render | stale token / arbitrary token class が出力されない |

## 3. RED 確認

Phase 5 実装前に script spec を `xit` / `test.skip` ではなく実テストとして書き、初回実行で FAIL することを確認 (TDD)。
`loading.tsx` / `not-found.tsx` は既存 `error.component.spec.tsx` の token regression suite に同居済みのため、新規 spec を増やさず既存 focused suite で回帰確認する。

## 4. 実行コマンド

```bash
mise exec -- pnpm vitest run scripts/__tests__/measure-coverage-exclude-ratio.spec.ts
mise exec -- pnpm vitest run apps/web/app/__tests__/error.component.spec.tsx
```
