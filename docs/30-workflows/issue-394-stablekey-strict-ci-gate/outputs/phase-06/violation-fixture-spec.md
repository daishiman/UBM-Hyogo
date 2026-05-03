# violation-fixture-spec

## 目的

`pnpm lint:stablekey:strict` が現実の違反混入に対して exit 非 0 を返すことを、cleanup 後の clean state で実証する。

## fixture

一時ファイル `apps/api/src/_dryrun-stablekey.ts` を作成し、以下のような違反コードを混入する:

```ts
// 違反: stableKey リテラル直書き（allow-list 外モジュール）
const sample = "publicConsent";
export const dryrun = sample;
```

## 実行手順

```bash
# fixture 作成（git に commit せず、untracked のまま）
echo 'const sample = "publicConsent";\nexport const dryrun = sample;' > apps/api/src/_dryrun-stablekey.ts

# strict を走らせ exit 非 0 / 該当行を確認
mise exec -- pnpm lint:stablekey:strict | tee outputs/phase-11/evidence/strict-violation-fail.txt
echo "exit=$?" >> outputs/phase-11/evidence/strict-violation-fail.txt

# fixture 破棄
rm apps/api/src/_dryrun-stablekey.ts
```

## 期待

- exit code: 非 0
- stdout に `_dryrun-stablekey.ts:1:` 行で違反報告が出ていること

## 注意

- fixture は **絶対に commit しない**（pre-commit hook でも fail する想定）
- 実行は cleanup 完了 + Stage 1 の strict-pass.txt 取得後に実施
