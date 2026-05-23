# Phase 12 output: implementation guide

[実装区分: 実装仕様書]

## Part 1: 中学生レベルの説明

このタスクは、管理画面でまちがえて「この質問はこの stableKey です」と登録したときに、データベースへ直接 SQL を打たずに画面から取り消せるようにするものです。

やることは大きく 3 つです。

1. 管理画面に rollback ボタンを出す
2. 登録直後 5 分以内なら undo で取り消せるようにする
3. 取り消した事実を `audit_log` に残す

データは完全に消さず、`deleted_at` という「消した印」を付けます。これにより、いつ誰が取り消したかをあとで追えます。ほかの管理者が同時に同じ alias を操作した場合は、`version` を使って古い画面からの取り消しを止めます。

## Part 2: 技術者向け実装ガイド

後続実行者（または AI agent）はこの guide を順に確認することで全 AC を検証できる。現ブランチでは Step 1-10 のローカル実装は完了済みであり、Step 11-12 の staging / visual runtime evidence と Phase 13 操作は user-gated として残る。

## 前提

- ブランチ `feat/issue-778-schema-alias-rollback-undo` で作業
- Node 24.15.0 / pnpm 10.33.2（`mise exec --` 経由）

### Step 1: migration 0019 作成と local apply

`apps/api/migrations/0019_schema_alias_soft_delete.sql` を作成（内容は `outputs/phase-02/d1-schema-migration.md` 参照）。

`apps/api/migrations/0003_auth_support.sql` を確認し、`audit_log` が `after_json` JSON column を持つことを確認する。`relatedAuditId` は列追加ではなく rollback 行の `after_json` 内に保存する。

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --local
bash scripts/cf.sh d1 execute ubm-hyogo-db --local --command "PRAGMA table_info(schema_aliases);"
```

### Step 2: repository 拡張

`apps/api/src/repository/schemaAliases.ts`（存在しなければ新規）に以下を追加:
- `getById(db, id)` (`SELECT * FROM schema_aliases WHERE id = ? AND deleted_at IS NULL`)
- `findActiveByStableKey(db, stableKey)` (`AND deleted_at IS NULL` 追加)
- `listRecentResolvedAliases(db, limit)` (`SchemaDiffPanel` の HistoryPane 用)
- `buildSoftDeleteStatement(db, input)` (`UPDATE ... SET deleted_at=?, deleted_by=?, version = version + 1 WHERE id = ? AND version = ? AND deleted_at IS NULL`)

### Step 3: rollback workflow

`apps/api/src/workflows/schemaAliasRollback.ts` を新規作成。実装骨子は `phase-06.md` Step 3 を参照。

主要関数:
- `schemaAliasRollback(db, input): Promise<SchemaAliasRollbackResult>`
- `SchemaAliasRollbackFailure` (kind: `not_found` / `already_deleted` / `version_mismatch` / `batch_failed`)
- `findResolveAuditId(db, aliasId)` (`schema_alias.*` target または `schema_diff.alias_assigned.after_json.aliasId` を参照)
- `computeImpact(db, stableKey)` (`COUNT(*) FROM response_fields WHERE stable_key = ?`)

### Step 4: endpoint 追加

`apps/api/src/routes/admin/schema.ts` に `POST /admin/schema/aliases/:aliasId/rollback` を追加。実装骨子は `phase-06.md` Step 4 を参照。

主要点:
- `If-Match: version=<N>` ヘッダの正規表現 parse → 400
- `schemaAliasRollback` 呼出
- `SchemaAliasRollbackFailure.kind` → status code mapping
- non-Failure error は middleware に throw（既存と整合）

### Step 5: 既存 query 更新 + grep gate

```bash
rg -n "FROM schema_aliases" apps/api/src --type ts
```

ヒットした全 query に `AND deleted_at IS NULL`（既存 WHERE がない場合は `WHERE deleted_at IS NULL`）を追加。

検証:
```bash
rg -n "FROM schema_aliases" apps/api/src --type ts | rg -v "deleted_at"  # 0 件期待
```

### Step 6: web helper

`apps/web/src/lib/admin/api.ts` に `rollbackSchemaAlias(input)` を追加。実装骨子は `phase-06.md` Step 6。`RollbackApiError` を既存 admin api error 体系に統合。

### Step 7: SchemaDiffPanel UI

`apps/web/src/components/admin/SchemaDiffPanel.tsx` を編集:
- `<HistoryPane>`（内部 component）
- `<RollbackConfirmModal>`（影響件数 / 再集計要否 / actor / 対象 alias を表示）
- `<UndoToast>`（5 分タイマー）
- mutation は `useAdminMutation` 経由
- 型は `outputs/phase-02/ui-state-machine.md` 参照

### Step 8: test 追加

- `apps/api/src/routes/admin/__tests__/schema.rollback.spec.ts` 新規（A-01 〜 A-10）
- `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` 編集（C-01 〜 C-12）

ケース一覧は `phase-07.md` 参照。

### Step 9: 正本 spec 追記

- `docs/00-getting-started-manual/specs/11-admin-management.md` に rollback / undo 操作仕様追記
- `docs/00-getting-started-manual/specs/01-api-schema.md` に endpoint 追記

### Step 10: unassigned-task の 3 件新規作成 + 1 件 fold-state sync

新規追加（`docs/30-workflows/unassigned-task/`）:
- `serial-05-step-03-followup-005-schema-alias-recompute-trigger.md`
- `serial-05-step-03-followup-006-schema-alias-bulk-rollback.md`
- `serial-05-step-03-followup-007-schema-alias-rollback-notification.md`

既存参照（重複作成禁止）:
- `serial-05-step-03-followup-003-schema-diff-history-view.md`

fold-state sync（既存 MD への追記）:
- `serial-05-step-03-followup-004-schema-alias-rollback-undo.md` の状態語彙セクションに `consumed_via_issue_778_rollback_undo_spec` を追記

### Step 11: 検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm build
bash scripts/verify-pr-ready.sh
```

### Step 12: visual baseline（local）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web playwright test \
  --grep "SchemaDiffPanel.*rollback" \
  --update-snapshots
```

## user-gated 操作

以下は user 明示承認後のみ:
- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db --env staging`
- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`
- `git push origin feat/issue-778-schema-alias-rollback-undo`
- `gh pr create --base dev`

## DoD

- [ ] Step 1-12 全実行
- [ ] 全 AC pass（Phase 09 チェックリスト）
- [ ] verify-pr-ready.sh pass
- [ ] visual baseline 4 screens 配置
- [ ] PR draft 完成
