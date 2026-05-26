# Phase 6: テスト拡充

> 親 index: [index.md](index.md) / 前段: [phase-5-implementation.md](phase-5-implementation.md) / 次段: [phase-7-coverage.md](phase-7-coverage.md)

## 目的

Phase 4 の RED ケースを spec として落とし込みつつ、race / TTL / size 上限 / 5xx rollback の fail path および回帰 guard を厚くする。

## 初期化（local D1）

```bash
# 1. local miniflare D1 を初期化（worktree ローカル）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --local

# 2. D1 lane で contract spec 実行
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --config=vitest.d1.config.ts \
  src/middleware/__tests__/idempotency.spec.ts

# 3. unit lane で repository spec 実行
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  src/repository/__tests__/idempotency.repository.spec.ts
```

> D1 lane は `vitest.d1.config.ts` の singleFork により port 競合を回避（MEMORY.md「API contract spec は D1 lane で実行」「issue-866」参照）。

## spec ファイル構造

### `apps/api/src/middleware/__tests__/idempotency.spec.ts`

```
describe('idempotency middleware (contract)', () => {
  beforeEach: テスト用 Hono app を組み立てる
    - createIdempotencyMiddleware() を use
    - POST /__test/ok を spy 経由で 200 を返す
    - POST /__test/fail を spy 経由で 500 を throw
    - POST /__test/large を 70KiB body を返す
    - c.env.DB は test bindings から注入
  afterEach: idempotency_keys を TRUNCATE 相当（DELETE FROM ...）

  describe('header 無し', () => { it: TC-01 })

  describe('完全 replay', () => {
    it: TC-02 初回 200 → 再送で stored response 再生 + Idempotent-Replayed: true
  })

  describe('race / in_flight', () => {
    it: TC-03 事前 INSERT in_flight → 同一 key で 409
    it: TC-03b 並行送信（Promise.all で 2 本同時 fire） → 1 本のみ handler 実行 + もう 1 本は 409 か stored response
  })

  describe('fingerprint mismatch', () => {
    it: TC-04 completed 行ありで body 異なると 422
  })

  describe('5xx rollback', () => {
    it: TC-05a 1 回目 500 → row が DELETE されている
    it: TC-05b 2 回目同一 key → handler が再度実行される（dedupe しない）
  })

  describe('TTL 切れ', () => {
    it: TC-06 expired completed 行は新規扱い（handler 実行 + row 再生成）
    it: TC-06b gcExpired が in_flight expired 行も削除する
  })

  describe('response size 上限', () => {
    it: TC-07a 70KiB body は response_body=NULL で保存
    it: TC-07b 再送時に stored body が NULL なら handler 再実行
  })

  describe('fail-open', () => {
    it: TC-08 c.env.DB undefined でも 200 + handler 実行
    it: TC-08b getByScope D1 throw でも handler に到達（warn log 出るが request は通る）
  })

  describe('method gating', () => {
    it: GET は header あっても middleware を素通り（idempotency_keys 行は 0）
  })
})
```

### `apps/api/src/repository/__tests__/idempotency.repository.spec.ts`

```
describe('idempotency.repository (unit / pure)', () => {
  describe('computeFingerprint', () => {
    it: TC-R01a 同一入力で同一 hash
    it: TC-R01b method 差分で異なる hash
    it: TC-R01c bodyHash 差分で異なる hash
  })

  describe('isExpired', () => {
    it: TC-R02a expires_at < now → true
    it: TC-R02b expires_at === now → true（境界は expired 扱い）
    it: TC-R02c expires_at > now → false
  })

  describe('shouldPersistResponse', () => {
    it: TC-R03a bytes === max → true
    it: TC-R03b bytes > max → false
    it: TC-R03c bytes === 0 → true
  })
})
```

## 観点別カバレッジ

| 観点 | 担保するテスト |
|---|---|
| Race（同一 key の並行 2 本） | TC-03b |
| TTL 切れ（completed / in_flight 両方） | TC-06 / TC-06b |
| Response size 上限 | TC-07a / TC-07b |
| 5xx rollback の再実行可能性 | TC-05a / TC-05b |
| Fail-open（DB undefined / throw） | TC-08 / TC-08b |
| Method gating（GET 素通り） | method gating describe |
| Stored response 完全 replay（status / headers / body） | TC-02 |
| Header 名カスタマイズ | options で headerName='X-Test-Key' を渡す test を追加（regression guard） |

## 回帰 guard

- 既存の admin route spec（`apps/api/src/routes/admin/**/__tests__/*.spec.ts`）が middleware 配線後も全 green になることを `pnpm --filter @ubm-hyogo/api test` で確認する
- 既存 spec が `Idempotency-Key` header を送っていない前提のため、middleware は素通りし破壊変更にならないことを TC-01 で固定

## 完了条件

- contract.spec / repository.spec の describe/it 構成が上記に従って実装可能
- D1 lane / unit lane どちらでも green
- 既存 spec が全 green（回帰なし）
