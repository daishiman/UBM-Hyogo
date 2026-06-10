# Documentation Changelog

[実装区分: 実装仕様書]

本タスク（`admin-schema-history-purpose-clarity-and-filter-fix`・`implemented_local_evidence_captured`）のドキュメント同期結果を全 Step 個別に記録する。

---

## workflow-local 同期（本サイクルで実施）

| 成果物 | 結果 |
|--------|------|
| `phase-1-requirements.md` 〜 `phase-13-pr.md`（Phase 仕様書） | 作成済み（Phase 1-10/12 completed / Phase 11 pending_user_gate / Phase 13 pending_user_approval） |
| `shared-context.md`（SSOT） | 作成済み（対象ファイル / 関数シグネチャ / Lane / AC / DoD） |
| `outputs/phase-12/main.md` | 本サイクルで作成 |
| `outputs/phase-12/implementation-guide.md` | 本サイクルで作成（Part 1 + Part 2） |
| `outputs/phase-12/system-spec-update-summary.md` | 本サイクルで作成（Step 2 = N/A） |
| `outputs/phase-12/documentation-changelog.md` | 本ファイル |
| `outputs/phase-12/unassigned-task-detection.md` | 本サイクルで作成（M-1 / M-2 baseline） |
| `outputs/phase-12/skill-feedback-report.md` | 本サイクルで作成 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 本サイクルで作成（canonical 9） |
| `outputs/phase-11/manual-test-result.md` | local command evidence 記録済み（focused Vitest / typecheck / token / apps-api diff） |
| `artifacts.json` / `outputs/artifacts.json` / `index.md` | 作成済み（status `implemented_local_evidence_captured`） |

---

## global skill sync（aiworkflow-requirements）

| Step | 対象 | 結果 |
|------|------|------|
| Step 1-A 新規 export interface | shared 型 / API contract への公開 interface 追加 | **該当なし**（apps/web ローカル表現層のみ） |
| Step 1-B 既存 shared / API contract 変更 | `AppliedFiltersZ` batchId 追加は web adapter zod の後追い | **該当なし**（API contract 不変） |
| Step 1-C specs/** 影響 | `/admin/schema/history` 画面表現契約 | `09g-screen-blueprints-admin.md` に追記 |
| Step 2 system spec 昇格 | aiworkflow-requirements system spec | `/admin/schema/history` 画面契約のみ同期。API / DB は N/A |

> 実装差分が入ったため、aiworkflow-requirements の task-workflow-active / artifact-inventory / changelog / quick-reference / resource-map / SKILL-changelog / LOGS を同一 wave で同期する。

---

## system spec（specs/**）

| 対象 | 結果 |
|------|------|
| `docs/00-getting-started-manual/specs/01-api-schema.md` | **該当なし**（API schema 不変） |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`（`/admin/schema/history` 節） | 目的説明 / card list / `.schema-history-error` / batchId 受理・filter UI 非追加を追記 |

---

## まとめ

- workflow-local: 全 strict 7 + Phase 仕様書 + Phase 11 local evidence を本サイクルで同期。
- global skill / system spec: 画面表現契約と aiworkflow ledgers を同期。API / D1 / Google Form は N/A。
