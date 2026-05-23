# Implementation Guide

## Part 1: 中学生レベル

### 1. KV って何？

KV は Cloudflare 上のミニ付箋帳です。アプリが `key="xxx"` で付箋を貼っておくと、別の場所からでも同じ `key` で取り出せます。alert relay は、Slack に同じ警報を何度も流さないように「この通知は 5 分以内にもう送った」というメモを KV に保存します。

### 2. dedup って何？

dedup は重複排除のことです。同じ警報が短時間に何度も Slack に流れると、本当に見るべき異常が埋もれます。そこで「直近 5 分以内に同じ警報を出していたら 2 回目以降は黙る」という判定を入れ、その判定材料を KV に保存します。

### 3. ログを構造化すると何が嬉しい？

普通の文章ログだと「今月、KV put 失敗が何回あったか」を数えるのが大変です。今回のログは JSON 1 行に固定しているため、`event=alert_relay_kv_op_failed` だけを抜き出し、`op="get"` と `op="put"` を分けて数えられます。

### 4. なぜ正本を同期する？

機能を作っても、運用手順や仕様書に残っていないと、数か月後に別の人がログの意味を調べ直すことになります。Phase 12 では、ログ schema と確認手順を runbook と aiworkflow-requirements に同期し、後続の監視タスクが同じ契約を見られる状態にします。

### 5. なぜ behaviour change を伴う？

以前の `KV.get` は例外でリクエスト全体が落ちる可能性がありました。今回、KV 読み取り失敗時は警報を止めず Slack へ流し、代わりに構造化ログを出します。重複通知の可能性は増えますが、警報が届かないより運用上の害が小さいためです。

### 用語セルフチェック

| 用語 | このタスクでの意味 |
| --- | --- |
| KV | alert dedup の「送信済み」印を保存する Cloudflare KV namespace |
| dedup | 同一 alert を短時間に重複送信しないための判定 |
| fail-open | KV が失敗しても Slack 配信を継続する判断 |
| `dedupeKeyHash` | raw key を出さず、同一 alert を追跡するための SHA-256 先頭 12 hex |
| `isolateId` | Worker isolate 単位の連続失敗を見分ける UUID |

## Part 2: 技術契約

Changed files:

| Path | Change |
| --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` | `KV_OP_FAILED_EVENT`, module top `isolateId`, `computeDedupeKeyHash`, `getErrorClass`, fail-safe `logKvOperationError`, `KV.get` fail-open catch, `KV.put` structured logging |
| `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | KV get throw, KV put throw, success zero-warn, hash-failure fallback, isolateId stability, hash determinism, warn-sink fail-safe, non-`Error` errorClass assertions |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | KV operation error log section and field table |

Signatures (抜粋: `apps/api/src/routes/internal/alert-relay.ts`):

```ts
// module top で 1 回採番（emit ごとに採番しない）
const isolateId = crypto.randomUUID();

// dedupeKey の SHA-256 を hex 化し先頭 12 文字を返す
async function computeDedupeKeyHash(dedupeKey: string): Promise<string>;

// KV 操作失敗を構造化 JSON 1 行で console.warn する fail-safe helper
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void>;
```

Log schema:

```json
{"event":"alert_relay_kv_op_failed","op":"get|put","errorClass":"Error|string|object","dedupeKeyHash":"<12 hex or hash_error>","isolateId":"<uuid>","ts":"<ISO timestamp>"}
```

`logKvOperationError` must never rethrow. If SHA-256 hashing fails, it emits the same schema with `dedupeKeyHash: "hash_error"`. If `console.warn` itself throws, the helper swallows that logging failure so alert delivery and `dedupPersisted:false` response semantics are preserved.

### 実行コマンド全集

`outputs/phase-12/main.md` の evidence と整合。Phase 13 直前に再実行する想定。

```bash
# 型 / Lint / Build / Test
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api build
ESBUILD_BINARY_PATH="$PWD/node_modules/@esbuild/darwin-arm64/bin/esbuild" \
  mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay

# grep gate（schema 文字列の 3 点同期確認）
grep -rn alert_relay_kv_op_failed apps/api/src/
grep -rn logKvOperationError apps/api/src/
grep -rn hash_error apps/api/src/

# runtime tail（staging deploy 後・user-gated）
bash scripts/cf.sh tail --env staging --config apps/api/wrangler.toml | grep alert_relay_kv_op_failed
```

Verification commands are recorded in `outputs/phase-11/evidence/*.txt`; after the review fixes, rerun the four commands above.

### DoD (Definition of Done)

phase-12.md L147-157 の 9 項目を実装結果に照らしてチェック済み複製。

- [x] `KV.get` に try/catch 追加され、catch ブロックで `logKvOperationError("get", err, dedupeKey)` を呼ぶ
- [x] `KV.put` の既存 catch ブロックで `console.warn` 直書きを `logKvOperationError("put", err, dedupeKey)` に置換
- [x] `isolateId` が module top で `crypto.randomUUID()` で 1 回採番される（emit ごとに採番しない）
- [x] `dedupeKeyHash` が `SHA-256(dedupeKey)` の先頭 12 hex chars
- [x] 成功 path で `console.warn` が 0 回（AC-6）
- [x] HTTP レスポンス shape が変わっていない（AC-7）
- [x] `*.spec.ts` 縛り遵守、新規 `*.test.ts` ファイル 0（AC-10）
- [x] runbook に field 定義表 + `cf.sh tail \| grep` 例追記（AC-9）
- [x] typecheck / lint / test PASS（AC-8）
