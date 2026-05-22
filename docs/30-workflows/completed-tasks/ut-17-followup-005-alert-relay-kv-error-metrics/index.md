# ut-17-followup-005-alert-relay-kv-error-metrics - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/api/src/routes/internal/alert-relay.ts` に対する
> 構造化ログ emit 追加（`get` の try/catch 新設、`put` catch の JSON 化、`isolateId` /
> `dedupeKeyHash` ヘルパ実装）、`apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`
> へのテストケース追加、`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
> への運用手順追記を伴うコード実装タスク。ドキュメントのみで完結しない。
>
> **GitHub Issue 状態の確認結果**: Issue #701 は `state=closed` / `state_reason=completed`
> としてクローズされているが、本ワークツリー (origin/dev = caa42915) のコードベースを
> 確認した結果、要求された構造化ログ schema・isolateId・dedupeKeyHash・`get` 側の
> try/catch・spec.ts のテスト・runbook 追記のいずれも **未実装** である。ユーザー指示に従い
> issue は CLOSED のままタスク仕様書を作成し、根本的問題を解決する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-17-FU-005 |
| タスク名 | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| ディレクトリ | docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics |
| 親タスク | UT-17-FU-002 (`apps/api` alert-relay dedup KV persistence) |
| 原典 | docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | implemented_local_evidence_captured / implementation_complete_pending_pr |
| タスク種別 | implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL |
| 優先度 | LOW |
| GitHub Issue | #701（CLOSED / completed marked / close 時点では実コード未実装。本 workflow で local 実装済み） |

## 目的

`apps/api/src/routes/internal/alert-relay.ts` の Cloudflare KV `get` / `put` 失敗を
**構造化 JSON ログ**として `console.warn` 経由で emit し、Workers Logs / 後段 logpush から
`errorClass` 別に集計可能な土台を提供する。

これにより、KV 一時障害・global replication 遅延・write rate limit 接近時の
dedup 不整合（Slack 重複配信）を「人間が Slack で気づく」前に観測可能にし、
ut-17 monthly healthcheck runbook の SLO 化と ut-17-followup-006（KV usage dashboard）
の dashboard 化の前提を満たす。

## スコープ

### 含む

- `apps/api/src/routes/internal/alert-relay.ts`
  - module top で `isolateId = crypto.randomUUID()` を 1 回採番
  - 同一ファイル top-level に private helper `logKvOperationError(op, err, dedupeKey)` を新設
  - `env.ALERT_DEDUP_KV.get(dedupeKey)` を `try/catch` で包み、catch 内で `logKvOperationError('get', err, dedupeKey)` を呼び出し、**fail-open（dedup skip して通常処理続行）**
  - `env.ALERT_DEDUP_KV.put(dedupeKey, "1", ...)` の既存 catch を、plain object `console.warn` から `logKvOperationError('put', err, dedupeKey)` 呼び出しに置き換え（fail-open 継続・`dedupPersisted=false` レスポンス挙動は不変）
  - `dedupeKeyHash` 計算: `crypto.subtle.digest('SHA-256', new TextEncoder().encode(dedupeKey))` の first 12 hex chars
  - JSON schema: `{ event: "alert_relay_kv_op_failed", op: "get"|"put", errorClass: string, dedupeKeyHash: string, isolateId: string, ts: string }`
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`
  - `KV.get` throw 時に warn が 1 回 emit され、payload に `event`/`op:"get"`/`errorClass`/`dedupeKeyHash`/`isolateId`/`ts` が含まれることを assert
  - `KV.put` throw 時に warn が 1 回 emit され、payload に `op:"put"` が含まれることを assert
  - 成功パスでは `console.warn` が呼ばれないことを assert（false-positive 防止）
  - `vi.spyOn(console, 'warn')` の leak 防止（`afterEach` で `vi.restoreAllMocks()`）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
  - 「KV 操作エラーログの確認」セクション追加
  - `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \| grep alert_relay_kv_op_failed` の grep 例
  - しきい値（直近 1 時間で 10 件超なら調査開始）
  - 構造化ログ schema 表（field 名・型・例値）

### 含まない

- Cloudflare Dashboard / Analytics Engine への送信設定（ut-17-followup-006 領域）
- Workers Logpush 設定（別タスク）
- Slack / PagerDuty への自動通知ルート追加
- KV 失敗時の retry / 二重書き戦略の変更
- D1 / Durable Object への移行検討
- 既存 fail-open / fail-closed 挙動の変更（KV `get` 失敗時も fail-open を継続）
- production への deploy（user-gated / external ops）

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md | 原典タスク指示書 |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | emit 追加対象 |
| 必須 | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | テスト追加対象 |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | runbook 追記対象 |
| 必須 | apps/api/src/env.ts | `ALERT_DEDUP_KV` binding 型（変更なし、参照のみ） |
| 必須 | apps/api/wrangler.toml | `ALERT_DEDUP_KV` namespace 定義（変更なし、参照のみ） |
| 必須 | CLAUDE.md | `apps/api` env / `scripts/cf.sh` 利用ルール |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | `crypto.subtle.digest` / `crypto.randomUUID` API |
| 参考 | https://developers.cloudflare.com/workers/observability/logs/workers-logs/ | Workers Logs での JSON emit 取り扱い |

## 受入条件 (AC)

- **AC-1**: `apps/api/src/routes/internal/alert-relay.ts` の module top に `const isolateId = crypto.randomUUID();` が一度だけ採番され、handler 内で再採番されない。
- **AC-2**: 同ファイル top-level に private helper `async function logKvOperationError(op: "get" \| "put", err: unknown, dedupeKey: string): Promise<void>` が定義され、外部 export されていない。
- **AC-3**: emit される JSON は固定 schema `{ event: "alert_relay_kv_op_failed", op, errorClass, dedupeKeyHash, isolateId, ts }` で、`console.warn(JSON.stringify(payload))` 形で 1 行 JSON として出力される。
- **AC-4**: `dedupeKeyHash` は SHA-256 hash の first 12 hex chars（lowercase）であり、同一 dedupeKey に対し同一 hash が再現する。
- **AC-5**: `env.ALERT_DEDUP_KV.get(dedupeKey)` が `try/catch` で囲われ、catch 内で `await logKvOperationError('get', err, dedupeKey)` を呼んだ後、`seen = null` 相当として通常処理を継続する（fail-open）。
- **AC-6**: `env.ALERT_DEDUP_KV.put(...)` の既存 catch ブロックが、plain object の `console.warn` から `await logKvOperationError('put', err, dedupeKey)` 呼び出しに置き換わり、戻り値・レスポンス挙動（`dedupPersisted: false`）は不変。
- **AC-7**: `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` に以下 4 ケースが追加されている: (a) KV.get throw → warn 1 回 emit + payload assert, (b) KV.put throw → warn 1 回 emit + payload assert, (c) 同一 dedupeKey の dedupeKeyHash 再現性, (d) 成功パス → warn 0 回。
- **AC-8**: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` に「KV 操作エラーログの確認」セクションが追加されており、`grep` コマンド例・しきい値・schema 表を含む。
- **AC-9**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm --filter @ubm-hyogo/api test` が全 PASS。
- **AC-10**: 既存 alert-relay の behaviour change が無い（KV `get` 失敗時を除く。`get` 失敗時は従来 500 / unhandled だったが、本タスクで fail-open 継続に変更する点のみ意図的な挙動変更として記録する）。

## Phase 一覧（本仕様書の対象範囲）

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{log-schema,helper-design,emit-points,get-fail-open-policy}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/design-review.md |
| 4 | タスク分解 | phase-04.md | completed | outputs/phase-04/{task-breakdown,critical-path}.md |
| 5 | 実装計画 | phase-05.md | completed | outputs/phase-05/implementation-plan.md |
| 6 | 実装手順 | phase-06.md | completed | outputs/phase-06/implementation-steps.md |
| 7 | テスト計画 | phase-07.md | completed | outputs/phase-07/test-plan.md |
| 8 | ドキュメント更新 | phase-08.md | completed | outputs/phase-08/docs-updates.md |
| 9 | 受入確認 | phase-09.md | completed | outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | outputs/phase-10/refactor-summary.md |
| 11 | NON_VISUAL evidence | phase-11.md | completed | outputs/phase-11/visual-verification-skip.md |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md |
| 13 | PR・振り返り | phase-13.md | blocked | outputs/phase-13/pr-summary.md |

## 不変条件

1. **fail-open 維持**: KV `get` / `put` 失敗時は Slack 配信を止めない。例外を握り潰すパス自体は変えず、ログ emit を追加するのみ。ただし `get` 側は従来 try/catch 無しだったため、本タスクで `try { ... } catch { log; return null 相当 }` を新設する。
2. **behaviour change 最小化**: 上記 `get` の fail-open 化以外、レスポンス body / status code / dedupe TTL / Slack 配信路は不変。
3. **schema 固定**: `event` field は文字列リテラル `"alert_relay_kv_op_failed"` で固定。後段 logpush の filter 契約となるため、改名は本タスク以後の互換性 break を伴う。
4. **isolateId 採番回数**: module top で 1 回のみ。handler ごとに採番しない（isolate ライフサイクル代理識別子として機能させるため）。
5. **dedupeKeyHash 短縮**: SHA-256 first 12 hex chars 固定。raw `dedupeKey` をログに出さない（Workers Logs 容量圧迫防止 + 軽度の冗長化抑制）。
6. **`wrangler` 直接禁止**: 動作確認時の `wrangler tail` は `bash scripts/cf.sh tail` 経由のみ。
7. **D1 直接アクセス境界**: 本タスクで D1 binding は使用しない。
8. **平文 secret 禁止**: `.env` には `op://Vault/Item/Field` 参照のみ。
9. **CONST_007 遵守**: 本サイクル内で Phase 1〜12 と local implementation は完了済み。Phase 13 の commit / push / PR と production deploy は user-gated。
10. **alert-relay 主機能改変禁止**: dedupe TTL / Slack 配信 retry / `formatCloudflareAlertToSlack` 等の主機能ロジックは触らない。

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| コード | apps/api/src/routes/internal/alert-relay.ts | 構造化ログ emit 追加 |
| テスト | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | KV throw 時の emit assertion 追加 |
| ドキュメント | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | KV エラーログ確認手順追記 |
| 仕様 | outputs/phase-02/log-schema.md | 構造化ログ schema 正本（AC-3, AC-4） |
| 仕様 | outputs/phase-02/helper-design.md | logKvOperationError ヘルパ設計（AC-2） |
| 仕様 | outputs/phase-02/emit-points.md | emit 箇所マッピング（AC-5, AC-6） |
| 仕様 | outputs/phase-02/get-fail-open-policy.md | `get` fail-open 化方針（AC-5, AC-10） |
| 仕様 | outputs/phase-03/design-review.md | 設計レビュー GO/NO-GO |
| 管理 | artifacts.json | root workflow state / Phase 1-13 status |
| 管理 | outputs/artifacts.json | outputs parity marker |

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| `get` の fail-open 化が既存挙動変更となり regression を生む | 既存 spec.ts に `KV.get` 成功路の assertion を残し、追加テストで `get throw → seen=null 扱い → 通常 Slack 配信続行` をカバー |
| Workers Logs の 1 行上限超過 | stack trace を含めず `errorClass` のみ。dedupeKey は 12 char hash に短縮 |
| `console.warn` spy が他 test と leak | `afterEach(() => vi.restoreAllMocks())` を spec.ts に明示 |
| `crypto.subtle.digest` の async が emit 順序を乱す | helper 自体は `async` とし、catch 内も `await logKvOperationError(...)` で待機 |
| isolate 跨ぎでログ集計困難 | `isolateId` は module top で 1 回採番（同一 isolate ログ集約の代理キー） |
| 後段 logpush 契約 break | `event` 文字列固定。schema 変更時は本 workflow の続編 issue を立てる |

## Phase マップ

```
phase-01 (要件定義)
  └─ outputs/phase-01/requirements.md
       │
       ▼
phase-02 (設計)
  ├─ outputs/phase-02/log-schema.md
  ├─ outputs/phase-02/helper-design.md
  ├─ outputs/phase-02/emit-points.md
  └─ outputs/phase-02/get-fail-open-policy.md
       │
       ▼
phase-03 (設計レビュー)
  └─ outputs/phase-03/design-review.md
       │
       ▼
phase-04〜12 (実装〜正本同期 / local complete)
     │
     ▼
phase-13 (PR・振り返り / user approval gate)
```

## 注意点

- GitHub Issue #701 は state=closed / state_reason=completed として閉じられているが、
  本ワークツリー (origin/dev = caa42915) のコードベースを実測した結果、要求された
  構造化ログ schema・isolateId・dedupeKeyHash・`get` 側の try/catch・spec.ts のテスト・
  runbook 追記のいずれも未実装である。ユーザー指示に従い issue は CLOSED のまま、
  本 workflow の local implementation で根本的に解決し、Phase 13 の commit / push / PR はユーザー承認後に実施する。
- 親タスク UT-17-FU-002 (`ALERT_DEDUP_KV` 永続化) は実装済み前提。
- 本タスクは behaviour change を最小化するが、`get` 失敗時の fail-open 化は意図的な
  挙動変更として Phase 12 documentation-changelog に記載する。
