# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-07B-FU-01 schema alias back-fill queue/cron split |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-05 |
| Wave | 2（親タスク完了後） |
| 実行種別 | sequential（条件付き着手 / 着手 gate は Phase 11 で判定） |
| 前 Phase | なし |
| 次 Phase | 2（設計 - Queue vs Cron / batch contract / remaining-scan model） |
| 状態 | spec_created |
| 実装区分 | 実装仕様書 |
| タスク分類 | implementation（条件付き：staging 10,000+ rows evidence で着手判断） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #361（CLOSED 維持・参照のみ） |
| 親タスク | ut-07b-schema-alias-hardening |

## 目的

UT-07B 完了時点で残された「条件付き follow-up（staging 10,000+ rows で `backfill_cpu_budget_exhausted` が持続再発する場合のみ着手）」を、Phase 2 が **Queue / Cron / cursor / dedupe / response contract** の設計を一意に絞り込める粒度で論点・苦戦箇所・依存境界・AC として固定する。

Phase 1 は決定そのものを行わず、以下 4 点を入力として整える Phase として閉じる。

1. 真の論点（true issue）を「Queue を入れるか / Cron に分けるか」ではなく **「条件付き着手 gate の客観化 + 着手時の責務分離 boundary 設計」** に再定義する。
2. 既存差分前提表（07b 完了状態 vs 強化後ゴール）を確定する。
3. 苦戦箇所 3 件以上（staging 実測未完 / Queue vs Cron 採用基準 evidence 待ち / duplicate enqueue & partial failure recovery 境界未定義）を言語化する。
4. AC-1〜AC-11 を `index.md` と完全一致で固定する。

---

## 実行タスク

1. 親タスク `ut-07b-schema-alias-hardening` の Phase 12 implementation-guide / unassigned-task-detection を写経し、本タスクが **「条件付き着手 follow-up」** であることを再確認する。
2. `apps/api/src/workflows/schemaAliasAssign.ts` / `apps/api/src/routes/admin/schema.ts` の現行 retryable contract（`backfill_cpu_budget_exhausted` / `cursor` / `retryable: true`）を読み、既存 Stage 1 / Stage 2 責務分離の実装位置を特定する。
3. `apps/api/wrangler.toml` の現行 binding（D1 / KV `SYNC_ALERTS` / cron trigger 既存 3 本）を読み、新規 Queue / 追加 Cron の干渉点を抽出する。
4. NON_VISUAL / implementation（条件付き）/ spec_created の分類を `artifacts.json` と同期する。
5. AC-1〜AC-11 と Phase 2 引き渡し論点（trade-off 軸 / batch contract / dedupe key 設計 / response contract 拡張点）を固定する。

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Issue #361 body | 起票仕様（source of truth）。CLOSED 維持。再 OPEN しない |
| 必須 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/index.md` | 本タスク metadata / AC 正本 |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md` | 検出根拠（条件付き follow-up） |
| 必須 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md` | 親タスク完了状態 / retryable contract / 実 DB 差分吸収方針 |
| 必須 | `apps/api/src/workflows/schemaAliasAssign.ts` | 現行 alias 確定 + back-fill + CPU budget 処理（Stage 1 / Stage 2） |
| 必須 | `apps/api/src/routes/admin/schema.ts` | dryRun / apply / retry route 境界（202 retryable contract） |
| 必須 | `apps/api/src/repository/schemaAliases.ts` | alias write target |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | back-fill 残件管理 / cursor 永続 |
| 必須 | `apps/api/wrangler.toml` | 既存 binding（D1 / KV / cron trigger 3 本）と干渉点 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | API contract 正本 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | D1 schema 正本 |
| 参考 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | workflow 一覧 |

---

## 真の論点 (true issue)

「Cloudflare Queue を入れる」「Cron Trigger に分ける」のどちらを選ぶかは表層であり、本質ではない。本タスクの真の論点は次の 2 点に圧縮できる。

### 論点 1: 条件付き着手 gate の客観化

親タスク UT-07B の Phase 11 は in-memory D1 + 250 行級と staging 未実測のまま完了し、現行の cursor 管理 retry 方式は **「100,000 行で恒常的に CPU 超過する場合は follow-up 起票」** を Phase 2 の measurement plan で条件化している。本タスクはその follow-up にあたるが、staging 10,000+ rows fixture で `backfill_cpu_budget_exhausted` が **持続的・複数回再現** することが evidence として残らない限り、Queue / Cron 化は YAGNI scope creep となる。

したがって本タスクの第一の責務は「着手 gate を Phase 11 evidence で客観判定する基準の固定」であり、コード変更ではない。

### 論点 2: 着手時の非同期 boundary 責務分離

着手 gate 成立時、現行の「単発 API request 内で alias 確定 + back-fill cursor 進行 + 202 retryable で client 駆動 retry」モデルは、以下 3 点で破綻する。

1. **client 駆動 retry の限界**: 管理 UI または cron polling が `retryable: true` を見て再投する設計は、UI 閉じた / cron 失敗の場合に back-fill が止まる。
2. **duplicate enqueue 防止が単発 API 前提では未定義**: 同一 `diffId` への apply が並列で投入された場合、両方が同じ `__extra__:<questionId>` を取り合う race が発生する。現行は workflow 内 pre-check のみで防いでおり、Queue 投入後は dedupe key が必要になる。
3. **partial failure recovery の境界**: batch 内 N 件失敗時、残件 + 失敗件をどう次 batch に持ち越すかが、cursor 単独では表現できない（cursor は「次に走査開始する id」だが、失敗 id を skip すると無限後退する）。

したがって真の論点は **「alias 確定（API request 内・即時 commit）と back-fill 継続（Queue consumer or Cron handler 駆動・remaining-scan + idempotent UPDATE）の責務 boundary を非同期境界として再設計し、duplicate enqueue 防止 / partial failure recovery / response contract 拡張をその boundary に閉じる」** ことである。

---

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 対象は admin API + D1 + Workers binding 系。UI 追加なし。`apps/web` 側の表示変更は別タスク FU-02 に分離済み |
| 成果物の物理形態 | コード（`wrangler.toml` / workflow / consumer / repository / route / test）+ Markdown 仕様 + staging evidence ログ | スクリーンショット不要 |
| 検証方法 | unit / route / workflow test + staging 10,000+ rows fixture 実測 evidence（CLI 出力 / 数値ログ） | NON_VISUAL 縮約手順を Phase 11 で適用 |

`artifacts.json` の `metadata.visualEvidence` は `NON_VISUAL` で固定。

---

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | `ut-07b-schema-alias-hardening`（完了済） | base workflow / Stage 1 / Stage 2 / cursor + status / 202 retryable contract / phase-12 implementation-guide | 強化対象の前提実装と「未着手の条件付き follow-up」detection |
| 関連 | `aiworkflow-requirements`（`api-endpoints.md` / `database-schema.md` / `task-workflow-active.md`） | 現行 API contract と D1 schema 正本 | Queue / Cron binding 追加 + response contract 拡張（`confirmed` / `backfill.status`）+ `schema_diff_queue` dedupe key 列追加（採用時） |
| 下流 | 運用（staging Workers / D1 / Cloudflare Queues or Cron Trigger） | 10,000+ 行 fixture 投入手順、evidence 記録テンプレート | Phase 11 evidence（持続再現性 / 着手 gate 判定 / before-after 数値） |
| 関連 | UT-07B-FU-02（管理 UI 側 polling / progress 表示） | 本タスクの response contract 確定 | UI client が見る `backfill.status` の semantic |

---

## 既存差分の前提（Phase 2 入力）

| 軸 | 07b 完了状態 | 強化後ゴール | 出典 |
| --- | --- | --- | --- |
| back-fill 駆動主体 | 単発 API request 内 + client 駆動 retry（202 + `retryable: true`） | API request 内で alias 確定のみ、back-fill は Queue consumer or Cron handler 駆動の自走 batch | `apps/api/src/workflows/schemaAliasAssign.ts` L150-260 / 親 phase-02 retryable-contract-design |
| API response 契約 | `result.mode === "apply" && result.backfill.status === "exhausted"` のとき 202、それ以外 200。body は `backfill: { status, updated, cursor, code?, retryable? }` | `confirmed: boolean`（Stage 1 結果）と `backfill: { status: pending\|running\|exhausted\|completed, remaining: number, lastProcessedAt: string\|null }` を明示分離 | `apps/api/src/routes/admin/schema.ts` L162-185 / Issue #361 body |
| cursor 進行モデル | `id > cursor` の monotonic 走査（in_progress / exhausted / completed） | remaining-scan + idempotent UPDATE。`COUNT(*) WHERE key = '__extra__:<questionId>'` を毎 batch で再評価し、残件ゼロまで自走 | `schemaAliasAssign.ts` `backfillResponseFields` |
| duplicate enqueue 防止 | workflow 内 pre-check のみ（同一 transaction 内） | `schema_diff_queue` に dedupe key 列を追加するか、KV / D1 の in-flight marker で global lock。並列 enqueue を idempotent 化 | 新規（07b 未対応） |
| partial failure recovery | batch 内 1 件失敗 → 全 batch fail → 次 retry で同 cursor から再試行 | batch 内 N 件失敗を retry counter 付きで `failed_items` キューへ退避し、残件 scan は前進。無限ループ防止 | 新規（07b 未対応） |
| Cloudflare binding | D1 + KV (`SYNC_ALERTS`) + cron 3 本（u-04 sheets sync 系） | + Queue producer / consumer（採用時）または + Cron trigger（追加 1 本）。staging / production / CI variables / runbook 同一 wave で同期 | `apps/api/wrangler.toml` |
| `response_fields` カラム | `questionId` / `is_deleted` カラム不在。`__extra__:<questionId>` + `deleted_members` JOIN で吸収 | 同方針を維持（migration コスト + アクセスパターン整合性の観点で base case） | 親 phase-12 implementation-guide |

---

## 苦戦箇所【記入必須】

### 1. staging credentials 必要で 10,000+ rows 実測が未完

- **対象**: `apps/api`（staging Workers / D1）+ `scripts/cf.sh` ラッパー経由の wrangler 実行
- **症状**: 親タスク UT-07B の Phase 11 では staging 投入が deferred evidence 形式で未実測のまま完了している。本タスクの **着手 gate そのもの** が staging 実測 evidence に依存するため、credentials なし環境では Phase 1-4 / 7-10 までしか先行できない。
- **本タスクへの影響**: Phase 11 で `scripts/cf.sh d1 execute` 経由で 10,000 / 50,000 / 100,000 行 fixture を staging に投入し、apply API を `retryable=true` の間繰り返し叩く evidence ログを記録する手順を Phase 2 measurement plan として固定する必要がある。Phase 11 evidence なしで Phase 5 以降に着手すると YAGNI 化する。
- **参照**: 親 phase-12 skill-feedback-report / `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-11/manual-evidence.md`

### 2. Queue vs Cron 採用基準が evidence 待ち

- **対象**: `apps/api/wrangler.toml` の binding 設計
- **症状**: Cloudflare Queues は producer/consumer + dead-letter で低 latency / 可視性が高いが Workers Paid プラン依存度が高く、Free プランでは制約がある。Cron Trigger は既存 3 本で運用実績があるが latency が cron interval に固定され、UI 起動 retry より遅い。どちらを採用すべきかは「持続再現の頻度・1 回あたりの batch 必要数・運用 visibility 要件」が定量化されないと決まらない。
- **本タスクへの影響**: Phase 2 で trade-off 表（latency / batch size / retry semantics / dead-letter / 運用 visibility / cost / Free プラン適合）を作成し、**base case として Queue を第一候補**としつつ、着手 gate 不成立時の代替として Cron を準備するか、または **Phase 11 evidence で最終決定する設計** にする必要がある。Phase 1 で「どちらか」を決め切らないことが正解。
- **参照**: Cloudflare Queues 公式仕様 / `wrangler.toml` 既存 cron trigger 設計 / Issue #361 body

### 3. duplicate enqueue / partial failure recovery の境界が単発 API 前提では未定義

- **対象**: `apps/api/src/repository/schemaDiffQueue.ts` / `schemaAliasAssign.ts` Stage 2
- **症状**: 現行 cursor 管理は **単一 client が連続 retry する前提** で idempotent。Queue 化すると、(a) 同一 `diffId` の重複 enqueue（管理画面の二重クリック / cron 多重 fire）、(b) consumer 並列実行（Queue concurrency > 1）、(c) batch 中 N 件失敗時の残件 + 失敗件分離、の 3 点が新たな race source になる。cursor 単独では「次走査開始 id」しか表せず、失敗 id を skip すると無限後退する。
- **本タスクへの影響**: Phase 2 で **dedupe 設計**（`schema_diff_queue` に `dedupe_key` 列追加 vs KV in-flight marker vs D1 row lock の比較）と **failed_items 分離 + retry counter による無限ループ防止** を base case として固定する必要がある。remaining-scan model は `COUNT(*) WHERE key = '__extra__:<questionId>'` を毎 batch 再評価することで、failed_items を skip しても残件数が単調減少することを保証する。
- **参照**: 親 phase-02 resumable-backfill-design.md / `schemaDiffQueue.ts` 現行 schema

---

## 価値とコスト

- **価値**: 親タスクで残った条件付き未対応事項を **「客観 evidence で着手判断 → 着手時は責務分離 boundary を明示」** という形に正本化することで、CPU budget 超過が再発した瞬間に YAGNI 議論抜きで実装着手できる状態にする。dedupe / partial failure recovery / response contract 拡張も同時に閉じる。
- **コスト**: Phase 1-4 / 7-10 の仕様書整備（先行可能）+ Phase 11 staging 実測（credentials 必要）+ 着手 gate 成立時の実装（`wrangler.toml` 1 binding 追加 / consumer 1 ファイル / migration 1 本 / repository / route / test）。中規模見積もり。Free プラン制約下では Cron Trigger 経路を base case にする可能性あり。
- **機会コスト**: 放置すると、本番で 10,000+ 行投入時に管理 UI が CPU budget exhaust 表示のまま停止し、運用者が手動で何度も apply を叩き直す事態になる。dedupe なしの並列 retry が race condition を引き起こす可能性も残る。

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 着手 gate の客観化 + 責務分離 boundary 確定 + dedupe + partial failure recovery + response contract 拡張を一括で閉じ、CPU budget 超過再発時に即着手可能な状態を作る |
| 実現性 | PASS | Cloudflare Queues / Cron Trigger いずれも既存スタックで実装可能。`wrangler.toml` 1 binding 追加 + consumer 1 ファイル + migration 1 本で済む。staging 実測は `scripts/cf.sh` 経由で実行可能 |
| 整合性 | PASS | 不変条件 #5（D1 アクセスは apps/api 限定）に整合。Queue consumer / Cron handler すべて apps/api 内に閉じる。aiworkflow-requirements 同期更新で正本一貫性を維持 |
| 運用性 | PASS | 着手 gate を Phase 11 evidence で判定する設計により、不要実装を起こさない。binding drift 防止のため staging / production / CI variables / runbook を同一 wave で同期する手順を Phase 5 runbook で固定 |

---

## 受入条件（AC）

`index.md` と完全一致（AC-1〜AC-11）。

- [ ] AC-1: staging 10,000+ rows fixture と既存 API（dryRun/apply/retry）の before evidence が Phase 11 に保存され、着手 gate（持続再現 / 収束）が判定されている
- [ ] AC-2: 着手 gate 成立時、Cloudflare Queue または Cron Trigger のいずれを採用するかの設計判断が Phase 2 で根拠付き決定されている（trade-off 表）
- [ ] AC-3: 着手 gate 成立時、alias 確定と back-fill 継続の状態が API request 内 / queue/cron consumer 内に責務分離されている
- [ ] AC-4: 着手 gate 成立時、API response が `confirmed: true` と `backfill.status: pending|running|exhausted|completed` を区別して返す契約に統一されている
- [ ] AC-5: 着手 gate 成立時、batch 処理が remaining-scan model + idempotent update で実装され、duplicate enqueue / duplicate processing / partial failure recovery が test で固定されている
- [ ] AC-6: 着手 gate 成立時、Cloudflare binding（Queue / Cron / KV など必要なもの）が `wrangler.toml`、CI variables、runbook で staging / production 一致している
- [ ] AC-7: route / workflow / repository tests が PASS し、idempotent retry / duplicate enqueue 抑止 / partial failure recovery / batch size boundary を網羅している
- [ ] AC-8: 着手 gate 成立時、staging 10,000+ rows after evidence で CPU budget exhaustion が運用上収束することが確認されている
- [ ] AC-9: 不変条件 #5（D1 直接アクセスは apps/api 限定）違反ゼロ。queue consumer / cron handler すべて `apps/api/**` 配下に閉じる
- [ ] AC-10: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- [ ] AC-11: Phase 12 で 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main）と aiworkflow-requirements（api-endpoints / database-schema / task-workflow-active / indexes）が同期されている

---

## 完了条件チェックリスト

- [ ] `artifacts.json.metadata.visualEvidence` が `NON_VISUAL` で固定確認済み
- [ ] 真の論点が「Queue を入れる/Cron に分ける」ではなく「条件付き着手 gate の客観化 + 責務分離 boundary 設計」に再定義されている
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 依存境界表に上流 1 / 関連 2 / 下流 1 すべて前提と出力付きで記述
- [ ] 既存差分前提表（駆動主体 / response 契約 / cursor / dedupe / partial failure / binding / カラム）が出典付き
- [ ] 苦戦箇所 3 件（staging 実測未完 / Queue vs Cron 基準 evidence 待ち / dedupe & partial failure 境界未定義）が言語化
- [ ] AC-1〜AC-11 が `index.md` と完全一致
- [ ] 不変条件 #5 への影響方針が示されている
- [ ] Issue #361 を再 OPEN しない方針が明示

---

## 実行手順

### ステップ 1: 起票仕様 / 親タスク完了 evidence の写経確認

- Issue #361 body を `gh issue view 361` で読み（CLOSED 状態のまま参照のみ）、AC / リスク / scope と本 Phase 文書の論理一致を確認する。
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md` を Read し、本タスクが「条件付き未対応 detection」であることを再確認する。

### ステップ 2: 既存実装と Cloudflare binding の照合

- `apps/api/src/workflows/schemaAliasAssign.ts` を Read し、現行 Stage 1（alias 確定）/ Stage 2（`backfillResponseFields`）の境界を行番号付きで `outputs/phase-01/main.md` に記録する。
- `apps/api/src/routes/admin/schema.ts` L162-185 の 202 retryable 判定を抽出し、`confirmed` / `backfill.status` 拡張で変わる points を記録する。
- `apps/api/src/repository/schemaDiffQueue.ts` の現行 schema を抽出し、dedupe key 列追加候補（`dedupe_key TEXT NULL UNIQUE`）と KV in-flight marker 案の比較入力を準備する。
- `apps/api/wrangler.toml` の `[triggers]` / `[env.production.triggers]` / `[env.staging.triggers]` を Read し、新規 Queue 追加 / 追加 Cron 追加時の干渉点（既存 3 本との order / Free プラン上限）を記録する。

### ステップ 3: 4 層責務の言語化

- route 層（API request 内：alias 確定 + Queue/Cron enqueue + `confirmed` 即時返却）/ workflow 層（Stage 1 同期 + Stage 2 自走 batch）/ queue consumer or cron handler 層（remaining-scan + idempotent UPDATE + retry counter）/ repository 層（dedupe key / failed_items / cursor 永続）の 4 層を `outputs/phase-01/main.md` で図表化し、Phase 2 の責務分離設計を一意化する。

### ステップ 4: 4 条件と AC のロック

- 4 条件すべて PASS で固定されていることを確認。
- AC-1〜AC-11 を `index.md` と完全一致で `outputs/phase-01/main.md` に列挙。

### ステップ 5: artifacts.json 同期

- `phases[0].status` = `spec_created` / `metadata.visualEvidence` = `NON_VISUAL` を確認。

---

## 多角的チェック観点

- **不変条件 #5**: queue consumer / cron handler / migration / repository / workflow / route すべて `apps/api/**` 配下に閉じる設計入力か。`apps/web` から D1 binding を直接参照させる経路を含まないか。
- **直交性**: 本 Phase が「設計判断（Queue or Cron / batch size / dedupe 実装方式）」を含んでいないか。Phase 1 は論点整理に徹する。判断は Phase 2 で行う。
- **起票仕様一致**: Issue #361 body の AC / リスク / スコープと一字一句の論理矛盾がないか。`Closes #361` ではなく `Refs #361` を採用する方針が含まれているか。
- **苦戦箇所網羅**: (a) staging 実測未完, (b) Queue vs Cron 基準 evidence 待ち, (c) dedupe & partial failure 境界未定義 の 3 件が漏れなく言語化されているか。
- **NON_VISUAL 適合**: スクリーンショット要求が混入していないか。
- **条件付き着手 gate**: Phase 11 evidence なしに Phase 5 以降の実装に着手しない方針が明示されているか。

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | visualEvidence = NON_VISUAL の確定 | 1 | pending | artifacts.json と同期 |
| 2 | 真の論点を「着手 gate 客観化 + 責務分離 boundary」に再定義 | 1 | pending | main.md 冒頭 |
| 3 | 依存境界（上流 1 / 関連 2 / 下流 1）の固定 | 1 | pending | UT-07B 完了状態 / aiworkflow / staging / FU-02 |
| 4 | 既存差分前提表の固定（駆動 / response / cursor / dedupe / partial / binding / カラム） | 1 | pending | 出典付き |
| 5 | 苦戦箇所 3 件の言語化 | 1 | pending | staging 未完 / Queue vs Cron / dedupe & partial failure |
| 6 | 4 条件 PASS 根拠の固定 | 1 | pending | 全件 PASS |
| 7 | AC-1〜AC-11 の確定 | 1 | pending | index.md と完全一致 |
| 8 | 不変条件 #5 への影響方針記述 | 1 | pending | apps/api 境界 |
| 9 | 着手 gate 判定基準の Phase 11 移譲明示 | 1 | pending | Phase 5 以降は gate 後 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（真の論点 / 依存境界 / 既存差分 / 苦戦箇所 3 件 / 4 条件評価 / AC / 着手 gate 方針） |
| メタ | artifacts.json | Phase 1 状態の更新 |

---

## タスク 100% 実行確認【必須】

- 全実行タスク（5 件）と全サブタスク（9 件）が `spec_created` へ遷移
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 3 件すべてが Phase 2 の決定論点（trade-off / batch contract / dedupe / response contract）に対応している
- `artifacts.json` の `phases[0].status` が `spec_created`
- `artifacts.json` の `metadata.visualEvidence` が `NON_VISUAL`
- Issue #361 の状態が CLOSED のまま（再 OPEN していない）

---

## 次 Phase への引き渡し

- 次 Phase: 2（設計 - Queue vs Cron / batch contract / remaining-scan model）
- 引き継ぎ事項:
  - 真の論点 = 着手 gate の客観化 + 責務分離 boundary 設計
  - 既存差分前提表（駆動主体 / response 契約 / cursor / dedupe / partial failure / binding / カラム不在）
  - 苦戦箇所 3 件（staging 実測未完 / Queue vs Cron 基準 evidence 待ち / dedupe & partial failure 境界未定義）
  - 既存実装の参照点（`schemaAliasAssign.ts` Stage 1 / Stage 2、`schema.ts` 202 retryable、`schemaDiffQueue.ts`、`wrangler.toml` 既存 binding）
  - 4 層責務（route / workflow / queue consumer or cron handler / repository）
  - 不変条件 #5 を満たす設計上の制約
  - Phase 11 を着手 gate にする条件付き実行設計
- ブロック条件:
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-11 が `index.md` と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
  - Issue #361 が再 OPEN されている
  - 起票仕様との論理矛盾

---

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow / queue consumer / cron handler integration test に接続する。
- Cloudflare binding（Queue / Cron / KV）、`schema_diff_queue` dedupe / failed_items、remaining-scan idempotent UPDATE、`confirmed` / `backfill.status` response 契約、staging 10,000+ rows evidence は Phase 4 / Phase 9 / Phase 11 で実測またはテスト証跡へ連結する。
