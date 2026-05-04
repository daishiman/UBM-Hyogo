# UT-07B-FU-04 production migration already-applied verification - タスク指示書

## メタ情報

```yaml
task_id: UT-07B-FU-04-production-migration-apply-execution
task_name: Production D1 migration already-applied verification for schema alias hardening
category: operations
target_feature: schema alias hardening production migration
priority: high
scale: small
status: consumed_by_current_workflow
source_phase: docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/unassigned-task-detection.md
created_date: 2026-05-02
dependencies:
  - UT-07B-FU-03-production-migration-apply-runbook
  - user_approval_after_phase13_merge
```

## 1. なぜこのタスクが必要か（Why）

UT-07B-FU-03 は production migration apply runbook を作るタスクであり、production D1 の runtime evidence は扱わない。runtime evidence を同じ文書タスクの完了条件に混ぜると、DOC_PASS と runtime PASS が混同され、誰が・いつ・どの承認で本番 DB を確認したか追跡できなくなる。

このタスクは当初 production apply execution として起票されたが、正本 `database-schema.md` は `apps/api/migrations/0008_schema_alias_hardening.sql` が production D1 ledger に既適用であることを記録している。したがって current workflow は再 apply ではなく、既適用検証・duplicate apply 禁止・read-only runtime verification の evidence 境界を保存する運用検証タスクとして消化する。

## 2. 何を達成するか（What）

### スコープ

含む:

- UT-07B-FU-03 runbook の再確認
- 対象 DB `ubm-hyogo-db-prod` と migration `0008_schema_alias_hardening.sql` の preflight 確認
- ユーザー明示承認の記録
- duplicate production migration apply の禁止記録
- `schema_diff_queue.backfill_cursor` / `backfill_status` の read-only post-check と redacted runtime evidence の保存（ユーザー承認後のみ）
- aiworkflow-requirements への already-applied verification boundary 反映

含まない:

- runbook の再設計
- queue / cron split for large back-fill
- admin UI retry label
- Cloudflare token 値、Account ID 値、raw secret 値の記録
- commit、push、PR 作成

## 3. どのように実行するか（How）

1. `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` を読む。
2. ユーザーが read-only production verification を明示承認したことを記録する。mutation 承認ではない。
3. `bash scripts/d1/preflight.sh ... --expect applied` で対象 DB と migration 既適用状態を確認する。
4. `d1 migrations apply` は実行せず、`apply.log` に duplicate apply prohibition を記録する。
5. `scripts/d1/postcheck.sh` で `schema_diff_queue.backfill_cursor` / `backfill_status` の存在を確認する。
6. redacted evidence または placeholder evidence を確認し、already-applied verification boundary を system spec へ同一 wave で同期する。

## 4. 完了条件チェックリスト

- [ ] Current FU-04 workflow に consumed / reclassified 状態が反映されている
- [ ] ユーザーの read-only verification 明示承認または未承認 placeholder が記録されている
- [ ] `bash scripts/cf.sh` 経由でのみ Cloudflare 操作を実行している
- [ ] `0008_schema_alias_hardening.sql` が `ubm-hyogo-db-prod` で既適用 fact と整合する
- [ ] duplicate apply が実行されていない
- [ ] post-check が PASS している
- [ ] evidence に token 値、Account ID 値、secret 値、生 PII が含まれない
- [ ] aiworkflow-requirements の already-applied verification boundary が同期されている

## 5. 検証方法

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/d1/preflight.sh ubm-hyogo-db-prod --env production --migration 0008_schema_alias_hardening --expect applied --json
bash scripts/d1/postcheck.sh ubm-hyogo-db-prod --env production
```

期待: preflight → duplicate apply prohibition → post-check → redacted evidence 保存を直列に扱い、hardening migration の対象 column が確認できる。`d1 migrations apply` は実行しない。

## 6. リスクと対策

| リスク | 対策 |
| --- | --- |
| 承認前に production DB を変更する | production DB mutation は禁止し、承認後も read-only verification のみ実行する |
| DB 名や environment を取り違える | preflight で `ubm-hyogo-db-prod` と `--env production` を二重確認する |
| 二重適用する | `apply.log` を no-op prohibition evidence とし、apply command を実行しない |
| secret や account id を evidence に転記する | evidence は redacted shape のみ保存し、値は記録しない |

## 7. 苦戦箇所【記入必須】

- 対象: `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-12/unassigned-task-detection.md`
- 症状: runbook formalization と production apply execution を同じ候補のまま残すと、Phase 12 close-out が「後で Issue 起票」の宣言で止まり、未タスク formalization 条件を満たさない。
- 解決: FU-03 は DOC_PASS の runbook task として閉じ、本 FU-04 は正本 ledger 既適用 fact を優先した already-applied verification / duplicate apply prohibition task として消化する。

## 8. 参照情報

- `docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/`
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md`
- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md`
