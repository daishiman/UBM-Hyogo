# Patterns — Cloudflare KV Dedup Persistence

Cloudflare Workers (`apps/api`) で「外部通知の重複抑制状態」を KV に永続化する際の再利用パターン集。UT-17 follow-up 002 (`docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/`) の実装から抽出。

> KV は eventually consistent（伝播 < 60s 程度）であるため、本パターンは **practical reduction** を提供し、**exactly-once guarantee は提供しない**。Slack / mail / Discord 等の重複通知を実用的に大幅低減することが目的。

---

## 1. Env binding narrowing（必須 binding 追加時の型 contravariance 回避）

### 問題
`Env` interface に必須 `ALERT_DEDUP_KV: KVNamespace` 等を追加すると、`(env: Env) => X` を受ける既存 helper が contravariance により従来の狭い env で呼べなくなる。

### パターン
- 追加 binding を使わない helper は signature を `Pick<Env, "USED_KEYS_ONLY">` または最小 interface へ narrow し直す。
- 追加 binding を使う helper だけ full `Env` を受ける。
- 同一 commit で全 narrowing を完結させ、typecheck PASS を維持する。

### 参照
- `apps/api/src/env.ts` — `Env` 定義
- `apps/api/src/index.ts` — `buildFormsClient` 呼び出しの env narrowing
- `lessons-learned/lessons-learned-ut-17-followup-002-alert-relay-dedup-kv-2026-05.md` § 1

---

## 2. KV stub fixture（focused test 用）

### 問題
本物の `KVNamespace.put({ expirationTtl })` を実時間で検証すると最短数秒の sleep が必要で、CI が flaky になる。

### パターン
- `apps/api/test/helpers/kv-stub.ts` で `createKvStub()` を提供:
  - return shape: `{ kv: KVNamespace, puts: Array<PutCall>, store: Map<string, StoredValue> }`
  - `kv.get` / `kv.put` / `kv.delete` を Map 上で実装、`put` 呼び出しは `puts` 配列に push して順序検証可能にする。
- TTL は `vi.useFakeTimers()` + `vi.advanceTimersByTime(ttlMs)` で論理時間進行。
- `puts` への push 順を assert することで「Slack 成功後にだけ put された」ことを検証。

### 参照
- `apps/api/test/helpers/kv-stub.ts`
- `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`
- `lessons-learned/lessons-learned-ut-17-followup-002-alert-relay-dedup-kv-2026-05.md` § 2

---

## 3. Persistence ordering — 外部 call 成功後にのみ put

### 問題
受信直後に `KV.put(key, ...)` すると、外部通知（Slack 等）の失敗後 Cloudflare retry が dedup hit で握り潰され、silent failure に陥る。

### パターン
- alert 受信 → KV `get(key)` で重複判定 → 既存 hit なら早期 return（or fallback log only）。
- 重複でなければ **外部 call を試行**（Slack `POST hooks.slack.com/...`）。
- 外部 call が HTTP 2xx を返した場合**のみ** `ALERT_DEDUP_KV.put(key, value, { expirationTtl })` を呼ぶ。
- 外部 call が失敗した場合、KV には書かず、Cloudflare retry / 上位 retry path が再試行できる状態を維持する。

### 参照
- `apps/api/src/routes/internal/alert-relay.ts`
- `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`（Slack 失敗後 retry が再 POST する回帰ケースを含む）
- `lessons-learned/lessons-learned-ut-17-followup-002-alert-relay-dedup-kv-2026-05.md` § 4

---

## 4. `wrangler.toml` binding gating

### 問題
KV namespace id は user が `wrangler kv:namespace create` を実行して初めて発行される。placeholder の active binding を commit すると `wrangler deploy` が invalid binding error で fail する。

### パターン
- `wrangler.toml` の staging / production env 双方に **コメントアウトした `[[kv_namespaces]]` block** を配置:
  ```toml
  # TODO: uncomment after user-gated namespace creation
  # [[env.staging.kv_namespaces]]
  # binding = "ALERT_DEDUP_KV"
  # id = "<staging-namespace-id>"
  ```
- user が以下を順に実施したらコメント解除:
  1. `bash scripts/cf.sh kv:namespace create ALERT_DEDUP_KV --env staging`
  2. 返却された id を `wrangler.toml` に貼り付け、当該 block をコメント解除
  3. production も同様
  4. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`
- AI エージェントは絶対に commented block をコメント解除せず、placeholder id も埋めない（user-gated）。

### 参照
- `apps/api/wrangler.toml`
- `lessons-learned/lessons-learned-ut-17-followup-002-alert-relay-dedup-kv-2026-05.md` § 3
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` § KV healthcheck

---

## 5. Wording 規律 — practical reduction を使う

### 問題
"exactly-once" / "guarantee" / "strict dedup" 等の表現は KV の eventual consistency 性質と矛盾し、user の誤期待を生む。

### パターン
- 許容語彙: `practical reduction` / `eventual` / `best-effort` / `重複通知を実用的に大幅低減`
- 禁止語彙: `exactly-once` / `guarantee` / `strict dedup`
- spec / runbook / artifact inventory / quick-reference / task-workflow-active を **同一 wave** で更新し、grep で禁止語彙の残留がないことを確認。

### 参照
- `docs/30-workflows/ut-17-followup-002-alert-relay-dedup-kv/outputs/phase-12/system-spec-update-summary.md`
- `references/workflow-ut-17-followup-002-alert-relay-dedup-kv-artifact-inventory.md`
- `lessons-learned/lessons-learned-ut-17-followup-002-alert-relay-dedup-kv-2026-05.md` § 5

---

## 適用範囲

このパターン集は以下のような後続タスクに再利用できる:

- mail / Discord / Push 通知の dedup を KV 永続化したい場合
- D1 / R2 / Durable Object など、他の必須 binding を `Env` に追加する場合の型 narrowing 起点
- 外部 API 呼び出し成否に依存する状態を KV / Cache API に persist する一般パターン

新規 binding を追加する PR では本ファイル 5 セクションを review checklist として参照すること。

---

## 6. KV usage monitoring policy（ALERT_DEDUP_KV 後続監視）

### 問題
`ALERT_DEDUP_KV` の usage / error / storage を Cloudflare Notification policy で監視したい場合、Cloudflare native alert が namespace 単位・metric 単位で露出しているかが account / plan / API 仕様に依存する。旧 Dashboard-only 前提のまま進めると、followup-004 で確立した `infra/cloudflare-alerts/` IaC 経路と矛盾する。

### パターン
- まず `GET /accounts/{account_id}/alerting/v3/available-alerts` 相当の read-only evidence で、native alert type と namespace filter 可否を記録する。
- usage / storage は native alert + namespace filter が確認できた場合のみ `infra/cloudflare-alerts/policies/workers-kv-*.json` へ namespace-specific policy 化する。namespace filter が無い場合は、account に対象 KV namespace しかないことを確認したうえで Workers KV account quota guard と明記する。
- latency は native Notification に出ない場合、policy 化せず Workers Analytics / GraphQL review 項目として runbook に固定する。
- 初期 policy は `enabled:false` で IaC 化し、Slack delivery smoke は一時低閾値 policy または短時間負荷で証明する。
- 5 営業日 baseline 後の `enabled:true` 本運用切替は user-gated 別 wave とし、短時間 smoke の baseline を本運用閾値根拠として誤用しない。

### 参照
- `docs/30-workflows/ut-17-followup-006-alert-dedup-kv-usage-dashboard-monitoring/`
- `infra/cloudflare-alerts/`
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
