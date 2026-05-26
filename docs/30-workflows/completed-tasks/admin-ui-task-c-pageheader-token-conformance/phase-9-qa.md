---
spec_classification: implementation_spec
state: spec_created
phase: 9
phase_name: QA / CI gate
created_at: 2026-05-26
workflow: docs/30-workflows/admin-ui-task-c-pageheader-token-conformance/
---

# Phase 9: QA / CI gate

## 9.1 必須 green ゲート

| gate | コマンド | 期待 |
|------|---------|------|
| typecheck | `mise exec -- pnpm typecheck` | green |
| lint | `mise exec -- pnpm lint` | green |
| verify-test-suffix | CI workflow | green (新規 spec は `.spec.tsx` のみ) |
| verify-design-tokens | CI workflow `verify-design-tokens` | green (AC-C3 / C4 / C6) |
| vitest unit (apps/web) | `mise exec -- pnpm --filter web test` | 新規 10 spec green |
| structure gate | `tests/structure/admin-page-header-adoption.spec.ts` | green |
| coverage threshold | `mise exec -- pnpm --filter web test:coverage` | threshold drop なし |

## 9.2 ローカル手動確認

- `mise exec -- pnpm --filter web dev` を起動し、admin 9 page を遷移
- AdminPageHeader が title / eyebrow / breadcrumb / actions slot 通りに表示されることを目視
- visual baseline 取得は Task E に委譲

## 9.3 AC 突合

| AC | 確認コマンド / 方法 |
|----|---------------------|
| AC-C1 | `grep -L 'AdminPageHeader' apps/web/app/\(admin\)/admin/**/page.tsx` |
| AC-C2 | `grep -rE '<Breadcrumb\b\|from .*components/admin/Breadcrumb' apps/web/app/\(admin\)/admin/**/page.tsx` |
| AC-C3 | palette regex grep |
| AC-C4 | HEX regex grep |
| AC-C5 | `grep -E '<main' apps/web/app/\(admin\)/admin/identity-conflicts/page.tsx` |
| AC-C6 | `verify-design-tokens` CI |
| AC-C7 | RTL spec 9 |
| AC-C8 | `find apps/web/src -name '*PageHeader*'` diff = AdminPageHeader.tsx のみ |

## 9.4 失敗時の対処

- typecheck fail: `eyebrow` / `headingId` prop の export / import が一致しているか確認
- verify-design-tokens fail: panel 内部に palette が残っていないか追加 grep
- vitest fail: page.tsx の SSR fetch mock が server component 引数と整合しているか確認
