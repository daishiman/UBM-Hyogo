# Phase 9 正本: SSOT 反映仕様

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 実装区分 | 実装仕様書 |
| 親 Issue | #503 |
| 対象 | `.claude/skills/aiworkflow-requirements/{references,indexes}` / `docs/30-workflows/unassigned-task/...` |

## 目的

aiworkflow-requirements skill の SSOT に「remaining-scan vs cursor の判断結果」を反映するための **書き込み先** と **書き込み内容のドラフト** を確定する。実書き込みは Phase 12 で行う。CI の `verify-indexes-up-to-date` gate に drift がない状態を担保する条件も併せて確定する。

採用 / 不採用 / 判定保留 の 3 分岐すべてに対する状態語彙ドラフトを設計する。

## Step 0: P50 チェック（必須）

- [ ] `test -d .claude/skills/aiworkflow-requirements/references` 存在
- [ ] `test -f .claude/skills/aiworkflow-requirements/indexes/keywords.json` 存在
- [ ] `test -f .claude/skills/aiworkflow-requirements/indexes/topic-map.md` 存在
- [ ] `test -f docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` 存在
- [ ] `which jq` 成功
- [ ] log: `ls -la .claude/skills/aiworkflow-requirements/{references,indexes} 2>&1 | tee outputs/phase-9/p50-precheck.log`

## 9-A. 反映対象ファイル一覧

| # | ファイル | 種別 | 反映内容 |
| --- | --- | --- | --- |
| 1 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 編集 | `schema_diff_queue` の cursor 列（採用時のみ）、もしくは「remaining-scan を base case として固定」の記述追加 |
| 2 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 編集 / 再生成 | schema-alias-backfill トピックの状態語彙更新 |
| 3 | `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 編集 | cursor / remaining-scan 関連キーワード追加 |
| 4 | `docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` | 書き換え | consumed marker（issue-503 への trace + 採用判断結果） |

## 9-B. 追加キーワード仕様

`indexes/keywords.json` に以下キーワードを `database-schema` または `database-operations` ref に紐付けて追加:

```
"BACKFILL_CURSOR_MODE"
"schema alias back-fill cursor"
"remaining-scan base case"
"last_processed_id"
"schemaAliasBackfillBatch"
```

| key | mapped reference |
| --- | --- |
| `BACKFILL_CURSOR_MODE` | `references/database-operations.md` |
| `schema alias back-fill cursor` | `references/database-schema.md` |
| `remaining-scan base case` | `references/database-operations.md` |
| `last_processed_id` | `references/database-schema.md` |
| `schemaAliasBackfillBatch` | `references/database-operations.md` |

> 既存キーが衝突した場合は配列に追記し、上書きしない（progressive disclosure 原則を維持）。

## 9-C. 状態語彙ドラフト（3 分岐）

| 分岐 | 状態語彙 | topic-map / db-schema 反映文言（要点） |
| --- | --- | --- |
| 採用 | `cursor_adopted` | 「`schema_diff_queue` に `last_processed_id` 列を追加（migration 0015 以降）。Phase 1 SSOT の E1 + E4 採用条件を満たしたため cursor を採用」 |
| 不採用 | `remaining_scan_fixed` | 「remaining-scan を base case として固定。Phase 1 SSOT の E1 または E4 が不採用条件に該当したため cursor 経路は破棄」 |
| 判定保留 | `cursor_decision_deferred` | 「runtime evidence の数値分散が大きく判定保留。次回 staging fixture 拡張時に再評価」 |

## 9-D. consumed trace 書き換え方針

`docs/30-workflows/unassigned-task/task-ut-07b-fu-01-followup-cursor-semantics-migration.md` を Phase 12 で以下に書き換える:

- 先頭メタブロックの `status` を `consumed` に更新
- consumed marker section を追記:
  - `consumed_by`: `docs/30-workflows/issue-503-ut-07b-fu-01-followup-cursor-semantics-migration/`
  - `decision`: `cursor_adopted` / `remaining_scan_fixed` / `cursor_decision_deferred` のいずれか（Phase 11 結果）
  - `evidence`: `outputs/phase-11/decision-record.md` への相対パス

## 9-E. indexes 再生成手順

```bash
mise exec -- pnpm indexes:rebuild \
  2>&1 | tee outputs/phase-9/indexes-rebuild.log
```

期待:
- `.claude/skills/aiworkflow-requirements/indexes/` 配下が更新される
- `git diff` で keywords.json と派生 index の追加分のみ差分が出る
- 行ソート差分・順序入替が出ないこと（決定論性）

## 9-F. CI gate 担保

`.github/workflows/verify-indexes.yml` の `verify-indexes-up-to-date` job が以下で fail しないこと:

```bash
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes
```

`diff` が空（exit 0）であれば drift なし。差分があれば本 Phase に戻り再 commit する。

## 9-G. 検証コマンド（spec 確認用）

```bash
jq '.["BACKFILL_CURSOR_MODE"]' .claude/skills/aiworkflow-requirements/indexes/keywords.json \
  | tee outputs/phase-9/keyword-check.log
```

期待: `db-schema` を含む参照配列が返る。

## 動作確認チェックリスト

- [ ] 反映対象 4 ファイルが事前 Read で実在確認済
- [ ] 追加キーワード 5 件確定
- [ ] 状態語彙 3 分岐確定
- [ ] consumed trace 書き換え方針確定
- [ ] `pnpm indexes:rebuild` 実行手順確定
- [ ] `verify-indexes-up-to-date` gate clean 条件確定

## 次 Phase の前提条件

Phase 10（vitest）で全 test PASS、Phase 11 で staging evidence 取得後に Phase 12 implementation guide で本 Phase 確定値を再参照する。
