[実装区分: 実装仕様書]

# build-cloudflare-smoke.md（PASS）

| 項目 | 値 |
| --- | --- |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| 改訂日 | 2026-05-03 |
| evidence status | PASS |

## 目的

Phase 11 実測 9 段手順の段 6 結果を記録する。AC-2 / AC-3 の evidence。

## 段 6: cloudflare build

```bash
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee /tmp/web-build-cf.log
echo "exit=$?"
grep -c "Cannot read properties of null" /tmp/web-build-cf.log
```

## 期待結果

- exit code: 0
- `apps/web/.open-next/worker.js` が生成されている（段 7 で確認）
- `useContext` null grep: 0 件
- worker.js サイズが Cloudflare Workers 無料枠（gzip 後 1MB 等）の制約内であること（不変条件 #14）

## 実測

- evidence: PASS
- 実行日時: 2026-05-03
- 採用方針: Plan A + build script `NODE_ENV=production`
- command: `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee /tmp/issue-385-build-cf.log`
- exit code: 0
- ログ末尾抜粋: `Worker saved in .open-next/worker.js`; `OpenNext build complete`; `[patch-open-next-worker] auth env bridge injected`
- `useContext` null 検出件数: 0

## 判定

- AC-2: PASS
- AC-3: PASS
- 不変条件 #14: PASS（worker.js 生成確認。サイズ上限監査は deploy gate 側で継続）

## 失敗時の取り扱い

- 段 5 PASS かつ段 6 のみ FAIL の場合は `@opennextjs/cloudflare` の ESM bundling 問題を疑い、Phase 12 `unassigned-task-detection.md` に FU-4 を追記する（Plan A の rollback はしない）
