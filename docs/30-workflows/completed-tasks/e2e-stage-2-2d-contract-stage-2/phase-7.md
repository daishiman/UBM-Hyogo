# Phase 7: 結合テスト・全体回帰

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |

## 1. 単体（test 単独実行）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts
```

期待: 7 describe / 全 it pass、skip 0。

## 2. `apps/api` 全体回帰

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test
```

確認項目:

| # | 観点 | 期待 |
|---|------|------|
| 1 | 既存 contract test への影響 | `apps/api/src/audit-correlation/__tests__/contract.test.ts` 等が引き続き pass |
| 2 | route 3 ファイルの export 化が他テストを破壊していない | `apps/api/src/routes/admin/__tests__/*.test.ts` 全 pass |
| 3 | skip 累計 | `apps/api` 全体での skip 件数が本 PR で増えていない |

## 3. 静的検証

| 観点 | コマンド | 期待 |
|------|---------|------|
| 型 | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 |
| 全体型 | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | exit 0 |
| schema 重複定義禁止 | `grep -c 'z\\.object(' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | `0` |
| `apps/web` import 禁止 | `grep -cE "from '@?@?ubm-hyogo/web\|from '\\.\\./\\.\\./.*apps/web\|apps/web" apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | `0` |
| skip 禁止 | `grep -cE '\\b(test\|it\|describe)\\.skip\\b' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | `0` |
| `it.fixme` / `test.fixme` 禁止 | `grep -cE '\\b(it\|test)\\.fixme\\b' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | `0` |
| 行数 | `wc -l apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 251 |

## 4. shared schema 未変更確認

```bash
git diff packages/shared/src/schemas/identity-conflict.ts
git diff packages/shared/src/index.ts
```

期待: **diff なし**（shared schema は正本として参照のみ）。

## 5. route 微修正の差分粒度確認

```bash
git diff apps/api/src/routes/admin/member-delete.ts
git diff apps/api/src/routes/admin/requests.ts
git diff apps/api/src/routes/admin/audit.ts
git diff apps/api/src/routes/admin/identity-conflicts.ts
```

期待:
- `member-delete.ts`: `const DeleteBodyZ` → `export const DeleteBodyZ` の 1 字句追加のみ
- `requests.ts`: `ListRequestsQueryZ` と list/resolve response contract 型を export
- `audit.ts`: `ListAuditQueryZ` と list response contract 型を export
- `apps/web/src/lib/admin/server-fetch.ts` / `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`: `conflictId` を `source__target` 形式に同期
- `identity-conflicts.ts`: **diff なし**

## 6. fixture / D1 / 環境差分なし確認

```bash
git diff apps/web/
git diff packages/
git diff migrations/
```

期待: **diff なし**（`apps/web` / D1 / shared schema を本 PR で変更しない）。

## 7. 失敗時の対応

| 症状 | 対応 |
|------|------|
| `MergeIdentityResponseZ.parse` が `archivedSourceMemberId` 欠落で fail | fixture を shared schema 正本に揃える（phase-2 §3）。shared schema 自体は変更しない |
| route の named export 化で他 test が壊れた | route 内部識別子は不変。export 付与・別名 re-export だけで他 test に影響しない設計のため、壊れた場合は import 経路の typo を疑う |
| `DeleteBodyZ.parse({ reason: '501文字' })` が pass してしまう | 実 schema の `max(500)` 上限値が変わっている可能性。schema 仕様に従い境界値を補正し spec を schema 正本に追従させる |
| `ListRequestsQueryZ.parse({ status:'pending' })` が fail | route 側 query schema の必須項目が変わっている可能性。schema 正本に従い fixture を補正する |
