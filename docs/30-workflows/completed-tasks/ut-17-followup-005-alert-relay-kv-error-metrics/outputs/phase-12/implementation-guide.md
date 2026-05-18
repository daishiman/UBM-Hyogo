# Phase 12 — implementation-guide.md（UT-17-FU-005）

Phase 13 PR 本文に直接転記される実装ガイド。技術契約 / 変更ファイル / behaviour change /
シグネチャ / 検証手順 / ロールバック / DoD を一括で記述する。

---

## Part 1 — 中学生レベル概念説明

### なぜ必要か

この変更が必要な理由は、Slack 通知を重複させないための KV が失敗したときに、
運用者が原因をすぐ見つけられるようにするためです。これまでは KV の読み取り失敗が
500 になったり、書き込み失敗が機械集計しにくいログになったりして、あとから数えるのが難しい状態でした。

### 何をするか

KV の `get` / `put` が失敗したら、決まった形の 1 行 JSON を `console.warn` に出します。
画面を増やす変更ではなく、Workers Logs で検索できる合言葉を残す変更です。

### 今回作ったもの

- KV 失敗時の構造化ログ helper
- `KV.get` 失敗時の fail-open 処理
- `KV.put` 失敗時の structured warn 化
- `dedupeKeyHash` 再現性を含む Vitest 回帰テスト
- NON_VISUAL evidence と monthly healthcheck runbook の手順

| 概念 | 例え |
| --- | --- |
| KV (Cloudflare KV) | 「同じアラートが連続で来たら 1 回だけ Slack に流す」ための小さなメモ帳。読み書きが時々失敗する |
| dedup KV `get` | メモ帳を見て「このアラート、さっきも流したか？」を確認する動作 |
| dedup KV `put` | メモ帳に「このアラート、もう流した」と書き込む動作 |
| fail-open | メモ帳が壊れていたら「念のため Slack に流しておく」方針（流さないより流す方が安全） |
| 構造化ログ | エラーが起きた瞬間に「決まった書式の 1 行 JSON」をログに残す。後で機械で集計しやすい |
| `event` 文字列契約 | 集計側が grep する**合言葉**。一度決めたら勝手に変えてはいけない |
| `isolateId` | Cloudflare Workers の「同じ isolate（インスタンス）で出たログを束ねる」ための識別子 |
| `dedupeKeyHash` | アラートを識別するキーをそのままログに出すと長い & 個人情報リスク。SHA-256 の頭 12 文字に短縮 |

---

## Part 2 — 技術契約（schema 固定）

```ts
type AlertRelayKvOpFailedLog = {
  event: "alert_relay_kv_op_failed"; // 固定リテラル
  op: "get" | "put";
  errorClass: string;        // err instanceof Error ? err.constructor.name : typeof err
  dedupeKeyHash: string;     // SHA-256 first 12 hex chars (lowercase)
  isolateId: string;         // crypto.randomUUID() 採番（module top で 1 回）
  ts: string;                // new Date().toISOString()
};
```

出力経路: `console.warn(JSON.stringify(payload))` の 1 行 JSON。

後段（logpush / Workers Logs filter）は `event === "alert_relay_kv_op_failed"` を
filter キーとして使用するため、**この文字列は本タスク以降不変**とする。改名する場合は
互換性 break を伴うため、UT-17-FU-006 以降で follow-up issue を先に立てる。

---

### 変更ファイル一覧（CONST_005）

| 種別 | パス | 役割 |
| --- | --- | --- |
| 編集 | `apps/api/src/routes/internal/alert-relay.ts` | module top で `isolateId` 採番、private helper `logKvOperationError` / `sha256Hex12` 追加、`KV.get` を try/catch で包み fail-open 化、`KV.put` catch を helper 呼び出しに置換 |
| 編集 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 4 ケース追加: (a) `KV.get` throw → warn 1 回 emit + payload assert, (b) 同一 `dedupeKey` の `dedupeKeyHash` 再現性, (c) `KV.put` throw → warn 1 回 emit + payload assert, (d) 成功パス → warn 0 回。`afterEach(() => vi.restoreAllMocks())` 追加 |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「KV 操作エラーログの確認」セクション追加（grep 例 / 直近 1 時間で 10 件超のしきい値 / schema 表） |
| 新規 | `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/phase-{01..13}.md` | 本タスク Phase 仕様 |
| 新規 | `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/phase-{01..13}/*` | 各 Phase 出力 |
| 新規 | `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/artifacts.json` | root workflow state |
| 新規 | `docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/artifacts.json` | outputs parity marker |

---

### APIシグネチャ

```ts
// apps/api/src/routes/internal/alert-relay.ts（module top, file-scope）

// isolate ライフサイクル代理識別子（module top で 1 回採番）
const isolateId = crypto.randomUUID();

// SHA-256 hash の first 12 hex chars
async function sha256Hex12(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

// 構造化ログ emit ヘルパ（外部 export しない）
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void> {
  const errorClass =
    err instanceof Error ? err.constructor.name : typeof err;
  const dedupeKeyHash = await sha256Hex12(dedupeKey);
  const payload = {
    event: "alert_relay_kv_op_failed" as const,
    op,
    errorClass,
    dedupeKeyHash,
    isolateId,
    ts: new Date().toISOString(),
  };
  console.warn(JSON.stringify(payload));
}
```

---

### 使用例

```ts
const app = createAlertRelayRoute({
  fetch: fetchMock,
  sleep: async () => {},
  now: () => 1_715_000_000_000,
});

await app.request(
  "/",
  {
    method: "POST",
    headers: { "content-type": "application/json", "cf-webhook-auth": SECRET },
    body: JSON.stringify({
      name: "Workers Daily Requests Approaching Limit",
      policy_id: "policy-workers",
      ts: 1_715_000_000_000,
    }),
  },
  buildEnv({ kv }),
);
```

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- apps/api/src/routes/internal/__tests__/alert-relay.spec.ts
```

### エラーハンドリング

`KV.get` で例外が出た場合は `logKvOperationError("get", ...)` を await し、
`seen = null` として通常の Slack 配信へ進む。通知系では「多少重複しても通知が届く」方が
「通知経路が 500 で沈黙する」より安全なため、ここは意図的な behaviour change とする。

`KV.put` で例外が出た場合は Slack 配信成功を維持し、レスポンスに `dedupPersisted: false` を返す。
ログ payload には raw `dedupeKey` や stack trace を入れず、`errorClass` と `dedupeKeyHash` だけを出す。

### エッジケース

- `payload.ts` が有限な number でない場合は `now()` を使い、minute bucket を決める。
- `policy_id` が無い場合は `name`、`alert_type`、`unknown` の順で dedupe key を作る。
- 同一 `dedupeKey` なら `dedupeKeyHash` は常に同じ 12 桁 hex になる。
- KV が一時的に落ちても `get` は fail-open、`put` は `dedupPersisted: false` で運用者が検知できる。
- UI は存在しないため screenshot は作らず、`outputs/phase-11/visual-verification-skip.md` を証跡にする。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| `event` | `alert_relay_kv_op_failed` |
| `op` | `get` / `put` |
| `dedupeTtlMs` default | `5 * 60 * 1000` |
| `expirationTtl` | `Math.ceil(dedupeTtlMs / 1000)` |
| `dedupeKeyHash` | SHA-256 first 12 hex chars |
| `ALERT_DEDUP_KV` | 既存 KV binding。新規 binding は追加しない |
| `visualEvidence` | `NON_VISUAL` |

### テスト構成

| テスト | 目的 |
| --- | --- |
| `TC-KV-05` | `KV.get` throw 時に warn を出し、Slack 配信を継続する |
| `TC-DEDUPE-KEY-HASH` | 同一 `dedupeKey` の hash が再現し、12 hex chars であることを確認する |
| `TC-KV-09` | `KV.put` throw 時に `dedupPersisted: false` を返し、warn を出す |
| `TC-KV-10` | 成功時に warn を出さない |

### emit 箇所（fail-open / behaviour change）

### `KV.get(dedupeKey)` 側（新規 try/catch + fail-open 化）

```ts
let seen: string | null = null;
try {
  seen = await env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (err) {
  await logKvOperationError("get", err, dedupeKey);
  // fail-open: dedup skip して通常処理を続行（Slack に流す側に倒す）
  seen = null;
}
```

**behaviour change（意図的）**:

| 観点 | 改修前 | 改修後 |
| --- | --- | --- |
| `KV.get` 失敗時 | try/catch 無し → 例外が handler まで伝播 → 500 / unhandled | try/catch で囲み `logKvOperationError("get", ...)` 呼び出し後、`seen = null` 相当として通常処理続行（**fail-open**） |

### `KV.put(...)` 側（既存 catch の helper 置換）

```ts
try {
  await env.ALERT_DEDUP_KV.put(dedupeKey, "1", { expirationTtl: TTL });
  dedupPersisted = true;
} catch (err) {
  await logKvOperationError("put", err, dedupeKey);
  dedupPersisted = false;
}
```

**behaviour change**: 既存 `console.warn` の plain object を helper 呼び出しに置換するだけで、
レスポンス（`dedupPersisted: false`）・status code・Slack 配信路は不変。

---

### 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `sha256Hex12` | `dedupeKey: string` | first 12 hex chars (lowercase) | 純関数（`crypto.subtle.digest` のみ）|
| `logKvOperationError` | `op`, `err`, `dedupeKey` | `void` | `console.warn` 1 回。例外を内部で吸収（log emit 自体は throw しない設計）|

---

### テスト方針

| テストレイヤ | 対象 | 想定ケース |
| --- | --- | --- |
| unit | `alert-relay.spec.ts` | (a) `KV.get` throw → warn 1 回 + payload に `event`/`op:"get"`/`errorClass`/`dedupeKeyHash`/`isolateId`/`ts`, (b) 同一 `dedupeKey` の `dedupeKeyHash` 再現性, (c) `KV.put` throw → warn 1 回 + `op:"put"`, (d) 成功パス → warn 0 回 |
| static | 型 | `event` リテラル型が `"alert_relay_kv_op_failed"` に narrow されている |
| leak 防止 | `afterEach` | `vi.restoreAllMocks()` で `console.warn` spy を解除 |

---

### ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
```

---

### 設計判断

| 判断 | 理由 |
| --- | --- |
| `event` を文字列リテラルで固定 | 後段 logpush / Workers Logs filter の grep キー。schema 変更は破壊的変更なので命名予約を先に行う |
| `dedupeKey` 生値ではなく SHA-256 first 12 hex を出力 | Workers Logs 容量圧迫防止 + 軽度の冗長化抑制 + 将来 dedupeKey 内に PII が混入した際の事故防止 |
| `isolateId` を module top で 1 回採番 | Cloudflare Workers の isolate ライフサイクル代理識別子として機能させる。handler ごと採番だと同一リクエスト束化が困難 |
| `console.warn(JSON.stringify(...))` の 1 行 JSON | Workers Logs は 1 行 = 1 イベントで取り扱うため。`console.log` ではなく `warn` を使うのは「正常路ではない」を level で示すため |
| `KV.get` 失敗時の fail-open 化 | dedup skip して 1 回余分に Slack に流す方が、500 / unhandled で Slack 連絡網そのものが沈黙するより安全（通知系の一般原則） |
| helper を private（非 export） | 他 route から流用させず、`event` 文字列の散逸を防ぐ |

---

### 検証手順

ローカル:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
```

staging / production（外部実施 / user-gated）:

```bash
# deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# emit 観測（イベント発生時のみ output 出る・未発生は正常）
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \
  | grep alert_relay_kv_op_failed
```

---

### ロールバック手順

| 範囲 | 手順 |
| --- | --- |
| デプロイ | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env <env>` |
| コード（fail-open 解除） | `KV.get` の try/catch を除去すれば改修前の挙動（unhandled 500）に戻る。ただし fail-open 解除は通知系の安全性観点で非推奨 |
| ログ schema 変更 | `event` 文字列は本 PR で予約済み。変更は UT-17-FU-006 以降で follow-up issue を立ててから |

---

### DoD（Definition of Done）

- [x] AC-1〜AC-10 が `outputs/phase-09/acceptance.md` で OK 判定
- [x] `mise exec -- pnpm typecheck` PASS
- [x] `mise exec -- pnpm lint` PASS
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api test` PASS
- [x] `console.warn` spy が後続テストに leak しない
- [x] `apps/web/` 配下に変更なし
- [x] D1 / Google Form schema / Slack 配信路 / dedupe TTL に変更なし
- [x] `event` 文字列が `"alert_relay_kv_op_failed"` の文字列リテラルとして fix
- [x] `isolateId` が module top で 1 回採番（handler 内採番なし）
- [x] `dedupeKeyHash` が 12 hex chars 固定（raw `dedupeKey` がログ payload に含まれない）
- [x] Phase 11 NON_VISUAL skip evidence は `outputs/phase-11/visual-verification-skip.md` に明示
