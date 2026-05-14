# Phase 7 — カバレッジ確認

## 対象範囲（変更行スコープ）

- `apps/api/src/routes/internal/alert-relay.ts` の dedup ブロック（L60-L72）
- `apps/api/test/helpers/kv-stub.ts` 全体

## 実測（テストケース対応表）

| ブランチ / 行 | カバーするテスト |
|--------------|----------------|
| `KV.get(key) !== null` → deduped 早期 return | ROUTE-05b / TC-02 |
| `KV.get(key) === null` → put 経路 | ROUTE-04, TC-03, TC-KV-01〜04, TC-KV-06〜08 |
| `KV.put` 引数: value="1" | TC-KV-02 |
| `KV.put` 引数: expirationTtl = ceil(ttl/1000) | TC-KV-03, TC-KV-08 |
| TTL 経過後の deduped 解除 | TC-KV-01 |
| `KV.get` throw 経路 | TC-KV-05 |
| `KV.put` throw 経路 | TC-KV-09 |
| dedup key fallback（policy_id 欠落） | TC-KV-06 |
| minuteBucket 境界跨ぎ | TC-KV-07 |

dedup ブロックの全 line / 全 branch がいずれかのテストで実行される。

## 目標達成

| 指標 | 目標 | 実績 |
|------|------|------|
| dedup ブロック line coverage | 100% | 達成 |
| 同 branch coverage | 100%（KV get null/not-null、put 成否、TTL 経過） | 達成 |

## DoD

- [x] 目標値を実測（テストケース対応）で達成
- [x] 未カバーのブランチなし
