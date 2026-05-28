# 2026-05-27 admin-schema-page-prototype-alignment-and-diff-fetch-fix

## Summary

`/admin/schema` を `SchemaDiffPage` prototype に再整合し、observed `/admin/schema/diff` 404 を local contract / page regression で検知できる状態へ更新した。

## State

- `implemented_local_evidence_captured / implementation / VISUAL / runtime_visual_pending`
- Local web Vitest: 158 files PASS, 1147 tests PASS, 1 skipped
- Local Playwright schema visual: 7 tests PASS, screenshots captured under workflow Phase 11
- Staging deploy refresh, authenticated visual screenshots, commit, push, PR are user-gated.

## Implementation

- `apps/web/app/(admin)/admin/schema/page.tsx`: stale `Form schema 概要` fallback removed; page-head, CURRENT REVISION, stats grid-4, SchemaDiffPanel, REVISIONS and ALIAS HISTORY added.
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`: `hideInlineStats` and `schema-field-card diff-{type}` + `Chip` rendering added.
- `apps/web/src/components/layout/AdminSidebar.tsx`: label changed from `schema` to「スキーマ」.
- `apps/web/src/lib/admin/server-fetch.ts`: Playwright-only `/admin/schema/diff` fixture fallback added after task-specific schema fixtures.
- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`: `/admin/schema` blueprint synchronized.

## Follow-up Boundary

No unassigned task was created. Remaining work is runtime evidence gated by staging/authenticated browser access and PR publication approval.

## Lessons (skill 反映 wave 2026-05-27)

- L-ASCHEMA-001..005 を [[lessons-learned-admin-schema-page-prototype-alignment-and-diff-fetch-fix-2026-05]] に新規作成し、`task-specification-creator/references/patterns-lessons-and-pitfalls.md` 末尾へ「Admin page prototype 整合 + observed API 404 同居タスクパターン」として汎化反映。
- `artifact-inventory` の Lessons 節を ID 付きへ更新（L-ASCHEMA-001..005 + Anti-pattern 4 件）。
- 苦戦箇所要点: ① stale staging deploy + Playwright fixture silent absorb で 404 が UI に届かない / ② `SchemaDiffPanel` 8 参照点の destructive 削除回避 / ③ contract spec の D1 lane 配置忘れ防止 / ④ Playwright fallback chain 順序 / ⑤ sidebar 表記併修の PR 同梱判断。
