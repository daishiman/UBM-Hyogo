# Phase 1 成果物: 要件定義

## 概要

`apps/api/src/routes/internal/alert-relay.ts` の Cloudflare KV (`ALERT_DEDUP_KV`) に対する `get` / `put` 操作失敗を、構造化 JSON ログ 1 行として `console.warn` 経由で emit し、後段 Workers Logs / logpush で `event` 別・`op` 別の集計（dedup スキップ率 / KV 一時障害頻度）を取得できる状態にする。既存 API 契約と fail-open / fail-closed 既存挙動は維持し、`KV.get` のみ「観測不能 fail-closed → 観測可能 fail-open」に転換する。

## 採用案サマリ

| 論点 | 採用案 | 理由 |
| --- | --- | --- |
| 1. `KV.get` の try/catch 化 | (B) try/catch + fail-open + 構造化ログ | サイレント 500 落下を排除し、重複配信は後段 dashboard で検出可能化 |
| 2. ログ emit 方式 | (A) `console.warn` で JSON 1 行 | 追加 binding 不要、logpush / grep 互換、コスト 0 |
| 3. `dedupeKey` PII / 容量対策 | (B) SHA-256 先頭 12 hex (48bit) | 衝突確率 ≪ 1e-9、容量・PII 双方を充足 |
| 4. `isolateId` 採番戦略 | (B) module top で `crypto.randomUUID()` 1 回 | 同一 isolate 内相関を維持しつつ isolate 単位の偏りを観測可能 |

## スコープ

### 含む

- module-local helper `logKvOperationError(op, err, dedupeKey)` 追加
- module top で `crypto.randomUUID()` による `isolateId` 1 回採番
- `dedupeKeyHash` (SHA-256 先頭 12 hex) 算出（catch path のみ）
- `KV.get` 呼び出しの try/catch 化と fail-open (`seen=null` として処理続行)
- `KV.put` 既存 catch の非構造化 `console.warn` を構造化 JSON 1 行に置換
- `alert-relay.spec.ts` への追加ケース (get throw / put throw / 成功時 emit 0 / payload shape / isolateId 一致)
- monthly runbook への「KV 操作エラーログ確認」セクション追記

### 含まない

- Cloudflare Dashboard / Analytics Engine 連携 (UT-17-FU-004)
- Workers Logpush 設定
- Slack / PagerDuty 自動通知ルート追加
- KV retry / 二重書き戦略の変更
- D1 / Durable Object への dedup ストア移行
- `wrangler.toml` / `apps/api/src/env.ts` 変更、secret 追加

## 既存資産インベントリ

| 資産 | 確認結果 | 参照 |
| --- | --- | --- |
| `KV.get` 呼び出し | try/catch 無し（fail-closed 状態） | `apps/api/src/routes/internal/alert-relay.ts:66` |
| `KV.put` 呼び出し | try/catch 有り。catch 内に非構造化 `console.warn` | `apps/api/src/routes/internal/alert-relay.ts:93-102` |
| `dedupeKey` 構築 | `metric:policyId:minuteBucket` 形式 | `apps/api/src/routes/internal/alert-relay.ts:59-63` |
| `AlertRelayEnv` interface | `ALERT_DEDUP_KV: KVNamespace` 定義済（既存流用） | `apps/api/src/routes/internal/alert-relay.ts:17-24` |
| `crypto.randomUUID()` / `crypto.subtle.digest` | Workers runtime 標準 API、polyfill 不要 | Cloudflare Workers Runtime APIs |
| 月次 runbook | 既存。「KV 操作エラーログ確認」未存在 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` |

## 4 条件評価

| 条件 | 判定 | 解消条件 |
| --- | --- | --- |
| 価値性 | PASS | — |
| 実現性 | PASS | Workers runtime 標準 API のみ |
| 整合性 | CONDITIONAL | `KV.get` fail-closed → fail-open 化を Phase 3 設計レビューで明示承認 |
| 運用性 | CONDITIONAL | AC-3 schema を Phase 2 で固定し、不変条件 7 (additive only) を恒常適用 |

## AC 承認

index.md の AC-1〜AC-10 を Phase 1 で正式承認する。具体化は次 Phase 以降:

- AC-1〜AC-3 → Phase 2 `log-schema.md` / `emit-points.md`
- AC-4 → Phase 2 `helper-design.md`
- AC-5 → Phase 2 `isolate-id-strategy.md`
- AC-6〜AC-7 → Phase 2 `emit-points.md` (既存挙動の不変性)
- AC-8 → Phase 7/9 コマンド evidence
- AC-9 → Phase 8 runbook 追記
- AC-10 → 不変条件 2 (`*.spec.ts` 縛り) で恒常担保

## 用語集

| 用語 | 意味 |
| --- | --- |
| isolateId | Workers isolate 1 つあたりに module top で 1 回採番される UUID。同一 isolate 内全 emit で共有 |
| dedupeKeyHash | `SHA-256(dedupeKey)` の先頭 12 hex chars。catch path 内でのみ算出 |
| fail-open | 副次機能（dedup）の失敗時に主機能（Slack 配信）を継続する設計方針 |
| 構造化ログ 1 行 | `JSON.stringify` で 1 行整形された確定 schema JSON。`event=alert_relay_kv_op_failed` discriminator 固定 |

## Phase 2 への申し送り事項

1. 採用案 (1B / 2A / 3B / 4B) を Phase 2 設計の前提として固定
2. CONDITIONAL 解消条件 2 件 (behaviour change 承認 / schema 不変条件 7 固定) を Phase 2 / Phase 3 で消化
3. 既存資産インベントリの行番号（L17-24 / L59-63 / L66 / L93-102）を Phase 2 設計内 before/after snippet 参照に転記
4. テスト helper の `vi.spyOn(console, 'warn')` leak 防止策（beforeEach clear / afterEach restore）を Phase 7 設計時の必須項目とする
