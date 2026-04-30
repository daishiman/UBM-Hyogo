# system-spec-update-summary — UT-04 D1 データスキーマ設計

> spec-update-workflow.md（task-specification-creator skill）の Step 1-A / 1-B / 1-C / Step 2 構造に従う。

## Step 1-A: spec_created タスク記録 + 関連 doc リンク + topic-map

| 同期対象 | 記述内容 | 状態 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 既存正本として参照し、UT-04 skill feedback 由来の DDL 同期テンプレ導線を追加 | updated |
| `.claude/skills/aiworkflow-requirements/references/database-schema-ddl-template.md` | DDL 反映時のテーブル別セクション分割・制約一覧表テンプレを新規分離 | updated |
| `.claude/skills/aiworkflow-requirements/references/database-indexes.md` | `database-schema.md` の 500 行制限超過を避けるためインデックス一覧を責務分離 | updated |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 既存正本として参照。`bash scripts/cf.sh d1 migrations apply` 手順は Phase 5 runbook 側に閉じるため、本 PR では reference 本体へ重複追記しない | verified |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned.md` | UT-04 lessons hub 行を追加 | updated |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | UT-04 を `spec_created / docsOnly=true / NON_VISUAL / Phase 13 blocked` として active ledger に追加 | updated |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `database-schema.md` / `database-schema-ddl-template.md` / `database-indexes.md` の索引を再生成 | updated |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | UT-04 workflow inventory 行を追加 | updated |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | UT-04 spec sync root と legacy/current schema 境界を追加 | updated |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 索引再生成で UT-04 キーワードを追加 | updated |
| `.claude/skills/aiworkflow-requirements/SKILL.md` / `LOGS/_legacy.md` | UT-04 close-out sync を変更履歴と実行ログに記録。`LOGS.md` はこの skill では archive index 移行済みで、実体は `LOGS/_legacy.md` | updated |
| `.claude/skills/task-specification-creator/SKILL.md` / `LOGS/_legacy.md` / `references/phase-12-documentation-guide.md` | Phase 12 一括 SubAgent 実行プロファイルをスキルへ反映。`LOGS.md` は存在せず、実体は `LOGS/_legacy.md` | updated |
| 関連 doc 双方向リンク | 本 PR では UT-04 workflow 側から上流・下流を参照。既存タスク側への追記は実装 wave で必要時に行う | deferred |

## Step 1-B: 実装状況テーブル更新（spec_created）

| 対象 | 変更内容 |
| --- | --- |
| `docs/30-workflows/ut-04-d1-schema-design/index.md` | workflow root の状態は `spec_created`、Phase 1〜12 の成果物状態は `completed` として ledger と整合 |
| `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md` | 状態を `spec_created` に更新し、後継 workflow root と Phase 13 境界を追記 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | 関連タスク仕様書として UT-04 参照を追加 |

> **本タスクは spec のみ**のため `implemented` には更新しない。実 migration が merge された段階で別 PR が `implemented` へ昇格させる（phase-12-pitfalls.md「設計タスクの workflow root を completed にしてしまう」回避）。

## Step 1-C: 関連タスクテーブル更新

| 対象 | 反映内容 |
| --- | --- |
| `docs/30-workflows/ut-04-d1-schema-design/index.md` | 上流（03-serial / 02-runtime / 01b-bootstrap）と下流（UT-09 / UT-06 / UT-21）を明記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory から UT-04 へ到達可能に更新 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | current schema と legacy schema の境界を追記 |

## Step 2（条件付き）: 新規インターフェース追加時のみ

**判定: N/A**

理由:

- 本タスクは Cloudflare D1 の schema 設計のみ。TypeScript インターフェース / API endpoint / IPC 契約 / shared package 型の **新規追加なし**。
- DDL の正本は既存の `database-schema.md` にあり、UT-04 はその current facts に基づく workflow spec を追加する。新規 DDL 本体は後続実装 PR で `apps/api/migrations/` に投入する。
- 型生成（`packages/shared/src/zod/*` 等の DDL→型派生）は別タスク（実装フェーズ / UT-shared-zod-codegen 候補）でスコープ化済み。本 Phase 12 ではスコープ外。

> Step 2 を **N/A 判定の根拠付きで明記** しておくことで、phase-12-pitfalls.md「Step 2 必要性判定の記録漏れ」を回避する。

## Phase 11 の NON_VISUAL evidence 転記

Phase 11 の `outputs/phase-11/main.md` に記載の evidence 差分表（S-1〜S-7）と既知制限 8 件は、本サマリー経由で Phase 13 PR description の根拠として接続される。spec PR 段階のため smoke 実行ログ（manual-smoke-log.md §1〜§7）は **TBD** 状態で、実装 Phase で実値に置換する旨を Phase 13 PR body に明記する。
