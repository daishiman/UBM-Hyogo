# Phase 4 — テスト戦略

## マトリクス

| layer | 対象 | テスト名（例） | 入口 |
|---|---|---|---|
| unit | adminGate | 401 (no header) / 403 (mismatch) / 200 (match) | `apps/api/src/middleware/admin-gate.test.ts`（必要時） |
| unit | dashboard 集計 | totals が COUNT クエリ通り返る | `routes/admin/dashboard.test.ts` |
| contract | 各 route | response が `*ViewZ.parse` を通る | route ごと |
| authz | adminGate 越え | 全 route で 401/403/200 のいずれか | route ごとに最低 1 ケース |
| integration | attendance | duplicate→409, deleted→422, ok→201 | `routes/admin/attendance.test.ts` |
| integration | tag queue resolve | queued→reviewing→resolved 経由のみ resolved になる | `routes/admin/tags-queue.test.ts` |
| integration | schema aliases | 既存 stableKey と diff_queue の resolve が同 transaction 風に走る | `routes/admin/schema.test.ts` |
| integration | sync trigger | 既存 03a/03b でカバー済み | 本タスクでは追加なし |

## D1 スタブ方針

既存 `apps/api/src/routes/admin/sync-schema.test.ts` のスタブパターン（`prepare().bind().first/all/run`）を踏襲。fixture が大きい場合は `__fixtures__/` の既存 helper を活用。

## カバレッジ最低基準

- 各 route で正常系 1 + 異常系 1（authz 含む）= 計 18+ ケース
- attendance / tag queue / schema は遷移系を 1 ケース追加

## 未カバー（Out of scope, 後続 wave）

- E2E（ブラウザから admin UI 経由）→ 06c で実装後に追加
- 本番 D1 への hit テスト → Phase 11 manual smoke で curl 確認
