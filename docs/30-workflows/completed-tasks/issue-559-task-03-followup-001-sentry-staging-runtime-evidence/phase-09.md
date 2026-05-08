# Phase 9: 品質保証

## 1. ローカル品質ゲート（local PASS 5 点 + grep gate）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck   2>&1 | tee outputs/phase-09/typecheck.log
mise exec -- pnpm --filter @ubm-hyogo/web lint        2>&1 | tee outputs/phase-09/lint.log
mise exec -- pnpm --filter @ubm-hyogo/web test        2>&1 | tee outputs/phase-09/test.log
mise exec -- pnpm --filter @ubm-hyogo/web build       2>&1 | tee outputs/phase-09/build.log
{
  if rg -n 'requestIdleCallback' apps/web/.open-next/; then echo 'FAIL: requestIdleCallback matches found'; exit 1; else echo 'PASS: requestIdleCallback 0 matches'; fi
  if rg -n '@sentry/nextjs' apps/web/.open-next/; then echo 'FAIL: @sentry/nextjs matches found'; exit 1; else echo 'PASS: @sentry/nextjs 0 matches'; fi
} 2>&1 | tee outputs/phase-09/grep-gate.log
```

## 2. 期待値

| ゲート | 期待 |
| --- | --- |
| typecheck | exit 0 / errors 0 |
| lint | exit 0 / errors 0 |
| test | 既存 + 新規 6 ケース pass / failures 0 |
| build | exit 0 / `.open-next/worker.js` 生成 |
| grep gate `requestIdleCallback` | 0 件 |
| grep gate `@sentry/nextjs` | 0 件 |

## 3. CI gate（参考）

`.github/workflows/` 配下の既存 web build / web typecheck / web lint / web test job が PR で走ることを前提。本タスクで CI workflow ファイルの追加・編集はしない。

## 4. 静的セキュリティ確認

```bash
rg -n 'https://[a-z0-9]+@[a-z0-9.]+[.]ingest[.]sentry[.]io' .        # 0 件期待
rg -n 'SENTRY_DSN_WEB=https' .env* apps/web/.dev.vars*               # 0 件期待（op:// のみ）
rg -n 'process\.env\.SENTRY_DSN_WEB' apps/web/src/                    # 0 件期待（getEnv 経由）
```

## 5. 不変条件再確認（CLAUDE.md）

- INV-2 ランタイムシークレット = Cloudflare Secrets: ✓ DSN は `cf.sh secret put` 経由のみ
- INV-5 D1 直接アクセス = `apps/api` 限定: ✓ 本タスクは `apps/web` のみ、D1 binding 触らず
- INV: `apps/web` env は `getEnv()` 経由のみ: ✓ schema 拡張のみで access 経路維持
- INV: `127.0.0.1:8888` 等ローカル限定 endpoint の焼き込み禁止: ✓ 本タスク無関係

## 6. 品質保証結論

全ゲート PASS が確認できれば G2 staging deploy へ進行可。FAIL 時は phase-06 の異常系手順で recovery。
