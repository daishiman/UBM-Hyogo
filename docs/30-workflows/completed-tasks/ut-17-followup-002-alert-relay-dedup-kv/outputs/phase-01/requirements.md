# Phase 1 — 要件定義（ut-17-followup-002-alert-relay-dedup-kv）

[実装区分: 実装仕様書 / NON_VISUAL]

## P50 前提確認

| 項目 | 結果 |
|------|------|
| current branch に実装が存在する | No（`seenAlerts = new Map<string, number>()` のまま） |
| upstream（main / dev）にマージ済み | No |
| 前提タスク（UT-17）が完了済み | Yes |

`implementation_mode: "new"`

## 機能要件（確定）

| FR-ID | 要件 |
|-------|------|
| FR-1 | dedup 判定は `c.env.ALERT_DEDUP_KV.get(key)` の存在で行う。`null` → 新規、それ以外 → deduped |
| FR-2 | 新規通知時は `put(key, "1", { expirationTtl })`。value は `"1"` 固定、metadata 不使用 |
| FR-3 | TTL は `Math.ceil(dedupeTtlMs / 1000)` 秒（既定 300 秒） |
| FR-4 | KV binding は `Env` 上で必須プロパティ（`KVNamespace`）。Optional fallback は禁止 |
| FR-5 | Slack 配信 retry / Block Kit 整形 / cf-webhook-auth 経路は無変更 |

## 非機能要件

| NFR-ID | 要件 |
|--------|------|
| NFR-1 | KV write/read は per-request 各 1 回 |
| NFR-2 | KV eventual consistency による 100% dedup 保証は対象外（improvement 目標） |
| NFR-3 | `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/api test` 全 PASS |

## 変更対象ファイル一覧（CONST_005）

| パス | 種別 | 概要 |
|------|------|------|
| `apps/api/src/env.ts` | 編集 | `ALERT_DEDUP_KV: KVNamespace` を `Env` に追加 |
| `apps/api/src/routes/internal/alert-relay.ts` | 編集 | `seenAlerts` Map 削除、KV 経由 dedup へ置換 |
| `apps/api/wrangler.toml` | 編集 | `[[env.{staging,production}.kv_namespaces]]` 追記（id は user-gated step で実 ID 反映） |
| `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | 編集 | KV stub inject、TC-KV-* 追加 |
| `apps/api/test/helpers/kv-stub.ts` | 新規 | Miniflare 互換 KV stub helper |
| `apps/api/src/index.ts` | 編集 | `buildFormsClient` を narrow env 型に変更（KV 必須化に伴う型整合） |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 編集 | KV namespace 健全性確認 Step 4b 追記 |

## 関数シグネチャ（確定）

```ts
// apps/api/src/routes/internal/alert-relay.ts
export interface AlertRelayEnv extends VerifyCfWebhookAuthEnv {
  readonly SLACK_WEBHOOK_URL?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
  readonly ALERT_DEDUP_KV: KVNamespace;
}
```

## 受入条件

- [x] `alert-relay.ts` に `seenAlerts` Map が残っていない
- [x] `c.env.ALERT_DEDUP_KV` を経由した dedup 判定が機能する
- [x] KV TTL 経過後の再受信が deduped 解除される（TC-KV-01）
- [x] 既存テストケース構造（既存 PASS 件数）を維持しつつ、KV stub ベースのテストで PASS
- [ ] `wrangler.toml` の `[[env.{staging,production}.kv_namespaces]]` に実 namespace_id が記載されている（user-gated step）

## 完了条件

Phase 2 で参照する変更対象ファイル一覧・関数シグネチャが固定済み。
