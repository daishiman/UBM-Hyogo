# Phase 12: ドキュメント整備（6 必須タスク）— 索引

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 作成日 | 2026-05-07 |
| 状態 | implemented-local / runtime evidence pending_user_gate |
| 親 Issue | #503 |
| workflow_state ルール | local 実装は `implemented-local`。staging evidence で cursor 採用/不採用を最終確定するまでは runtime PASS を主張しない。 |

## 目的

task-specification-creator skill 規定の **6 必須タスク** を整備し、schema alias back-fill cursor 化の判断・実装プロセスを Part 1（中学生レベル）/ Part 2（技術者レベル）両面で説明する。Phase 9 で確定した SSOT 反映ドラフトを実書き込みし、Phase 11 decision-record.md の判定結果を反映する。

## Step 0: P50 チェック（必須）

- [x] Phase 11 NON_VISUAL evidence placeholder が実体配置済（runtime evidence は user gate 解除後）
- [x] Phase 9 SSOT 反映先確定
- [x] Phase 10 focused vitest PASS
- [x] aiworkflow-requirements `references/database-schema.md` / `references/database-operations.md` 更新済

## 6 必須タスクと成果物

| # | 必須タスク | 成果物 |
| --- | --- | --- |
| 1 | implementation guide（中学生レベル + 技術者レベル） | `outputs/phase-12/implementation-guide.md` |
| 2 | aiworkflow-requirements SSOT 反映ログ | `outputs/phase-12/system-spec-update-summary.md` |
| 3 | docs / SSOT 更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 4 | 残課題（unassigned）検出（0 件でも必須） | `outputs/phase-12/unassigned-task-detection.md` |
| 5 | task-specification-creator skill への feedback | `outputs/phase-12/skill-feedback-report.md` |
| 6 | spec compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 各成果物の必須内容

### 1. `implementation-guide.md`

- **Part 1（中学生レベル / 比喩 = しおり）**: 「本を毎日少しずつ読むとき、どこまで読んだかを『しおり』で覚えておくと、毎回最初から探さなくて済む。schema 整理の作業も同じで、毎回最初から探す方式（remaining-scan）と、しおり方式（cursor）のどちらが効率良いか、本物のデータで試して決める」を 200-300 字で説明。
- **Part 2（技術者レベル）**: 以下を含める。
  - data flow: `Queue trigger` → `schemaAliasBackfillBatch` → `BACKFILL_CURSOR_MODE` 分岐 → `remaining-scan` または `cursor (last_processed_id)` 経路 → `schemaDiffQueue` repository update → 完了 or retry continuation
  - 採用判断のしきい値（Phase 1 SSOT: E1 + E4 を必須、E2 / E3 は補足）
  - 不採用時の固定方針（remaining-scan を base case）
  - cursor 列の更新タイミング（batch 単位確定 / row 単位ではない）
  - dedupe / failed_items_json との整合方針
  - migration 0015 以降の追加（採用時のみ）
  - API contract `backfill.status` は不変（内部実装の改善に限定）
- 期待行数: 150-300 行

### 2. `system-spec-update-summary.md`

aiworkflow-requirements への反映ログ:

- `references/database-schema.md` の編集箇所（schema_diff_queue 列定義 / cursor 列の有無）
- `references/database-operations.md` の編集箇所（A/B 比較、rollback、採用判断レコード）
- `indexes/keywords.json` に追加した 5 キーワード（Phase 9 確定値）
- topic-map の状態語彙更新内容
- `pnpm indexes:rebuild` の実行コマンドと再生成 evidence の保存先（`outputs/phase-12/indexes-rebuild.log`）
- consumed trace 反映: `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` を consumed marker に書き換え
- 期待行数: 50-120 行

### 3. `documentation-changelog.md`

新規 / 編集ファイルを表形式で列挙:

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | 編集 | `BACKFILL_CURSOR_MODE` 分岐追加 / cursor 経路実装 |
| `apps/api/src/repository/schemaDiffQueue.ts` | 編集 | cursor 列読み書き API 追加（採用時のみ） |
| `apps/api/migrations/0015_schema_diff_queue_cursor.sql` | 新規（採用時のみ） | `last_processed_id` 列追加 |
| `apps/api/src/workflows/__tests__/schemaAliasBackfillBatch.test.ts` | 編集 | cursor / parity / fallback test 5 ケース追加 |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 編集 | cursor 列 or remaining-scan 固定の記述追加 |
| `.claude/skills/aiworkflow-requirements/references/database-operations.md` | 編集 | staging A/B 比較と rollback 手順の記述追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | 5 キーワード追加 |
| `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` | 書き換え | consumed marker |

期待行数: 40-80 行

### 4. `unassigned-task-detection.md`

**0 件でも出力必須**。後続タスク化候補:

- 50,000 行 fixture での再評価（本タスクは 10,000 行スコープ）
- DLQ / 監視ダッシュボード（cursor 採用時の運用観察）
- public API `backfill.status` の語彙拡張要否（今回は変更なし）
- production への migration 0015 段階適用タスク（採用時のみ）

該当なしの場合は「検出なし」と明記し、判定理由（スコープ完結を確認した evidence ファイル名）を併記する。

期待行数: 30-80 行

### 5. `skill-feedback-report.md`

task-specification-creator skill への feedback。**3 観点固定**:

1. **テンプレート観点**: NON_VISUAL evidence の必須ファイル化（Phase 11 の 5 ファイル）が runtime 採用判断タスクで再利用できたか
2. **ワークフロー観点**: G1-G4 multi-stage approval gate と user gate（Phase 11 runtime apply / Phase 13 PR 作成）の境界が明示できたか
3. **ドキュメント観点**: 採用 / 不採用 / 判定保留 の 3 分岐に対応した状態語彙の事前確定（Phase 9）が runtime 判断タスクで機能したか

期待行数: 40-80 行

### 6. `phase12-task-spec-compliance-check.md`

compliance 検証チェックリスト:

- [ ] Phase 1-13 すべてに index.md からの参照が通っている
- [ ] artifacts.json の `phases.phase-N.outputs` がすべて実体ファイルと一致
- [ ] Phase 12 6 必須成果物がすべて実体配置
- [ ] Phase 11 NON_VISUAL evidence 5 ファイル + lint-evidence.log が実体配置
- [ ] index.md `claudeCodeContext` の値が Phase 13 の `gh pr create` 引数と一致
- [ ] `status:unassigned` ラベルが PR 側に付与されない仕様になっている
- [ ] consumed trace が起票元 unassigned-task spec に反映済
- [ ] CI `verify-indexes-up-to-date` gate clean

期待行数: 40-80 行

## DoD

- [ ] 6 必須成果物すべて実体配置
- [ ] `implementation-guide.md` に Part 1 / Part 2 両方が含まれる
- [ ] `unassigned-task-detection.md` が 0 件の場合でも判定理由付きで存在
- [ ] `system-spec-update-summary.md` に `pnpm indexes:rebuild` evidence への参照
- [ ] consumed trace が起票元 spec に反映済
- [x] workflow_state は `implemented-local`。staging runtime evidence 後に採用/不採用を最終確定

## 成果物

- `outputs/phase-12/phase-12.md`（本ファイル / 索引）
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 次 Phase の前提条件

6 必須成果物すべての実体配置と compliance check PASS。
