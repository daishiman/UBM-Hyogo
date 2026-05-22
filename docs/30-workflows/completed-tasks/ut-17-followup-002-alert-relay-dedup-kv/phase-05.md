# Phase 5: 実装（TDD Green）

[実装区分: 実装仕様書]

## 目的

Phase 4 で Red にしたテストを Green にする。

## 新規作成 / 修正ファイル一覧

| パス | 種別 | 内容 |
|------|------|------|
| `apps/api/src/env.ts` | 編集 | `Env` に `ALERT_DEDUP_KV: KVNamespace` を追加。`@cloudflare/workers-types` 未 import なら追加 |
| `apps/api/src/routes/internal/alert-relay.ts` | 編集 | `AlertRelayEnv` に KV 型追加。`seenAlerts` Map 削除。`get`/`put` 経由 dedup へ置換 |
| `apps/api/wrangler.toml` | 編集 | `[[env.staging.kv_namespaces]]` / `[[env.production.kv_namespaces]]` 追加（実 namespace_id） |

## 実装手順（順序固定）

### Step 1: KV namespace 作成（Cloudflare 側）

`bash scripts/cf.sh` 経由のみ。**`wrangler` 直接実行禁止**。

```bash
bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env staging
bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env production
```

出力された `id`（hex 文字列）を `apps/api/wrangler.toml` に転記する。

### Step 2: `apps/api/wrangler.toml` 編集

```toml
[[env.staging.kv_namespaces]]
binding = "ALERT_DEDUP_KV"
id = "<実際の staging namespace id>"

[[env.production.kv_namespaces]]
binding = "ALERT_DEDUP_KV"
id = "<実際の production namespace id>"
```

### Step 3: `apps/api/src/env.ts`

```ts
import type { KVNamespace } from "@cloudflare/workers-types";

export interface Env {
  // ...existing
  readonly ALERT_DEDUP_KV: KVNamespace;
}
```

### Step 4: `apps/api/src/routes/internal/alert-relay.ts`

差分:

```ts
// AlertRelayEnv に追加
readonly ALERT_DEDUP_KV: KVNamespace;
```

```ts
// createAlertRelayRoute の本体
// 削除: const seenAlerts = new Map<string, number>();
// 削除: for (const [key, seenAt] of seenAlerts) { ... }

// dedup ブロックを次に置換
const dedupeKey = [
  classifyAlertMetric(payload),
  payload.policy_id ?? payload.name ?? payload.alert_type ?? "unknown",
  String(minuteBucket),
].join(":");
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}
await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
  expirationTtl: Math.ceil(dedupeTtlMs / 1000),
});
```

`now()` への呼び出しは `minuteBucket` 算出のみで残す。

### Step 5: テスト調整・実行

```bash
mise exec -- pnpm --filter @repo/api test alert-relay
```

→ TC-01〜TC-03、TC-KV-01〜05 が全 PASS。

## 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @repo/api test
```

## DoD（Phase 5 完了条件）

- [ ] `seenAlerts` 参照が `apps/api/src/` 配下に残っていない（`grep -r "seenAlerts" apps/api/src/` がゼロ）
- [ ] `wrangler.toml` の `id` が hex placeholder ではなく実 ID で記載されている
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm lint` PASS
- [ ] `pnpm --filter @repo/api test` PASS（Phase 4 で Red にした全ケース Green）
- [ ] `bash scripts/cf.sh` 以外の `wrangler` 直接呼び出しを追加していない（`grep -rn "wrangler " apps/api/scripts/ 2>/dev/null` の確認）
- [ ] `outputs/phase-05/implementation-plan.md` に実装サマリーが記録されている

## Pitfall 対策

- **[Feedback RT-03]** 上記「新規作成 / 修正ファイル一覧」表を実装着手前に必ず確認。
- **wrangler.toml の TOML 構文**: `[[env.staging.kv_namespaces]]` は double-bracket 必須。single-bracket は別意味になる。
- **`@cloudflare/workers-types`**: `apps/api/package.json` に既に含まれているか Phase 5 着手前に確認（含まれていなければ `mise exec -- pnpm --filter @repo/api add -D @cloudflare/workers-types`）。
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 5
- status: completed

## 目的

alert-relay の KV dedup 実装を local complete にする。

## 実行タスク

- route、env 型、tests、wrangler template、runbook を更新する。

## 参照資料

- `outputs/phase-05/implementation-plan.md`

## 成果物/実行手順

- `apps/api/src/routes/internal/alert-relay.ts`
- `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`

## 完了条件

- [x] focused tests が PASS
- [x] typecheck / lint が PASS

## 統合テスト連携

- Phase 11 evidence に focused test 結果を保存する。
