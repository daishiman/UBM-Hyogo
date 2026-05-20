# Phase 09 — 受け入れ基準 (Acceptance Criteria)

## AC 一覧

- **AC-1**: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` が存在し、`useAutoFocusOnMount<T extends HTMLElement>(ref)` の signature で export されている
- **AC-2**: hook の単体 spec (`useAutoFocusOnMount.spec.tsx`) が 3 ケース (mount focus / ref null noop / re-render で再 focus しない) を全 pass
- **AC-3**: `apps/web/app/error.tsx` (root) が hook 経由で focus 呼び出ししている（直接 `headingRef.current?.focus(...)` を hook 外で呼ばない）
- **AC-4**: `apps/web/app/login/error.tsx` で `h1` に `ref` / `tabIndex={-1}` が付与され、hook が呼ばれている
- **AC-5**: `apps/web/app/profile/error.tsx` で同上
- **AC-6**: `apps/web/app/(admin)/admin/error.tsx` で同上
- **AC-7**: 4 boundary 各々の component spec で `focus({ preventScroll: true })` が呼ばれることを assert
- **AC-8**: `pnpm typecheck` pass
- **AC-9**: `pnpm lint` pass
- **AC-10**: 既存 `apps/web/app/__tests__/error.component.spec.tsx` の AC が維持されている
- **AC-11**: 新 test ファイルは `*.spec.tsx` のみ（lefthook `block-test-suffix` pass）
- **AC-12**: `bash scripts/verify-pr-ready.sh` executed and evidence recorded. In the uncommitted review cycle it may fail only on `indexes:rebuild drift` caused by the intentionally uncommitted regenerated aiworkflow index files; full pass is required after commit/PR handoff.
- **AC-13**: 既存 API endpoint / D1 schema / UI 文言 / OKLch token に対する変更がゼロ
- **AC-14**: `docs/30-workflows/completed-tasks/issue-769-root-error-focus/outputs/phase-12/unassigned-task-detection.md` の対応 followup が **consumed** に更新
- **AC-15**: Issue #799 は closed issue のため PR body は `Refs #799` とし、`Closes #799` を使わない

## 検証手順

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web vitest run \
  src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx \
  app/__tests__/error.component.spec.tsx \
  app/login/__tests__/error.component.spec.tsx \
  app/profile/__tests__/error.component.spec.tsx \
  "app/(admin)/admin/__tests__/error.component.spec.tsx"
bash scripts/verify-pr-ready.sh
```
