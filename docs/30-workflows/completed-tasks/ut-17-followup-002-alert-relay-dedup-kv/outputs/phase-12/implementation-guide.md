# 実装ガイド — ut-17-followup-002-alert-relay-dedup-kv

## Part 1: 中学生にもわかる例え話

### なぜ必要か

なぜ必要か: 同じアラートが何度も Slack に届くと、重要な異常を見落としやすくなるためです。

同じアラートが何度も Slack に届くと、重要な異常を見落としやすくなる。これまでは「もう送った」という記録を Workers の一時的なメモリに置いていたため、別の isolate で処理されると記録が見えなくなることがあった。

たとえば、学校の連絡係を想像してください。あなたは友達 5 人に「明日の集合場所」という同じ連絡を伝える役です。同じ人に二度言うとうるさいから、伝え終わった人の名前を**メモ帳**に書いておきます。

ところがこのメモ帳は、あなたの**机の上にしか置けない**ルールがあります。休憩から戻ったとき、別の席に座ってしまうと、メモ帳は前の机に置きっぱなしです。新しい机では「誰に伝えたか」分からないので、もう一度同じ連絡をしてしまいます。

Cloudflare Workers（クラウド上のプログラム）でも同じことが起きていました。プログラムが動く「机」（isolate と呼びます）が切り替わると、メモ帳（in-memory の `Map`）が消えて、Slack に同じアラートが二回届いてしまう問題があったのです。

このタスクでは、メモ帳を**みんなが共通で見られる共有ホワイトボード**（Cloudflare KV namespace）に置き換えます。どの机に座っても同じホワイトボードを見るので、「もう伝えた」可能性が大きく上がります。5 分経つとホワイトボードの文字は自動で消える（TTL）ので、新しい知らせは正しく届きます。

### 今回作ったもの

何をしたか: Slack 配信に成功したアラートだけを共有ホワイトボードへ記録するようにしました。

- Slack へ正常配信できた alert だけを Cloudflare KV に記録する処理
- KV の `get` / `put` をテストできる `createKvStub`
- Slack 失敗後 retry が dedup で握りつぶされない回帰テスト
- 実 namespace id 取得まではコメント化された `wrangler.toml` binding template

## Part 2: 技術者向け実装解説

### 変更前の問題

```ts
const seenAlerts = new Map<string, number>();  // ← isolate ローカル
```

Cloudflare Workers の isolate は cold start / rolling deploy / 複数 isolate 分散により跨ぎ無効化される。Cloudflare Notifications の retry が発生したとき、別 isolate がリクエストを受けると dedup window が実効 0 まで縮退し、Slack に二重通知が発生しうる。

### 変更後のアーキテクチャ

| 部位 | 所有 | 役割 |
|------|------|------|
| dedup state | Cloudflare KV namespace `ALERT_DEDUP_KV` | isolate 跨ぎ永続化 |
| TTL | KV の `expirationTtl` | 自動失効（既定 300 秒） |
| dedup key 生成 | `apps/api/src/routes/internal/alert-relay.ts` | `{metric}:{policy_id}:{minuteBucket}` |
| Slack 配信 | 既存 `sendSlackMessage`（無変更） | Block Kit 整形 / retry |

### インターフェース定義

```ts
// apps/api/src/env.ts
export interface Env extends SyncEnv, ResponseSyncEnv {
  // ...existing
  readonly ALERT_DEDUP_KV: KVNamespace;  // 必須プロパティ
}

// apps/api/src/routes/internal/alert-relay.ts
export interface AlertRelayEnv extends VerifyCfWebhookAuthEnv {
  readonly SLACK_WEBHOOK_URL?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
  readonly ALERT_DEDUP_KV: KVNamespace;
}
```

### APIシグネチャ

```ts
export function createAlertRelayRoute(
  deps: AlertRelayDeps = {},
): Hono<{ Bindings: AlertRelayEnv }>;
```

### CLIシグネチャ

```bash
bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env staging
bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env production
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

### 使用例

```bash
pnpm exec vitest run apps/api/src/routes/internal/__tests__/alert-relay.test.ts
```

### Handler 内 dedup フロー

```ts
const dedupeKey = [
  classifyAlertMetric(payload),
  payload.policy_id ?? payload.name ?? payload.alert_type ?? "unknown",
  String(minuteBucket),
].join(":");

const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}

const result = await sendSlackMessage(webhookUrl, message, sendOptions);
if (!result.ok) {
  return c.json({ ok: false, attempts: result.attempts, status: result.status }, 502);
}

await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
  expirationTtl: Math.ceil(dedupeTtlMs / 1000),
});
```

- value は `"1"` 固定（最小化、cost / 転送量削減）
- metadata 不使用
- per-request 内では `get → put` 直列。複数 isolate からの並行は KV eventual consistency に依存しベストエフォート

### 設定可能パラメータ

| パラメータ | 既定 | 意味 |
|-----------|------|------|
| `deps.dedupeTtlMs` | `5 * 60 * 1000` | dedup window（ミリ秒） |
| `KV expirationTtl` | `Math.ceil(dedupeTtlMs / 1000)` | KV 側 TTL（秒） |

### wrangler.toml（user-gated step で実 ID 反映）

```toml
# namespace 作成後、実 id だけを使ってコメント解除する。
# placeholder id を active TOML に残さない。
# [[env.staging.kv_namespaces]]
# binding = "ALERT_DEDUP_KV"
# id = "<staging_namespace_id>"

# [[env.production.kv_namespaces]]
# binding = "ALERT_DEDUP_KV"
# id = "<production_namespace_id>"
```

### エラーハンドリング

| ケース | 挙動 |
|--------|------|
| `KV.get` throw（KV 障害） | エラー伝播 → Hono が 500 系応答。Slack 配信せず。Cloudflare Notifications は retry |
| `KV.put` throw | Slack 配信成功後は `{ ok: true, dedupPersisted: false }`。未配信を dedup 済みにしないことを優先 |
| 同一リクエスト内 race | per-request `get → put` 直列 |
| TTL 境界 | TTL 超過後の `get` は `null`（TC-KV-01 で実測） |
| binding 未設定 / placeholder id | TypeScript では検出不可。active TOML に placeholder を置かず、user-gated namespace 作成後の実 id 反映と staging smoke で検出 |

### エッジケース

- Slack 配信失敗後の同一 alert retry は dedup しない。KV `put` は Slack 成功後だけ実行する。
- KV `get` failure は fail-closed とし、Slack 配信前に 500 系へ倒す。
- KV `put` failure は Slack 配信済みを優先し、`dedupPersisted=false` で返す。
- KV eventual consistency のため完全な exactly-once は主張しない。

### 設定項目と定数一覧

| 項目 | 値 |
|------|----|
| Binding | `ALERT_DEDUP_KV` |
| Default TTL | `5 * 60 * 1000` ms |
| KV expiration | `Math.ceil(dedupeTtlMs / 1000)` seconds |
| KV value | `"1"` |

### テスト構成

| ファイル | 役割 |
|----------|------|
| `apps/api/src/routes/internal/__tests__/alert-relay.test.ts` | focused route tests（21 cases） |
| `apps/api/test/helpers/kv-stub.ts` | KV get/put/TTL/error stub |
| `outputs/phase-11/evidence/api-test.txt` | focused test evidence |

### 視覚証跡

UI/UX 変更なし。Phase 11 スクリーンショット不要。主要証跡は `outputs/phase-11/manual-test-result.md` および `outputs/phase-11/evidence/{typecheck,lint,api-test}.txt`。

### 副次変更（KV 必須化に伴う型整合）

`Env.ALERT_DEDUP_KV` 必須化により、`buildFormsClient(env: Env)` を `AdminResponsesSyncEnv` slot に渡せなくなるため、`apps/api/src/index.ts` に narrow env 型 `FormsClientEnv extends ResponseSyncEnv` を導入。Forms クライアント生成に必要な fields のみを公開。

### 関連変更ファイル

- `apps/api/src/env.ts`
- `apps/api/src/routes/internal/alert-relay.ts`
- `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`
- `apps/api/test/helpers/kv-stub.ts`（新規）
- `apps/api/wrangler.toml`
- `apps/api/src/index.ts`
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

### user-gated runtime ops（本サイクル対象外）

1. `bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env staging`
2. `bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env production`
3. 出力 id を `wrangler.toml` のコメント化済み block に反映し、コメント解除する
4. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
5. 擬似 webhook 2 連送で deduped 動作と Slack 1 通到達を確認
6. production deploy / 月次 runbook 反映
