# Output Phase 4: テスト戦略

## status

EXECUTED

## 追加テストファイル

| Layer | File | Cases |
| --- | --- | --- |
| Unit | `apps/web/src/lib/auth/verify-magic-link.test.ts` | 15 |
| Route | `apps/web/app/api/auth/callback/email/route.test.ts` | 11 |
| Static (既存利用) | `apps/web/src/lib/__tests__/boundary.test.ts` | 3 |

## テストマトリクス → 実テスト対応

| 観点 | 期待 | 対応テスト |
| --- | --- | --- |
| Credentials authorize success | verifiedUser JSON から user 復元 | route success ケース → signIn 呼び出し検証 |
| Credentials failure | reason に応じた error redirect | route reason × 5 ケース |
| Route success | 404 にならず signIn 到達 | route AC-1 |
| Route missing token/email | `/login?error=missing_*` | route AC-3 (2 ケース) |
| Route invalid shape | `/login?error=invalid_link` | route token 形式違反 / email 形式違反 |
| Verify reason mapping | 正規化 | verify-magic-link.test.ts mapVerifyReasonToLoginError |
| Static boundary | apps/web から API/D1 を import 0件 | boundary.test.ts (既存) + lint-boundaries.mjs exit=0 |

## 推奨コマンド（再解決後）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  apps/web/src/lib/auth/verify-magic-link.test.ts \
  apps/web/app/api/auth/callback/email/route.test.ts
node scripts/lint-boundaries.mjs
```

## 結果

- typecheck: PASS（`outputs/phase-11/typecheck.log`）
- focused tests: 26 PASS（`outputs/phase-11/test.log`）
- boundary check: PASS exit=0（`outputs/phase-11/boundary-check.log`）
