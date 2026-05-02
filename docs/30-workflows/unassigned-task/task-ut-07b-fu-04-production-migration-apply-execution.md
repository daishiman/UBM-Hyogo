# UT-07B-FU-04 production migration apply execution - タスク指示書

## メタ情報

```yaml
task_id: UT-07B-FU-04-production-migration-apply-execution
task_name: Production D1 migration apply execution for schema alias hardening
category: operations
target_feature: schema alias hardening production migration
priority: high
scale: small
status: 未実施
source_phase: docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-02
dependencies:
  - UT-07B-FU-03-production-migration-apply-runbook
  - user_approval_after_phase13_merge
```

## 1. なぜこのタスクが必要か（Why）

UT-07B-FU-03 は production migration apply runbook を作るタスクであり、production D1 への実 apply は実行しない。実 apply を同じ文書タスクの完了条件に混ぜると、DOC_PASS と runtime PASS が混同され、誰が・いつ・どの承認で本番 DB を変更したか追跡できなくなる。

このタスクは、PR merge 後にユーザーから明示承認を得たうえで `apps/api/migrations/0008_schema_alias_hardening.sql` を `ubm-hyogo-db-prod` へ適用し、fresh runtime evidence を保存するための運用実行タスクである。

## 2. 何を達成するか（What）

### スコープ

含む:

- UT-07B-FU-03 runbook の再確認
- 対象 DB `ubm-hyogo-db-prod` と migration `0008_schema_alias_hardening.sql` の preflight 確認
- ユーザー明示承認の記録
- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` の実行
- post-check と redacted runtime evidence の保存
- aiworkflow-requirements への production applied fact 反映

含まない:

- runbook の再設計
- queue / cron split for large back-fill
- admin UI retry label
- Cloudflare token 値、Account ID 値、raw secret 値の記録
- commit、push、PR 作成

## 3. どのように実行するか（How）

1. `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md` を読む。
2. Phase 13 PR が merge 済みであること、ユーザーが production apply を明示承認したことを記録する。
3. `bash scripts/cf.sh` 経由で preflight を実行し、対象 DB と migration 未適用状態を確認する。
4. runbook に従い production migration apply を 1 回だけ実行する。
5. post-check で `schema_aliases`、2 UNIQUE index、`schema_diff_queue` 追加カラムの存在を確認する。
6. redacted evidence を保存し、production applied fact を system spec へ同一 wave で同期する。

## 4. 完了条件チェックリスト

- [ ] Phase 13 PR merge 後である
- [ ] ユーザーの production apply 明示承認が記録されている
- [ ] `bash scripts/cf.sh` 経由でのみ Cloudflare 操作を実行している
- [ ] `0008_schema_alias_hardening.sql` が `ubm-hyogo-db-prod` に適用済みである
- [ ] post-check が PASS している
- [ ] evidence に token 値、Account ID 値、secret 値、生 PII が含まれない
- [ ] aiworkflow-requirements の production applied fact が fresh evidence に基づき同期されている

## 5. 検証方法

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

期待: apply は 1 回だけ成功し、post-check で対象 table / index / column が確認できる。

## 6. リスクと対策

| リスク | 対策 |
| --- | --- |
| 承認前に production DB を変更する | Phase 13 merge 後かつユーザー明示承認後だけ実行する |
| DB 名や environment を取り違える | preflight で `ubm-hyogo-db-prod` と `--env production` を二重確認する |
| 二重適用する | `migrations list` で未適用を確認し、実行ログに command / exit code / timestamp を残す |
| secret や account id を evidence に転記する | evidence は redacted shape のみ保存し、値は記録しない |

## 7. 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/unassigned-task-detection.md`
- 症状: runbook formalization と production apply execution を同じ候補のまま残すと、Phase 12 close-out が「後で Issue 起票」の宣言で止まり、未タスク formalization 条件を満たさない。
- 解決: FU-03 は DOC_PASS の runbook task として閉じ、実 apply は本 FU-04 に分離して approval-gated operations task として formalize する。

## 8. 参照情報

- `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/`
- `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md`
- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md`
