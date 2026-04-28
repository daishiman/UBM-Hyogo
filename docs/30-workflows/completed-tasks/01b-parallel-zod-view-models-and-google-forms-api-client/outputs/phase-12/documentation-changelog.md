# Documentation Changelog

タスク `01b-parallel-zod-view-models-and-google-forms-api-client` で追加・更新されたドキュメントの一覧。

## 新規追加（15 ファイル）

### Phase 仕様書（既存）

| ファイル | 種別 |
| --- | --- |
| `docs/30-workflows/01b-parallel-zod-view-models-and-google-forms-api-client/phase-01.md` 〜 `phase-13.md` | 仕様書（13 件） |
| `docs/30-workflows/01b-parallel-zod-view-models-and-google-forms-api-client/index.md` | エントリ |
| `docs/30-workflows/01b-parallel-zod-view-models-and-google-forms-api-client/artifacts.json` | メタ |

### Phase outputs（本タスクで新規生成）

| ファイル | 由来 Phase |
| --- | --- |
| `outputs/phase-07/main.md` | Phase 7 |
| `outputs/phase-07/ac-matrix.md` | Phase 7 |
| `outputs/phase-08/main.md` | Phase 8 |
| `outputs/phase-09/main.md` | Phase 9 |
| `outputs/phase-09/free-tier-estimate.md` | Phase 9 |
| `outputs/phase-10/main.md` | Phase 10 |
| `outputs/phase-11/typecheck.log` | Phase 11 |
| `outputs/phase-11/vitest.log` | Phase 11 |
| `outputs/phase-11/eslint-boundary.log` | Phase 11 |
| `outputs/phase-12/main.md` | Phase 12 |
| `outputs/phase-12/implementation-guide.md` | Phase 12 |
| `outputs/phase-12/system-spec-update-summary.md` | Phase 12 |
| `outputs/phase-12/documentation-changelog.md` | Phase 12（本ファイル） |
| `outputs/phase-12/unassigned-task-detection.md` | Phase 12 |
| `outputs/phase-12/skill-feedback-report.md` | Phase 12 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 |

## 既存ドキュメントの変更

| ファイル | 変更 |
| --- | --- |
| `doc/00-getting-started-manual/specs/*` | **変更なし** |
| `CLAUDE.md` | **変更なし** |
| `scripts/lint-boundaries.mjs` | `@ubm-hyogo/integrations-google` をボーダリ対象に追記済み（コードスクリプト） |

## 追加されたコード（参考 / ドキュメント外）

| パッケージ | 主なファイル |
| --- | --- |
| `packages/shared` | `src/branded/`, `src/types/{ids,common,response,schema,identity,viewmodel}/`, `src/zod/{primitives,field,response,identity,schema,viewmodel}.ts`, `src/utils/consent.ts` |
| `packages/integrations/google` | `src/forms/{auth,backoff,client,mapper,index}.ts` + 各 `*.test.ts` |

## 命名 / リンク注記

- パッケージ名は `@ubm-hyogo/shared`, `@ubm-hyogo/integrations-google`（後続 Wave での import パスはこの 2 つ）。
- 後続 PR 説明では本ファイルを `documentation-changelog.md` として参照する。
