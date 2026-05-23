# Phase 2 成果物: Emit point 設計 (before / after)

Emit 点は **2 箇所のみ**: `KV.get` の catch（新規追加）と `KV.put` の catch（既存置換）。

## Emit point A: `KV.get` — try/catch 化 + fail-open

### Before (try/catch 無し / fail-closed throw)

```ts
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}
```

### After

```ts
let seen: string | null = null;
try {
  seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (error) {
  await logKvOperationError("get", error, dedupeKey);
  // fail-open: seen=null として処理続行 → Slack 配信は通常通り実施
}
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}
```

### 意思決定根拠

- 現状の throw → Hono global error handler 経由 500 は **観測不能の fail-closed**
- fail-open 後の重複配信リスク < サイレント障害の運用リスク
- 重複配信検出は構造化ログ + 後段 dashboard (UT-17-FU-004) で観測可能化

## Emit point B: `KV.put` — 既存 catch の構造化置換

### Before (非構造化 `console.warn`)

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

### After

```ts
try {
  await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
    expirationTtl: Math.ceil(dedupeTtlMs / 1000),
  });
} catch (error) {
  await logKvOperationError("put", error, dedupeKey);
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

### 意思決定根拠

- 既存 response 契約 `{ ok: true, attempts, dedupPersisted: false }` は完全維持 (AC-7)
- `console.warn` 呼び出し回数も 1 回のまま (1 emit = 1 行)
- 非構造化メッセージ部分が schema 化された JSON へ置換される

## Emit が行われない経路 (AC-6)

以下すべてで `console.warn` 呼び出し回数 = 0 を保証する（TC-LOG-03 で assertion 化）:

- `KV.get` が `null` を返した正常ケース
- `KV.get` が string を返し dedup hit した正常ケース
- `KV.put` 成功ケース
- Slack 配信失敗で 502 返却（KV.put 到達前）
- 不正 JSON / Slack URL 未設定 で 400 / 503 返却
