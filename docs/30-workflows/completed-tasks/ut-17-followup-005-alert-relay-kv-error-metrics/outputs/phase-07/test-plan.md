# Phase 7 成果物: テスト計画書

## サマリ

| 項目 | 値 |
| --- | --- |
| 対象テストファイル | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` |
| 新規ケース数 | 4（TC-KV-GET-THROW / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN / TC-DEDUPE-KEY-HASH） |
| 削除ケース | 1（既存 TC-KV-05、TC-KV-GET-THROW へ統合） |
| 追加 hook | `afterEach(() => vi.restoreAllMocks())`（`describe("createAlertRelayRoute")` 直下） |
| import 追加 | `afterEach`（既存 `import { describe, it, expect, vi } from "vitest"` に追加） |

## 1. テストスコープ

### 含む

- 新規 4 ケース追加
- `afterEach(() => vi.restoreAllMocks())` 追加
- 既存 TC-KV-05 削除（fail-open 化との mutual contradiction 解消）

### 含まない

- Cloudflare staging / production deploy 検証（user-gated / external ops）
- Workers Logs / logpush 経由の実 dashboard 検証（UT-17-FU-006 領域）
- E2E（Playwright）追加
- `apps/web` 側テスト変更
- coverage 閾値変更

## 2. テストケース表

| ID | 観点 | 前提条件 | 入力 | 期待挙動 | AC マッピング |
| --- | --- | --- | --- | --- | --- |
| TC-KV-GET-THROW | `get` fail-open + warn emit | `createKvStub({ getError: () => new Error("boom") })`, Slack 200 mock | 正常 payload | `res.status === 200`, `fetchMock` 1 回, `console.warn` 1 回, payload に `{event:"alert_relay_kv_op_failed", op:"get", errorClass:"Error"}`, `dedupeKeyHash` length 12, `isolateId` string, `ts` string | AC-3 / AC-5 / AC-7 (a) / AC-10 |
| TC-KV-PUT-THROW | `put` 失敗時の warn emit + レスポンス不変 | `createKvStub({ putError: () => new Error("put boom") })`, Slack 200 | 正常 payload | `res.status === 200`, レスポンス `{ok:true, attempts:1, dedupPersisted:false}`, `console.warn` 1 回, payload `{op:"put", errorClass:"Error"}` | AC-3 / AC-6 / AC-7 (b) |
| TC-KV-SUCCESS-NO-WARN | false-positive 防止 | デフォルト `createKvStub`, Slack 200 | 正常 payload | `res.status === 200`, `console.warn` 0 回 | AC-7 (c) |
| TC-DEDUPE-KEY-HASH | hash 決定論性 | 同一 `now` / 同一 `payload` で 2 度 `getError` | 2 リクエスト | `warnSpy` 2 回、両 payload の `dedupeKeyHash` 一致、`/^[0-9a-f]{12}$/` マッチ | AC-4 |
| 既存 TC-KV-09 | `put` throw で 200 / `dedupPersisted:false` の挙動保証 | （既存） | （既存） | （既存）レスポンス挙動保証は本ケースが担当、warn emit 内容保証は TC-KV-PUT-THROW が担当 | AC-6（レスポンス挙動の不変） |
| 既存 TC-KV-05 | — | — | — | **削除**。TC-KV-GET-THROW で代替 | — |

## 3. 共通テスト前提

| 項目 | 値 |
| --- | --- |
| vitest import | `import { describe, it, expect, vi, afterEach } from "vitest";` |
| `afterEach` | `describe("createAlertRelayRoute")` 直下に `afterEach(() => vi.restoreAllMocks())` |
| `console.warn` spy | 各 it 内で `vi.spyOn(console, "warn").mockImplementation(() => {})` |
| KV stub | 既存 `createKvStub({ getError, putError })` を流用 |
| `fetchMock` | `vi.fn().mockResolvedValue(new Response("", { status: 200 }))` |
| `now` 固定値 | `1_715_000_000_000` |
| payload bracket-access | `payload["dedupeKeyHash"]` 形式（`noPropertyAccessFromIndexSignature` 互換） |

## 4. テスト実装の注意点

1. **leak 防止**: `vi.spyOn(console, "warn")` 後は `afterEach(() => vi.restoreAllMocks())` で必ず復元。
2. **mockImplementation 必須**: `mockImplementation(() => {})` で warn 出力を抑制。
3. **`isolateId` の値固定 assert 禁止**: `typeof === "string"` までを assert。
4. **既存 TC-KV-05 削除**: 同条件で 500 と 200 を両方期待するケースの共存は不可。
5. **TC-DEDUPE-KEY-HASH の決定論性**: 同一 `dedupeKey` 入力 → 同一 SHA-256 hash 出力。`createKvStub` を 2 個用意するのは isolate 分離のためで、hash 決定論性とは無関係。

## 5. テスト実行コマンド

```bash
# alert-relay spec のみ
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec

# 型チェック
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint
```

3 コマンド全 PASS が AC-9 の達成条件。

## 6. カバレッジ要件

| 観点 | 要件 |
| --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` line coverage | 既存閾値（リポジトリ既定）以上を維持 |
| 新規追加経路 | `sha256Hex12` / `logKvOperationError` / `get` 側 try/catch / `put` 側 catch の 4 経路が TC-KV-GET-THROW / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN / TC-DEDUPE-KEY-HASH のいずれかでカバー |
| 既存ケース | ROUTE-01〜07, TC-03, TC-KV-01〜04, TC-KV-06〜09 が PASS 維持 |

## 7. 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17-FU-002（KV 永続化） | `createKvStub({ getError, putError })` 流用 | helper 改修なし |
| 既存 INDEX-01 | mounted route smoke | 本タスクで変更なし |

## 8. リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `vi.spyOn` leak で他テスト false-positive | `afterEach(() => vi.restoreAllMocks())` 必須 |
| `dedupeKeyHash` 長さ assert が brittle | 12 文字固定 + regex `/^[0-9a-f]{12}$/` で 2 重チェック |
| `isolateId` 値固定 assert が brittle | `typeof === "string"` までを assert（値は assert しない） |
| TC-KV-05（旧）と TC-KV-GET-THROW（新）の mutual contradiction | TC-KV-05 削除で 1 経路に統合 |
| `crypto.subtle.digest` が test 環境で動かない | 既存 KV テストと同じ workers pool を使用、Node 20+ Web Crypto fallback も利用可能 |

## 9. AC マッピング集約

| AC | カバー手段 |
| --- | --- |
| AC-3（emit JSON schema） | TC-KV-GET-THROW / TC-KV-PUT-THROW の payload assert |
| AC-4（`dedupeKeyHash` 12 hex chars / 再現性） | TC-DEDUPE-KEY-HASH |
| AC-5（`get` fail-open） | TC-KV-GET-THROW |
| AC-6（`put` レスポンス不変） | TC-KV-PUT-THROW + 既存 TC-KV-09 |
| AC-7 (a)(b)(c) | TC-KV-GET-THROW / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN |
| AC-9（typecheck / lint / test 全 PASS） | テスト実行コマンド 3 種 |
| AC-10（`get` 挙動変更の意図的記録） | TC-KV-GET-THROW + TC-KV-05 削除メモを Phase 12 documentation-changelog へ |
