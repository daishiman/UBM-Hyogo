# Phase 6: テスト拡充（fail path / 回帰 guard）

> 入力: [phase-5-implementation.md](phase-5-implementation.md)
> 出力: `outputs/phase-6/test-additions.md`
> 目的: Phase 4 の happy-path RED に対し、fail-soft / schema reject / diff edge case を補強する。

## 6-1. 追加テストファイルとケース表

### (A) logger fail-soft 回帰（`apps/web/src/lib/__tests__/logger.spec.ts` に追加）

| ID | テスト名（it） | 入力 | 期待値 | 狙い |
|---|---|---|---|---|
| TC-LOG-05 | `does not throw when captureException throws synchronously` | `captureException` mock を `mockImplementation(() => { throw new Error("sentry down") })` にして `logger.error({ event:"e", scope:"admin", digest:"d", err })` | logger 呼び出しが throw しない（`expect(() => logger.error(...)).not.toThrow()`）。tag 昇格を追加しても既存の try/catch fail-soft が維持されること | DSN 未設定 / SDK 未 init でも UI へ伝播させない不変条件の回帰 guard |
| TC-LOG-06 | `keeps scope/digest in extras even when promoted to tags` | `logger.error({ event:"e", scope:"admin", digest:"167275886", err })` | `captureException` 第2引数 `.extras` に `scope:"admin"` / `digest:"167275886"` が**残る**（tag 昇格は extras を奪わない） | 調査用 extras と alert 用 tag の二重保持を保証 |

> mock 戦略: 既存 `beforeEach` の `vi.clearAllMocks()` + `mockImplementation` 再設定パターンを踏襲。TC-LOG-05 のみ局所的に throw 版へ差し替え、`afterEach` 相当で復元（`vi.clearAllMocks()` が次ケースで戻す）。`vi.stubGlobal("window", ...)` は使用禁止。

### (B) sentry-alerts schema reject（`infra/sentry-alerts/lib/__tests__/schema-contract.spec.ts` に追加）

schema は JSON ファイルとして読み、`additionalProperties:false` / `enum` / `required` の存在を contract として検証する（cloudflare 側 schema-contract.spec.ts と同方針。ajv での実 validate を行う場合は `ajv` を devDep に追加し `validate(policy)` の真偽を検証）。

| ID | テスト名（it） | 入力 | 期待値 | 狙い |
|---|---|---|---|---|
| TC-IAC-08 | `schema rejects unknown filter field via enum` | schema の `filters.items.properties.field.enum` を読む | enum が `["event","scope","runtime","digest"]` で、`additionalProperties:false`。未知 field（例 `"foo"`）は schema 上 invalid と判定できる | schema 違反 policy が CI で reject される根拠 |
| TC-IAC-09 | `schema requires frequency.window_minutes and threshold` | `frequency.required` を読む | `["window_minutes","threshold"]` を含み、`additionalProperties:false` | 閾値欠落 policy の reject |
| TC-IAC-10 | `all policy manifests pass schema validation (ajv)` | `policies/*.json` 全件を ajv で validate | 全件 `valid===true`。`admin-error-boundary.json` が schema に適合 | 実 manifest の schema 適合保証（ajv 採用時のみ。未採用なら manifest 構造の手動 assert で代替） |

### (C) sentry-alerts diff/load edge case（`infra/sentry-alerts/lib/__tests__/diff.spec.ts` / `load.spec.ts` に追加）

| ID | テスト名（it） | 入力 | 期待値 | 狙い |
|---|---|---|---|---|
| TC-IAC-11 | `diffPolicies detects orphan rule (remote present, local absent)` | local=[], remote=[{name:"legacy-rule"}] | `[{ kind:"extra", name:"legacy-rule" }]` | リモートにあって local に無い rule = orphan 検知（手動作成された野良 rule の発見） |
| TC-IAC-12 | `diffPolicies is order-insensitive for filters` | local.filters=[event,scope], remote.filters=[scope,event]（順序のみ違う） | `[]`（canonicalize の filters sort で順序非依存） | filters 配列順序差を drift と誤検知しない |
| TC-IAC-13 | `diffPolicies detects threshold drift` | local.frequency.threshold=3, remote.frequency.threshold=4 | `[{ kind:"changed", name, path:"frequency.threshold", expected:3, actual:4 }]` | 閾値変更 drift の検知 |
| TC-IAC-14 | `loadPolicies throws on malformed json` | 不正 JSON を含む fixture dir | `JSON.parse` 由来の throw（fail-fast。drift CI で気づける） | 壊れた manifest を silent pass させない |
| TC-IAC-15 | `canonicalize strips server-generated keys` | `{ id:"123", dateCreated:"...", name:"x", filters:[...], frequency:{...}, actions:[...], environment:"staging" }` | 戻り値に `id` / `dateCreated` を含まない | remote response と local repo を同一 form で比較できる根拠 |

## 6-2. api-client fail path（`infra/sentry-alerts/lib/__tests__/api-client.spec.ts` 新規・任意）

mock dir 経由で write 系の冪等性を間接検証する（cloudflare 側 cli テストと同様、実 API は呼ばない）。

| ID | テスト名（it） | 入力 | 期待値 |
|---|---|---|---|
| TC-IAC-16 | `createRule appends to write-log under mock dir` | `SENTRY_ALERTS_MOCK_DIR` を tmp dir に設定し `createRule(body)` | `write-log.txt` に `POST` 行が追記され、実 fetch は呼ばれない |
| TC-IAC-17 | `listRules requires env outside mock mode` | mock dir 未設定 + `SENTRY_AUTH_TOKEN` 未設定で `listRules()` | env 欠落で throw（CI config error 検知） |

## 6-3. 実行コマンド

```bash
# logger 拡充
mise exec -- pnpm exec vitest run apps/web/src/lib/__tests__/logger.spec.ts

# sentry-alerts 拡充（全 __tests__）
mise exec -- pnpm exec vitest run infra/sentry-alerts/lib/__tests__

# まとめ（package.json script）
mise exec -- pnpm test:sentry-alerts
```

## 6-4. 回帰 guard チェックリスト

- [ ] logger 既存ケース（`emits JSON one-line` / `calls captureException once` / `keeps err alias` / `child fields merge`）が全 PASS。
- [ ] tag 昇格後も fail-soft（TC-LOG-05）維持。
- [ ] cloudflare-alerts 側テスト（`pnpm test:alerts`）に影響なし（sentry-alerts は別 dir なので非干渉を確認）。
