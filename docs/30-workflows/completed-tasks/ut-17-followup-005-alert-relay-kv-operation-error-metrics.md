# alert-relay KV 操作エラーの observability 計測 - タスク指示書

## メタ情報

```yaml
issue_number: 701
```

## メタ情報

| 項目         | 内容                                                            |
| ------------ | --------------------------------------------------------------- |
| タスクID     | ut-17-followup-005-alert-relay-kv-operation-error-metrics       |
| タスク名     | alert-relay KV 操作エラーの observability 計測                  |
| 分類         | 改善（運用観測）                                                |
| 対象機能     | `apps/api` `/internal/alert-relay` の KV dedup ログ／計測       |
| 優先度       | 低                                                              |
| 見積もり規模 | 小規模                                                          |
| ステータス   | consumed / transferred_to_workflow                              |
| 発見元       | ut-17-followup-002-alert-relay-dedup-kv-persistence             |
| 発見日       | 2026-05-14                                                      |
| 消費先       | `docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/` |
| 消費日       | 2026-05-16                                                      |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

ut-17-followup-002 で `apps/api/src/routes/internal/alert-relay.ts` の dedup ストアを Cloudflare KV namespace (`ALERT_DEDUP_KV`) に移行した。2026-05-16 の実装サイクルで、本タスクは canonical workflow `docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/` に移管され、`KV.get` fail-open 構造化ログ、`KV.put` 構造化ログ、fail-safe fallback、runbook 追記、focused tests と Phase 11/12 evidence まで実装済みである。残る runtime Workers Logs tail は user-gated。

KV は eventual consistency ベースで動作するため、一時障害・global replication 遅延・write rate limit 接近時に dedup の不整合（=Slack 重複配信）が増える可能性がある。発生検知が「Slack の重複通知を人間が気づく」しか経路がない現状を改善する必要がある。

### 1.2 問題点・課題

- KV `get` / `put` の失敗が、Cloudflare Workers Logs に普通の `console.error` として混じり、構造化検索ができない。
- 失敗回数のトレンド（dedup スキップ率）がダッシュボード化できない。
- alert-relay handler 内で例外が握り潰されていると、回復可能な KV 一時障害と恒久障害の切り分けがオペレーター側でできない。

### 1.3 放置した場合の影響

- KV 一時障害時の Slack 二重配信が発生しても、原因を「Cloudflare KV」「Workers」「Slack 側」のいずれかに切り分けるのに時間を要する。
- ut-17 monthly healthcheck runbook の SLO 化が進まず、「KV を入れたから安心」状態の根拠が示せない。
- 後続の UT-17-FU-006 dashboard / aggregation で `alert_relay_kv_op_failed` を参照するため、canonical workflow の log schema を正本として使う必要がある。

---

## 2. 何を達成するか（What）

### 2.1 目的

alert-relay の KV 操作（`get` / `put`）の失敗を **構造化ログ**として emit し、Workers Logs / 後段 logpush から `errorClass` 別に集計できる土台を提供する。これにより `dedupPersisted=false` の発生率を後続タスク (UT-17-FU-006) でダッシュボード化できる状態にする。

### 2.2 最終ゴール

- KV `get` / `put` 失敗時に `console.warn` 経由で固定 schema の構造化 JSON ログが emit される。
- 失敗種別は固定 event `alert_relay_kv_op_failed` と `op: "get" | "put"` で表し、最小限のコンテキスト（dedupe key の hash, errorClass, isolateId, timestamp）が含まれる。
- alert-relay の既存 `KV.put` 失敗時レスポンスは維持する。`KV.get` 失敗は、未保護 fail-closed から fail-open + structured log へ変更済み。
- 追加テストで「KV throw 時に該当ログが 1 回 emit される」「成功時には emit されない」ことを検証。

### 2.3 スコープ

#### 含むもの

- `apps/api/src/routes/internal/alert-relay.ts` への構造化ログ emit 追加
- ログ schema を 1 か所に集約（例: `logKvOperationError({...})` ヘルパ関数を同一ファイル top-level に定義）
- isolate を識別するための疑似 ID（module top で `crypto.randomUUID()` を一度だけ採番）
- 追加テストケース（`apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`）
- monthly healthcheck runbook (`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`) に「KV エラーログ確認手順」セクション追記

#### 含まないもの

- Cloudflare Dashboard / Analytics Engine への送信設定（UT-17-FU-006 領域）
- Workers Logpush 設定（別タスク）
- Slack / PagerDuty への自動通知ルート追加
- KV 失敗時の retry / 二重書き戦略の変更
- D1 / Durable Object への移行検討

### 2.4 成果物

- 更新版 `alert-relay.ts`（構造化ログ emit 追加）
- 更新版 alert-relay test（KV throw 時のログ assertion 追加）
- 更新版 runbook（KV エラーログ確認 + `wrangler tail` 例）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Node 24.15.0 / pnpm 10.33.2
- ut-17-followup-002 の KV 永続化実装がマージ済みであること
- Cloudflare CLI 操作はすべて `bash scripts/cf.sh` 経由（`wrangler` 直接実行禁止）

### 3.2 依存タスク

- ut-17-followup-002-alert-relay-dedup-kv-persistence（親 / 前提）

### 3.3 必要な知識

- Cloudflare Workers の `console.warn` / `console.error` が Workers Logs に到達する経路
- Workers では `process` / OS API が無く、`isolate.id` を直接取得する公式 API も無いこと
- 構造化ログ schema の最低限の安定化（後段 logpush との契約）
- `vitest` で `console.warn` を `vi.spyOn(console, 'warn')` で観測する手法

### 3.4 推奨アプローチ

1. **ログ schema を固定**: `{ event: "alert_relay_kv_op_failed", op: "get"|"put", errorClass: string, dedupeKeyHash: string, isolateId: string, ts: string }` を最小集合とする。`dedupeKey` 自体は PII ではないが、念のため短い hash（first 12 chars of `crypto.subtle.digest('SHA-256', key)`）にしてログ肥大化を防ぐ。
2. **isolateId 採番**: module top で `const isolateId = crypto.randomUUID();` を 1 回採番し、当該 isolate が再生成されるまで再利用する。Workers に `isolate.id` 公式 API がないため、これで「同一 isolate 内のログをまとめて見る」用途を満たす。
3. **emit 箇所**: 既存 `try { await env.ALERT_DEDUP_KV.get(...) } catch (err) { /* swallow */ }` の catch ブロックでヘルパを呼ぶ。put 側も同様。**catch を握り潰すパス自体は変えない**（fail-open 方針はそのまま、ログだけ追加）。ただし `get` で例外時は dedup 不整合の検出を見落とさないよう、`dedupPersisted=false` の意味と「fail-open するが警告ログを必ず出す」ポリシーを docstring に明記する。
4. **errorClass 抽出**: `err instanceof Error ? err.constructor.name : typeof err`。スタックトレースは出さない（Workers Logs 上限に当たりやすい）。
5. **テスト**: `vi.spyOn(console, 'warn')` で emit 回数と payload shape を検証。固定 sleep を入れない。

---

## 4. 実行手順

### Phase 構成

1. ログ schema 策定とヘルパ実装
2. alert-relay.ts への emit 追加
3. テストケース追加
4. runbook 追記と動作確認

### Phase 1: ログ schema 策定とヘルパ実装

#### 目的

後段 dashboard 化が容易な、安定した構造化ログ schema を確立する。

#### 手順

1. `alert-relay.ts` 同一ファイル top-level に `logKvOperationError(op, err, dedupeKey)` を定義
2. `isolateId` を module top で `crypto.randomUUID()` で採番
3. `dedupeKeyHash` は `crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))` の first 12 hex chars
4. `console.warn(JSON.stringify({ event, op, errorClass, dedupeKeyHash, isolateId, ts }))` で emit

#### 完了条件

- schema の field 名が全て snake_case でない（Workers Logs filter での grep 互換のため）
- ヘルパは alert-relay.ts 外部から import されない（モジュール内 private）

### Phase 2: alert-relay.ts への emit 追加

#### 目的

KV `get` / `put` 失敗を漏れなくログ化する。

#### 手順

1. `env.ALERT_DEDUP_KV.get(...)` の catch で `logKvOperationError('get', err, dedupeKey)` 呼び出し
2. `env.ALERT_DEDUP_KV.put(...)` の catch で `logKvOperationError('put', err, dedupeKey)` 呼び出し
3. 既存の fail-closed / fail-open 挙動は変えない（put 失敗時は `dedupPersisted=false` のまま継続）
4. `get` 失敗時は **fail-open 継続（Slack 配信は止めない）**だが、ログを必ず emit して見落とし防止

#### 完了条件

- `mise exec -- pnpm typecheck` PASS
- 既存 alert-relay test が全 PASS（emit 追加分以外の behaviour change なし）

### Phase 3: テストケース追加

#### 目的

ログ emit の正しさを CI で担保する。

#### 手順

1. KV stub の `get` を `vi.fn().mockRejectedValueOnce(new Error('boom'))` にして 1 回投入
2. `vi.spyOn(console, 'warn')` で emit を観測
3. JSON parse 後の payload が `{ event: "alert_relay_kv_op_failed", op: "get", errorClass: "Error" }` を含むことを assert
4. 成功パスでは `console.warn` が呼ばれていないことも assert（false positive 防止）

#### 完了条件

- `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay` PASS
- 追加ケースが flaky でない（fake timers / 固定 sleep 不要設計であること）

### Phase 4: runbook 追記と動作確認

#### 目的

オペレーターが KV エラーを発見・対応できる手順を残す。

#### 手順

1. `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` に「KV 操作エラーログの確認」セクションを追加
2. `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty | grep alert_relay_kv_op_failed` 例を記載
3. しきい値（例: 直近1時間で 10 件超なら調査開始）を runbook に記す
4. staging で KV を意図的に存在しない namespace に差し替えて 1 件 emit させ、ログ到達を確認

#### 完了条件

- runbook 反映、staging 実機ログ取得済み
- production wrangler.toml は変更しない

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] KV `get` 失敗時に `console.warn` で構造化ログが 1 回 emit される
- [ ] KV `put` 失敗時に `console.warn` で構造化ログが 1 回 emit される
- [ ] 成功パスではログが emit されない
- [ ] 既存 fail-open / fail-closed 挙動が変更されていない

### 品質要件

- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay` PASS

### ドキュメント要件

- [ ] monthly healthcheck runbook に KV エラーログ確認手順が追記されている
- [ ] ログ schema の field 名・型が runbook に明記されている

---

## 6. 苦戦箇所メモ（再発防止）

### 6.1 Workers では isolate.id を取得できない

- Cloudflare Workers には `isolate.id` を返す公式 API が無い。`process.pid` 相当も使えない。
- 「同一 isolate 内のログをまとめて見る」用途には、**module top で `crypto.randomUUID()` を 1 回採番**し isolate ライフサイクル中は再利用する代替案で十分。
- isolate が再生成されると別 UUID になるため、結果として「isolate ライフサイクルの代理識別子」として機能する。完全な isolate 識別ではない点を runbook に明記すること。

### 6.2 構造化ログを `console.warn` で出す妥当性

- Workers Logs は `console.warn` / `console.error` を構造化検索しやすくはない（プレーンテキスト混在）。
- それでも `JSON.stringify({ event: "alert_relay_kv_op_failed", ... })` で 1 行 JSON にしておけば、後段 logpush 設定（UT-17-FU-006 で計画）から filter / dashboard 化が可能になる。
- スタックトレースを含めると Workers Logs の 1 行上限に当たりやすい。`errorClass` のみで切り上げる。

### 6.3 `try/catch` で例外を握り潰す危険性

- 「KV 失敗時は fail-open（Slack 配信を止めない）」方針自体は妥当だが、**ログを必ず emit する**運用を伴わないと dedup 不整合を永久に見落とす。
- 本タスクは behaviour change ではなく「観測可能性の追加」が本質。catch 内で `console.warn` を必ず通すこと。
- 一方で **KV `get` 失敗時に fail-closed (500 系) にする選択肢は取らない**。`get` 失敗で Slack を止めるとアラート遅延の方が運用インパクトが大きいため、fail-open + 警告ログのままにする。

### 6.4 dedupeKey の PII 性とログ肥大化

- dedupeKey 自体は `(metric, policy_id, minuteBucket)` の join であり PII ではないが、ログ全行に raw key を入れると Workers Logs 容量を圧迫する。
- `SHA-256` first 12 hex chars に短縮すれば衝突確率は実用上無視できる範囲で、容量も最小化できる。
- 後段 dashboard 化時に「key 別の失敗率」を見たくなった場合のために、hash の同一性は維持される（同じ key は同じ hash になる）。

### 6.5 test での `console.warn` spy の落とし穴

- `vi.spyOn(console, 'warn')` は test 間で leak しやすい。`beforeEach` で `vi.clearAllMocks()` を呼ぶ or `vi.restoreAllMocks()` を `afterEach` で必ず実行する。
- 既存 alert-relay test が `console.warn` を別目的で監視している場合は、spy の競合に注意。

---

## 7. 参照情報

### 関連実装

- `apps/api/src/routes/internal/alert-relay.ts`（emit 追加対象）
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`（test 追加対象）
- `apps/api/src/env.ts`（`ALERT_DEDUP_KV` binding 型・変更なし）
- `apps/api/wrangler.toml`（変更なし）

### 関連ドキュメント

- `docs/30-workflows/unassigned-task/ut-17-followup-002-alert-relay-dedup-kv-persistence.md`（親）
- `docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/outputs/phase-12/unassigned-task-detection.md`（発見元）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（追記先）

### 関連 issue / task

- ut-17-followup-002-alert-relay-dedup-kv-persistence（親）
- ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring（後続・本タスクのログを利用する）
