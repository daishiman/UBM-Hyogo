[実装区分: 実装仕様書]

# build-smoke.md（PASS）

| 項目 | 値 |
| --- | --- |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| 改訂日 | 2026-05-03 |
| evidence status | PASS |

## 目的

Phase 11 実測 9 段手順の段 1〜5 結果を記録する。AC-1 / AC-3 / AC-4 / AC-5 / AC-9 の evidence。段 9 (AC-6) の `rg` 結果も末尾に転記する。

## 前提（段 1〜4）

| 段 | コマンド | exit code | 判定 |
| - | -------- | --------- | ---- |
| 1 | `mise exec -- pnpm install --force` | not run | existing lockfile / node_modules used |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 0 | AC-4 PASS |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | 0 | AC-5 PASS |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web test -- --run ...` | 0 | AC-9 PASS（22 files / 128 tests） |

## 段 5: next build

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee /tmp/web-build.log
echo "exit=$?"
grep -c "Cannot read properties of null" /tmp/web-build.log
```

## 期待結果

- exit code: 0
- ログ末尾に `Compiled successfully` 系メッセージ
- route table に `/_global-error` / `/_not-found` が含まれ "✓" でマークされる
- `useContext` null grep: 0 件

## 実測

- evidence: PASS
- 実行日時: 2026-05-03
- 採用方針: Plan A + build script `NODE_ENV=production`
- command: `mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee /tmp/issue-385-build.log`
- exit code: 0
- `useContext` null 検出件数: 0
- route table 抜粋: `○ /_not-found`; `/_global-error` prerender error なし
- 注意: `.mise.toml` は `NODE_ENV=development` を注入するため、`apps/web/package.json` の `build` script で `NODE_ENV=production` を明示して production build の React dispatcher を安定化した。

## 段 9: top-level next-auth import grep（参考転記）

```bash
rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts
rg -n '^import.*from "next-auth/providers' apps/web/src/lib/auth.ts
rg -n '^import.*from "next-auth/jwt' apps/web/src/lib/auth.ts
rg -n '^import.*from "next-auth/react' apps/web/src/lib/auth/oauth-client.ts
rg -n 'await getAuth\(\)' \
  'apps/web/app/api/auth/[...nextauth]/route.ts' \
  apps/web/app/api/auth/callback/email/route.ts \
  'apps/web/app/api/admin/[...path]/route.ts' \
  'apps/web/app/api/me/[...path]/route.ts'
```

期待: type-only import 以外で 0 hit（AC-6）/ `await getAuth()` 各 handler で 1 件以上 hit（AC-7）/ package.json の next / react / react-dom / next-auth が本タスク前と同一バージョン（AC-8）。実測値は実装着手後に転記。

## 判定

- AC-1: PASS
- AC-3: PASS
- AC-4 / AC-5 / AC-9: PASS
- AC-6 / AC-7 / AC-8: PASS（lazy-import-check.md 参照）
