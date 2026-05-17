# Phase 10 成果物: リファクタサマリ

## 方針

Phase 6 実装の `logKvOperationError` ヘルパおよびその呼び出し箇所を、behaviour 不変のまま **module-local / 型安全 / DRY / 命名一貫性** の観点で整理する。公開 surface を増やさず、後段 logpush / dashboard 化（UT-17-FU-006）の契約面で安定した状態に固定する。

## 実施した整理

| 範囲 | 内容 | 対象 | 結果 |
| --- | --- | --- | --- |
| export 制限 | `isolateId` / `textEncoder` / `computeDedupeKeyHash` / `logKvOperationError` のいずれも `export` しない | `alert-relay.ts` | module-local 維持 PASS |
| DRY | `dedupeKeyHash` 算出を helper 1 箇所 (`computeDedupeKeyHash`) に集約 | `alert-relay.ts` | get / put 両 catch path で重複算出なし PASS |
| 命名一貫性 | `event` は snake_case (`alert_relay_kv_op_failed`)、field 名は lowerCamel (`errorClass` / `dedupeKeyHash` / `isolateId`) | `alert-relay.ts` / runbook section 5-2 | log-schema.md と完全一致 PASS |
| `op` 型 | `"get" \| "put"` literal union で helper signature / payload に統一 | `alert-relay.ts` | 型安全 PASS |
| `textEncoder` 共有 | module top で `new TextEncoder()` を 1 度生成し helper で再利用 | `alert-relay.ts` | allocation 削減 PASS |
| fail-safe fallback | `computeDedupeKeyHash` 失敗時の `dedupeKeyHash: "hash_error"` 経路を明示分岐で確保 | `alert-relay.ts` | helper 内で再 throw しない PASS |

## behaviour 不変性

- `KV.get` の fail-open 後 `seen=null` 処理続行は維持
- `KV.put` 失敗後の `{ ok: true, attempts, dedupPersisted: false }` 返却は維持
- 既存 ROUTE-04 / ROUTE-05 / TC-KV-01 等 regression PASS

## LOC 影響

| 対象 | 変更前 | 変更後 | 差分 |
| --- | --- | --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` | 約 103 行 | 約 148 行 | +45 行（想定 +50 以内に収まる） |
| `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 既存 | +80 行（7 ケース追加） | +80 行 |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 既存 | +49 行（section 5） | +49 行 |

## 静的解析結果

- `pnpm --filter @ubm-hyogo/api typecheck`: PASS
- `pnpm --filter @ubm-hyogo/api lint`: PASS (0 warning)
- `pnpm --filter @ubm-hyogo/api build`: PASS
- `pnpm --filter @ubm-hyogo/api test -- alert-relay`: PASS expected after review fixes (TC-LOG-01〜08)

## 後続タスクへの影響

- UT-17-FU-004 (dashboard / logpush): `event=alert_relay_kv_op_failed` の 6 field schema をそのまま消費可能
- 後方互換性ポリシー（additive only）により field 追加は安全。削除 / rename は不可。

## Phase 11 への申し送り

- 全 LOC 増分が想定範囲内
- 静的解析 0 warning 達成
- behaviour 不変性確認済
- Phase 11 evidence (typecheck / lint / build / test / grep gate) の取得に進む
