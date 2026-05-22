# Phase 5 — 実装（TDD Green）サマリ

## 実装済み変更

| パス | 種別 | 概要 |
|------|------|------|
| `apps/api/src/env.ts` | 編集 | `Env` に `ALERT_DEDUP_KV: KVNamespace` を必須プロパティとして追加 |
| `apps/api/src/routes/internal/alert-relay.ts` | 編集 | `AlertRelayEnv` に KV 型追加。`seenAlerts` Map と TTL 走査ループを削除。Slack 配信成功後のみ `get`/`put` 経由 dedup に保存 |
| `apps/api/wrangler.toml` | 編集 | `[[env.staging.kv_namespaces]]` / `[[env.production.kv_namespaces]]` の user-gated block をコメントで追加。実 id 取得までは active TOML に placeholder を置かない |
| `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | 編集 | `buildEnv` を KV stub inject 形式に書き換え、TC-KV-01〜09 / TC-03 / Slack failure retry を追加 |
| `apps/api/test/helpers/kv-stub.ts` | 新規 | Miniflare 互換 KV stub。`puts` 観測 / `getError` / `putError` 注入対応 |
| `apps/api/src/index.ts` | 編集 | `buildFormsClient` の env 型を Env から narrow `FormsClientEnv extends ResponseSyncEnv` に変更（KV 必須化に伴う contravariance 整合） |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 編集 | Step 4b「ALERT_DEDUP_KV namespace 健全性確認」追記 |

## Handler 内 dedup 差分（実装結果）

```diff
-    const lastSeen = seenAlerts.get(dedupeKey);
-    if (typeof lastSeen === "number" && now() - lastSeen < dedupeTtlMs) {
-      return c.json({ ok: true, deduped: true });
-    }
-    seenAlerts.set(dedupeKey, now());
-    for (const [key, seenAt] of seenAlerts) {
-      if (now() - seenAt >= dedupeTtlMs) seenAlerts.delete(key);
-    }
+    const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
+    if (seen !== null) {
+      return c.json({ ok: true, deduped: true });
+    }
+    const result = await sendSlackMessage(webhookUrl, message, sendOptions);
+    if (!result.ok) return c.json({ ok: false, attempts: result.attempts, status: result.status }, 502);
+    await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
+      expirationTtl: Math.ceil(dedupeTtlMs / 1000),
+    });
```

`seenAlerts = new Map<string, number>()` の宣言と TTL 走査ループも削除済み。

## 検証結果

| コマンド | 結果 |
|---------|------|
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS |
| `mise exec -- pnpm --filter @ubm-hyogo/api lint` | PASS |
| `pnpm exec vitest run apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | 21 PASS / 0 FAIL |

## DoD

- [x] `seenAlerts` 参照は `apps/api/src/` から消滅
- [x] active `wrangler.toml` に placeholder id を置いていない（実 ID 反映は user-gated step）
- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm --filter @ubm-hyogo/api test`（alert-relay）PASS
- [x] `bash scripts/cf.sh` 以外の `wrangler` 直接呼び出しを新規追加していない

## user-gated step（本サイクルで実行しない）

```bash
bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env staging
bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env production
# 出力 id を apps/api/wrangler.toml のコメント化済み block に反映し、コメント解除する
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```
