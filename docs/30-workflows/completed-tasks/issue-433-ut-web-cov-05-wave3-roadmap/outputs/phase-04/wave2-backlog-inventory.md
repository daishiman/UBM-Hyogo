# Wave-2 Backlog Inventory

Status: `COMPLETED`

| source-task | source-file | label | layer | file/area | description | proposed-target |
| --- | --- | --- | --- | --- | --- | --- |
| ut-08a-01-public-use-case-coverage-hardening | phase-12/implementation-guide.md L107 | api-coverage-actuals-未取得 | route handler / use-case | `apps/api` 全体 | `pnpm --filter @ubm-hyogo/api test:coverage` の実数値が wave-2 時点で未取得。`schemaAliasAssign` の pre-existing timeout 影響を切り離して測る必要あり。 | wave-3-unit (本 roadmap で実測済) |
| ut-08a-01-public-use-case-coverage-hardening | phase-12/skill-feedback-report.md L46 | route-error-mapping-境界 | route handler | `apps/api/src/routes/public/**` | route 単体テストでの error mapping 境界検証は実装済だが、auth middleware 装着なしの session guard 性質確認は integration 寄り。 | integration-test |
| ut-web-cov-01-admin-components-coverage | phase-12/skill-feedback-report.md L6 | NON_VISUAL-VISUAL-runtime-分離 | admin component | admin component 群 | NON_VISUAL coverage で screenshot N/A と runtime PASS を分離する governance を確立。視覚回帰系は別 layer。 | e2e |
| ut-web-cov-02-public-components-coverage | phase-12/skill-feedback-report.md L8 | implemented-local-PR-ゲート | public component | public component 群 | NON_VISUAL の PR 作成は user-gated。Phase 13 の measured PASS が成立しても roadmap 側で wave-3 fold 必要。 | wave-3-unit |
| ut-web-cov-03-auth-fetch-lib-coverage | phase-12/implementation-guide.md L58 | oauth-client-fallback | lib | `apps/web/src/lib/oauth-client.ts` | 内部 path / 未指定 fallback / `//` schemeless 防止 / 外部 URL fallback / 空文字 fallback の境界は単体で書いたが、redirect 経路の e2e 検証は未着手。 | e2e |
| ut-web-cov-04-admin-lib-ui-primitives-coverage | phase-12/skill-feedback-report.md L5 | reserved-evidence-files | lib / admin component | admin lib & ui primitives | Phase 11 reserved evidence 方式の運用化に伴い、視覚 evidence の整備は wave-3 以降で再点検。 | polish-only |
| ut-web-cov-04-admin-lib-ui-primitives-coverage | documentation-changelog.md (NON_VISUAL governance) | admin-lib-branch-gap | lib | `apps/web/src/lib/admin/**` | Phase 12 unassigned-task 検出はゼロだが、wave-2 計測で branch coverage が 80% 未満の admin lib は残存。 | wave-3-unit |
