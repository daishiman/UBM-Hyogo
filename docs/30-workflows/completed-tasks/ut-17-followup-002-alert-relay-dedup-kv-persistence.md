# Alert relay dedup を KV namespace で永続化 - タスク指示書

## メタ情報

```yaml
issue_number: 634
```

## メタ情報

| 項目         | 内容                                                            |
| ------------ | --------------------------------------------------------------- |
| タスクID     | ut-17-followup-002-alert-relay-dedup-kv-persistence             |
| タスク名     | alert-relay dedup を in-memory Map から Cloudflare KV へ移行     |
| 分類         | 改善（信頼性）                                                  |
| 対象機能     | `apps/api` `/internal/alert-relay` の dedup 処理                |
| 優先度       | 低                                                              |
| 見積もり規模 | 小規模                                                          |
| ステータス   | transferred_to_workflow（`docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/` で仕様化済み。実装・外部操作は user-gated） |
| 発見元       | ut-17-cloudflare-analytics-alerts                               |
| 発見日       | 2026-05-09                                                      |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-17 で実装した `apps/api/src/routes/internal/alert-relay.ts` は、Cloudflare Notifications generic webhook を受信し Slack へ転送する。多重通知を避けるため `(metric, policy_id, minuteBucket)` を key とする dedup を行うが、現状の保持先は `Map<string, number>` の **isolate ローカル in-memory** である。

Cloudflare Workers の isolate は、リクエストパターン・cold start・rolling deploy・region 切替などの外的要因で破棄/再生成され、寿命は SLA で保証されない。「N分以内なら必ず同一 isolate に当たる」という前提は成り立たない。

### 1.2 問題点・課題

- 同一アラートが、isolate が再生成された直後に再到達すると dedup window を素通りする。
- dedup TTL（5分）を意図して設定しても、isolate 跨ぎで実効 TTL が 0 まで縮退する瞬間がある。
- in-memory Map は instance 数だけ独立して持たれるため、Cloudflare 側で複数 isolate に分散ルーティングされると最初から共有されない。

### 1.3 放置した場合の影響

- Cloudflare Notifications が retry を 1〜2 分間隔で複数回送ってきた場合、isolate 切替に当たると Slack に同一アラートが二重通知される。
- 重複通知はオペレーターのアラート疲労を招き、UT-17 で導入した monthly healthcheck runbook の「ノイズの可視化」効果が損なわれる。
- 上位の usage 急増アラートと dedup 抜け重複が混じると、本物のインシデントの優先度判断を遅らせる。

---

## 2. 何を達成するか（What）

### 2.1 目的

Cloudflare KV namespace を dedup ストアにして、isolate 跨ぎでも同一 (metric, policy_id, minuteBucket) のアラートが TTL 内では Slack に1回しか配信されない状態にする。

### 2.2 最終ゴール

- alert-relay の dedup 判定が KV 経由で機能する。
- 既存の Slack Block Kit 整形・retry・runbook 連携などは無変更。
- 既存テスト構造（27/33 ケース）を維持しつつ、KV mock を用いた追加ケースが PASS する。

### 2.3 スコープ

#### 含むもの

- `apps/api/src/env.ts` に KV binding 追加（例: `ALERT_DEDUP_KV`）
- `apps/api/wrangler.toml` の `[[kv_namespaces]]` 追加（staging / production 両 env）
- `alert-relay.ts` の dedup 処理を KV `get` / `put` の async 呼び出しに置換
- Miniflare KV mock を用いた test fixture 追加と既存 test 修正

#### 含まないもの

- Slack 配信 retry / Block Kit 整形ロジックの変更
- `cf-webhook-auth` 認証経路の変更
- 新たな Notification policy 追加

### 2.4 成果物

- 更新版 `alert-relay.ts`（KV 経由 dedup）
- 更新版 `apps/api/src/env.ts`（KV binding 型）
- 更新版 `apps/api/wrangler.toml`（namespace_id プレースホルダ含む）
- 更新版 test ファイル群（既存 27/33 ケース構造維持 + KV ケース）
- KV namespace 作成手順を記した short note（`scripts/cf.sh` 経由のみ）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Node 24.15.0 / pnpm 10.33.2
- Cloudflare CLI 操作はすべて `bash scripts/cf.sh` 経由（`wrangler` 直接実行禁止）
- `apps/api` 配下の既存ルーティング・middleware を破壊しない

### 3.2 依存タスク

- ut-17-cloudflare-analytics-alerts（親）

### 3.3 必要な知識

- Cloudflare KV の TTL（`expirationTtl` 秒指定）
- KV の eventual consistency 特性（write-after-read で stale を返しうる）
- Miniflare の KV namespace stub（test 用）
- Hono `c.env` を介した binding アクセス

### 3.4 推奨アプローチ

1. KV namespace を `bash scripts/cf.sh` で staging / production それぞれ作成し、`namespace_id` を `wrangler.toml` に記載。
2. dedup 判定は `await env.ALERT_DEDUP_KV.get(dedupeKey)` → 存在すれば deduped、無ければ `put(dedupeKey, "1", { expirationTtl: 300 })` で書く。値は最小化（"1" のみ、metadata は使わない）してコストを抑える。
3. KV eventual consistency による race を完全には消せないため、「同一リクエスト内での read→put 二重実行」を許容する。Slack 二重配信の可能性は in-memory 版より大幅に減るが 0 ではない点を docstring に明記。
4. test は Miniflare の KV stub を組み立てて inject する。固定 sleep を入れない（flaky 化の温床）。`vi.useFakeTimers` で時間進行を制御し、`expirationTtl` 経過は KV stub 側で simulate する。

---

## 4. 実行手順

### Phase 構成

1. KV namespace 作成と wrangler 反映
2. env 型と dedup 実装の置換
3. test の KV stub 化と既存ケース整合
4. 動作確認と note 追記

### Phase 1: KV namespace 作成と wrangler 反映

#### 目的

isolate 跨ぎ dedup の格納先を確保する。

#### 手順

1. `bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env staging`
2. `bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env production`
3. 出力された `id` を `apps/api/wrangler.toml` の `[[env.staging.kv_namespaces]]` / `[[env.production.kv_namespaces]]` に記載

#### 完了条件

両 env で namespace が `kv:namespace list` に存在する

### Phase 2: env 型と dedup 実装の置換

#### 目的

KV 経由 dedup に切り替える。

#### 手順

1. `apps/api/src/env.ts` の `Env` に `ALERT_DEDUP_KV: KVNamespace` を追加
2. `alert-relay.ts` の `seenAlerts` Map を削除し、`c.env.ALERT_DEDUP_KV` 経由 `get` / `put` に置換
3. `expirationTtl` を `Math.ceil(dedupeTtlMs / 1000)` に統一

#### 完了条件

`pnpm typecheck` PASS、KV binding を読まない経路は残らない

### Phase 3: test の KV stub 化と既存ケース整合

#### 目的

既存 27/33 ケース構造を維持しつつ KV 動作を検証する。

#### 手順

1. test 用に `createKvStub()` を作成（`Map` ベース、`expirationTtl` を simulate）
2. 既存テストの `c.env` 構築箇所に `ALERT_DEDUP_KV: kvStub` を inject
3. `vi.useFakeTimers()` で TTL 経過 → 再受信で deduped 解除、を 1 ケース追加
4. 固定 sleep / `setTimeout(..., realDelay)` を入れない

#### 完了条件

`pnpm --filter @repo/api test` PASS、追加ケース含め全 PASS

### Phase 4: 動作確認と note 追記

#### 目的

復旧 / 移行手順を残す。

#### 手順

1. staging 環境で擬似 webhook を 2 回連続送信し Slack 1 回のみ届くことを確認
2. `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` に「KV namespace 健全性確認」項を追記
3. `wrangler.toml` の namespace_id は GitHub Variables ではなく wrangler 直書きで OK（非機密）

#### 完了条件

runbook 反映 + staging 実機確認ログ取得

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] alert-relay が KV 経由で dedup 判定する
- [ ] TTL 経過後は再配信される
- [ ] in-memory Map を残していない

### 品質要件

- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `mise exec -- pnpm --filter @repo/api test` PASS（既存ケース構造維持）

### ドキュメント要件

- [ ] runbook に KV 健全性確認項目を追記
- [ ] wrangler.toml に staging / production 両方の namespace_id を記載

---

## 6. 苦戦箇所メモ（再発防止）

> このセクションは UT-17 本体実装で実際に踏んだ / 踏みかけた地雷を、後続作業者の事前知識として明文化する。

### 6.1 Workers isolate のライフサイクルは制御不能

- 「直近 N 分以内なら同一 isolate にヒットする」という保証は Cloudflare からは出ていない。rolling deploy / region 切替 / 低トラフィック時の cold start / health check 失敗での破棄など、外部要因で isolate は容赦なく入れ替わる。
- そのため `Map<string, number>` での dedup は「ベストエフォートの最初の壁」にしかならず、SLO 化はできない。**KV / Durable Objects / D1 のいずれかに永続化しない限り、isolate 跨ぎ dedup は構造的に成立しない**。
- 今回 KV を選ぶ理由は「数百ms の eventual consistency を許容できる」「TTL ネイティブ」「コストが極小」の三点。Durable Object はオーバーキル、D1 は write レイテンシが KV より高い。

### 6.2 KV の eventual consistency と write-after-read race

- KV は global replication を eventual consistency で行うため、`put` 直後の `get` が **同じリクエスト内であっても古い値（=未存在）を返す** ことがある。
- 「KV にすれば 100% dedup できる」という誤った期待を持たないこと。in-memory に比べて抜け率は劇的に下がるが、0 にはならない。
- 同時刻に 2 つの isolate が同じ key を `get`（両方 miss）→ 両方 `put`（成功）→ 両方 Slack 送信、というレースは発生しうる。実用上は問題にならない頻度だが、設計上の前提として docstring と runbook に明記する。
- もし真に exactly-once 保証が要るなら Durable Object か D1 unique constraint に切り替えるしかない（このタスクのスコープ外）。

### 6.3 KV 書き込みコストと value 設計

- KV は write が read より高価（list price）。dedup のように高頻度 key を書く用途では、value を最小化することが重要。
- value は `"1"` の 1 byte 文字列で十分。`metadata` 機能は今回は使わない（読み出しコスト増・複雑化）。
- TTL は `expirationTtl` を秒単位で渡す。`dedupeTtlMs / 1000` を `Math.ceil` で繰り上げ、TTL 0 を絶対に渡さない（KV が即時削除しない最低秒数があるため、短すぎ TTL は意味がない）。
- key は `(metric, policy_id, minuteBucket)` の join のままで OK。長さ最大 512 byte 制限内に収まることを assert で守る。

### 6.4 test での KV モック戦略と flaky 回避

- `vitest` 単体では KV namespace は再現できないため、**`createKvStub()` を自作する**か Miniflare の KVNamespace stub を使う。本リポジトリは vitest 直叩きが主なので、`Map` ベースの自作 stub が最小コスト。
- TTL の経過を表現するために `setTimeout` の実時間 sleep を入れると CI で 100% flaky 化する。**`vi.useFakeTimers()` + `vi.advanceTimersByTime()`** で論理時間を進める。stub 側も「現在の `Date.now()` と書き込み時刻 + ttl を比較して expired を返す」設計にして、fake timers と整合させる。
- 既存 27/33 ケースは `seenAlerts` Map を直接読まない構造で書かれているため、env への `ALERT_DEDUP_KV` inject 追加だけで大半が無変更で通るはず。通らないケースは「dedup の挙動を assert している test」だけで、そこは KV stub 経由の挙動に書き直す。

---

## 7. 参照情報

## 8. 後継 workflow

この未タスクは `docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/` に昇格済み。今後は後継 workflow の Phase 1-13、root / `outputs/artifacts.json`、Phase 12 strict 7 outputs を正本として扱う。

### 関連実装

- `apps/api/src/routes/internal/alert-relay.ts`（dedup 処理の現状実装）
- `apps/api/src/lib/__tests__/`（既存 alert-relay 系テスト）
- `apps/api/src/env.ts`（binding 型）
- `apps/api/wrangler.toml`（KV namespace 追記先）

### 関連ドキュメント

- `docs/30-workflows/unassigned-task/UT-17-cloudflare-analytics-alerts.md`
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
- `docs/30-workflows/runbooks/ut-17-cloudflare-usage-alert-response.md`

### 関連 issue / task

- ut-17-cloudflare-analytics-alerts（親 unassigned task）
