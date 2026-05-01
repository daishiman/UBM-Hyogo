# Phase 05 成果物: 実装ランブック（docs-only legacy umbrella close-out）

## サマリ

旧 UT-09 を legacy umbrella として閉じる docs 編集作業を、4 ステップ（stale 前提棚卸し → 責務移管確認 → 品質要件移植 → 検証）で固定する。本タスクは docs-only / spec_created であり runtime コードは生成しない。本ランブックの擬似 diff は Phase 12 implementation-guide.md の reviewer 確認手順にも引用される。

## 4 ステップ構成

| Step | 名称 | 目的 | 対応 verify suite |
| --- | --- | --- | --- |
| R-1 | stale 前提棚卸し | 旧 UT-09 path / Sheets API / 単一 endpoint / `sync_audit` / `dev/main 環境` 表記の検出 | S-1〜S-4 |
| R-2 | 責務移管確認 | 03a / 03b / 04c / 09b への割当キーワード hit 確認 | M-1〜M-4 |
| R-3 | 品質要件移植 | SQLITE_BUSY retry/backoff / batch / 短 tx の 03a / 03b 異常系、09b runbook への追記擬似 diff | M-1, M-2, M-4（異常系 grep） |
| R-4 | 検証 | format audit / spec consistency / conflict marker scan を一括実行 | D-1〜D-3, SP-1〜SP-3, C-1〜C-3 |

## R-1: stale 前提棚卸しランブック

```bash
# Step 1: 旧 UT-09 path / id 残存確認
rg -n "UT-09-sheets-d1-sync-job-implementation|ut-09-sheets-to-d1-cron-sync-job" \
  docs/30-workflows/unassigned-task .claude/skills/aiworkflow-requirements/references

# Step 2: Sheets API / 単一 endpoint / sync_audit
rg --pcre2 -n "Google Sheets API v4|spreadsheets\\.values\\.get|/admin/sync(?!/)|sync_audit" \
  docs/30-workflows/02-application-implementation

# Step 3: branch ↔ env 表記正規化
rg -n "dev / main 環境|dev/main 環境" docs/30-workflows/02-application-implementation
```

**sanity check**: いずれも legacy umbrella 文脈以外で 0 hit。違反時は該当箇所を Forms API / 分割 endpoint / `sync_jobs` / 正規環境表記へ置換。

## R-2: 責務移管確認ランブック

```bash
# 03a: schema 取得 / upsert
rg -l "POST /admin/sync/schema|forms\\.get|schema_questions" \
  docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/

# 03b: response 取得 / cursor / current
rg -l "forms\\.responses\\.list|member_responses|current response" \
  docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/

# 04c: admin endpoint
rg -l "/admin/sync/schema|/admin/sync/responses" \
  .claude/skills/aiworkflow-requirements/references/

# 09b: cron / pause / resume / incident
rg -l "cron|pause|resume|incident" \
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/
```

**sanity check**: 各キーワードが対応タスクで全 hit。不足時は該当タスク index / phase-02 / phase-05 へ追記。

## R-3: 品質要件移植（擬似 diff）

### Diff A: 旧 UT-09 ファイルへ legacy umbrella 明記

```diff
 # Forms to D1 sync legacy umbrella close-out - タスク指示書
+
+> **Status: legacy umbrella (closed)**
+> このファイルは旧 UT-09 を新規実装タスクとして起こすためのものではない。
+> 実装責務は 03a / 03b / 04c / 09b / 02c に分散済み。新規実装の入口として参照しないこと。
```

### Diff B: 03a 異常系への SQLITE_BUSY 注記

```diff
 ## 異常系
 - Forms API 429 / 5xx
+- D1 SQLITE_BUSY: WAL 非前提のため retry/backoff（指数 backoff、最大 N 回）
+  と短い transaction、batch-size 制限を schema upsert に適用する。
+  根拠: docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/ Phase 02 責務移管表 #9。
```

### Diff C: 03b 異常系への SQLITE_BUSY 注記

```diff
 ## 異常系
 - cursor 欠落
+- D1 SQLITE_BUSY: response 反映（member_responses / member_identities / member_status）に
+  対し retry/backoff、短い transaction、batch-size 制限を適用。
+  consent snapshot は同 transaction 内で凍結する。
```

### Diff D: 09b runbook への pause/resume 追記

```diff
 ## 運用ランブック
+- Cron Triggers の pause / resume 手順:
+  1. wrangler dashboard で `[triggers]` を一時無効化（pause）
+  2. 解消後に再有効化（resume）
+  3. evidence: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env <env>` の出力
```

### Diff E: 02c `sync_jobs` 排他注記

```diff
 ## sync_jobs テーブル
+- 同種 job 排他: `status='running'` 行が存在する場合、新規 job 起動は 409 Conflict。
+- 二重起動防止は D1 行排他のみで担保（アプリ内 mutex は採用しない）。
```

**sanity check**: 既存 03a / 03b / 09b / 02c に同等表現があれば重複追加しない。表現揺れは Phase 8 DRY 化で正規化。

## R-4: 検証ランブック

```bash
# format audit
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md

# spec consistency
rg -n "responseId|publicConsent|rulesConsent" \
  docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001 docs/00-getting-started-manual/specs/01-api-schema.md

# conflict marker scan
rg -n "^(<<<<<<<|=======|>>>>>>>)" \
  docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001 \
  docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md \
  .claude/skills/aiworkflow-requirements/references
```

**sanity check**: current violations 0 / spec key 一致 / conflict marker 0 件。

## 不変条件チェック

- #1: 擬似 diff で Forms API 表記のみ追加、Sheets API 表記は新たに追加しない
- #5: 移植要件文中で「apps/web から D1」表現を生まない
- #6: pause/resume 手順で GAS apps script trigger を選択肢に含めない

## エビデンス / 参照

- `outputs/phase-04/main.md` 5 層 verify suite ID
- `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` §4 Phase 1-4
- `.claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js`
- 03a / 03b / 04c / 09b / 02c の `phase-05.md` / `phase-06.md`

## AC トレーサビリティ

| AC | runbook step |
| --- | --- |
| AC-1 / AC-3 / AC-4 / AC-12 | R-1（stale 棚卸し） |
| AC-2 | R-2（dependency mapping） |
| AC-5 / AC-6 / AC-7 | R-3 Diff B / C / D / E |
| AC-10 / AC-11 / AC-13 | R-4（format audit + spec consistency） |

## 次 Phase（06 異常系検証）への引き渡し

1. 4 ランブック（R-1〜R-4）の sanity check
2. 擬似 diff B / C / D / E の整合性
3. failure case を runbook step と 1 対 1 対応させる予告
