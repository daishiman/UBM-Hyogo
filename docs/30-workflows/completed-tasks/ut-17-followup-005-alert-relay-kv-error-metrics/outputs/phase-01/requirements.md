# Phase 1 成果物: 要件定義

## 1. タスク概要

UT-17-FU-005 は `apps/api/src/routes/internal/alert-relay.ts` の Cloudflare KV `get` / `put` 操作失敗を構造化 JSON ログとして `console.warn` 経由で emit し、Workers Logs / 後段 logpush から `errorClass` 別に集計可能な土台を提供するタスクである。

親タスク UT-17-FU-002（`ALERT_DEDUP_KV` 永続化）の上に積み上がる観測タスクで、後続 UT-17-FU-006（KV usage dashboard）の前提となる。

## 2. 確定した真の論点（採用案）

| # | 論点 | 採用案 | 理由 |
| --- | --- | --- | --- |
| 1 | 構造化ログ schema 固定強度 | (A) 1 行 JSON + `event` 文字列リテラル固定 | `grep` 互換性 / logpush filter 契約の安定化 |
| 2 | `get` 側 try/catch 新設による behaviour change | (A) try/catch 新設 + fail-open（`seen = null` 相当） | KV 一時障害で Slack 配信を止めない方が運用インパクト小 |
| 3 | `isolateId` 採番方式 | (A) module top で `crypto.randomUUID()` 1 回採番 | Workers に `isolate.id` 公式 API が無いため代理識別子として最適 |
| 4 | `dedupeKey` 短縮方式 | (A) SHA-256 first 12 hex chars（lowercase） | 容量圧迫回避 / 同一 key→同一 hash の再現性確保 |

## 3. スコープ

### 含む

- `apps/api/src/routes/internal/alert-relay.ts` への以下追加:
  - module top で `const isolateId = crypto.randomUUID();` 1 回採番
  - top-level に private helper `logKvOperationError(op, err, dedupeKey)` 定義
  - `env.ALERT_DEDUP_KV.get(dedupeKey)`（既存 :66）を try/catch で囲み、catch 内で helper 呼出 + fail-open
  - `env.ALERT_DEDUP_KV.put(...)` 既存 catch（:93-102）を helper 呼出に置換
- 出力 JSON schema: `{ event: "alert_relay_kv_op_failed", op, errorClass, dedupeKeyHash, isolateId, ts }`
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` への 4 ケース追加 + `afterEach` での spy leak 防止
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` への「KV 操作エラーログの確認」セクション追加

### 含まない

- Cloudflare Dashboard / Analytics Engine 連携（UT-17-FU-006）
- Workers Logpush 設定
- Slack / PagerDuty 自動通知ルート追加
- KV retry / 二重書き戦略の変更
- D1 / Durable Object 移行
- `apps/web` 配下の変更
- production deploy（user-gated）
- 既存 fail-closed / fail-open 挙動の変更（`get` fail-open 化を**除く**）

## 4. 受入条件 (AC)

index.md AC-1〜AC-10 を全て Phase 1 で正式承認する。各 AC の Phase マッピング:

| AC | 内容 | 主担当 Phase |
| --- | --- | --- |
| AC-1 | isolateId module top 1 回採番 | Phase 2 (helper-design / emit-points) |
| AC-2 | helper 関数 private 定義 | Phase 2 (helper-design) |
| AC-3 | JSON schema 固定 | Phase 2 (log-schema) |
| AC-4 | dedupeKeyHash SHA-256 first 12 hex chars | Phase 2 (log-schema / helper-design) |
| AC-5 | `get` try/catch + fail-open | Phase 2 (emit-points / get-fail-open-policy) |
| AC-6 | `put` catch helper 置換 + 戻り値不変 | Phase 2 (emit-points) |
| AC-7 | spec.ts 4 ケース追加 | Phase 7 (test-plan) |
| AC-8 | runbook 追記 | Phase 8 (docs-updates) |
| AC-9 | typecheck / lint / api test PASS | Phase 9 (acceptance) |
| AC-10 | behaviour change なし（`get` fail-open 化除く） | Phase 3 (design-review) / Phase 12 (documentation-changelog) |

## 5. 4 条件評価

| 条件 | 判定 | 解消条件 |
| --- | --- | --- |
| 価値性 | PASS | — |
| 実現性 | PASS | Cloudflare Workers 標準 API のみで実装可能 |
| 整合性 | CONDITIONAL | `get` fail-open 化を Phase 12 documentation-changelog に意図的 behaviour change として明示記録すること |
| 運用性 | CONDITIONAL | `event` 文字列リテラル `"alert_relay_kv_op_failed"` 固定を Phase 2 log-schema.md で正本化すること |

## 6. 既存資産インベントリ

| 資産 | 状態 | 参照行 |
| --- | --- | --- |
| `alert-relay.ts` 全体 | 108 行 / `createAlertRelayRoute()` 実装済 | alert-relay.ts:1-108 |
| `ALERT_DEDUP_KV` binding 定義 | `AlertRelayEnv` interface に既に存在 | alert-relay.ts:23 |
| `get` 呼出 | try/catch なし（本タスクで新設対象） | alert-relay.ts:66 |
| `put` catch | plain object `console.warn` 実装済（本タスクで helper 呼出に置換） | alert-relay.ts:93-102 |
| `verifyCfWebhookAuth` middleware | 改変なし | alert-relay.ts:9, 41 |
| `formatCloudflareAlertToSlack` / `sendSlackMessage` | 改変なし | alert-relay.ts:75, 85 |
| Workers `crypto.subtle.digest` / `crypto.randomUUID` | ランタイム標準 API | — |
| `scripts/cf.sh tail` | wrangler tail ラッパー（runbook で使用） | scripts/cf.sh |

## 7. 不変条件

1. **fail-open 維持**: KV `get` / `put` 失敗時に Slack 配信を止めない（`get` 側は本タスクで fail-open 化が初導入）
2. **schema 固定**: `event` 文字列リテラル `"alert_relay_kv_op_failed"` を変更しない（logpush 契約）
3. **isolateId 採番回数**: module top で 1 回のみ
4. **dedupeKeyHash 短縮**: SHA-256 first 12 hex chars 固定 / raw key を出さない
5. **alert-relay 主機能改変禁止**: dedupe TTL / Slack 配信 retry / formatter は触らない
6. **`wrangler` 直接禁止**: `bash scripts/cf.sh tail` 経由のみ
7. **D1 binding 不使用**
8. **平文 secret 禁止**

## 8. Phase 2 申し送り事項

- 採用案 (A)-(A)-(A)-(A) を Phase 2 設計の前提として固定
- CONDITIONAL 解消条件 2 件（`get` fail-open documentation-changelog 記録 / `event` 文字列リテラル正本化）を Phase 2 で具体化
- 既存資産インベントリの行番号（alert-relay.ts:23 / :66 / :93-102）を Phase 2 設計内のコード参照に転記
- 異常系の Phase 2 検討対象: `get` throw → fail-open 経路 / `put` throw → 既存 `dedupPersisted=false` 経路 / spy leak / `crypto.subtle.digest` async ordering
