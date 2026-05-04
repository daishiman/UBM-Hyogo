# Documentation Changelog — ut-08a-01-public-use-case-coverage-hardening

## 概要

- 2026-05-03: docs-only 表記を `implementation` 実装仕様書へ再分類（CONST_004）。CONST_005 必須項目を Phase 1-13 / outputs に反映。
- 2026-05-03: workflow ルートを `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-08a-01-public-use-case-coverage-hardening/` から `docs/30-workflows/ut-08a-01-public-use-case-coverage-hardening/` へ昇格。Phase 12 完了後 `docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/` へ移動。
- 2026-05-03: `.claude/skills/aiworkflow-requirements/` 配下 4 ファイルを UT-08A-01 implementation 完了状態に同期。

## 変更ファイル一覧

`git status --short` ベースで分類。

### current（本タスクで変更）

#### apps/api 新規追加（テスト実装）

| path | 種別 | 内容 |
| --- | --- | --- |
| `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | 新規 | D1 fragment dispatch mock + fixture builder |
| `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | 新規 | happy / schema null / D1 failure |
| `apps/api/src/use-cases/public/__tests__/get-public-member-profile.test.ts` | 新規 | happy / 非公開 404 / D1 failure |
| `apps/api/src/use-cases/public/__tests__/get-public-stats.test.ts` | 新規 | happy / sync job null / D1 failure |
| `apps/api/src/use-cases/public/__tests__/list-public-members.test.ts` | 新規 | happy + pagination / 0 件 / D1 failure |
| `apps/api/src/routes/public/index.test.ts` | 新規 | 4 public route 直叩き + cache header + 404 boundary |

#### docs 新規追加（本タスク workflow root）

`docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/` 配下に Phase 1-13 spec、`artifacts.json`、`index.md`、Phase 12 outputs 7 ファイル（`implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` / `main.md`）。

#### baseline 同期（既存正本の更新）

| path | 種別 | 内容 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 編集 | UT-08A-01 行追加、wave-1 Boundary 文言を UT-08A-01 implementation 化に合わせ更新 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 編集 | wave-2 集約行に UT-08A-01 workflow root を追加、状態を `Phase 1-12 completed / Phase 13 pending_user_approval` に更新 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 | UT-08A-01 を `implemented-local / implementation` として明記、wave-2 行に canonical implementation root を併記、AC / 境界に focused tests を反映 |
| `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` | 編集 | UT-08A-01 行を workflow ルート直下へ移動、状態を昇格、Gate Boundary を「Upgrade gate is advanced by UT-08A-01」に書き換え |

### baseline（変更なし、参照のみ）

| path | 用途 |
| --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 参照（不変条件保持） |
| `docs/00-getting-started-manual/specs/03-data-fetching.md` | 参照（不変条件保持） |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 参照（変更なし） |
| `.github/workflows/verify-indexes.yml` | gate のみ（CI 側で UT-08A-01 indexes drift を検出） |

## ディレクトリ移動

旧パス → 新パス:

```
docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-08a-01-public-use-case-coverage-hardening/
  → docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/
```

`git status` 上は旧パス配下が `D`（37 ファイル）として、新パスが `??`（未追跡）として表示される。これは git rename 検出ではなく削除＋新規追加として記録される構造的差分で、内容上は workflow ルートの昇格 + completion ディレクトリ集約の 1 操作。

## validator 結果

| validator | 想定実行コマンド | 期待結果 | 実行記録 |
| --- | --- | --- | --- |
| skill indexes 再生成 | `pnpm indexes:rebuild` | drift なし | 本 Phase 12 では aiworkflow-requirements 配下を手動同期済。CI gate `.github/workflows/verify-indexes.yml` の `verify-indexes-up-to-date` job で drift を検出する想定 |
| planned wording 残存 | `rg -n "仕様策定のみ\|実行予定\|保留として記録" docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/outputs/phase-12/` | `planned wording なし` | 実行済（`system-spec-update-summary.md` Step 2A に記録） |
| focused vitest | `pnpm --filter @ubm-hyogo/api exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/use-cases/public/__tests__ apps/api/src/routes/public/index.test.ts` | 17/17 PASS | 実行済（`implementation-guide.md` 検証結果） |
| typecheck | `pnpm --filter @ubm-hyogo/api typecheck` | エラー 0 | 実行済（`implementation-guide.md` 検証結果） |
| lint | `pnpm --filter @ubm-hyogo/api lint` | violations 0 | 実行済（exit code 0、apps/api の lint script は `tsc -p tsconfig.json --noEmit`） |
| 全体 coverage | `pnpm --filter @ubm-hyogo/api test:coverage` | Statements/Functions/Lines >=85%, Branches >=80% | 未取得（pre-existing `schemaAliasAssign` timeout risk と分離扱い、要追測） |

## 関連

- 上流 wave: `docs/30-workflows/completed-tasks/ut-coverage-2026-05-wave/`
- 元 spec 配置: `docs/30-workflows/ut-coverage-2026-05-wave/wave-2-parallel-coverage/ut-08a-01-public-use-case-coverage-hardening/`（削除済、本 workflow root に集約）
- 別系統リスク追跡: `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md`（`schemaAliasAssign` timeout を含む全体 coverage gap）
