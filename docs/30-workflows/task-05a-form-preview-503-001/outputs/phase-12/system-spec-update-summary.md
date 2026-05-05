# system-spec-update-summary — task-05a-form-preview-503-001

## Step 1-A: 完了タスクとしての記録

| 項目 | 値 |
| --- | --- |
| タスク ID | task-05a-form-preview-503-001 |
| タスク名 | `/public/form-preview` 503 root cause + fix |
| GitHub Issue | #388（CLOSED, `Refs #388` で参照） |
| 完了 Phase | 1〜10 local / 12 completed。Phase 11 は runtime evidence blocked、13 は PR 作成 Phase で本サイクル対象外 |
| 実装サイクル完了日 | 2026-05-05（コード側 AC-4/AC-5/AC-6 達成。AC-1/AC-2/AC-3 は runtime evidence blocked） |
| visualEvidence | NON_VISUAL（curl + vitest） |

### same-wave sync

| 同期先 | 状態 | 内容 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 更新 | active workflow と runtime boundary を登録 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 更新 | 即時参照行を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 更新 | バグ修正タスク種別から逆引き可能化 |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-05a-form-preview-503-001-artifact-inventory.md` | 追加 | artifact inventory |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-05a-form-preview-503-2026-05.md` | 追加 | lessons learned |
| `.claude/skills/aiworkflow-requirements/changelog/20260505-task-05a-form-preview-503.md` | 追加 | changelog fragment |

## Step 1-B: 実装状況（実装サイクル実値反映）

| 区分 | ファイル / 領域 | 変更概要 |
| --- | --- | --- |
| backend use-case | `apps/api/src/use-cases/public/get-form-preview.ts` | `manifest === null` 分岐に `@ubm-hyogo/shared/logging.logWarn` を追加（`code: "UBM-5500"` / `usedFallback` 等の context 1 行 emit）。503 mapping は不変 |
| backend test (use-case) | `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | TC-RED-01, TC-RED-02-A, TC-RED-02-B, TC-FAIL-02-a, TC-FAIL-02-b, TC-COV-01 の 6 ケース追加 |
| backend test (route) | `apps/api/src/routes/public/index.test.ts` | TC-RED-03 (HTTP 503 + UBM-5500 body) を追加 |
| backend test helper | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | `bindLog?: Array<{ sql; bindings }>` フィールド追加。`buildEmptySchemaD1()` / `buildSchemaD1WithVersion()` factory は **見送り**（`createPublicD1Mock({ latestVersion: null })` で同等表現可能のため過剰実装回避） |
| データ | staging / production D1 `schema_versions` | 2026-05-05 review curl では staging / production とも 503。D1 write / production mutation は user approval gate 外では未実行 |
| API 仕様 | `/public/form-preview` response shape | **変更なし**（不変条件遵守） |
| 認証境界 | `apps/api/src/routes/admin` 等 | **変更なし** |
| `packages/shared/src/errors.ts` | UBM-5500 → 503 mapping | **変更なし**（不変条件遵守） |

## Step 1-C: 関連タスク

| 関連 | リンク | 関連性 |
| --- | --- | --- |
| 元 unassigned spec | `docs/30-workflows/unassigned-task/task-05a-form-preview-503-001.md` | 本タスクが昇格元 |
| follow-up 起点 | `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-005` | 503 の検知元 |
| 上流 | 05a public form-preview implementation | use-case 実装の親 |
| 周辺 | 08a-A public-use-case-coverage-hardening | coverage 観点の親 |

## Step 2: 新規 interface 追加判定

| 観点 | 判定 |
| --- | --- |
| API endpoint 追加 | **なし** |
| Response shape 変更 | **なし** |
| D1 schema 列追加 | **なし** |
| consent key 追加 | **なし** |
| environment binding 追加 | **なし** |

→ **新規 interface 追加なし**。既存契約の遵守のみ。

## Step 3: 仕様更新先

| 仕様 | 更新要否 | 備考 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | **不要** | API shape 不変 |
| `docs/00-getting-started-manual/specs/08-free-database.md` | **不要** | schema 列不変。ただし runbook は `schema_versions.state='active'` と `schema_questions.revision_id` に補正済み |
| 本タスク `implementation-guide.md` の runbook | **必要** | staging 復旧手順を追加 |
