# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/api/src/routes/internal/alert-relay.ts` への構造化ログ emit 追加、`__tests__/alert-relay.spec.ts` のテストケース追加、runbook 追記を伴うコード実装タスク。ドキュメント策定のみで完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

UT-17-FU-005 の必要性・スコープ・受入条件を確定し、Phase 2 設計に渡す入力を Phase 1 で固定する。特に以下 4 つの真の論点を本 Phase で明文化する。

1. KV 操作エラーログの **構造化 schema 固定** をどこまで強制するか（後段 logpush 契約）
2. `get` 側に `try/catch` を **新設**することによる behaviour change（fail-open 化）の取り扱い
3. `isolateId` を **module top で 1 回採番** する方式の妥当性（Workers に `isolate.id` API がない）
4. `dedupeKey` を **SHA-256 first 12 hex chars** に短縮する根拠（Workers Logs 容量 + 軽度の冗長化抑制）

## 真の論点

### 論点 1: 構造化ログ schema 固定の強度

`alert-relay.ts:98-100` 既存実装は plain object を `console.warn` の第 2 引数に渡す形式で、後段 logpush から `grep` / filter する際に schema 検索が安定しない。

選択肢:

- **(A) 1 行 JSON 固定 + `event` 文字列リテラル固定**: `console.warn(JSON.stringify({ event: "alert_relay_kv_op_failed", ... }))` で 1 行 JSON として出力。`grep alert_relay_kv_op_failed` で正確に拾える。**第一推奨**。
- **(B) plain object 維持で field 名のみ揃える**: Workers Logs 表示は読みやすいが、`grep` 互換性が弱く、後段 dashboard 化のとき再 normalize が必要。**不採用**。
- **(C) 独自 logger ライブラリ導入**: 過剰投資。本タスクの scope を逸脱。**不採用**。

→ Phase 1 では **(A) 1 行 JSON 固定** を採用。`event` field は文字列リテラル `"alert_relay_kv_op_failed"` で固定し、これを logpush の filter 契約とする。

### 論点 2: `get` 側 try/catch 新設による fail-open 化

`alert-relay.ts:66` の `const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);` は現状 try/catch なし。例外時は Hono の unhandled error として 500 が返る。

選択肢:

- **(A) try/catch 新設 + fail-open（`seen = null` 相当として通常配信続行）**: KV 一時障害時に Slack 配信を止めない。本タスクで唯一の意図的な behaviour change として記録。**第一推奨**。
- **(B) try/catch 新設 + fail-closed（500 返却）**: KV 障害が即アラート遅延に直結。alert 通知の運用インパクトの方が dedup 不整合より大きい。**不採用**。
- **(C) try/catch 新設せず**: そもそも観測対象として emit できない（本タスクの目的に反する）。**不採用**。

→ Phase 1 では **(A) fail-open 化** を採用。原典 6.3 章「KV `get` 失敗時に fail-closed (500 系) にする選択肢は取らない」と整合。Phase 12 documentation-changelog にこの意図的 behaviour change を必ず記録する。

### 論点 3: `isolateId` 採番方式

Cloudflare Workers には `isolate.id` を返す公式 API がない（原典 6.1 章）。`process.pid` 相当も使えない。

選択肢:

- **(A) module top で `crypto.randomUUID()` を 1 回採番し isolate 寿命中は再利用**: isolate 再生成時に別 UUID になるので「isolate ライフサイクルの代理識別子」として機能。**第一推奨**。
- **(B) request 毎に採番**: ログを isolate 単位で集計したい本来の目的を満たさない。**不採用**。
- **(C) `Math.random` ベースの短 ID**: 衝突確率が高く、後段集計時の代理識別子として信頼性が低い。**不採用**。

→ Phase 1 では **(A) module top 1 回採番** を採用。runbook に「完全な isolate 識別ではない / isolate 再生成で別値になる」点を明記する。

### 論点 4: dedupeKey の hash 短縮

`dedupeKey` は `(metric, policy_id, minuteBucket)` の join 値で raw 値は PII ではないが、ログ全行に直接埋めると Workers Logs 容量を圧迫する（原典 6.4 章）。

選択肢:

- **(A) SHA-256 first 12 hex chars（lowercase）**: 衝突確率は実用上無視可能。後段 dashboard 化で「key 別失敗率」を見たい場合も同一 key→同一 hash で再現性確保。**第一推奨**。
- **(B) raw key 直挿入**: 容量圧迫 + ログ可読性低下。**不採用**。
- **(C) hash なし（key 完全 omit）**: 「特定 dedupeKey の集中失敗」を後段から追えない。**不採用**。

→ Phase 1 では **(A) SHA-256 first 12 hex chars** を採用。`crypto.subtle.digest('SHA-256', new TextEncoder().encode(dedupeKey))` で計算し lowercase hex 12 文字に切り詰める。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流 | UT-17-FU-002 (ALERT_DEDUP_KV 永続化) | KV binding 実装済み・改変禁止 |
| 上流 | `apps/api/src/routes/internal/alert-relay.ts` | emit 追加対象（dedupe / formatter / Slack 配信ロジックは不変） |
| 上流 | `apps/api/src/middleware/verify-cf-webhook-auth.ts` | 改変なし |
| 上流 | `apps/api/wrangler.toml` | `ALERT_DEDUP_KV` namespace 定義・参照のみ |
| 連携 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | KV エラーログ確認手順追記 |
| 対象外 | Cloudflare Dashboard / Analytics Engine 連携 | UT-17-FU-006 領域 |
| 対象外 | Workers Logpush 設定 | 別タスク |
| 対象外 | Slack / PagerDuty 自動通知ルート追加 | scope 外 |
| 対象外 | KV retry / 二重書き戦略 | scope 外 |
| 対象外 | D1 / Durable Object 移行 | scope 外 |
| 対象外 | `apps/web` 配下 | scope 外 |

## 価値とコスト評価

- **初回提供価値**: KV `get` / `put` 失敗を構造化 JSON ログで観測可能になり、Slack 重複配信を「人間が気付く」前に検知できる。後続 UT-17-FU-006 dashboard 化の前提を満たす。
- **初回に払わないコスト**: Cloudflare Dashboard 統合、logpush 設定、自動 alerting ルート。
- **設計コスト**: Phase 02 成果物 4 件 + Phase 03 レビュー 1 件 = 5 ドキュメント。
- **実装コスト見積（Phase 4 以降）**:
  - `apps/api/src/routes/internal/alert-relay.ts` 編集 約 30〜40 行（helper / module top 採番 / get try/catch / put catch 置換）
  - `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` 追加 約 80〜140 行（4 ケース + spy leak 防止）
  - `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` 追記 約 30 行
- **運用コスト**: 月次 runbook で `bash scripts/cf.sh tail | grep alert_relay_kv_op_failed` を実行する 1 操作のみ。

## 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | KV 操作エラーを構造化観測でき、後段 dashboard 化が可能か | PASS | — |
| 実現性 | Cloudflare Workers 標準 API（`crypto.subtle.digest` / `crypto.randomUUID`）のみで実装可能か | PASS | 論点 3, 4 採用案で達成 |
| 整合性 | UT-17 不変条件・既存 alert-relay 主機能ロジックと整合するか | CONDITIONAL | `get` 側 fail-open 化を Phase 12 documentation-changelog に「意図的 behaviour change」として明示記録すること |
| 運用性 | runbook から `grep` 1 操作で異常検知できるか | CONDITIONAL | `event` 文字列リテラル固定（論点 1 採用案）を Phase 2 schema 設計で正本化すること |

## 既存資産インベントリ

| 資産 | 確認結果 | 参照 |
| --- | --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` | 108 行・`createAlertRelayRoute()` 実装済。`ALERT_DEDUP_KV` binding 経由 dedupe あり。`get` は try/catch なし。`put` は catch 内で plain object `console.warn` 実装済 | alert-relay.ts:1-108 |
| `alert-relay.ts:23` `ALERT_DEDUP_KV` binding | `AlertRelayEnv` interface に既に定義済（UT-17-FU-002 完了） | alert-relay.ts:23 |
| `alert-relay.ts:66` `get` 呼出 | try/catch なし・本タスクで try/catch 新設対象 | alert-relay.ts:66 |
| `alert-relay.ts:93-102` `put` catch | 既存 plain object `console.warn` から helper 呼出に置換対象 | alert-relay.ts:93-102 |
| `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 既存 spec ファイル（既存 case はテスト対象 behaviour change なしを担保するため温存） | (Phase 2 で再確認) |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | UT-17-FU-003 で作成済 runbook。本タスクで「KV 操作エラーログの確認」セクション追加対象 | (Phase 2 で再確認) |
| Workers `crypto.subtle.digest` / `crypto.randomUUID` API | Cloudflare Workers ランタイム標準（Web Crypto API） | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ |
| `scripts/cf.sh tail` | wrangler tail ラッパー（CLAUDE.md ルール） | scripts/cf.sh |

## スコープ確定

### 含む

- `apps/api/src/routes/internal/alert-relay.ts`:
  - module top で `const isolateId = crypto.randomUUID();` を 1 回採番
  - 同一ファイル top-level に private helper `logKvOperationError(op, err, dedupeKey)` を新設（外部 export なし）
  - `env.ALERT_DEDUP_KV.get(dedupeKey)` を `try/catch` で囲み、catch 内で helper 呼出 + fail-open（`seen = null` 相当）
  - `env.ALERT_DEDUP_KV.put(...)` 既存 catch を helper 呼出に置換
  - `dedupeKeyHash` は SHA-256 first 12 hex chars
  - 出力 schema: `{ event: "alert_relay_kv_op_failed", op, errorClass, dedupeKeyHash, isolateId, ts }`
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` への 4 ケース追加 + `afterEach` での spy leak 防止
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` への「KV 操作エラーログの確認」セクション追加

### 含まない

- Cloudflare Dashboard / Analytics Engine 送信設定（UT-17-FU-006 領域）
- Workers Logpush 設定
- Slack / PagerDuty 自動通知ルート追加
- KV retry / 二重書き戦略の変更
- D1 / Durable Object 移行
- 既存 fail-closed / fail-open 挙動の変更（`get` 失敗時の fail-open 化を**除く**）
- production への deploy（user-gated / external ops）
- `apps/web` 配下の変更

## 受入条件 (AC) 確認

index.md で定義した AC-1〜AC-10 を Phase 1 で正式承認する。

- AC-1（isolateId module top 1 回採番） → Phase 2 helper-design.md / emit-points.md に対応
- AC-2（helper 関数 private 定義） → Phase 2 helper-design.md に対応
- AC-3（JSON schema 固定） → Phase 2 log-schema.md に対応
- AC-4（dedupeKeyHash SHA-256 first 12 hex chars） → Phase 2 log-schema.md / helper-design.md に対応
- AC-5（`get` try/catch + fail-open） → Phase 2 emit-points.md / get-fail-open-policy.md に対応
- AC-6（`put` catch helper 置換 + 戻り値不変） → Phase 2 emit-points.md に対応
- AC-7（spec.ts 4 ケース追加） → Phase 7 test-plan.md に対応（Phase 1 では方針承認のみ）
- AC-8（runbook 追記） → Phase 8 docs-updates.md に対応（Phase 1 では方針承認のみ）
- AC-9（typecheck / lint / api test PASS） → Phase 9 acceptance.md に対応
- AC-10（behaviour change なし、`get` fail-open 化除く） → Phase 3 design-review.md / Phase 12 documentation-changelog に対応

## 用語集

| 用語 | 意味 |
| --- | --- |
| 構造化ログ | `console.warn(JSON.stringify({ ... }))` で 1 行 JSON として出力するログ形式。後段 logpush / grep の filter 契約となる |
| `event` field | ログ payload 内の固定文字列リテラル `"alert_relay_kv_op_failed"`。後段 filter の anchor |
| `errorClass` | `err instanceof Error ? err.constructor.name : typeof err`。Error クラス名のみ抽出、stack trace は含めない |
| `dedupeKeyHash` | `crypto.subtle.digest('SHA-256', new TextEncoder().encode(dedupeKey))` の first 12 hex chars（lowercase） |
| `isolateId` | module top で `crypto.randomUUID()` を 1 回採番し isolate 寿命中再利用する代理識別子 |
| fail-open | KV 操作失敗時に例外を握り潰して Slack 配信を止めない方針。本タスクで `get` 側にも適用拡張 |
| fail-closed | KV 操作失敗時に 500 等を返して上流処理を止める方針。本タスクでは採用しない |
| logpush 契約 | `event` 文字列リテラルを後段 filter の anchor として扱う暗黙契約。改名は互換性 break |

## 実行タスク

- [ ] 原典タスク `docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md` を読み込み、要件・苦戦箇所 6.1〜6.5 を本 spec に反映する
- [ ] 既存 `apps/api/src/routes/internal/alert-relay.ts` の現状を行番号付きで確認する
- [ ] 真の論点 4 点を Phase 1 で明文化する
- [ ] 4 条件評価を行い、CONDITIONAL の解消条件を Phase 2 へ申し送る
- [ ] 既存資産インベントリを行番号付きで記録する
- [ ] `outputs/phase-01/requirements.md` を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md | 原典タスク |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | emit 追加対象 |
| 必須 | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | テスト追加対象 |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | runbook 追記対象 |
| 必須 | CLAUDE.md | `apps/api` env / `scripts/cf.sh` ルール |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | `crypto.subtle.digest` / `crypto.randomUUID` 仕様 |
| 参考 | https://developers.cloudflare.com/workers/observability/logs/workers-logs/ | Workers Logs 構造化 JSON 取扱 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（4 論点・スコープ・AC・4 条件評価・既存資産・用語集） |

## 完了条件

- [ ] 4 つの真の論点が文書化されている
- [ ] 4 条件評価が PASS / CONDITIONAL で記録され、CONDITIONAL の解消条件が明示されている
- [ ] AC-1〜AC-10 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリが行番号付きで記録されている
- [ ] downstream handoff（Phase 2 への引き継ぎ事項）が明記されている
- [ ] `outputs/phase-01/requirements.md` が作成されている

## タスク 100% 実行確認【必須】

- 全実行タスク completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（`get` throw → fail-open 経路 / `put` throw → 既存 `dedupPersisted=false` 経路 / spy leak / `crypto.subtle.digest` async ordering）を Phase 2 申し送り事項に含む
- 次 Phase への引き継ぎ事項を明記

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項:
  - 論点 1〜4 の採用案（(A)-(A)-(A)-(A)）を Phase 2 設計の前提として固定
  - CONDITIONAL 解消条件 2 件（`get` fail-open 化の documentation-changelog 記録 / `event` 文字列リテラル正本化）を Phase 2 で具体化
  - 既存資産インベントリの行番号（alert-relay.ts:23 / :66 / :93-102）を Phase 2 設計内のコード参照に転記
- ブロック条件: `outputs/phase-01/requirements.md` 未作成 / CONDITIONAL 解消条件未記録 の場合は Phase 2 に進まない

## 統合テスト連携

`apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` を Phase 7 以降の統合テスト相当の focused evidence として扱う。
