# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 1 で確定した 4 論点採用案を `alert-relay.ts` の具体的な型定義・コード snippet・runbook ライティングまで落とし込み、Phase 3 設計レビュー / Phase 4 タスク分解の入力として固定する。設計成果物 4 件すべてを `outputs/phase-02/` 配下に配置する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | spec_created |

## 目的

Phase 1 で確定した採用案 (1B / 2A / 3B / 4B) を以下 4 成果物に分割し、実装者が Phase 5/6 で迷わず着手できる粒度に落とし込む。

| # | 成果物 | 責務 |
| --- | --- | --- |
| 1 | `outputs/phase-02/log-schema.md` | AC-3 ログ schema の field 定義・型・JSON サンプル・後方互換性ポリシー |
| 2 | `outputs/phase-02/helper-design.md` | `logKvOperationError` のシグネチャ・擬似コード・モジュール local 性 |
| 3 | `outputs/phase-02/emit-points.md` | L66 (`get`) / L93-102 (`put`) の before/after snippet と fail-open 化方針 |
| 4 | `outputs/phase-02/isolate-id-strategy.md` | `crypto.randomUUID()` を module top で採番する Workers isolate ライフサイクル前提 |

## 成果物 1: `outputs/phase-02/log-schema.md`

### Field 定義

| field | 型 | 必須 | 例 | 説明 |
| --- | --- | --- | --- | --- |
| `event` | `"alert_relay_kv_op_failed"` (literal) | yes | `"alert_relay_kv_op_failed"` | discriminator。grep / logpush filter で先絞り |
| `op` | `"get" \| "put"` | yes | `"get"` | KV 操作種別 |
| `errorClass` | `string` | yes | `"TypeError"` / `"Error"` / `"string"` | `err instanceof Error ? err.constructor.name : typeof err` |
| `dedupeKeyHash` | `string` (12 hex chars) | yes | `"3a7f9c1d2e88"` | `SHA-256(dedupeKey)` 先頭 12 hex |
| `isolateId` | `string` (UUID v4) | yes | `"b3c2a1f0-..."` | module top で採番した isolate ID |
| `ts` | `string` (ISO 8601 UTC) | yes | `"2026-05-16T12:34:56.789Z"` | `new Date().toISOString()` |

### JSON サンプル

```json
{"event":"alert_relay_kv_op_failed","op":"get","errorClass":"Error","dedupeKeyHash":"3a7f9c1d2e88","isolateId":"b3c2a1f0-4d5e-6789-abcd-ef0123456789","ts":"2026-05-16T12:34:56.789Z"}
```

### 後方互換性ポリシー

不変条件 7 (ログ schema 安定化) に従い:
- **許容**: 新規 field の **追加のみ** (additive)。既存 field は永続的に保持
- **禁止**: field 名の **rename / 削除** / 型変更 / `event` literal の変更
- **検証**: テストで JSON 構造 (key 集合・型) を assertion 化、回帰検知

### errorClass 抽出ルール

```ts
const errorClass =
  err instanceof Error ? err.constructor.name : typeof err;
```

stack trace / message は emit しない（不変条件 8 PII non-leak / Workers Logs 1 行容量）。

## 成果物 2: `outputs/phase-02/helper-design.md`

### シグネチャ

```ts
// module-local (export しない)
function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): void;
```

### 実装擬似コード

```ts
const ISOLATE_ID: string = crypto.randomUUID();

async function computeDedupeKeyHash(dedupeKey: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(dedupeKey),
  );
  return Array.from(new Uint8Array(buf))
    .slice(0, 6)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void> {
  const errorClass =
    err instanceof Error ? err.constructor.name : typeof err;
  let dedupeKeyHash = "unavailable";
  try {
    dedupeKeyHash = await computeDedupeKeyHash(dedupeKey);
  } catch {
    // crypto.subtle 自体が失敗してもログ emit を諦めない
  }
  console.warn(
    JSON.stringify({
      event: "alert_relay_kv_op_failed",
      op,
      errorClass,
      dedupeKeyHash,
      isolateId: ISOLATE_ID,
      ts: new Date().toISOString(),
    }),
  );
}
```

### 設計上の決定

- **module-local** にする (export しない): 他 route からの誤利用を防ぎ、UT-17-FU-005 の責務領域を `alert-relay.ts` 内に閉じる
- `async` 返却: `crypto.subtle.digest` は Promise を返すため必然
- emit は **catch path のみ** で呼ばれる → 成功 hot path のパフォーマンス影響ゼロ (AC-6 担保)
- `console.warn` は 1 回のみ呼ぶ (1 emit = 1 行) → logpush の 1 行 = 1 イベント前提と整合

## 成果物 3: `outputs/phase-02/emit-points.md`

### Emit point A: `KV.get` (L66) — try/catch 化 + fail-open

#### Before (`alert-relay.ts:64-69`)

```ts
// ut-17-followup-002: dedup state は KV 永続化。eventual consistency により
// 同一リクエスト内 race（複数 isolate からの同時 read→put）は許容スコープ外。
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}
```

#### After

```ts
// ut-17-followup-002 / 005: dedup state は KV 永続化。get 失敗時は fail-open
// (構造化ログを emit し配信継続) として観測可能化。
let seen: string | null = null;
try {
  seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (err) {
  await logKvOperationError("get", err, dedupeKey);
  // fail-open: seen=null として処理続行 → Slack 配信は通常通り
}
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}
```

#### 意思決定根拠

- 現状の throw → Hono global error handler 経由 500 は **観測不能の fail-closed**
- fail-open 後の重複配信リスク < サイレント障害の運用リスク
- 重複配信は構造化ログ + 後段 dashboard で UT-17-FU-004 領域で検出可能化

### Emit point B: `KV.put` (L93-102) — 既存 catch の構造化置換

#### Before (`alert-relay.ts:93-102`)

```ts
try {
  await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
    expirationTtl: Math.ceil(dedupeTtlMs / 1000),
  });
} catch (error) {
  console.warn("alert relay dedup KV put failed after Slack delivery", {
    error: error instanceof Error ? error.message : "unknown",
  });
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

#### After

```ts
try {
  await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
    expirationTtl: Math.ceil(dedupeTtlMs / 1000),
  });
} catch (err) {
  await logKvOperationError("put", err, dedupeKey);
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

#### 意思決定根拠

- 既存 response 契約 (`{ ok: true, attempts, dedupPersisted: false }`) は完全維持 (AC-7)
- `console.warn` 呼び出し回数も 1 回のまま (1 emit = 1 行)
- 非構造化 message 部分は schema 化された JSON に置換

### Emit が行われない経路 (AC-6)

- `KV.get` が `null` を返した正常ケース
- `KV.get` が string を返し dedup hit した正常ケース
- `KV.put` 成功ケース
- Slack 配信失敗で 502 返却するケース (KV 操作前に return)
- 不正 JSON / Slack URL 未設定 で 400 / 503 返却するケース

これらすべてで `console.warn` 呼び出し回数 = 0 をテストで assertion 化する。

## 成果物 4: `outputs/phase-02/isolate-id-strategy.md`

### Workers isolate ライフサイクル前提

Cloudflare Workers の実行モデル:
- 1 つの isolate (V8 context) が 複数 request にまたがって再利用される
- isolate がメモリ圧迫 / バージョン deploy / 長時間アイドルで破棄され、新規 isolate が起動
- module top-level 文は isolate 起動時に **1 度だけ評価** される

### 採用設計

```ts
// alert-relay.ts のモジュール top-level
const ISOLATE_ID: string = crypto.randomUUID();
```

- isolate 起動時に 1 回採番 → 同一 isolate 内の全 emit が同じ `ISOLATE_ID` を共有
- 別 isolate (別 v8 context) では別 UUID → ログから「isolate 単位の失敗集中」が観測可能
- request ごとの採番ではないため、複数 request 跨ぎの相関も取れる

### 代替案検討

| 案 | 評価 | 不採用理由 |
| --- | --- | --- |
| request 単位採番 | × | isolate 内相関不能、emit ごとに別 UUID で集約困難 |
| `env.ISOLATE_ID` binding | × | Workers で isolate 単位の binding 分離は不可 |
| `globalThis` への遅延セット | △ | module top と意味的に同じだが、可読性で module top が優位 |
| Date.now() ベース | × | 同時刻起動の isolate が衝突、UUID の方が安全 |

### Runbook 注意点

- 同一 `isolateId` で連続 emit → isolate 単位の偏った KV エラー (例: 特定 colo の KV replica drift) を疑う
- 異なる `isolateId` で分散 emit → グローバル KV 一時障害を疑う
- isolate ID 自体は無作為 UUID で識別子としての継続性無し (deploy 跨ぎで全て変わる) → 障害は **時間窓 + ID 多様性** で評価する

## 完了条件

- [ ] `outputs/phase-02/log-schema.md` に AC-3 schema 表 / JSON サンプル / 後方互換性ポリシーが記載されている
- [ ] `outputs/phase-02/helper-design.md` に `logKvOperationError` シグネチャ / 擬似コード / 設計決定理由が記載されている
- [ ] `outputs/phase-02/emit-points.md` に L66 / L93-102 の before/after snippet が記載され fail-open 化の根拠が明示されている
- [ ] `outputs/phase-02/isolate-id-strategy.md` に Workers isolate ライフサイクル前提と代替案検討が記載されている
- [ ] AC-1〜AC-10 すべてが本 Phase 成果物のいずれかにマッピングされている

## 実行タスク

- [ ] `apps/api/src/routes/internal/alert-relay.ts` の L17-24 (`AlertRelayEnv`) / L59-63 (`dedupeKey`) / L66 (`KV.get`) / L93-102 (`KV.put` catch) を実コードで再確認する
- [ ] AC-3 ログ schema を表で確定する
- [ ] `logKvOperationError` の擬似コードを TypeScript で書き起こす
- [ ] L66 / L93-102 の before/after snippet を作成する
- [ ] `ISOLATE_ID` の module top 採番設計を文書化する
- [ ] 4 つの outputs ファイルを作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 実装対象 |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/phase-01.md | Phase 1 採用案 |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/index.md | AC / 不変条件 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | `crypto.subtle.digest` 仕様 |
| 参考 | https://developers.cloudflare.com/workers/reference/how-workers-works/ | isolate ライフサイクル |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/log-schema.md | AC-3 schema 正本 |
| ドキュメント | outputs/phase-02/helper-design.md | `logKvOperationError` 設計 |
| ドキュメント | outputs/phase-02/emit-points.md | L66 / L93-102 before/after |
| ドキュメント | outputs/phase-02/isolate-id-strategy.md | isolate ID 採番戦略 |

## タスク 100% 実行確認【必須】

- 全実行タスク completed
- 全 4 成果物が指定パスに配置済み
- 全完了条件にチェック
- AC-1〜AC-10 すべてが本 Phase 内でマッピング済
- behaviour change (`KV.get` fail-closed → fail-open) が emit-points.md に明示記載

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項:
  - 4 成果物の内容を Phase 3 で AC マトリックス / 不変条件マトリックスにかける
  - behaviour change の意思決定承認を Phase 3 Gate-A で取得
  - test 計画妥当性 (`vi.spyOn(console, 'warn')` leak 対策) を Phase 3 で確認
- ブロック条件: 4 成果物のいずれかが outputs に未配置の場合、Phase 3 に進まない

## 統合テスト連携

設計した schema / helper / emit point は Phase 7 の `TC-LOG-*` と Phase 11 の grep gate で検証する。hash failure fallback は `dedupeKeyHash="hash_error"` として fail-safe に扱う。
