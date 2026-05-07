# Phase 12: ドキュメント更新

`[実装区分: 実装仕様書]`

task-specification-creator skill `references/phase-12-spec.md` の **6 必須タスク** を実行し、最低 7 ファイルを実体出力する。

## Task 12-1: 実装ガイド作成

`outputs/phase-12/implementation-guide.md` に以下 2 部構成で記述する。

### Part 1: 中学生レベル

- 「ある作業がとても大きいので一度に全部できないとき、API は『今のところまではやった、続きはあとで再開できる』と返す」
- 「画面側はそれを『失敗』と区別して『続きから再試行できます』と表示する」
- 「もう一度同じボタンを押すと続きから処理が進む」

### Part 2: 技術者レベル

- HTTP 202 + `code='backfill_cpu_budget_exhausted'` + `retryable=true` + `backfill.status='exhausted'` の 4 点合致を `isSchemaAliasRetryableContinuation` predicate で narrow
- API client `postSchemaAlias` の戻り値型を `AdminMutationResult<SchemaAliasApplyBody>` に拡張
- `SchemaDiffPanel` の `feedback` state で 4 区別（success / retryable / validation_error / conflict_error）
- API contract（`apps/api/src/routes/admin/schema.ts` / `schemaAliasAssign.ts`）は不変
- 不変条件 #5 / #11 / #14 維持

## Task 12-2: システム仕様書更新

`update-system-specs` agent を経由し、aiworkflow-requirements skill 配下の以下を確認:

- Step 1-A: skill 正本（該当章があれば retryable continuation の表示要件を追記）
- Step 1-B: index.json
- Step 1-C: keywords.json（「retryable continuation」「back-fill 再試行」を必要に応じて追加）
- Step 2（条件付き）: 該当章不在の場合は追記不要を `outputs/phase-12/system-spec-update-summary.md` に記録

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に canonical absolute path で更新ファイルを列挙する:

- `apps/web/src/lib/admin/api.ts`
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`
- `apps/web/src/lib/admin/__tests__/api.test.ts`
- `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx`
- `docs/30-workflows/ut-07b-fu-02-admin-schema-alias-retry-label/**`
- （該当時）`.claude/skills/aiworkflow-requirements/references/<該当章>.md`
- （該当時）`.claude/skills/aiworkflow-requirements/LOGS/` fragment または `docs/30-workflows/LOGS.md`

## Task 12-4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md` を出力（**0 件でも必須**）。

候補:

- 後続: GET `/admin/schema/aliases/:diffId/backfill` をポーリングして残件 progress を表示する UI（本タスク対象外、別 Issue）
- 後続: retryable 通知の運用ルール（Slack 通知など）— 本タスクは管理 UI 内表示のみ

## Task 12-5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` を 3 観点固定で出力（**改善点なしでも必須**）。

- テンプレ改善: small UI label タスク向け短縮テンプレの提案有無
- ワークフロー改善: VISUAL 小規模タスクで Phase 11 manual screenshot を deferred 化する基準
- ドキュメント改善: API contract 不変を Phase 9 で `git diff` チェックする pattern の汎用化

## Task 12-6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` に以下を記録:

- CONST_005（実装仕様書必須項目）8 項目チェック
- CONST_007（先送り禁止 / 1 サイクル完了）チェック
- 7 必須成果物の実体確認

## 完了条件

- [ ] Task 12-1〜12-6 の 6 必須タスクが実行
- [ ] `outputs/phase-12/` 配下に最低 7 ファイル実体（main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md）
- [ ] aiworkflow-requirements への同期 or 追記不要判定が記録
- [x] workflow root の `workflow_state` は `implemented-local`（web 実装 + focused tests 完了 / runtime screenshot pending）
