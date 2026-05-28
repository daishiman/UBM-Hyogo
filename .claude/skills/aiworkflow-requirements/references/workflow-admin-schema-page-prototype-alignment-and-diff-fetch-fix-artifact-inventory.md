# Workflow Artifact Inventory — admin-schema-page-prototype-alignment-and-diff-fetch-fix

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/` |
| state | `implemented_local_evidence_captured / implementation / VISUAL / runtime_visual_pending` |
| parent | `docs/30-workflows/admin-ui-prototype-alignment/` |
| purpose | `/admin/schema` prototype alignment plus observed `/admin/schema/diff` 404 regression guard |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/web/app/(admin)/admin/schema/page.tsx` | Breadcrumb「スキーマ」, page-head, CURRENT REVISION, stats grid-4, SchemaDiffPanel, REVISIONS / ALIAS HISTORY |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | `hideInlineStats` prop and `schema-field-card diff-{type}` + `Chip` rendering |
| `apps/web/src/components/layout/AdminSidebar.tsx` | `/admin/schema` label unified to「スキーマ」 |
| `apps/web/src/lib/admin/server-fetch.ts` | Playwright-only `/admin/schema/diff` fixture fallback for existing smoke/visual specs |
| `apps/web/src/styles/globals.css` | schema cards, grid-2/grid-4, stack/row helpers |
| `apps/web/app/(admin)/admin/schema/page.spec.tsx` | Page regression for prototype-aligned sections and stale fallback removal |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx` | Panel regression for card classes and `hideInlineStats` |
| `apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx` | Sidebar label regression |

## Workflow Artifacts

| Path | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/artifacts.json` | root state ledger |
| `docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/outputs/artifacts.json` | output mirror |
| `docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 compliance and 4-condition verdict |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | `/admin/schema` screen blueprint SSOT |

## Evidence

| Evidence | Status |
| --- | --- |
| Web Vitest | PASS: 158 files, 1147 tests, 1 skipped |
| Local Playwright schema visual | PASS: 7 tests; screenshots under `docs/30-workflows/completed-tasks/admin-schema-page-prototype-alignment-and-diff-fetch-fix/outputs/phase-11/screenshots/` |
| Authenticated staging screenshot | pending user-gated runtime |
| Staging deploy / tail investigation | pending user-gated runtime |
| Commit / push / PR | pending user approval |

## Lessons

- **L-ASCHEMA-001**: prototype 整合 + observed API 404 同居タスクは UI 着手前に Lane A（tail / curl / deploy 同期 / mount 順）で根本原因を切り分け、Phase 2 切り分け表を必須化する。
- **L-ASCHEMA-002**: parent page で stats を集約し、child panel に `hideInlineStats?: boolean`（default `false`）を持たせる。`_shared` Primitive 昇格は禁止。
- **L-ASCHEMA-003**: sidebar 表記 1 行統一は単独 issue 化せず関連 UI wave に併修、`AdminSidebar.component.spec` 追記をチェックリスト化。
- **L-ASCHEMA-004**: `*.contract.spec.ts` は D1 lane（`vitest.d1.config.ts` + `singleFork`）専用。Phase 4 / Phase 9 に lane と実行コマンドを明示。
- **L-ASCHEMA-005**: `server-fetch.ts` の Playwright fallback は task-specific fixture の **後** に append。chain 先頭挿入は既存 spec の expected fixture を上書きする。

### Anti-pattern

- prototype 整合タスクで API endpoint surface を改修する（不変条件 #1 違反）。
- panel inline stats を destructive 削除して既存呼び出し点を破壊する。
- contract spec を unit lane に置いて「実行されない緑」を量産する。
- Playwright fallback を chain 先頭に挿入し silent 200 で 404 分岐 regression を吸収させる。

詳細は [[lessons-learned-admin-schema-page-prototype-alignment-and-diff-fetch-fix-2026-05]] / task-specification-creator patterns-lessons 末尾「Admin page prototype 整合 + observed API 404 同居タスクパターン」を参照。
