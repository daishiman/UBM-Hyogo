# Test Strategy

## AC ↔ Test 対応表

| AC | テストケース | ファイル |
| --- | --- | --- |
| AC-1 | "AC-1: general 行は request_status / resolved_at / resolved_by_admin_id 全て NULL" | adminNotes.test.ts |
| AC-2 | migration backfill は in-memory D1 setup の migration 適用で間接的に検証（`_setup.ts` が全 migration を流す） | _setup |
| AC-3 | "create で visibility/delete request type を保持し pending 判定できる" / "AC-7: ..." | adminNotes.test.ts |
| AC-4 | "AC-4: markResolved で pending → resolved に遷移し metadata が記録される" / "AC-4: general 行への markResolved は null" | adminNotes.test.ts |
| AC-5 | "AC-5: markRejected で pending → rejected に遷移し reason が body 末尾に追記される" | adminNotes.test.ts |
| AC-6 | "AC-6: resolved 行への再 markResolved / markRejected は null" | adminNotes.test.ts |
| AC-7 | "AC-7: resolved 行のみ存在する member は再申請が 202 で成功する" | routes/me/index.test.ts |
| AC-8 | "F-7: 二重申請は 409 DUPLICATE_PENDING_REQUEST"（既存） | routes/me/index.test.ts |
| AC-9 | partial index は migration 0007 で `IF NOT EXISTS` 作成。`_setup.ts` が migration を流すため間接検証 | migration |
| AC-10 | `pnpm typecheck` / `apps/api` vitest 全件 green | CI |
| AC-11 | `docs/00-getting-started-manual/specs/07-edit-delete.md` 追記 | spec |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test
```
