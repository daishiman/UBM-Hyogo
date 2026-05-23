# Phase 1 — Spec Extraction Map（system spec ↔ current code anchor）

| 正本仕様（system spec） | 適用 primitive | current code anchor | drift 種別 | 解消先 Phase |
| --- | --- | --- | --- | --- |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md` §FormField | FormField | `apps/web/src/components/admin/MeetingPanel.tsx:158,162,171,191,207,224` | 直接 `<input>` 利用 | Phase 4 |
| 同上 §FormField | FormField | `apps/web/src/components/admin/AuditLogPanel.tsx:172,176,180,184,188,192` | 直接 `<input>` 利用 | Phase 4 |
| 同上 §FormField | FormField | `apps/web/src/components/admin/TagQueuePanel.tsx:165` | 直接 `<input>` 利用 | Phase 4 |
| 同上 §FormField | FormField | `apps/web/src/components/admin/SchemaDiffPanel.tsx:163` | 直接 `<input>` 利用 | Phase 4 |
| 同上 §FormField | FormField | `apps/web/src/components/public/DensityToggle.client.tsx:48` | 直接 `<input>` 利用（type=radio 想定。FormField でラップするか Toggle primitive 化判断） | Phase 4 |
| 同上 §useAdminMutation | useAdminMutation | `apps/web/src/components/admin/{MeetingPanel,AuditLogPanel,TagQueuePanel,SchemaDiffPanel,RequestQueuePanel}.tsx` | fetch / `useTransition` を hook 経由に統一 | Phase 4 |
| 同上 §Breadcrumb | Breadcrumb | `apps/web/app/(admin)/admin/**/page.tsx`（8 routes） | 配置なし | Phase 4 |
| 同上 §EmptyState | EmptyState | members / tags / meetings / schema / requests / identity-conflicts / audit / public-members の zero-result 分岐 | 配置なし | Phase 4 |
| 同上 §Pagination | Pagination | members / meetings / audit の list view | 配置なし | Phase 4 |
| 同上 §Icon | Icon | 既採用箇所（既に primitive 経由） | 回帰防止のみ | Phase 7（grep gate） |
| `CLAUDE.md` §UI prototype alignment 不変条件 2 | tokens.css | 全 components | HEX 直書き禁止（既存 task-18 gate と併走） | Phase 6 / Phase 7 |
| `CLAUDE.md` §重要な不変条件 8 | test suffix | 新規 spec | `*.spec.{ts,tsx}` のみ許可 | Phase 5 |

## 正本順位（衝突時）

1. `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
2. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md`
3. `docs/00-getting-started-manual/specs/*.md`
4. プロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）

## NO-GO 条件

- 新 primitive を増やす提案が出た場合 → Phase 2 で却下し本 spec scope 外とする
- 新 API endpoint / D1 schema 変更が必要と判明した場合 → 本タスクを停止し別 spec を切る
- `verify-design-tokens` が既に red の状態で開始 → 先に task-18 系で復旧
