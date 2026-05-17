# Phase 7: テスト計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テスト計画 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (ドキュメント更新) |
| 状態 | completed |
| GitHub Issue | #701（CLOSED / completed marked / close時点では実コード未実装・本workflowでlocal実装済み） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` への新規 4 ケース追加・既存 1 ケース調整・`afterEach` 追加を伴う **実テストコード変更**の計画を確定する。テスト実行コマンド・カバレッジ要件・false-positive 回避策を含む。 |

---

## 目的

Phase 6 で確定した実装手順 S1〜S8 のうち S5（vitest 4 ケース追加）/ S6（既存 TC-KV-05 調整）/ S8（品質ゲート）を、
テストケース粒度・前提条件・期待挙動・実行コマンドまで具体化する。
本 Phase の成果物 `outputs/phase-07/test-plan.md` は、テスト実装担当者または LLM coding agent が
それ単体を見て vitest コードを書ける粒度で記述する。

---

## 7-1. テストスコープ

### 含む

- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` への以下 4 ケース新規追加
  - **TC-KV-GET-THROW**: `KV.get` throw → warn 1 回 emit + Slack 配信成功
  - **TC-KV-PUT-THROW**: `KV.put` throw → warn 1 回 emit + `dedupPersisted: false`
  - **TC-KV-SUCCESS-NO-WARN**: 正常系で `console.warn` が呼ばれない
  - **TC-DEDUPE-KEY-HASH**: 同一 dedupeKey で `dedupeKeyHash` が再現する（12 hex chars lowercase）
- `afterEach(() => vi.restoreAllMocks())` を `describe("createAlertRelayRoute")` 直下に追加
- 既存 `TC-KV-05`（`get` throw で 500 期待）を `get` fail-open 化に合わせて **削除**（TC-KV-GET-THROW へ統合）
- 既存 `TC-KV-09`（`put` throw で 200 / `dedupPersisted: false`）は不変（TC-KV-PUT-THROW と共存可能。`TC-KV-09` はレスポンス挙動の保証、`TC-KV-PUT-THROW` は warn emit 内容の保証）

### 含まない

- Cloudflare staging / production への deploy 検証（user-gated / external ops）
- Workers Logs / logpush 経由での実 dashboard 検証（UT-17-FU-006 領域）
- E2E（Playwright）テスト追加
- `apps/web` 側テスト変更
- coverage 閾値の変更（既存値を維持）

---

## 7-2. テストケース表

| ID | 観点 | 前提条件 | 入力 | 期待挙動 | AC マッピング |
| --- | --- | --- | --- | --- | --- |
| TC-KV-GET-THROW | `get` fail-open + warn emit | `createKvStub({ getError: () => new Error("boom") })`, `fetchMock` Slack 200 | 正常 payload | `res.status === 200`, `fetchMock` 1 回, `console.warn` 1 回 emit, payload に `{event:"alert_relay_kv_op_failed", op:"get", errorClass:"Error"}` が含まれ、`dedupeKeyHash` が 12 文字 string, `isolateId` が string, `ts` が string | AC-3 / AC-5 / AC-7 (a) / AC-10 |
| TC-KV-PUT-THROW | `put` 失敗時の warn emit + レスポンス不変 | `createKvStub({ putError: () => new Error("put boom") })`, Slack 200 | 正常 payload | `res.status === 200`, レスポンスに `{ok:true, attempts:1, dedupPersisted:false}`, `console.warn` 1 回 emit, payload に `{op:"put", errorClass:"Error"}` | AC-3 / AC-6 / AC-7 (b) |
| TC-KV-SUCCESS-NO-WARN | false-positive 防止 | デフォルト `createKvStub`, Slack 200 | 正常 payload | `res.status === 200`, `console.warn` が 0 回 | AC-7 (c) |
| TC-DEDUPE-KEY-HASH | hash 決定論性 | 同一 `now` / 同一 `payload` で 2 度 `getError` 発生 | 2 リクエスト | `warnSpy` 2 回呼び出し、両 payload の `dedupeKeyHash` が一致、`/^[0-9a-f]{12}$/` にマッチ | AC-4 |
| 既存 TC-KV-09 | `put` throw で 200 / `dedupPersisted:false` の挙動保証 | （既存） | （既存） | （既存。warn emit 内容の assert は TC-KV-PUT-THROW が担当） | AC-6（レスポンス挙動の不変） |
| 既存 TC-KV-05 | （削除） | — | — | — | TC-KV-GET-THROW で代替（AC-5 / AC-10） |

---

## 7-3. 共通テスト前提（fixture / mock）

| 項目 | 値 |
| --- | --- |
| `vitest` import | `import { describe, it, expect, vi, afterEach } from "vitest";` |
| `afterEach` | `describe("createAlertRelayRoute")` 直下に `afterEach(() => vi.restoreAllMocks())` |
| `console.warn` spy | 各 it 内で `vi.spyOn(console, "warn").mockImplementation(() => {})` を取得 |
| KV stub | 既存 `createKvStub({ getError, putError })` を流用。新規 helper 追加なし |
| `fetchMock` | `vi.fn().mockResolvedValue(new Response("", { status: 200 }))`（Slack 200） |
| `now` 固定値 | `1_715_000_000_000`（既存 TC 群と整合） |
| payload bracket-access | TypeScript `noPropertyAccessFromIndexSignature` 互換のため `payload["dedupeKeyHash"]` 形式 |

---

## 7-4. テスト実装の注意点

1. **leak 防止**: `vi.spyOn(console, "warn")` を呼んだ後、必ず `afterEach` で `vi.restoreAllMocks()` する。他テストへの spy leak は false-positive を生むため必須。
2. **mockImplementation 必須**: `vi.spyOn(console, "warn").mockImplementation(() => {})` でログ抑制する。これがないとテスト output に warn が漏れて見づらくなる。
3. **payload bracket-access**: `payload["dedupeKeyHash"]` 形式で取り出す。`payload.dedupeKeyHash` は tsconfig 設定によって型エラーになる可能性がある。
4. **`isolateId` は値固定 assert しない**: module load 時に採番される UUID なので、`typeof payload["isolateId"] === "string"` までを assert する。値固定は将来の lint・refactor の障害になる。
5. **既存 TC-KV-05 の扱い**: 同じ `getError` 注入条件で 500 と 200 の両方を期待するケースを共存させると mutual contradiction になるため、TC-KV-05 を削除して TC-KV-GET-THROW へ統合する。Phase 12 documentation-changelog に「TC-KV-05 → TC-KV-GET-THROW 統合」と明記する。
6. **TC-DEDUPE-KEY-HASH の決定論性**: 同一 `now` / `policy_id` / `name` から作られる `dedupeKey` 文字列が同一であれば、SHA-256 hash も同一になる。`createKvStub` を 2 個作るのは isolate 分離のためであり、stub 単体の決定論性とは無関係。

---

## 7-5. テスト実行コマンド

```bash
# alert-relay spec のみ実行（高速確認用）
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec

# 型チェック
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint
```

> 3 コマンド全 PASS が AC-9 の達成条件。失敗時は Phase 6 の S1〜S7 に巻き戻して原因を特定する。

---

## 7-6. カバレッジ要件

| 観点 | 要件 |
| --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` の line coverage | 既存閾値（リポジトリ既定）以上を維持。本タスクで新規追加した `sha256Hex12` / `logKvOperationError` / `get` 側 try/catch / `put` 側 catch の 4 経路がすべて TC-KV-GET-THROW / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN / TC-DEDUPE-KEY-HASH のいずれかでカバーされる |
| 既存ケース | 既存テスト群（ROUTE-01〜07, TC-03, TC-KV-01〜04, TC-KV-06〜09）が PASS のまま維持される |

> 新規 coverage 閾値は導入しない（リポジトリ既定を尊重）。

---

## 7-7. 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17-FU-002（KV 永続化） | `createKvStub({ getError, putError })` を流用 | helper 改修なし。既存 stub の throw 注入オプションのみ使用 |
| 既存 `INDEX-01`（mounted route 経由） | route mount 経路の smoke | 本タスクで変更なし。`worker.fetch` 経路は触らない |

---

## 7-8. リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `vi.spyOn(console, "warn")` の leak で他テストが false-positive | `afterEach(() => vi.restoreAllMocks())` 必須 |
| `dedupeKeyHash` の長さ assertion が brittle | 12 文字固定 + `/^[0-9a-f]{12}$/` regex で 2 重チェック |
| `isolateId` の値固定 assert が brittle | `typeof === "string"` までを assert（値は assert しない） |
| TC-KV-05（旧）と TC-KV-GET-THROW（新）の mutual contradiction | TC-KV-05 を削除して 1 経路に統合 |
| `crypto.subtle.digest` が Workers test 環境で動かない | Node 20+ の Web Crypto に存在するため Workers vitest pool でも動作。`miniflare` / `@cloudflare/vitest-pool-workers` 設定済み前提（既存 test と同じ pool） |

---

## 7-9. 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/test-plan.md | テストケース表・前提・実行コマンドを含むテスト計画書 |
| メタ | artifacts.json | phase-07 を completed に更新 |

---

## 7-10. 完了条件

- [ ] TC-KV-GET-THROW / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN / TC-DEDUPE-KEY-HASH の 4 ケースが計画されている
- [ ] `afterEach(() => vi.restoreAllMocks())` 追加が明示されている
- [ ] 既存 TC-KV-05 の削除（または更新）方針が明示されている
- [ ] テスト実行コマンド 3 種が固定されている
- [ ] AC-3 / AC-4 / AC-5 / AC-6 / AC-7 / AC-9 / AC-10 が本テスト計画でカバーされている
- [ ] outputs/phase-07 配下が artifacts.json と 1 対 1 整合

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-07 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 8（ドキュメント更新）
- 引き継ぎ事項:
  - 既存 TC-KV-05 削除を Phase 12 documentation-changelog の入力とする
  - `get` fail-open 化の挙動変更を Phase 8 のドキュメント反映項目に転記する
  - テスト実行コマンド 3 種を Phase 9（受入確認）の検証手順へ転記する
- ブロック条件: 既存 TC-KV-05 と TC-KV-GET-THROW が共存して mutual contradiction を生む構成、または `event` 文字列 fixed assert が漏れる構成

## 実行タスク

- TC-KV-GET-THROW / TC-DEDUPE-KEY-HASH / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN を計画する。

## 参照資料

- `outputs/phase-07/test-plan.md`
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`

## 成果物/実行手順

- テスト計画は `outputs/phase-07/test-plan.md` を正本とする。

## 完了条件

- [x] 4 ケースと `afterEach(() => vi.restoreAllMocks())` が計画に含まれる。

## 統合テスト連携

Phase 9 で `mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` を実行する。
