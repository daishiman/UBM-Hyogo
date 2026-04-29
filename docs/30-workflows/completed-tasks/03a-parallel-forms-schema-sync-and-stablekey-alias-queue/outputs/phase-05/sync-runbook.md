# sync-runbook — forms-schema-sync (03a)

## 章 1: 前提

- branch: `feat/03a-forms-schema-sync`（任意 feature branch）
- env: staging（dev）想定。production 配信は wave 9b 以降。
- D1 binding: `DB`（apps/api/wrangler.toml の `[[d1_databases]]`）
- secret（Cloudflare Secrets）:
  - `SYNC_ADMIN_TOKEN`（admin gate 認可）
  - `GOOGLE_FORM_ID`
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_FORM_RESPONDER_URL`（任意）

## 章 2: module スケルトン

```
apps/api/src/sync/schema/
├── index.ts
├── types.ts
├── flatten.ts
├── schema-hash.ts
├── resolve-stable-key.ts
├── diff-queue-writer.ts
└── forms-schema-sync.ts
```

`pnpm install` 後、各ファイルが build/typecheck を通る空 export 状態でスタートする。

## 章 3: 関数本体

`pseudocode.md` に従って実装。実体は以下:
- `flatten(items)`: sectionHeader で sectionIndex 採番。pageBreak / questionItem 不在は skip。
- `schemaHash(flat)`: itemId 昇順 → JSON → SHA-256 hex。
- `resolveStableKey({questionId,title}, {ctx, labelToKnownStableKey})`: alias → known → unknown の 3 段階。
- `diffQueueWriter.enqueue(ctx, input)`: 同 questionId/queued があれば skip。
- `runSchemaSync(env, deps)`: lock(start) → fetch → assert(31/6) → upsert versions → loop（resolve + upsert + 必要なら diff） → ledger close。

## 章 4: endpoint 配線

`apps/api/src/routes/admin/sync-schema.ts`:

```ts
adminGate -> handler(c) {
  const deps = depsFactory(c.env)
  try { runSchemaSync(c.env, deps) → 200 }
  catch (ConflictError) → 409 { status: "conflict" }
  catch (other) → 500 { status: "failed" }
}
```

`apps/api/src/index.ts` に `app.route("/admin", adminSyncSchemaRoute)` で mount。

## 章 5: cron 配線

`apps/api/src/index.ts#scheduled`:

```ts
if (cron === "0 18 * * *") {
  ctx.waitUntil(runSchemaSync(env, makeDefaultSchemaSyncDeps(env)))
  return
}
ctx.waitUntil(runSync(env, { trigger: "cron" }))   // 既存 sheets sync
```

`apps/api/wrangler.toml` の `[triggers]` で `crons = ["*/15 * * * *", "0 18 * * *"]` を維持する。

## 章 6: test

```bash
mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api test
```

194/194 PASS を維持。

## 章 7: local dev dry-run

1. `mise exec -- pnpm install`
2. `bash scripts/cf.sh d1 migrations apply ubm_hyogo_local --local --config apps/api/wrangler.toml`
3. `mise exec -- pnpm --filter @ubm-hyogo-hyogo-hyogo/api dev`
4. 別 shell:
   ```bash
   curl -X POST http://localhost:8787/admin/sync/schema \
     -H "Authorization: Bearer ${SYNC_ADMIN_TOKEN}"
   ```
5. 結果確認:
   ```bash
   bash scripts/cf.sh d1 execute ubm_hyogo_local --local \
     --command "SELECT COUNT(*) FROM schema_questions"          # → 31
   bash scripts/cf.sh d1 execute ubm_hyogo_local --local \
     --command "SELECT status, COUNT(*) FROM sync_jobs GROUP BY status"
   ```

## 章 8: rollback / cleanup

- 失敗時の `sync_jobs.status='failed'` row はそのまま残す（監査用）。
- 不正な schema_versions row を作ってしまった場合: `state='superseded'` に降格 → 次回 sync で正しい revision を `active` に切替。
