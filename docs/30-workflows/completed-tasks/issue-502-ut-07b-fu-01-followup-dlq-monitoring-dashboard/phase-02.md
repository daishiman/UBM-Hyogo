# Phase 2: 設計（集計 SQL / runbook 構造 / skill references 追記）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-502 UT-07B-FU-01-FOLLOWUP schema alias back-fill Queue / DLQ 監視ダッシュボード整備 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（集計 SQL / runbook 構造 / skill references 追記） |
| 作成日 | 2026-05-07 |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（設計レビューゲート） |
| 状態 | spec_created |
| 実装区分 | **ドキュメントのみ（CONST_004 例外条件適用 / コード変更なし）** |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #502（CLOSED 維持） |

---

## 目的

Phase 1 で固定した「Queue / DLQ + D1 failure 永続化列を runbook 単一 view で read-only 観測 + しきい値 trigger 機械分岐」を、(1) **集計 SQL 設計**（DLQ 投入相当 / retry 過剰 / exhausted 滞留 の 3 種 + read-only 不変条件）、(2) **runbook 章構造設計**（前提 → 観測手順 → 集計 SQL → しきい値 → escalation の 5 章）、(3) **skill references 追記構造設計**（aiworkflow-requirements の `references/` 配下 1 topic + index 4 種再生成）、(4) **`scripts/cf.sh` 実行フロー設計** + **Cloudflare Queue Analytics 観測パス設計**（dash 手順 / `scripts/cf.sh queues list` フォールバック） の 4 軸で設計する。Phase 3 が 4 観点 / 4 条件で MAJOR / MINOR / PASS を判定できる粒度の設計入力を作成する。

CONST_005 必須項目（変更対象ファイル / テスト方針 / ローカル実行コマンド / DoD）の骨格を本 Phase で提示し、深掘りは Phase 5 / 6 / 9 に委譲する。関数シグネチャ / 型定義 / コードテストは **N/A（コード変更なし）**。

---

## 設計対象 4 軸

### 軸 1: 集計 SQL 設計（DLQ 投入相当 / retry 過剰 / exhausted 滞留）

すべて `SELECT` のみで構成し、`INSERT` / `UPDATE` / `DELETE` / `DROP` / `ALTER` を含まない（AC-7）。`scripts/cf.sh d1 execute <DB> --env <ENV> --command "<SQL>"` 経由で実行する。

**1-1. DLQ 投入相当の row 数集計**

```sql
-- DLQ 投入相当 = item 単位失敗が永続化された row（failed_items_json IS NOT NULL）
SELECT
  COUNT(*) AS dlq_equivalent_total,
  COUNT(DISTINCT diff_id) AS dlq_equivalent_diff_ids
FROM schema_diff_queue
WHERE failed_items_json IS NOT NULL;
```

異常判定: `dlq_equivalent_total >= 1` で要調査（AC-3）。

**1-2. retry 過剰の row 一覧（threshold = 3）**

```sql
-- retry_count >= 3 の row（過剰 retry）
SELECT
  diff_id,
  retry_count,
  backfill_status,
  last_processed_at
FROM schema_diff_queue
WHERE retry_count >= 3
ORDER BY retry_count DESC, last_processed_at DESC
LIMIT 50;
```

異常判定: 1 件でも返れば要調査（AC-3）。`last_error` は redaction 観点で SELECT 句に含めない（runbook 上で明示）。

**1-3. exhausted 滞留 24h 以上の row 一覧**

```sql
-- backfill_status='exhausted' かつ last_processed_at < now - 24h
SELECT
  diff_id,
  status,
  retry_count,
  last_processed_at,
  CAST(
    (julianday('now') - julianday(last_processed_at)) * 24 AS INTEGER
  ) AS stalled_hours
FROM schema_diff_queue
WHERE backfill_status = 'exhausted'
  AND last_processed_at < datetime('now', '-24 hours')
ORDER BY last_processed_at ASC
LIMIT 50;
```

異常判定: 1 件でも返れば要調査（AC-3）。

> **厳密な状態列名は `backfill_status`**。Phase 5 では migration `0008_schema_alias_hardening.sql`（列追加）と `0014_schema_diff_queue_dedupe_failure.sql`（failure 永続化列追加）を直接読み、runbook に転記する。本 Phase は SQL 骨格のみ確定。

**1-4. read-only 不変条件の機械検証**

```bash
# runbook 内 SQL に書き換え系が混入していないか
rg -i -n -e '\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE)\b' \
  docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/dlq-monitoring-runbook.md \
  || echo "OK (read-only)"
```

期待: マッチ 0 件（exit 1）。1 件でも検出されたら AC-7 違反として Phase 6 異常系へ戻す。

### 軸 2: runbook 章構造設計

**2-1. 配置先**

| 案 | パス | base case |
| --- | --- | --- |
| **(A) outputs 配下（base case）** | `outputs/phase-11/dlq-monitoring-runbook.md` | ✅ 仕様書評価サイクル内に閉じる / Phase 12 で `docs/runbooks/` に転記する選択肢を残す |
| (B) `docs/runbooks/dlq-monitoring-schema-alias-backfill.md` | プロジェクト横断 runbook 配置 | Phase 12 で昇格させる場合の最終形 |

**判定**: runbook 本体は `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` に一本化する。Phase 5 / 11 は同パスの下書きと evidence を更新し、Phase 12 で正本化する。`outputs/phase-11/` は実行ログのみを置く。

**2-2. 章構成（5 章）**

```markdown
# DLQ Monitoring — schema alias back-fill

## 1. 前提と対象（binding 名 / D1 schema / migration 紐付け）
- Queue: SCHEMA_ALIAS_BACKFILL_QUEUE / prod=schema-alias-backfill / staging=schema-alias-backfill-staging
- DLQ: prod=schema-alias-backfill-dlq / staging=schema-alias-backfill-staging-dlq
- Table: schema_diff_queue（migration: 0014_schema_diff_queue_dedupe_failure.sql）
- Repository: apps/api/src/repository/schemaDiffQueue.ts
- 監視対象列: retry_count / failed_items_json / last_error / last_processed_at / backfill_status

## 2. Cloudflare Queue / DLQ メトリクス観測手順
- 2.1 Cloudflare dash → Workers & Pages → Queues → schema-alias-backfill[-staging] / schema-alias-backfill[-staging]-dlq
- 2.2 内蔵指標: messages, dead-letters, retries, ack rate（プランにより取得可否が異なる）
- 2.3 dash で参照不能な場合のフォールバック:
      bash scripts/cf.sh queues list   ← `scripts/cf.sh` 経由の許可済みサブコマンドとして実行
      （通せない場合は Phase 5 で D1 集計 SQL を AC-2 の正本観測経路にし、Queue 指標の自動化は CONST_005 に従ってユーザーへエスカレーション）

## 3. D1 集計 SQL（read-only / scripts/cf.sh d1 execute 経由）
- 3.1 DLQ 投入相当 → SQL 1-1
- 3.2 retry 過剰 → SQL 1-2
- 3.3 exhausted 滞留 24h 以上 → SQL 1-3
- 注意: last_error は redaction 観点で SELECT 句に含めない

## 4. 異常しきい値と判定
| 指標 | しきい値 | 判定 |
| --- | --- | --- |
| DLQ 投入 (failed_items_json IS NOT NULL) | >= 1 | 要調査 |
| retry_count | >= 3 | 要調査 |
| exhausted 滞留 | >= 24h | 要調査 |

## 5. エスカレーション分岐
- 5.1 すべての指標が「正常」 → 観測のみで終結（記録不要）
- 5.2 1 つでも「要調査」 → 別 unassigned task を `gh issue create` で起票（本 runbook では retry / alert 実装を行わない）
  起票テンプレ:
    gh issue create \
      --title "schema alias back-fill DLQ / retry 異常検知（YYYY-MM-DD）" \
      --body  "DLQ=N / retry>=3=N / exhausted>=24h=N。本 runbook 経由で観測。Refs #502, Refs #UT-07B-FU-01"
```

### 軸 3: skill references 追記構造設計

**3-1. 追記先 topic**

`.claude/skills/aiworkflow-requirements/references/` 配下に新規 topic を 1 件追加する。topic ファイル名候補:

| 案 | ファイル名 | base case |
| --- | --- | --- |
| **(A) `dlq-monitoring.md`（base case）** | 単独 topic として独立 | ✅ resource-map / topic-map で逆引き容易 |
| (B) 既存 `runtime-observability.md` 等への追記 | 既存 topic 拡張 | 既存 topic に observability セクションがあるか Phase 5 で確認 |

**判定**: (A) を base case 採用。Phase 5 で既存 topic に統合可能か再評価し、統合の方が DRY なら (B) に格下げする選択肢を残す。

**3-2. topic セクション構造**

```markdown
# DLQ Monitoring (schema alias back-fill)

## 概要
schema alias back-fill の Cloudflare Queue / DLQ + D1 schema_diff_queue 失敗永続化列を read-only に観測する正本。

## binding / queue 名
| 種別 | binding 変数 | prod | staging |
| --- | --- | --- | --- |
| 主 Queue | SCHEMA_ALIAS_BACKFILL_QUEUE | schema-alias-backfill | schema-alias-backfill-staging |
| DLQ | (consumer dead_letter_queue) | schema-alias-backfill-dlq | schema-alias-backfill-staging-dlq |

## D1 schema 監視対象（schema_diff_queue）
| 列 | 用途 | 異常判定 |
| --- | --- | --- |
| retry_count | retry 累計 | >= 3 |
| failed_items_json | 失敗 item 永続化 | IS NOT NULL = DLQ 投入相当 |
| last_error | 最終エラー | redaction（SELECT に含めない） |
| last_processed_at | 最終処理時刻 | exhausted 24h 滞留判定 |
| backfill_status | back-fill 状態 | backfill_status='exhausted' |

## 関連 runbook
docs/runbooks/dlq-monitoring/schema-alias-backfill.md

## 関連実装
- apps/api/wrangler.toml
- apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql
- apps/api/src/repository/schemaDiffQueue.ts
```

**3-3. index 再生成**

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/
# → drift があれば commit、drift なし（topic-map / keywords / quick-reference / resource-map が反映済）なら AC-6 充足
```

### 軸 4: `scripts/cf.sh` 実行フロー + Cloudflare Queue Analytics 観測パス

**4-1. `scripts/cf.sh d1 execute` の標準実行コマンド**

```bash
# DLQ 投入相当（staging）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS dlq_equivalent FROM schema_diff_queue WHERE failed_items_json IS NOT NULL"

# retry 過剰（staging）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT diff_id, retry_count, status, last_processed_at FROM schema_diff_queue WHERE retry_count >= 3 ORDER BY retry_count DESC LIMIT 50"

# exhausted 滞留（staging）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT diff_id, backfill_status, retry_count, last_processed_at FROM schema_diff_queue WHERE backfill_status='exhausted' AND last_processed_at < datetime('now','-24 hours') ORDER BY last_processed_at ASC LIMIT 50"

# production は Phase 13 以降のユーザー明示承認後のみ同等コマンドで DB 名と --env を差し替える。
# bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "..."
```

**4-2. Queue Analytics 観測パス**

| パス | 利用条件 | runbook 記載 |
| --- | --- | --- |
| Cloudflare dash UI（Workers & Pages → Queues） | アカウントが Queues 機能利用可 | 章 2.1 / 2.2 |
| `scripts/cf.sh queues list` 等のフォールバック | dash で表示不能 / API 経由が必要 | 章 2.3 |
| 取得不能（プラン制限）の場合 | Workers Free 等 | 章 2.3 末尾に「取得不能なら別 unassigned task で escalation」と注記 |

**4-3. プラン制限時の escalation 表現（base case）**

> Cloudflare Queue Analytics が dash / `scripts/cf.sh queues list` のいずれでも取得不能な場合、AC-1 は「Queue / DLQ 指標の取得不能理由と代替運用手順が runbook に明記されている」ことで境界付き PASS とする。D1 集計 SQL は AC-2 の正本観測経路であり、AC-1 そのものの代替とは扱わない。

---

## trade-off 表

### trade-off A: 集計 SQL の粒度（COUNT のみ vs row 一覧）

| 案 | 利点 | 欠点 | base case |
| --- | --- | --- | --- |
| COUNT のみ | shell exit コードで判定容易 / 出力短い | 異常 row の特定に追加 SQL 必要 | - |
| **COUNT + LIMIT 50 row 一覧（base case）** | しきい値判定 + 異常 row 特定が 1 回で済む | 出力が長い | ✅ |
| 全 row 出力 | 完全情報 | スケール時に出力膨張 | - |

**判定**: COUNT + LIMIT 50 を base case 採用。runbook 上は SQL 1-1 を COUNT、1-2 / 1-3 を row 一覧（LIMIT 50）として並記する。

### trade-off B: しきい値の保守性（起票元仕様継承 vs 緩和）

| 案 | DLQ | retry | exhausted | base case |
| --- | --- | --- | --- | --- |
| **起票元仕様継承（base case）** | >= 1 | >= 3 | >= 24h | ✅ |
| 緩和案 | >= 5 | >= 5 | >= 72h | - |
| 厳格案 | >= 1 | >= 1 | >= 6h | - |

**判定**: 起票元仕様の保守的初期値（`>= 1` / `>= 3` / `>= 24h`）を base case 採用。staging 観測後に Phase 12 documentation-changelog で見直し余地を残す。

### trade-off C: skill references topic の単独 vs 既存統合

| 案 | 利点 | 欠点 | base case |
| --- | --- | --- | --- |
| **単独 topic `dlq-monitoring.md`（base case）** | resource-map / topic-map で逆引き容易 | 既存 observability topic と分散 | ✅ |
| 既存 topic 統合 | DRY | 統合先 topic の選定 / 既存構造の歪み | fallback |

**判定**: 単独 topic を base case。Phase 5 で既存 references 構造を再確認し、適切な統合先がある場合のみ (B) に格下げ。

### trade-off D: runbook 配置先（outputs vs docs/runbooks）

| 案 | 利点 | 欠点 | base case |
| --- | --- | --- | --- |
| **outputs/phase-11/（base case for spec cycle）** | 仕様書サイクル内に閉じる / Phase 12 で再評価 | 運用者が探しにくい | ✅ |
| docs/runbooks/（最終形） | プロジェクト横断 runbook と整合 | 仕様書サイクル外への commit | Phase 12 で昇格 |

**判定**: 仕様書サイクル中は outputs、Phase 12 で `docs/runbooks/` に転記または symlink する。

---

## 出力契約（後続 Phase の入力）

| 成果物 | パス | Phase | 用途 |
| --- | --- | --- | --- |
| runbook 本体 | `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` | Phase 5 で下書き / Phase 12 で正本化 | AC-1 / AC-2 / AC-3 / AC-4 |
| staging 集計 dry-run log | `outputs/phase-11/dlq-aggregation-staging.log` | Phase 11 で生成 | AC-2（SQL 動作確認） |
| read-only 検証 log | `outputs/phase-11/sql-readonly-grep.log` | Phase 11 で生成 | AC-7 |
| skill references topic | `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md` | Phase 12 で追加 | AC-5 / AC-8 |
| skill index 再生成差分 | `.claude/skills/aiworkflow-requirements/indexes/*` | Phase 12 で `pnpm indexes:rebuild` 実行 | AC-6 |
| skill references diff | `outputs/phase-12/skill-references-diff.md` | Phase 12 で生成 | AC-11 |
| changelog 行 | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` | Phase 12 で追記 | AC-11 |
| escalation issue（条件付き） | `gh issue create` 出力 | Phase 12 でしきい値超過時のみ実行 | AC-4 |

---

## 変更対象ファイル（最終）

| パス | 変更種別 | Phase |
| --- | --- | --- |
| `outputs/phase-11/dlq-monitoring-runbook.md` | 新規 | 11 |
| `outputs/phase-11/dlq-aggregation-staging.log` | 新規 | 11 |
| `outputs/phase-11/sql-readonly-grep.log` | 新規 | 11 |
| `.claude/skills/aiworkflow-requirements/references/dlq-monitoring.md` | 新規 | 12 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 自動再生成 | 12 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 自動再生成 | 12 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 自動再生成 | 12 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 自動再生成 | 12 |
| `.claude/skills/aiworkflow-requirements/changelog/20260507-issue502-dlq-monitoring.md` | 1 行追記 | 12 |
| `docs/runbooks/dlq-monitoring-schema-alias-backfill.md`（昇格時） | 新規 or symlink | 12 |
| `outputs/phase-12/skill-references-diff.md` | 新規 | 12 |

関数シグネチャ / 型定義 / コードテスト: **N/A（コード変更なし）**

---

## ローカル実行コマンド（base case 確定版）

```bash
# 1. binding / migration の事実確認
rg -n "SCHEMA_ALIAS_BACKFILL_QUEUE|schema-alias-backfill" apps/api/wrangler.toml
rg -n "retry_count|failed_items_json|last_error|last_processed_at|backfill_status" \
  apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql

# 2. 集計 SQL dry-run (staging)
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS dlq_equivalent FROM schema_diff_queue WHERE failed_items_json IS NOT NULL"
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT diff_id, retry_count, status, last_processed_at FROM schema_diff_queue WHERE retry_count >= 3 ORDER BY retry_count DESC LIMIT 50"
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT diff_id, backfill_status, retry_count, last_processed_at FROM schema_diff_queue WHERE backfill_status='exhausted' AND last_processed_at < datetime('now','-24 hours') ORDER BY last_processed_at ASC LIMIT 50"

# 3. read-only 検証
rg -i -n -e '\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE)\b' \
  outputs/phase-11/dlq-monitoring-runbook.md \
  > outputs/phase-11/sql-readonly-grep.log || echo "OK (read-only)"

# 4. skill index 再生成 + drift 確認
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/

# 5. Issue CLOSED 据え置き確認
gh issue view 502 --json state
```

---

## 不変条件への影響

すべて影響なし（コード変更なし / D1 アクセス点はコード経路で不変 / フォーム関連変更なし）。Phase 1 と同様。

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 軸設計（集計 SQL / runbook 5 章 / skill references / cf.sh 実行）が AC-1〜AC-11 を網羅。Queue Analytics プラン制限時のフォールバックも構造化 |
| 実現性 | PASS | `scripts/cf.sh` / D1 read-only SQL / markdown 追記 / `pnpm indexes:rebuild` のみで完結。コード変更ゼロ |
| 整合性 | PASS | 不変条件 1〜7 影響なし。`apps/api` 外コード経路の D1 直接アクセスを行わず（運用 SQL は `scripts/cf.sh` 経由）。aiworkflow-requirements 構造と整合 |
| 運用性 | PASS | しきい値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）が起票元仕様と一致 / read-only 不変条件が機械検証可能 / staging count=0 でも判定成立 |

---

## DoD（Definition of Done / Phase 2）

- [ ] 4 軸（集計 SQL / runbook 5 章 / skill references / cf.sh 実行 + Queue Analytics）が設計確定
- [ ] trade-off 表 4 件（SQL 粒度 / しきい値 / topic 単独 / runbook 配置）が base case 確定
- [ ] 出力契約（後続 Phase 入力）が 8 成果物で確定
- [ ] read-only 不変条件の機械検証コマンドが確定
- [ ] しきい値 3 種（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）が起票元仕様と一致
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 不変条件 1〜7 影響なしを再確認

---

## 次 Phase への引き渡し

- 次 Phase: 3（設計レビューゲート）
- 引き継ぎ事項:
  - 4 軸設計の base case 確定状態
  - trade-off 4 件の判定根拠
  - 出力契約 8 成果物
  - read-only 検証コマンドと grep パターン（`INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE`）
  - しきい値 3 種（起票元仕様継承）
  - Queue Analytics プラン制限時の境界付き PASS 記録と、AC-2 側 D1 SQL 正本観測経路
- ブロック条件:
  - 4 観点（read-only 性 / runbook 章充足 / skill references 構造 / cf.sh 経由）のいずれかで MAJOR
  - AC-1〜AC-11 が `index.md` と乖離
  - Issue #502 が再 OPEN されている

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/index.md` | AC / scope 正本 |
| 必須 | `apps/api/wrangler.toml` | binding 名 正本 |
| 必須 | `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql` | D1 列 正本 |
| 必須 | `apps/api/src/repository/schemaDiffQueue.ts` | 永続化点正本 |
| 必須 | `scripts/cf.sh` | D1 / Workers アクセスラッパー |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| Phase spec | 本ファイル | 本 Phase の実行可能仕様 |
| outputs | `outputs/phase-02/` | 設計確定差分（必要時） |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] docs-only / NON_VISUAL / Issue #502 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として 集計 SQL の `rg` read-only grep、staging D1 dry-run（count 返却）、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
