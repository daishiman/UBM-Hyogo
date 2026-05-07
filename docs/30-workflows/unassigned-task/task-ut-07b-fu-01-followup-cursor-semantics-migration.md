# UT-07B-FU-01-FOLLOWUP cursor semantics migration - タスク指示書

## メタ情報

```yaml
issue_number: 503
task_id: UT-07B-FU-01-FOLLOWUP-cursor-semantics-migration
task_name: schema alias back-fill batch を remaining-scan から cursor 方式に拡張
category: type:improvement
target_feature: schema alias back-fill batch model
priority: low
scale: medium
status: formalized_by_issue_503
source_phase: docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-06
dependencies:
  - UT-07B-FU-01-schema-alias-backfill-queue-cron-split
```

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07B-FU-01-FOLLOWUP-cursor-semantics-migration |
| タスク名 | schema alias back-fill batch を remaining-scan から cursor 方式に拡張 |
| 分類 | implementation / improvement |
| 対象機能 | schema alias back-fill batch model |
| 優先度 | low |
| 見積もり規模 | medium |
| ステータス | formalized_by_issue_503 / implemented-local shadow flag / runtime adoption pending |
| 発見元 | `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-06 |
| issue_number | #503 |

## Consumed Trace（2026-05-07）

本 unassigned task は `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/` に formalize 済み。今回サイクルで `BACKFILL_CURSOR_MODE` shadow flag、cursor / remaining-scan 分岐、既存 `schema_diff_queue.backfill_cursor` 再利用、row-skip 防止の stale cursor reset test を implemented-local として反映した。

Phase 11 の staging 10,000 行 A/B evidence と cursor 採用/不採用の最終判断は user-gated runtime evidence pending。採用までは専用 `0015_schema_diff_queue_cursor.sql` を作成せず、public `backfill.status` contract も変更しない。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-07B-FU-01 では back-fill batch を「未処理行を都度スキャンして処理する」remaining-scan 方式で実装した。Phase 11 gate 評価でも cursor / offset を canonical API contract に含めず、remaining-scan を base case として GO 判定した。これは local implementation の責務を最小化し、API contract drift を避けるための判断である。

### 1.2 問題点・課題

remaining-scan 方式は対象 row が小さい間は安定する一方で、未処理 row が継続的に大きい場合、毎 batch のスキャンコストが線形に積み上がる。10,000 行を超える extended fixture や、複数 schema diff が同時に back-fill する場合、Queue 1 batch 内の CPU 消費が cursor 方式より不利になる可能性がある。

### 1.3 放置した場合の影響

- staging で 10,000 行超の fixture を流したとき、CPU budget exhausted の頻度が cursor 方式より高くなる可能性
- back-fill 完了までの累計 CPU 時間が削減できない
- DLQ 投入 / retry_count 増加の遠因になる

---

## 2. 何を達成するか（What）

### 2.1 目的

remaining-scan を base case のまま残しつつ、cursor 方式の持ち込み是非を「runtime evidence ベース」で判定し、必要なら cursor semantics を batch repository に追加する。

### 2.2 最終ゴール

- runtime evidence（10,000 行超の staging trial）の比較で remaining-scan と cursor のどちらを採用するか判断できる
- 採用判断が cursor の場合、`schemaAliasBackfillBatch.ts` と `schemaDiffQueue.ts` repository に cursor 列（例: `last_processed_id`）を追加し、API contract を変えずに内部実装のみ拡張する
- 不採用の場合、remaining-scan を base case として固定する記録を残す

### 2.3 スコープ

#### 含む

- staging 比較 evidence の取得
- 採用時のみ: cursor 列 migration、batch / repository / test の更新
- 採用判断ログの aiworkflow-requirements 反映

#### 含まない

- public API `backfill.status` の語彙拡張
- DLQ / 監視ダッシュボード（別タスク）
- 50,000 行 fixture（別タスク）
- commit、push、PR 作成

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- UT-07B-FU-01 が runtime PASS していること
- staging 環境で 10,000 行以上の fixture が流せる状態
- cursor 列追加時は既存 0014 migration と整合した形で 0015 以降の migration を作る

### 3.2 推奨アプローチ

1. remaining-scan の現行 batch 1 回あたり CPU 時間 / 残行数 / retry_count を staging で記録する
2. cursor 候補列（例: `last_processed_id INTEGER` または `last_processed_pk TEXT`）を batch repository が必要とする最小形で設計する
3. shadow 実装または分岐 flag を使い、A/B で比較する evidence を取得する
4. 採用判断後、不要側を破棄する

---

## 4. 実行手順

### Phase 1: evidence 取得

1. staging で 10,000 行以上の fixture を流し、remaining-scan の batch 内 CPU 時間 / 残行数 / retry_count を記録する
2. 各 batch のクエリプラン（`EXPLAIN QUERY PLAN`）を確認する

### Phase 2: cursor 設計

1. cursor 列の型と更新タイミング（batch 完了時 / 各 row 完了時）を決める
2. dedupe / failed_items_json と整合する初期化・rollback 戦略を決める

### Phase 3: 比較実装（採用判断前）

1. shadow flag または環境変数 `BACKFILL_CURSOR_MODE` で remaining-scan / cursor を切り替えられるようにする
2. test fixture で両方の経路が test 通過することを確認する

### Phase 4: 採用判断

1. staging 比較 evidence をもとに採用 / 不採用を決定する
2. 採用なら shadow flag を削除し、cursor 経路を default にする
3. 不採用なら shadow flag を削除し、cursor 経路を完全に外す

### Phase 5: 仕様反映

1. aiworkflow-requirements の references / topic-map / keywords を採用結果に合わせて更新する
2. `phase-12/implementation-guide.md` の contract matrix を更新する

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] staging evidence で remaining-scan vs cursor の比較値が取得済み
- [ ] 採用 / 不採用が記録されている
- [ ] 採用時、`backfill.status` の API contract に変更がないこと

### 品質要件

- [ ] cursor 採用時、cursor 列の初期化・更新が dedupe / failed_items_json と整合
- [ ] 採用 / 不採用いずれの場合も既存 test が壊れていない
- [ ] migration を追加する場合は既存 0014 と互換

### ドキュメント要件

- [ ] aiworkflow-requirements skill 配下の DB schema / topic-map / keywords が更新済み
- [ ] 採用判断の数値根拠（CPU 時間 / retry_count）が evidence として記録されている

---

## 6. 検証方法

### shadow 切り替え確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaAliasBackfillBatch
```

期待: cursor / remaining-scan いずれの経路でも test PASS。

### 比較 evidence 取得（staging）

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
```

期待: staging で fixture を流し、retry_count / CPU 時間が記録される。

### skill index drift 確認

```bash
mise exec -- pnpm indexes:rebuild
git status .claude/skills/aiworkflow-requirements/indexes/
```

期待: drift 無し。

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| cursor を導入したのに改善が無い | 中 | shadow flag で A/B し、不採用なら破棄する |
| cursor 列の更新が dedupe と競合し row skip | 高 | 各 row 単位で cursor を更新せず、batch 単位で確定する。failed_items_json に残った row は除外せずに次 batch でも対象にする |
| API contract `backfill.status` に値を増やしたくなる | 中 | cursor 化は内部実装の改善に限定し、API は variation pending |

---

## 8. 参照情報

- `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/implementation-guide.md`
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts`
- `apps/api/src/repository/schemaDiffQueue.ts`
- `apps/api/migrations/0014_schema_diff_queue_dedupe_failure.sql`

---

## 9. 備考

UT-07B-FU-01 では cursor を canonical API contract に含めず、remaining-scan を base case とした。本タスクは「不採用も含めて runtime evidence で判断する」ためのものであり、cursor 採用ありき・あらかじめ実装ありきではない。

## 苦戦箇所【記入必須】

- 対象: `apps/api/src/workflows/schemaAliasBackfillBatch.ts`
- 症状: 現行 remaining-scan は CPU budget exhausted を retryable continuation で吸収する設計だが、未処理行が継続的に大きいときの累計 CPU 時間は実装側からは判断できず、staging evidence が無いと cursor 化の必要性を結論できない。
- 参照: `docs/30-workflows/ut-07b-fu-01-schema-alias-backfill-queue-cron-split/outputs/phase-12/unassigned-task-detection.md`
