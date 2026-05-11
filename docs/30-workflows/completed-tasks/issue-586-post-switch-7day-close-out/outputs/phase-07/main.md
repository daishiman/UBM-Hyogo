# Phase 7 — テスト計画 / 実施結果

## focused vitest

```
$ mise exec -- pnpm exec vitest run scripts/cf-audit-log/observation/__tests__
✓ scripts/cf-audit-log/observation/__tests__/post-switch-monitor.test.ts (10 tests)
✓ scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts (12 tests)
Test Files  2 passed (2)
     Tests  22 passed (22)
```

## leakage grep dry-run（observation 形状）

```
$ ESBUILD_BINARY_PATH=... mise exec -- pnpm exec tsx scripts/cf-audit-log/evaluation/secret-leakage-grep.ts \
    --exit-on-detect --input /tmp/observation-smoke
{"ok":true,"hits":[]}
exit=0
```

7 日 regression は GitHub Actions 上での実 run 集計に依存。本サイクルでは契約定義のみ。
