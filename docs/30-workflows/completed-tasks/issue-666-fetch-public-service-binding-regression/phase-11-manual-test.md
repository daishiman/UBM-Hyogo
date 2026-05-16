# Phase 11: 手動テスト / evidence

[実装区分: 実装仕様書]

> Phase: 11 / 13

---

## visualEvidence

`NON_VISUAL` — UI 変更を伴わない unit test 追加 + 内部ロジック edit のみ。スクリーンショットは取得しない。

## evidence 保存先

`docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/`

各 evidence は 1 ファイル 1 観点で保存し、PR 本文から参照する。

```bash
mkdir -p docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence
```

## 取得 evidence 一覧

### 11.1 typecheck.txt

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/typecheck.txt
```

期待: 最終行が `Done` 系で exit 0。

### 11.2 lint.txt

```bash
mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 | tee docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/lint.txt
```

期待: エラー / warning 0 で exit 0。

### 11.3 unit-test.txt

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/fetch/public.spec.ts 2>&1 | tee docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/unit-test.txt
```

期待: `Tests passed` / 5 件以上の新規ケース(AC-R-02 / AC-R-03 / edge-1 / edge-2 / edge-3)を含む全 test green。

### 11.4 build.txt

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/build.txt
```

期待: Next production build exit 0。

### 11.4b build-cloudflare.txt

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/build-cloudflare.txt
```

期待: OpenNext Workers build exit 0。

### 11.5 inverse-assertion-fail.txt

Phase 9.4 の手順で AC-R-02 を逆書きしてテストが fail することを観測。

```bash
# 逆書き状態(commit せず)
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/fetch/public.spec.ts 2>&1 | tee docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/inverse-assertion-fail.txt
```

期待: `AC-R-02` 該当ケースが fail。確認後 spec を元に戻し、`git diff apps/web/src/lib/fetch/public.spec.ts` がクリーンであることを観測。

### 11.6 grep-process-env.txt

```bash
grep -nE "^[[:space:]]*[^/].*process\.env\." apps/web/src/lib/fetch/public.ts | tee docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/grep-process-env.txt
```

期待: 4 行(`isTestOrPlaywright` の 2 行 / `getBaseUrl` の 1 行 / `getServiceBinding` の 1 行)。`process.env.CI` は 0 件。

### 11.7 wrangler-env-grep.txt(任意)

```bash
grep -nE "^(CI|NODE_ENV|PLAYWRIGHT_TEST)\s*=" apps/web/wrangler.toml | tee docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/wrangler-env-grep.txt || true
```

期待: 0 件。

### 11.8 opennext-bundle-transport-grep.txt

```bash
rg -n "process\\.env\\.CI|CI ===|CI=\\\"true\\\"|PLAYWRIGHT_TEST|isTestOrPlaywright" apps/web/.open-next apps/web/.next/server \
  | tee docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/opennext-bundle-transport-grep.txt
```

期待: bundled transport path に `process.env.CI` が fallback trigger として含まれず、`PLAYWRIGHT_TEST` と `PUBLIC_API_BASE_URL` の組み合わせだけが service binding skip 条件として残る。

## evidence 検証

PR 本文に上記 evidence ファイルへの相対パスリンクを記載する(Phase 13 参照)。

## 完了条件(Phase 11)

- [x] 11.1 〜 11.8 の evidence ファイルが保存されている
- [x] 11.5 で逆 assertion が fail することが観測されている
- [x] 11.6 の grep hit が 4 行ちょうどで `process.env.CI` が 0 件
- [x] 11.7 で test env 混入 0 件(混入時は Phase 9 のエスカレーション対応に従う)
