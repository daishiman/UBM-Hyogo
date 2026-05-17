# Phase 5: 実装計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装手順) |
| 状態 | completed |
| GitHub Issue | #701（CLOSED / completed marked / close時点では実コード未実装・本workflowでlocal実装済み） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | Phase 4 で固定した T1〜T8 のうち T1〜T4（コア実装）および T5/T6（テスト追加）は `apps/api/src/routes/internal/alert-relay.ts` と `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` を **実コードとして編集する**。本 Phase は CONST_005 必須項目（変更対象ファイル / 関数シグネチャ / 型 / 入出力・副作用 / 依存ライブラリ / 実装順序）に沿ってコード実装の前計画を固定する。 |

---

## 目的

Phase 4 のサブタスク T1〜T8 を、Phase 06（実装手順）以降が即着手できる粒度まで具体化する。
本 Phase の出力は `outputs/phase-05/implementation-plan.md` を中心に、変更対象ファイル・関数シグネチャ・型・依存・実装順序を CONST_005 必須項目に沿って固定する。

---

## 5-1. 変更対象ファイル一覧

| 種別 | パス | 役割 | 担当サブタスク |
| --- | --- | --- | --- |
| 編集 | `apps/api/src/routes/internal/alert-relay.ts` | module-top `isolateId` 採番、private helper `sha256Hex12` / `logKvOperationError` 追加、`KV.get` を try/catch で包んで fail-open 化、`KV.put` catch を helper 呼び出しへ置換 | T1〜T4 |
| 編集 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | TC-KV-GET-THROW / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN / TC-DEDUPE-KEY-HASH 4 ケース追加、既存 TC-KV-05（`get` throw で 500）の fail-open 化への更新、`afterEach(() => vi.restoreAllMocks())` 追加 | T5 / T6 |
| 編集 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「KV 操作エラーログの確認」セクション追加・`scripts/cf.sh tail` grep 例・しきい値・schema 表を追記 | T7 |
| 参照のみ | `apps/api/src/env.ts` | `ALERT_DEDUP_KV` binding 型（変更なし） | — |
| 参照のみ | `apps/api/wrangler.toml` | `ALERT_DEDUP_KV` namespace 定義（変更なし） |  — |
| 参照のみ | `apps/api/test/helpers/kv-stub.ts` | 既存 `getError` / `putError` オプションを利用（変更なし） | T5 |

> 削除ファイルなし。新規ファイルなし。`apps/web/` 配下は変更しない。新規 Cloudflare Secret / Var なし。

---

## 5-2. 主要関数シグネチャ・型定義

### 5-2-1. module-top 採番（`apps/api/src/routes/internal/alert-relay.ts`）

```ts
// import 群直後、createAlertRelayRoute() 定義の前に配置する。
// isolate ライフサイクル代理識別子として、Workers isolate が起きている間は同一値を保持する。
const isolateId = crypto.randomUUID();
```

> **AC-1 / 不変条件 4**: handler 内で再採番しない。テストごとに `vi.resetModules()` するとモジュール再評価で値が変わるが、本仕様では「同一モジュール評価内では再採番しない」までを保証する。

### 5-2-2. SHA-256 12 文字短縮ヘルパ

```ts
// SHA-256 hash の先頭 12 hex chars（lowercase）を返す。
// raw dedupeKey をログに出さない目的の軽量 fingerprint。
async function sha256Hex12(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .slice(0, 6)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

> **AC-4 / 不変条件 5**: `Uint8Array` 6 バイト × 2 hex = 12 hex chars。同一入力に対して同一値が再現すること。

### 5-2-3. 構造化ログ emit ヘルパ

```ts
// 1 行 JSON を console.warn で emit する private helper。
// Workers Logs から後段 logpush で event 文字列 fixed filter に乗せる前提。
async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void> {
  const errorClass = err instanceof Error ? err.constructor.name : typeof err;
  const dedupeKeyHash = await sha256Hex12(dedupeKey);
  const payload = {
    event: "alert_relay_kv_op_failed",
    op,
    errorClass,
    dedupeKeyHash,
    isolateId,
    ts: new Date().toISOString(),
  };
  console.warn(JSON.stringify(payload));
}
```

> **AC-2 / AC-3**: 外部 export しない（module 内 private）。`console.warn(JSON.stringify(payload))` で 1 行 JSON 化。

### 5-2-4. emit 接続箇所

```ts
// (現状) const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
// (変更後) try/catch で包み、catch では log+fail-open
let seen: string | null;
try {
  seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (error) {
  await logKvOperationError("get", error, dedupeKey);
  seen = null; // fail-open: dedup skip して通常 Slack 配信続行
}
```

```ts
// 既存 put catch ブロックの置換
try {
  await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
    expirationTtl: Math.ceil(dedupeTtlMs / 1000),
  });
} catch (error) {
  await logKvOperationError("put", error, dedupeKey);
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

> **AC-5 / AC-6 / 不変条件 1, 2**: `get` 側のみ fail-open 化が意図的挙動変更。`put` 側のレスポンス挙動（`dedupPersisted: false`）は不変。

---

## 5-3. 依存ライブラリ・ランタイム API

| 種別 | 名前 | 用途 |
| --- | --- | --- |
| ランタイム | `crypto.randomUUID()` | Workers Web Crypto / Node 20+ に存在。`isolateId` 採番 |
| ランタイム | `crypto.subtle.digest("SHA-256", ...)` | Workers Web Crypto / Node 20+ に存在。`dedupeKeyHash` |
| ランタイム | `TextEncoder` | 文字列 → `Uint8Array` 変換 |
| ランタイム | `console.warn` | Workers Logs 経路。1 行 JSON 化済み payload を渡す |
| ランタイム | `new Date().toISOString()` | ISO 8601 UTC タイムスタンプ |
| テスト | `vitest` の `vi.spyOn(console, "warn")` | warn emit assertion |
| テスト | `vi.fn().mockRejectedValueOnce(new Error("..."))` | KV throw 注入 |
| テスト | 既存 `createKvStub({ getError, putError })` | KV stub の throw 注入オプション |

> 新規 npm package 追加なし。tsconfig 変更なし。

---

## 5-4. 実装順序（Phase 6 と整合）

1. **S1**: module-top に `const isolateId = crypto.randomUUID();` 追加（T1）
2. **S2**: top-level に `sha256Hex12` / `logKvOperationError` 実装（T2）
3. **S3**: `KV.get` を try/catch で包み、catch で `logKvOperationError("get", err, dedupeKey)` + `seen = null` 化（T3）
4. **S4**: `KV.put` catch を `logKvOperationError("put", error, dedupeKey)` へ置換、レスポンス挙動は不変（T4）
5. **S5**: `alert-relay.spec.ts` に 4 ケース追加 + `afterEach(() => vi.restoreAllMocks())`（T5）
6. **S6**: 既存 TC-KV-05 を `get` fail-open 化に合わせて更新（T6）
7. **S7**: runbook 追記（T7）
8. **S8**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec` 全 PASS 確認（T8）

> S1 と S2 の間に `pnpm typecheck` を 1 回挟むと型エラーの局所化が容易（推奨）。

---

## 5-5. 入出力・副作用契約

| 項目 | 内容 |
| --- | --- |
| 入力 | `Hono` request context `c`。`c.env.ALERT_DEDUP_KV` を KV 操作対象とする |
| 出力（レスポンス） | 既存と不変（200 / 502 / 503 / 400 / 401 / 500）。`dedupPersisted: false` も既存通り |
| 副作用 1 | `console.warn(JSON.stringify({ event, op, errorClass, dedupeKeyHash, isolateId, ts }))` を KV throw 時のみ emit |
| 副作用 2 | `KV.get` 失敗時は `seen = null` 相当として通常 Slack 配信フローへ進む（fail-open） |
| 副作用 3 | `KV.put` 失敗時はレスポンスに `dedupPersisted: false` を含めて 200 を返す（既存挙動の維持） |
| 例外伝播 | `crypto.subtle.digest` / `TextEncoder` は通常 throw しない。`logKvOperationError` 自体の throw は呼び出し側で握り潰さず、上位 try/catch の外（成功路）で発生した場合のみ Hono 既定 500 にまとめられる（許容） |

---

## 5-6. 後方互換性 / 既存挙動変更

| 項目 | 変更前 | 変更後 | 区分 |
| --- | --- | --- | --- |
| `KV.get` throw 時 | unhandled（Hono 既定で 500） | warn emit + `seen = null` 扱いで Slack 配信続行 | **意図的な挙動変更（AC-10 / Phase 12 documentation-changelog 連携）** |
| `KV.put` throw 時 | plain object `console.warn` + `dedupPersisted: false` | 1 行 JSON `console.warn` + `dedupPersisted: false` | ログ schema のみ変更（レスポンス不変） |
| 成功路 | `console.warn` なし | `console.warn` なし | 不変 |
| Slack 配信 retry / dedupe TTL | 不変 | 不変 | 不変 |

---

## 5-7. 検証コマンド

```bash
# 型チェック
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint

# alert-relay spec のみ実行
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec
```

> production deploy は本 Phase の範囲外（user-gated / external ops）。

---

## 5-8. リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `get` fail-open 化が regression を生む | TC-KV-GET-THROW で「Slack 配信が成功すること」を明示 assert。既存 TC-KV-05（`get` throw で 500 期待）は T6 で fail-open 化に合わせて更新 |
| `vi.spyOn(console, "warn")` の他 test への leak | `afterEach(() => vi.restoreAllMocks())` を `describe` 直下に追加 |
| `crypto.subtle.digest` の async が emit 順序を乱す | helper を `async` とし、catch 内も `await logKvOperationError(...)` で待機 |
| Workers Logs 1 行上限超過 | stack trace を含めず `errorClass` のみ。`dedupeKey` は 12 char hash に短縮 |
| 後段 logpush 契約 break | `event` 文字列を `"alert_relay_kv_op_failed"` で固定。schema 変更時は本 workflow の続編 issue を立てる |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-plan.md | 本 Phase の正本 |
| メタ | artifacts.json | phase-05 を completed に更新 |

---

## 完了条件

- [ ] 変更対象ファイル一覧・関数シグネチャ・型・依存・実装順序が CONST_005 必須項目を満たす
- [ ] 後方互換性 / 既存挙動変更が「`get` fail-open 化のみ」に絞られている
- [ ] 検証コマンド 3 種が固定されている
- [ ] outputs/phase-05 配下が artifacts.json と 1 対 1 整合

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-05 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 6（実装手順）
- 引き継ぎ事項:
  - 関数シグネチャ・型をそのまま Phase 6 の「コードスニペット」に転記する
  - 実装順序 S1〜S8 を Phase 6 のステップ番号に対応させる
  - 後方互換性表を Phase 12 documentation-changelog の入力とする
- ブロック条件: `event` 文字列固定が崩れる、または `isolateId` を handler 内採番する設計が混入した場合

## 実行タスク

- 変更対象、関数シグネチャ、型、入出力、副作用、実装順序を固定する。

## 参照資料

- `apps/api/src/routes/internal/alert-relay.ts`
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`
- `outputs/phase-05/implementation-plan.md`

## 統合テスト連携

Phase 7 の focused Vitest 4 ケースを Phase 5 実装計画の検証手段にする。
