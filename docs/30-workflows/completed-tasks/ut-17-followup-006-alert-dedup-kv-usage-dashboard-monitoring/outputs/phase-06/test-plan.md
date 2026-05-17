# Phase 6: テスト計画

## quota-base.spec.ts に追加するケース

| ID | 内容 |
| --- | --- |
| Q7 | `workers_kv_writes_per_day` の閾値が `floor(1000 * 0.8) = 800` |
| Q8 | `workers_kv_stored_data_bytes` の閾値が `floor(1073741824 * 0.8) = 858993459` |

## load.spec.ts に追加するケース

| ID | 内容 |
| --- | --- |
| L_KV1 | `loadExpected(repoRoot)` の policies に `workers-kv-writes-per-day`, `workers-kv-stored-bytes` が含まれる |
| L_KV2 | KV policy の canonical form の threshold 値が期待値（800 / 858993459）と一致する |
| L_KV3 | KV policy の `enabled` が `false` で固定されている |

## 既存テスト regression 確認

- canonicalize.spec.ts: 不変
- diff.spec.ts: 不変
- schema-contract.spec.ts: 既存 policy 全件 validation PASS
- resolve.spec.ts: 不変

## 実行コマンド

```bash
mise exec -- pnpm test:alerts
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```
