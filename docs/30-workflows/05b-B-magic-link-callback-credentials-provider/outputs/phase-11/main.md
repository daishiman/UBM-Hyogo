# Output Phase 11: 手動 smoke / 実測 evidence

## status

EXECUTED (NON_VISUAL)

## Evidence Files

| ファイル | 内容 | 結果 |
| --- | --- | --- |
| `outputs/phase-11/typecheck.log` | apps/web typecheck (`tsc -p tsconfig.json --noEmit`) | exit=0 |
| `outputs/phase-11/test.log` | focused auth tests (verify-magic-link + callback route) | 15 files / 98 tests passed |
| `outputs/phase-11/boundary-check.log` | `node scripts/lint-boundaries.mjs` | exit=0（apps/web から D1 / apps/api / @ubm-hyogo/api / localStorage / sessionStorage 直接参照 0 件） |
| `outputs/phase-11/callback-smoke.log` | dev server を立ち上げての curl smoke | NOT_EXECUTED（自動 route test で代替済み・後続タスク 09a-A staging smoke に委譲） |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  apps/web/src/lib/auth/verify-magic-link.test.ts \
  apps/web/app/api/auth/callback/email/route.test.ts
node scripts/lint-boundaries.mjs
```

## 環境

- Node 24.15.0 / pnpm 10.33.2 (mise 経由)
- vitest 2.1.9
- next-auth 5.0.0-beta.25 / next 16.2.4
- 対象 commit: WIP（本セッション内変更、未 commit）

## visualEvidence

NON_VISUAL — UI 表示更新は伴わず、route / auth 配線のみ。screenshot 不要。
