---
issue_number: 363
task_id: UT-07B-FU-03-production-migration-apply-runbook
task_name: UT-07B production migration apply runbook
category:
  type: requirements
target_feature: Cloudflare D1 production migration operations
priority: high
scale: small
status: 未実施
source_phase: docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-01
dependencies:
  - UT-07B-schema-alias-hardening-001
---

# UT-07B-FU-03: production migration apply runbook

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-07B-FU-03-production-migration-apply-runbook |
| タスク名 | UT-07B production migration apply runbook |
| 分類 | requirements / operations / runbook |
| 対象 | `apps/api/migrations/0008_schema_alias_hardening.sql` の本番 D1 適用手順 |
| 優先度 | high |
| 見積もり規模 | small |
| ステータス | 未実施 |
| issue_number | #363 |
| 発見元 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md` |
| 根拠 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md` |

## 1. なぜこのタスクが必要か（Why）

UT-07B では `schema_aliases` table、revision-scoped stableKey UNIQUE index、alias question UNIQUE guard、resumable back-fill state を `apps/api/migrations/0008_schema_alias_hardening.sql` として実装済みである。一方で、本番 D1 への適用は post-merge operational execution として Phase 12 で分離された。

本番 migration はデータベース状態を直接変更するため、ローカル実装完了や PR 作成と同じ扱いで自動実行してはいけない。commit / PR / merge 後、ユーザー承認を得たうえで、事前確認、適用、証跡保存、失敗時停止判断を runbook 化する必要がある。

## 2. 何を達成するか（What）

- `apps/api/migrations/0008_schema_alias_hardening.sql` を本番 D1 に適用するための承認ゲート付き runbook を作成する。
- migration 適用前後の確認コマンド、期待結果、証跡保存先、失敗時の停止条件を明文化する。
- 本番適用作業が「ユーザー承認後の運用」であり、実装タスク内の自動実行・push・PR 作成とは分離されることを固定する。

## 3. どのように実行するか（How）

`bash scripts/cf.sh` 経由の Cloudflare / Wrangler 操作を前提に、production D1 の migration 一覧確認、対象 SQL の内容確認、適用前バックアップまたは export 方針確認、migration apply、適用後 schema 確認、関連 API smoke の順に手順化する。実行者は runbook に沿って証跡を残し、承認がない場合は production apply を実行しない。

### スコープ

### 含む

- `apps/api/migrations/0008_schema_alias_hardening.sql` の production apply runbook 作成
- commit / PR / merge 後、かつユーザー承認後にのみ本番適用する運用境界の明記
- production D1 migration 適用前の preflight checklist
- migration apply コマンド、適用後確認コマンド、証跡保存項目の定義
- 失敗時に中断して追加判断へ戻す条件の明記

### 含まない

- このタスク内での production migration 実行
- commit、push、PR 作成、PR merge
- `0008_schema_alias_hardening.sql` の内容変更
- queue / cron split for large back-fill の実装
- admin UI retry label の実装

## 4. 実行手順

1. 前提確認
   - UT-07B の実装 commit が PR に含まれていることを確認する。
   - PR がレビュー / CI / merge 方針を満たしていることを確認する。
   - ユーザーから production migration apply の明示承認を得る。
   - 承認がない場合は以降の production 操作を実行しない。

2. 対象 SQL 確認
   - `apps/api/migrations/0008_schema_alias_hardening.sql` が対象であることを確認する。
   - SQL が `schema_aliases` table、`idx_schema_aliases_revision_stablekey_unique`、`idx_schema_aliases_revision_question_unique`、`schema_diff_queue.backfill_cursor`、`schema_diff_queue.backfill_status` を含むことを確認する。
   - 本番以外の未適用 migration が混在していないか確認する。

3. production preflight
   - `bash scripts/cf.sh d1 migrations list <production-db-name> --env production` で適用済み migration を確認する。
   - production DB の backup / export / point-in-time recovery 相当の手段が利用可能か確認する。
   - 適用時間帯、影響範囲、rollback 判断者を記録する。

4. production apply
   - ユーザー承認済みであることを再確認する。
   - `bash scripts/cf.sh d1 migrations apply <production-db-name> --env production` を実行する。
   - 実行ログ、開始時刻、終了時刻、exit code を証跡として保存する。

5. 適用後確認
   - migration list で `0008_schema_alias_hardening.sql` が applied になっていることを確認する。
   - production D1 に `schema_aliases` table と UNIQUE index が存在することを確認する。
   - `schema_diff_queue` に `backfill_cursor` / `backfill_status` が存在することを確認する。
   - 管理 API の schema alias dryRun / read 系 smoke を実行し、破壊的な apply smoke は別承認に分ける。

6. 証跡保存
   - 実行コマンド、出力、時刻、承認者、対象 DB、migration hash または commit SHA を記録する。
   - 失敗した場合は追加入力で上書きせず、失敗ログをそのまま保存して判断待ちにする。

## 5. 完了条件チェックリスト

- [ ] production migration apply runbook が作成されている。
- [ ] commit / PR / merge 後、ユーザー承認後にのみ実行する境界が明記されている。
- [ ] `apps/api/migrations/0008_schema_alias_hardening.sql` の対象オブジェクトが runbook 内で特定されている。
- [ ] preflight、apply、post-check、evidence、failure handling の手順が揃っている。
- [ ] production apply をこのタスクでは実行しないことが明記されている。

## 6. 検証方法

### ドキュメント検証

```bash
rg "0008_schema_alias_hardening|schema_aliases|idx_schema_aliases_revision_stablekey_unique|ユーザー承認|production" \
  docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md
```

期待: 対象 migration、主要 DB オブジェクト、ユーザー承認ゲート、production 境界がすべて検出できる。

### 手順検証

```bash
rg "preflight|migrations list|migrations apply|post-check|証跡|失敗" \
  docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md
```

期待: 適用前、適用、適用後、証跡、失敗時停止の各手順が確認できる。

### 実行時検証

```bash
bash scripts/cf.sh d1 migrations list <production-db-name> --env production
bash scripts/cf.sh d1 migrations apply <production-db-name> --env production
bash scripts/cf.sh d1 execute <production-db-name> --env production --command "SELECT name FROM sqlite_master WHERE name IN ('schema_aliases','idx_schema_aliases_revision_stablekey_unique','idx_schema_aliases_revision_question_unique');"
```

期待: ユーザー承認後の実運用でのみ実行し、migration applied と対象 table / index の存在を確認できる。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| production migration を PR 前または未承認で実行する | runbook に commit / PR / merge 後かつユーザー承認後の gate を明記し、承認なしでは production 操作を止める |
| 対象 DB または environment を取り違える | `--env production` と production DB 名を preflight で確認し、実行ログに対象 DB を残す |
| UNIQUE index 作成が既存データ重複で失敗する | apply 前に migration 内容と既存 schema 状態を確認し、失敗時は追加 SQL を即興実行せず判断待ちにする |
| `schema_diff_queue` の ALTER TABLE が既に適用済みで失敗する | migration list と schema introspection で既適用状態を確認し、二重適用を避ける |
| 適用後 smoke が destructive apply を実行する | post-check は read / dryRun 系に限定し、実データ変更を伴う apply smoke は別承認に分ける |

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 根拠 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md` | production migration apply runbook が post-merge operational execution として検出された根拠 |
| 根拠 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md` | 実装済み migration と検証済み内容 |
| 対象 | `apps/api/migrations/0008_schema_alias_hardening.sql` | production 適用対象 SQL |
| 関連 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md` | UT-07B 内の migration runbook 文脈 |
| 関連 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md` | 失敗時判断と rollback 方針の参照 |

## 9. 備考

- この未タスクは runbook 正式化タスクであり、本番 DB の変更作業そのものではない。
- 実際の production apply は、対象 commit / PR が確定した後にユーザー承認を得て実施する。
- Phase 12 の検出候補のうち、queue / cron split と admin UI retry label は本タスクに含めない。

## 苦戦箇所【記入必須】

- 対象: `apps/api/migrations/0008_schema_alias_hardening.sql`
- 症状: migration は `schema_aliases` table 作成と `schema_diff_queue` への `ALTER TABLE` を含むため、production での二重適用、対象 DB 取り違え、UNIQUE index 作成失敗が同時に運用リスクになる。
- 参照: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md` の `production migration apply runbook` 候補、および `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md` の implemented files / verification。
