# Phase 9 — 品質保証

**[実装区分: 実装仕様書 / implementation_mode: verify_existing]**

> landed 実装（commit `745c95115` / PR #1064）に対する品質ゲートを一括判定する。
> 本タスクは line budget / link / mirror parity 系の検証は対象外とし、
> typecheck / lint（`verify:no-inline-style` 含む）/ OKLch トークン準拠 / 不変条件 #5・#9・#10 / `apps/api` 差分ゼロ を判定する。
> 各項目に検証コマンドと期待結果を付す。

---

## 1. 品質ゲートチェックリスト

| # | 観点 | 検証コマンド | 期待結果 |
|---|------|-------------|----------|
| Q1 | 型チェック | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0 / 型エラー 0 件 |
| Q2 | Lint（`verify:no-inline-style` 含む） | `mise exec -- pnpm lint` | exit 0 / 違反 0 件（inline style / 禁止トークン無し） |
| Q3 | OKLch トークン準拠（不変条件 #2 / HEX 禁止） | `grep -rnE '#[0-9a-fA-F]{3,8}\b|bg-\[#|text-\[#' apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 空ヒット（HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 無し） |
| Q4 | 不変条件 #5（`apps/web` → `apps/api` 非 import = zod 再宣言） | `grep -rnE "from ['\"].*apps/api|@ubm-hyogo/api" apps/web/src/features/admin/diagnostics/manual-sync.ts apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 空ヒット（`apps/api` import 無し / contract は `manual-sync.ts` に再宣言） |
| Q5 | 不変条件 #10（`useAdminMutation` 経由） | `grep -n "@/features/admin/hooks/useAdminMutation\|features/admin/hooks/useAdminMutation" apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 1 件以上ヒット（legacy `@/lib/useAdminMutation` は不可） |
| Q6 | 不変条件 #10 補（legacy 参照無し） | `grep -n "@/lib/useAdminMutation" apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 空ヒット |
| Q7 | 不変条件 #9（新規 `<input>` を生やさない） | `grep -nE '<input[ >]' apps/web/src/features/admin/components/_sync/ManualFormResyncPanel.client.tsx` | 空ヒット（直 `<input>` 無し / `FormField` 系経由） |
| Q8 | `apps/api` 差分ゼロ invariant | `git diff dev...HEAD --name-only -- apps/api packages` | 出力ゼロ行 |
| Q9 | env アクセサ規約（`process.env` 直参照禁止 / `getAuthEnv()` 経由） | `grep -n 'process\.env' 'apps/web/app/api/admin/[...path]/route.ts'` | SYNC_ADMIN_TOKEN を `process.env` から読まない（token は `getAuthEnv().SYNC_ADMIN_TOKEN` 経由。`NODE_ENV` / `ENVIRONMENT` 判定の既存 2 箇所のみ許容） |
| Q10 | server-only 機密境界（token をクライアントへ非返却） | `grep -nE 'SYNC_ADMIN_TOKEN' apps/web/src apps/web/app -r` | 参照は `env.ts`（宣言）と `route.ts`（注入）のみ。client component / response body 経路に出現しない |

---

## 2. 必須コマンド（仕様準拠）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
git diff dev...HEAD --name-only -- apps/api packages   # 空であること
```

- typecheck: `@ubm-hyogo/web` パッケージで型エラー 0 件。
- lint: `verify:no-inline-style` を含む全 lint タスクが pass。
- `apps/api` 差分: 出力ゼロ行（backend 凍結の invariant）。

---

## 3. 判定基準

- **PASS 条件**: Q1〜Q10 すべてが期待結果を満たすこと。
- **FAIL 時の扱い**: Q3 / Q4 / Q7 / Q8 / Q10 のいずれかが違反した場合は不変条件違反のため即 FAIL（landed 実装が正であるため、違反検出時は環境差分やマージ汚染を疑い差分の出所を調査する）。Q1 / Q2 の FAIL は dev 同期由来の周辺差分の可能性があるため、原因を切り分けてから判定する。
- 本タスクでは line budget / link check / mirror parity / index drift は **判定対象外**（実装が `apps/web` 配下の機能差分のみで、skill / indexes に影響しないため）。

---

## 完了条件

- [x] Q1 typecheck（`@ubm-hyogo/web`）が exit 0 であることを確認した
- [x] Q2 lint（`verify:no-inline-style` 含む）が exit 0 であることを確認した
- [x] Q3 OKLch トークン準拠（HEX 直書き無し / 不変条件 #2）を確認した
- [x] Q4 不変条件 #5（`apps/web` → `apps/api` 非 import / zod 再宣言）を確認した
- [x] Q5・Q6 不変条件 #10（`useAdminMutation` 経由 / legacy 参照無し）を確認した
- [x] Q7 不変条件 #9（新規 `<input>` 無し）を確認した
- [x] Q8 `apps/api` 差分ゼロ invariant（出力ゼロ行）を確認した
- [x] Q9・Q10 env アクセサ規約 / server-only 機密境界（token 非返却）を確認した
- [x] line budget / link / mirror parity が本タスクの判定対象外であることを明記した
