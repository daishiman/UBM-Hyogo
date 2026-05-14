# Phase 9: .github/workflows/ci.yml の shard matrix 化 + required context 維持

## 変更対象

- `.github/workflows/ci.yml`

## 現状

`coverage-gate` ジョブが単一 runner で `scripts/coverage-guard.sh` を実行し、全 package を直列で `test:coverage` する構成。

## 変更後

`coverage-gate-shard` を matrix 化し、後段の集約 job 名を既存 required context と同じ `coverage-gate` にする。

これにより branch protection の `required_status_checks.contexts` を変更せず、CI の並列化だけを導入できる。

### `coverage-gate-shard`

```yaml
coverage-gate-shard:
  name: coverage-gate-shard (${{ matrix.group }})
  needs: [ci]
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      group: [web, api-unit, api-d1, packages]
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with:
        version: 10.33.2
    - uses: actions/setup-node@v4
      with:
        node-version: '24'
        cache: pnpm
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Build apps/web (web shard only)
      if: matrix.group == 'web'
      run: pnpm --filter @ubm-hyogo/web build:cloudflare
    - name: Run coverage for shard
      env:
        CI: 'true'
      run: bash scripts/coverage-guard.sh --group ${{ matrix.group }}
    - name: Upload per-shard coverage artifact
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: coverage-${{ matrix.group }}
        path: |
          apps/*/coverage/
          packages/*/coverage/
          packages/integrations/*/coverage/
        if-no-files-found: error
```

### `coverage-gate`

```yaml
coverage-gate:
  name: coverage-gate
  needs: [coverage-gate-shard]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
      with: { version: 10.33.2 }
    - uses: actions/setup-node@v4
      with: { node-version: '24', cache: pnpm }
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    - name: Download all per-shard coverage
      uses: actions/download-artifact@v4
      with:
        pattern: coverage-*
        merge-multiple: true
    - name: Merge apps/api unit + d1 coverage
      run: |
        node scripts/coverage-merge.mjs \
          --inputs="apps/api/coverage/unit/coverage-final.json,apps/api/coverage/d1/coverage-final.json" \
          --output="apps/api/coverage"
    - name: Coverage gate (aggregate no-run)
      env: { CI: 'true' }
      run: bash scripts/coverage-guard.sh --no-run
    - name: Upload merged coverage artifact
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: coverage-report-merged
        path: |
          apps/*/coverage/
          packages/*/coverage/
          packages/integrations/*/coverage/
        if-no-files-found: error
```

## branch protection 同期

不要。最終判定 job 名を `coverage-gate` として維持するため、現在の required context `coverage-gate` はそのまま使える。

将来 `coverage-gate` 以外の context へ移行する場合だけ、Phase 13 で dev/main 個別 GET snapshot、PATCH payload、user approval marker、after GET snapshot を保存してから実行する。

## 完了条件

- `.github/workflows/ci.yml` の `coverage-gate-shard` が 4 matrix で並列起動
- `coverage-gate` が後段で artifact を download / merge し、80% gate を判定
- branch protection mutation が不要であることが Phase 12 compliance に記録されている
