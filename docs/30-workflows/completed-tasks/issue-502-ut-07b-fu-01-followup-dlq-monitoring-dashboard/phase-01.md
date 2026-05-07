# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-502 UT-07B-FU-01-FOLLOWUP schema alias back-fill Queue / DLQ 監視ダッシュボード整備 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義（真の論点 / 観測対象棚卸し / 苦戦箇所） |
| 作成日 | 2026-05-07 |
| Wave | 2（UT-07B-FU-01 staging / production デプロイ済み前提） |
| 実行種別 | sequential |
| 前 Phase | なし |
| 次 Phase | 2（設計 - 集計 SQL / runbook 構造 / skill references 追記） |
| 状態 | spec_created |
| 実装区分 | **ドキュメントのみ（CONST_004 例外条件適用 / コード変更なし）** |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #502（CLOSED 維持・再 OPEN しない / PR 文面は `Refs #502, Refs #UT-07B-FU-01`） |
| 親タスク | ut-07b-fu-01-schema-alias-backfill-queue-cron-split |

---

## 目的

UT-07B-FU-01 で導入した **schema alias back-fill の Cloudflare Queue / DLQ binding** と D1 `schema_diff_queue` の failure 永続化列を、運用者が単一 runbook + read-only D1 集計 SQL で観測できる状態に到達するための「論点」「観測対象」「依存境界」「AC」を Phase 1 で固定する。

Phase 1 は決定そのものを行わず、Phase 2 が「集計 SQL 設計 / runbook 章構成 / skill references 追記構造」を一意に絞り込める粒度で、論点・観測対象棚卸し・苦戦箇所・依存境界・AC を確定する Phase として閉じる。

具体的には次の 4 点を入力として整える:

1. 真の論点（true issue）を「Queue を分割するか / retry を増やすか」ではなく **「Queue / DLQ メトリクスと D1 failure 永続化列を runbook 単一 view から read-only に観測できる状態を確立し、しきい値超過時の次アクション分岐を機械化する」** に再定義する。
2. 観測対象棚卸し（Cloudflare Queue 内蔵指標 / DLQ 内蔵指標 / D1 列 4 種 + `backfill_status='exhausted'`）と binding 名の正規化を完了させる。
3. 苦戦箇所 3 件以上（DLQ が空で観測手順を staging で実証できないリスク / Cloudflare Queue Analytics が Workers Paid 限定の可能性 / staging fixture 不足）を言語化する。
4. AC-1〜AC-11 を `index.md` と完全一致で固定する。

---

## 真の論点 (true issue)

「Queue を分割する」「retry を増やす」「DLQ TTL を変える」のどれにするかは表層の選択肢であり、本タスクの本質ではない。本タスクの真の論点は次の 1 点に圧縮できる。

### 論点: Queue / DLQ + D1 failure 永続化列を runbook 単一 view で read-only に観測する正本ベースラインの確立 + しきい値超過 trigger による次アクション機械分岐

UT-07B-FU-01 のリリース時点では:

- Cloudflare Queue / DLQ binding は `wrangler.toml` に存在し、consumer shim は `apps/api/src/index.ts` に存在する
- `schemaDiffQueue.ts` repository は `retry_count` / `failed_items_json` / `last_error` / `last_processed_at` を永続化する
- しかしランタイム上で「DLQ に何件投入されているか」「retry_count 過剰の row はどれか」「`backfill_status='exhausted'` が何時間滞留しているか」を観測する **単一エントリポイントが存在しない**

本タスクの責務は **「観測対象を runbook に集約し、read-only 集計 SQL とダッシュボード手順で運用者が異常を判断できる状態を作る + しきい値超過時は本タスクではなく別 unassigned task に escalation する」** ことに限定される。

したがって、本タスクは:

- **コード変更を伴わない**（runbook markdown + 集計 SQL code block + skill references topic 追加 + index 再生成のみで完結）。
- **alert / pager / retry 増強 / 通知基盤の実装は本タスク責務外**（必要時は別 unassigned task として `gh issue create` 起票する）。
- **GitHub Issue #502 は CLOSED のまま据え置き**（再 OPEN しない / PR 文面は `Refs #502, Refs #UT-07B-FU-01`）。

---

## 実装区分の確定

`[実装区分: ドキュメントのみ]`

CONST_004 例外条件適用根拠:

- 成果物は (a) runbook markdown 追加、(b) D1 集計 SQL を runbook 内 code block として記載、(c) `.claude/skills/aiworkflow-requirements/references/` への DLQ 監視 topic 追加、(d) `pnpm indexes:rebuild` による skill index 再生成 に完結する。
- ソース（`apps/api/src/**`）/ テスト / 設定（`wrangler.toml` / migration / D1 schema）の変更を一切伴わない。
- 集計 SQL は `SELECT` のみで構成し、`INSERT` / `UPDATE` / `DELETE` を含まない（AC-7）。
- しきい値超過時の retry / alert 追加が必要となった場合は、本仕様書スコープ外として **別 unassigned task を起票** する。

CONST_005 必須項目の取り扱い:

- 「変更対象ファイル」「テスト方針」「ローカル実行コマンド」「DoD」は実装仕様書同等の粒度で記述し、後続実行者が迷わない粒度を確保する。
- 「関数シグネチャ」「型定義」「コードテスト」は **N/A（コード変更なし）** と明記する。

---

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 対象は Cloudflare dash / D1 SQL 集計 / runbook markdown 追記。UI 変更なし |
| 成果物の物理形態 | runbook markdown（追加）+ skill references markdown（追加）+ skill index 再生成差分（drift ゼロ） | スクリーンショット不要 |
| 検証方法 | 集計 SQL の `EXPLAIN` / `rg` で `INSERT|UPDATE|DELETE` 不在確認 / `pnpm indexes:rebuild` の git diff / staging D1 fixture での dry-run | NON_VISUAL 縮約手順を Phase 11 で適用 |

`artifacts.json.metadata.visualEvidence` は `NON_VISUAL` で固定。

---

## 観測対象棚卸し

### Cloudflare Queue / DLQ binding（`apps/api/wrangler.toml` 由来）

| 種別 | binding 変数 | queue 名 (production) | queue 名 (staging) |
| --- | --- | --- | --- |
| 主 Queue | `SCHEMA_ALIAS_BACKFILL_QUEUE` | `schema-alias-backfill` | `schema-alias-backfill-staging` |
| DLQ | （consumer の `dead_letter_queue` 経由） | `schema-alias-backfill-dlq` | `schema-alias-backfill-staging-dlq` |

> 厳密な binding 文字列は Phase 2 で `wrangler.toml` を読み replace 不要レベルで runbook に転記する。

### D1 `schema_diff_queue` テーブルの監視対象列

| 列 | 用途 | 観測条件 |
| --- | --- | --- |
| `retry_count` | consumer batch retry の累計 | `retry_count >= 3` で過剰 |
| `failed_items_json` | DLQ 投入相当 / item 単位失敗の永続化 | `IS NOT NULL` で DLQ 投入相当 |
| `last_error` | 最終エラー文字列 | redaction 観点で skill references に転記しない |
| `last_processed_at` | 最終処理時刻（UTC） | `exhausted` 滞留時間算出のキー |
| `backfill_status` (or 等価 status 列) | back-fill 状態（`pending` / `running` / `exhausted` / `done` 等） | `backfill_status='exhausted'` かつ `last_processed_at < now - 24h` で滞留 |

> 厳密な列名・型は migration `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` で確認する責務を Phase 2 に渡す。本 Phase は「観測対象 5 軸」が固定されたことのみを confirm する。

---

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | `ut-07b-fu-01-schema-alias-backfill-queue-cron-split`（完了済 / staging+production デプロイ済前提） | Queue / DLQ binding が `wrangler.toml` で宣言済 / migration `0014_schema_diff_queue_dedupe_failure.sql` 適用済 | 観測対象 binding 名 + D1 列 5 種 |
| 上流（外部） | Cloudflare dash / Workers Analytics / Cloudflare API | 1Password 経由 `CLOUDFLARE_API_TOKEN` (`scripts/cf.sh` がラップ) / dash UI 利用権限 | Queue / DLQ メトリクス（messages, dead-letters, retries, ack rate） |
| 関連 | `aiworkflow-requirements`（`references/` 配下に DLQ 監視 topic 追加 / `topic-map` / `keywords.json` / `quick-reference` / `resource-map` 再生成） | 既存 references の構成 / `pnpm indexes:rebuild` スクリプト | DLQ 監視 topic markdown + index 再生成差分 |
| 下流 | 運用（Phase 12 後・別 unassigned task） | しきい値超過判定結果 | retry / alert / pager 統合が必要な場合の `gh issue create` 起票 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Issue #502 body | 起票仕様（CLOSED 維持・参照のみ）。`gh issue view 502` で取得 |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/index.md` | 本タスク metadata / AC-1〜AC-11 / スコープ正本 |
| 必須 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` | 起票元仕様 |
| 必須 | `apps/api/wrangler.toml` | Queue / DLQ binding 名の正本 |
| 必須 | `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | D1 列の正本 |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | `retry_count` / `failed_items_json` / `last_error` / `last_processed_at` の永続化点 |
| 必須 | `scripts/cf.sh` | D1 / Workers アクセスラッパー（`wrangler` 直接禁止） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/` | DLQ 監視 topic 追加先 |
| 参考 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-dlq-monitoring-dashboard.md` | 検出根拠 |
| 参考 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/` | docs-only exemplar |
| 参考 | `.claude/skills/task-specification-creator/references/phase-template-phase1.md` | Phase 1 テンプレ |

---

## 苦戦箇所【記入必須】

### 1. DLQ がそもそも空で、staging で観測手順を実証できないリスク

- **対象**: staging Queue (`schema-alias-backfill-staging`) と staging DLQ (`schema-alias-backfill-staging-dlq`)、staging D1 `schema_diff_queue`
- **症状**: UT-07B-FU-01 の back-fill batch が staging で正常完走している場合、`failed_items_json IS NOT NULL` の row が **0 件**であり、集計 SQL は構文上は通るが「実データ上で異常を検知できる」ことを証明する staging dry-run ができない。runbook の正しさを実体で確認できないまま production に持ち込むことになる。
- **本タスクへの影響**: Phase 4 検証戦略で「staging fixture 集計の dry-run」を `count = 0` を許容する形で設計し、Phase 6 異常系で「DLQ ゼロ件 / failed_items_json 全件 NULL」を仕様上の正常状態として扱う。Phase 11 の手動検証で count=0 でも SQL が syntax error を出さず行返却できることを `EXPLAIN` で先行確認するアプローチを取る。集計 SQL 自体は count を返すため count=0 を「観測 OK / 異常なし」と機械判定できることが救い。
- **参照**: 起票元仕様 リスク表「DLQ 監視を自動化しないまま放置」

### 2. Cloudflare Queue Analytics（messages / dead-letters / retries の内蔵指標）が Workers Paid 限定の可能性

- **対象**: Cloudflare dash の Queue / DLQ メトリクス画面、Workers Analytics
- **症状**: Cloudflare Queues はプラン依存で内蔵 Analytics の粒度が異なり、Workers Free では Queues 自体が利用不可・Workers Paid でも DLQ 別の grouping が dash 上に表示されないケースが報告されている。dash 経由の観測が利用不可なら runbook の AC-1（Queue / DLQ メトリクスの観測手順）が空振りする。
- **本タスクへの影響**: Phase 2 で「dash 内蔵指標 → 利用可能な場合は記載」「dash 上で参照不能な場合は `scripts/cf.sh queues list` 等の出力で代替」というフォールバック構造を runbook に組み込み、AC-1 を「dash または `scripts/cf.sh` 経由の Queue 確認手順が記載されれば充足」と定義する。D1 集計 SQL は AC-2 の正本観測経路であり、AC-1 の代替にはしない。
- **参照**: 起票元仕様 「3.1 前提条件」 / Cloudflare Queues プラン依存

### 3. staging fixture 不足で集計 SQL の出力例（sample row）を runbook に書けない

- **対象**: staging D1 `schema_diff_queue` の現状データ
- **症状**: runbook には「集計 SQL を実行すると、たとえばこのような出力が返る」というサンプル出力を併記したいが、staging で `failed_items_json IS NOT NULL` の row が現実に 0 件なら sample 出力は「(0 rows)」しか書けない。読者が「異常時に何が出るか」を runbook 上で理解できないと運用判断が遅れる。
- **本タスクへの影響**: Phase 2 で sample 出力を 2 種類（(a) staging 実 dry-run の `(0 rows)` 出力 / (b) 仮想異常データを想定した「期待される出力フォーマット」のスケッチ）並記する設計に固定する。仮想 sample は runbook 上に「※サンプル（実 staging 値ではない）」と注記し、混同を防ぐ。コード変更を伴わずに学習価値を担保するための中間策。
- **参照**: 起票元仕様 「Phase 5: 検証」 / 親タスク Phase 12 の D1 状態スナップショット

---

## 価値とコスト

- **価値**: Queue / DLQ メトリクス + D1 failure 永続化列を runbook 単一 view に集約し、運用者が単独で異常検知できる正本ベースラインを確立。しきい値超過時は別 unassigned task に機械的に escalation でき、observability 債務が放置されない。aiworkflow-requirements skill から binding 名 / D1 schema を逆引きできる効果も得られる。
- **コスト**: runbook markdown 1 章 + 集計 SQL 3 種（runbook 内 code block）+ skill references 1 topic + index 再生成のみ。コード変更ゼロ・migration ゼロ・production 副作用ゼロ。small 見積もり。
- **機会コスト**: 放置すると、DLQ 投入が静かに蓄積し特定 schema diff の back-fill が永久に未完了のまま残る / `retry_count` 過剰のループが課金面で増える / `exhausted` 滞留が異常か正常か判断不能。

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Queue / DLQ + D1 failure 永続化列を runbook 単一 view に集約し、しきい値 trigger で別 unassigned task に機械分岐できる observability ベースラインを確立 |
| 実現性 | PASS | runbook markdown + 集計 SQL（read-only） + skill references topic 追加 + `pnpm indexes:rebuild` のみで実装可能。コード変更ゼロ。Cloudflare Analytics 不可時の `scripts/cf.sh queues list` フォールバックも保有 |
| 整合性 | PASS | 不変条件 1〜7 すべて影響なし。`apps/api` 外部からの D1 直接アクセスではなく `scripts/cf.sh d1 execute` 経由の運用 read-only 参照（コード経路の D1 アクセス点は不変）。aiworkflow-requirements 同期で正本一貫性を維持 |
| 運用性 | PASS | しきい値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）を起票元仕様から保守的に継承。集計 SQL は count を返すため staging count=0 でも機械判定可能。`scripts/cf.sh` 経由で 1Password + Node 24 + esbuild 解決込み |

---

## 受入条件（AC）

`index.md` AC-1〜AC-11 と完全一致。

- [ ] AC-1: Cloudflare Queue / DLQ メトリクスの観測手順（dash / Workers Analytics 内蔵指標 / `scripts/cf.sh queues list` フォールバック）が runbook に記載されている
- [ ] AC-2: D1 集計 SQL（DLQ 投入: `failed_items_json IS NOT NULL` / retry 過剰: `retry_count >= 3` / exhausted 滞留: 24h 以上）が runbook に記載されている
- [ ] AC-3: 異常しきい値（DLQ ≥ 1、retry ≥ 3、exhausted 24h）が文書化されている
- [ ] AC-4: エスカレーション先と次アクション分岐（観測のみ → 別 unassigned task 起票）が runbook に明記されている
- [ ] AC-5: aiworkflow-requirements skill の `references/` に DLQ 監視 topic が追加されている
- [ ] AC-6: `topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` が drift なし（`pnpm indexes:rebuild` で確認）
- [ ] AC-7: 集計 SQL が read-only（`INSERT` / `UPDATE` / `DELETE` を含まない）
- [ ] AC-8: Queue / DLQ binding 名（`SCHEMA_ALIAS_BACKFILL_QUEUE` / `schema-alias-backfill[-staging]` / `schema-alias-backfill[-staging]-dlq`）と D1 schema（`schema_diff_queue` の監視対象列）が aiworkflow-requirements から逆引きできる
- [ ] AC-9: 既存 schema / API contract / Queue 構造の変更がない
- [ ] AC-10: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- [ ] AC-11: Phase 12 strict 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）に加え、runbook 本体と aiworkflow-requirements skill 同期が完了

---

## 不変条件への影響

| # | 不変条件 | 影響 | 対策 |
| --- | --- | --- | --- |
| 1 | 実フォーム schema をコードに固定しすぎない | なし | コード変更なし |
| 2 | consent キー（`publicConsent` / `rulesConsent`）統一 | なし | コード変更なし |
| 3 | `responseEmail` は system field | なし | コード変更なし |
| 4 | Google Form schema 外は admin-managed data として分離 | なし | コード変更なし |
| 5 | D1 直接アクセスは `apps/api` 限定 | なし | 運用 SQL は `scripts/cf.sh d1 execute` 経由（コード経路の binding は不変） |
| 6 | GAS prototype は本番昇格しない | なし | GAS 非対象 |
| 7 | MVP では Google Form 再回答が本人更新の正式経路 | なし | フォーム関連変更なし |

---

## 変更対象ファイル

| パス | 変更種別 | 備考 |
| --- | --- | --- |
| `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` | 新規（runbook 本体） | Cloudflare dash 手順 + 集計 SQL 3 種 + 異常閾値 + escalation 分岐 |
| `.claude/skills/aiworkflow-requirements/references/<dlq-monitoring-topic>.md` | 新規 | DLQ 監視 topic（binding 名 / D1 schema 逆引き / 集計 SQL リンク） |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 自動再生成 | `pnpm indexes:rebuild` の出力 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 自動再生成 | `pnpm indexes:rebuild` の出力 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 自動再生成 | `pnpm indexes:rebuild` の出力 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 自動再生成 | `pnpm indexes:rebuild` の出力 |
| `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md`（または `workflow-local close-out`） | 1 行追記 | DLQ 監視 topic 追加の change history |
| `outputs/phase-11/dlq-aggregation-staging.log` | 新規（成果物） | staging D1 集計 SQL の dry-run 出力 |
| `outputs/phase-12/skill-references-diff.md` | 新規（成果物） | references 追記差分記録 |

関数シグネチャ / 型定義 / コードテスト: **N/A（コード変更なし）**

---

## ローカル実行コマンド

```bash
# Queue / DLQ binding 確認（runbook 記載前の事実確認）
rg -n "SCHEMA_ALIAS_BACKFILL_QUEUE|schema-alias-backfill" apps/api/wrangler.toml

# D1 列の事実確認（migration から)
rg -n "retry_count|failed_items_json|last_error|last_processed_at" \
  apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql

# 集計 SQL dry-run (staging)
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS dlq_equivalent FROM schema_diff_queue WHERE failed_items_json IS NOT NULL"

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS retry_excess FROM schema_diff_queue WHERE retry_count >= 3"

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS exhausted_stalled FROM schema_diff_queue \
             WHERE backfill_status = 'exhausted' AND last_processed_at < datetime('now', '-24 hours')"

# read-only 確認
rg -i -e 'INSERT|UPDATE|DELETE|DROP|ALTER' \
  docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/

# skill index drift 確認
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/
```

---

## DoD（Definition of Done / Phase 1）

- [ ] 真の論点が「Queue / DLQ + D1 failure 永続化列を runbook 単一 view で read-only 観測 + しきい値 trigger 機械分岐」に再定義されている
- [ ] 観測対象棚卸し（Queue / DLQ binding 4 名 + D1 列 5 種）が言語化されている
- [ ] 苦戦箇所 3 件（DLQ ゼロ件 staging dry-run / Queue Analytics プラン依存 / staging fixture 不足）が言語化されている
- [ ] 依存境界（上流 2 / 関連 1 / 下流 1）が記述されている
- [ ] AC-1〜AC-11 が `index.md` と完全一致
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 不変条件 1〜7 への影響が「すべてなし」と確定
- [ ] Issue #502 を再 OPEN しない方針が明示されている
- [ ] `artifacts.json.phases[0].status` が `spec_created`、`metadata.visualEvidence` が `NON_VISUAL`

---

## 次 Phase への引き渡し

- 次 Phase: 2（設計 - 集計 SQL / runbook 構造 / skill references 追記）
- 引き継ぎ事項:
  - 真の論点 = Queue / DLQ + D1 failure 永続化列の単一 view 観測 + しきい値 2 分岐
  - 観測対象 Queue / DLQ binding 4 名（prod / staging × 主 / DLQ） + D1 列 5 種
  - 苦戦箇所 3 件（DLQ ゼロ件 staging dry-run / Queue Analytics プラン依存 / staging fixture 不足）
  - AC-1〜AC-11（index.md と完全一致）
  - ドキュメントのみ仕様書（CONST_004 例外条件適用 / コード変更なし）
- ブロック条件:
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-11 が `index.md` と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
  - Issue #502 が再 OPEN されている

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| Phase spec | 本ファイル | 本 Phase の実行可能仕様 |
| outputs | `outputs/phase-01/` | 本 Phase の evidence / summary（必要時） |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] docs-only / NON_VISUAL / Issue #502 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として 集計 SQL の `rg` による read-only grep（`INSERT|UPDATE|DELETE|DROP|ALTER` 不在）、staging D1 dry-run（count 返却）、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
