# Phase 2 成果物: emit 箇所マッピング

> AC-5, AC-6 紐付け。`alert-relay.ts` 内で `logKvOperationError` を呼ぶ箇所と既存コードの diff 設計を正本化する。

## 1. 既存コード現状（参照行）

| 行 | 現状コード | 区分 |
| --- | --- | --- |
| alert-relay.ts:23 | `readonly ALERT_DEDUP_KV: KVNamespace;` | binding 定義（不変） |
| alert-relay.ts:66 | `const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);` | try/catch なし → 本タスクで新設 |
| alert-relay.ts:67-69 | `if (seen !== null) { return c.json({ ok: true, deduped: true }); }` | dedupe 判定（不変） |
| alert-relay.ts:93-102 | `try { put } catch (error) { console.warn("alert relay dedup KV put failed after Slack delivery", { error: ... }); return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false }); }` | catch 内 console.warn → helper 呼出に置換 |

## 2. 変更点 1: module top 採番（NEW）

### 配置

import 群の直後、`createAlertRelayRoute` の前。

### 設計

```typescript
import { ... };

// UT-17-FU-005: isolate 寿命中に再利用する代理識別子（Workers に isolate.id API 無し）
const isolateId = crypto.randomUUID();

async function logKvOperationError(/* ... */): Promise<void> { /* ... */ }

export function createAlertRelayRoute(/* ... */) { /* ... */ }
```

## 3. 変更点 2: `get` を try/catch で包む（NEW / AC-5）

### 既存（行 66）

```typescript
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
```

### 変更後（設計）

```typescript
let seen: string | null = null;
try {
  seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (err) {
  // UT-17-FU-005: fail-open。seen = null として通常配信を継続。
  await logKvOperationError("get", err, dedupeKey);
}
```

### 設計上の決定

- `seen` の宣言を `const` から `let` に変更し、初期値 `null` を持つ
- `catch` 後は `seen = null` として続行（明示再代入は不要、初期値のまま）
- `if (seen !== null)` の dedupe 判定（行 67-69）は不変。throw 時は `null` のまま判定を通過し、通常配信パスへ進む
- これが本タスク唯一の意図的な behaviour change（詳細は `get-fail-open-policy.md`）

### AC-5 達成根拠

- try/catch で囲まれている ✓
- catch 内で `await logKvOperationError("get", err, dedupeKey)` を呼ぶ ✓
- `seen = null` 相当として通常処理を継続（fail-open） ✓

## 4. 変更点 3: `put` 既存 catch を helper 呼出に置換（AC-6）

### 既存（行 93-102）

```typescript
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

### 変更後（設計）

```typescript
try {
  await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
    expirationTtl: Math.ceil(dedupeTtlMs / 1000),
  });
} catch (error) {
  // UT-17-FU-005: 既存 fail-open は不変、emit のみ helper 経由に置換。
  await logKvOperationError("put", error, dedupeKey);
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

### 設計上の決定

- `try` block / `put` 引数 / `expirationTtl` 計算は不変
- catch 内の `console.warn(...)` 行のみを `await logKvOperationError("put", error, dedupeKey)` に置換
- `return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false })` は完全に不変
- catch 変数名は既存の `error` のままで helper 第 2 引数に渡す

### AC-6 達成根拠

- 既存 catch ブロックが helper 呼出に置き換わる ✓
- 戻り値・レスポンス挙動（`dedupPersisted: false`）が不変 ✓

## 5. behaviour change の正本記録

| 行 | 種別 | 変更内容 | behaviour change |
| --- | --- | --- | --- |
| module top | NEW | `const isolateId = crypto.randomUUID();` | なし（読み取り副作用のみ） |
| top-level helper | NEW | `logKvOperationError` 関数追加 | なし（呼び出されなければ発火しない） |
| :66 周辺 | EDIT | `get` を try/catch + fail-open 化 | **あり**：従来は throw 時 500、変更後は fail-open 続行 |
| :93-102 | EDIT | `put` catch の console.warn を helper 呼出に置換 | なし（戻り値・レスポンス挙動完全一致） |

唯一の behaviour change（`get` fail-open 化）は `get-fail-open-policy.md` で根拠化し、Phase 12 documentation-changelog にも記録する。

## 6. 影響範囲外（明示）

以下は本タスクで一切触らない:

- `createAlertRelayRoute` のシグネチャ・引数・戻り値型
- `verifyCfWebhookAuth` middleware 適用
- `dedupeTtlMs` / `now` / `dedupeKey` 計算ロジック（行 38-63）
- `formatCloudflareAlertToSlack` 呼出（行 75）
- `sendSlackMessage` 呼出（行 85）
- Slack 配信失敗時の 502 レスポンス（行 87-91）
- 成功時の `c.json({ ok: true, attempts })` レスポンス（行 103）
- `AlertRelayEnv` / `AlertRelayDeps` interface 定義
