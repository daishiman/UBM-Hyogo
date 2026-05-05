# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| 機能名 | task-issue-191-schema-aliases-implementation-001 |
| 作成日 | 2026-05-01 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| scope | D1 / repository / 07b / 03a の実装設計 |

## 目的

Phase 1 の AC を、編集対象ファイル、依存順序、transaction 境界、検証コマンドへ落とす。

## 実行タスク

| Concern | 変更対象 | owner | 完了条件 |
| --- | --- | --- | --- |
| D1 schema | `apps/api/migrations/<NNNN>_create_schema_aliases.sql` | backend | table/index が PRAGMA で確認できる |
| Repository | `apps/api/src/repository/schemaAliases.ts` または現行 repository 命名 | backend | lookup/insert/update contract tests |
| 07b route/workflow | `apps/api/src/routes/admin/schema.ts`, `apps/api/src/workflows/schemaAliasAssign.ts` | backend | endpoint 維持、write target 差し替え |
| 03a sync lookup | `apps/api/src/jobs/sync-forms-responses.ts`, `apps/api/src/sync/schema/*` | backend | alias-first + fallback |
| Static guard | test または script | backend | direct update 検出 |

## 参照資料

| 資料名 | パス | 説明 |
| --- | --- | --- |
| Database implementation | `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` | `schema_aliases` 契約 |
| API endpoints | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/admin/schema/aliases` 契約 |
| Manual API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | stableKey 用語 |
| Admin management | `docs/00-getting-started-manual/specs/11-admin-management.md` | 管理 UI 側境界 |

## 実行手順

1. 最新 migration 番号を `ls apps/api/migrations` で確認する。
2. 実 DB と仕様の対応表を作る。

| 仕様要素 | 実装先 | 検証 |
| --- | --- | --- |
| id | `schema_aliases.id` TEXT PRIMARY KEY。ULID 推奨 | `PRAGMA table_info` |
| alias source question | `schema_aliases.alias_question_id` TEXT NOT NULL UNIQUE | `PRAGMA table_info` + duplicate test |
| canonical stable key | `schema_aliases.stable_key` TEXT NOT NULL | lookup test |
| label snapshot | `schema_aliases.alias_label` TEXT | insert test |
| source | `schema_aliases.source` TEXT NOT NULL DEFAULT `'manual'` | insert test |
| audit actor | `schema_aliases.resolved_by` TEXT。manual resolve では必須 | route auth test |
| timestamps | `created_at`, `resolved_at` | insert test |
| queue resolution | `schema_diff_queue.status='resolved'` | transaction test |

3. 仕様語と実装語の対応を固定する。

| 仕様語 | 実装語 | 備考 |
| --- | --- | --- |
| alias apply | `POST /admin/schema/aliases` | HTTP path は変更しない |
| candidate/confirmed | `queued/resolved` | 07a/07b drift 再発防止 |
| stableKey fallback | `schema_questions.stable_key` read only | retirement は別タスク |

4. D1 batch/transaction の境界を設計する。`schema_aliases` INSERT と queue resolved 更新は atomic に扱う。
5. `source='manual'` の場合は auth middleware 由来の admin user id を `resolved_by` に記録する。
6. 03a は lookup error と alias miss を型または result で分離する。

## 統合テスト連携

| コマンド | 目的 |
| --- | --- |
| `mise exec -- pnpm --filter @repo/api test` | repository/route/workflow contract |
| `rg -n "UPDATE schema_questions SET stable_key|stableKey.*schema_questions" apps packages` | 直更新 guard |
| `wrangler d1 migrations apply --local` | local D1 migration apply |

## 多角的チェック観点（AIが判断）

- endpoint rename が混入していないか。
- `schema_questions` 直更新と `schema_aliases` INSERT が二重書き込みになっていないか。
- transient error が fallback miss に潰されていないか。

## サブタスク管理

| Phase | サブタスク | 依存 |
| --- | --- | --- |
| 4 | test matrix | Phase 2 |
| 5 | implementation runbook | Phase 4 |
| 6 | failure cases | Phase 5 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| 設計書 | `phase-02.md` | target topology と validation matrix |

## 完了条件

- [ ] 変更対象ファイルと owner が定義されている
- [ ] D1 schema と repository contract の照合手順がある
- [ ] transaction 境界が明記されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] Phase 1 AC と Phase 2 設計の対応が取れている
- [ ] Phase 3 でレビューできる粒度になっている

## 次Phase

Phase 3: 設計レビュー
