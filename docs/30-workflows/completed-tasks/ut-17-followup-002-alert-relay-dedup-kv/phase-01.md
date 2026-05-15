# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 目的

isolate 跨ぎ dedup の要件、入出力、不変条件、判定可能な完了条件を Phase 2 設計着手前に固定する。

## P50 前提確認チェック

| 項目 | 結果 | 対応 |
|------|------|------|
| current branch に実装が存在する | No（`seenAlerts = new Map<string, number>()` のまま） | 通常の実装 Phase とする |
| upstream（main / dev）にマージ済み | No | 未マージとして扱う |
| 前提タスク（UT-17）が完了済み | Yes（`alert-relay.ts` は既に存在） | 依存解消は不要 |

→ `implementation_mode: "new"`

## タスク分類

- UI task / docs-only task: **NON_VISUAL implementation task**
- 視覚証跡: 不要（Phase 11 は manual-test-result.md にチェックリストで代替）

## 既存コード命名規則の確認

| 観点 | 既存パターン | 本タスクで採用 |
|------|-------------|--------------|
| binding 名 | `SLACK_WEBHOOK_URL` / `CF_*` (UPPER_SNAKE_CASE) | `ALERT_DEDUP_KV` |
| Hono `c.env` 型 | `AlertRelayEnv extends VerifyCfWebhookAuthEnv` | `AlertRelayEnv` に `ALERT_DEDUP_KV: KVNamespace` を追加 |
| dedup key | `${metric}:${policyId}:${minuteBucket}` | 維持 |
| TTL | `dedupeTtlMs = 5 * 60 * 1000` | KV 側は `expirationTtl: Math.ceil(dedupeTtlMs / 1000)` 秒 |

## 機能要件

| FR-ID | 要件 |
|-------|------|
| FR-1 | dedup 判定は KV `get(key)` の存在で行う。値が存在すれば deduped、`null` なら新規通知。 |
| FR-2 | 新規通知時は `put(key, "1", { expirationTtl })` を書き込む。値は最小化。 |
| FR-3 | TTL は `dedupeTtlMs` を秒換算した `expirationTtl` を使用。Phase 2 で値方針を固定。 |
| FR-4 | KV binding 未設定環境（テスト等）でも本番ルートは fallback せず、Phase 2 で env 必須化を決定する。 |
| FR-5 | 既存の Slack 配信 retry / Block Kit 整形 / cf-webhook-auth 経路は無変更。 |

## 非機能要件

| NFR-ID | 要件 |
|--------|------|
| NFR-1 | KV write は per-request 高々 1 回（put のみ）。read も 1 回（get のみ）。 |
| NFR-2 | KV eventual consistency により 100% dedup は保証しない。in-memory 版より大幅改善することを目標値とする。 |
| NFR-3 | `pnpm typecheck` / `pnpm lint` / `pnpm --filter @repo/api test` を全 PASS。 |

## 変更対象ファイル一覧（CONST_005）

| パス | 種別 | 概要 |
|------|------|------|
| `apps/api/src/env.ts` | 編集 | `ALERT_DEDUP_KV: KVNamespace` を `Env` に追加 |
| `apps/api/src/routes/internal/alert-relay.ts` | 編集 | `seenAlerts` Map 削除、KV 経由 dedup へ置換、`AlertRelayEnv` に KV 型追加 |
| `apps/api/wrangler.toml` | 編集 | `[[env.staging.kv_namespaces]]` / `[[env.production.kv_namespaces]]` 追加 |
| `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | 編集 | KV stub inject、TTL 経過テスト追加 |
| `apps/api/test/helpers/kv-stub.ts`（新規） | 新規 | Miniflare 互換 KV stub helper |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 編集 | 「KV namespace 健全性確認」項追記 |

## 関数シグネチャ（先取り）

```ts
// apps/api/src/routes/internal/alert-relay.ts
export interface AlertRelayEnv extends VerifyCfWebhookAuthEnv {
  readonly SLACK_WEBHOOK_URL?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
  readonly ALERT_DEDUP_KV: KVNamespace; // 追加（必須）
}

// test/helpers/kv-stub.ts
export interface KvStubEntry { readonly value: string; readonly expiresAt: number }
export function createKvStub(now: () => number): KVNamespace;
```

## 入力 / 出力 / 副作用

- 入力: Cloudflare Notifications webhook payload（既存）
- 出力: 既存と同じ JSON 応答（`{ ok, deduped? }` / `{ ok, attempts }` / `{ ok: false, ... }`）
- 副作用: KV `get` / `put`（per request 各 1 回）。Slack 配信は既存。

## 受入条件

- [ ] `alert-relay.ts` に `seenAlerts` Map が残っていない
- [ ] `c.env.ALERT_DEDUP_KV` を経由した dedup 判定が機能する
- [ ] KV TTL 経過後の再受信が deduped 解除される
- [ ] 既存テストケース構造（既存 PASS 件数）を維持しつつ、KV stub ベースのテストで PASS
- [ ] `wrangler.toml` の `[[env.{staging,production}.kv_namespaces]]` に実 namespace_id が記載されている

## 成果物

`outputs/phase-01/requirements.md`（本 Phase の確定要件記録）

## 完了条件

- 上記受入条件をすべて含む `requirements.md` が出力されている
- Phase 2 で参照する変更対象ファイル一覧・関数シグネチャが固定されている
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 1
- status: completed

## 目的

Alert relay dedup KV migration の要件を確定する。

## 実行タスク

- 要件、制約、受入条件を確認する。

## 参照資料

- `index.md`
- `outputs/phase-01/requirements.md`

## 成果物/実行手順

- `outputs/phase-01/requirements.md`

## 完了条件

- [x] 要件が記録されている
- [x] NON_VISUAL 境界が記録されている

## 統合テスト連携

- focused route test は Phase 4 以降で扱う。
