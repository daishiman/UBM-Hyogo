# Implementation Guide — issue-801 admin error focus transfer

## Part 1: 中学生レベルの説明

管理画面でエラーが起きたとき、画面を見る人だけでなく、音声読み上げを使う人にも「エラーが起きた」とすぐ伝わる必要があります。
今回の変更では、エラー画面が出た瞬間に見出しへ自動で注目が移るようにしました。
また、本番環境では詳しすぎるエラー内容を出さず、必要なときだけエラーIDを見せます。

## Part 2: 技術者向け要約

`apps/web/app/(admin)/admin/error.tsx` を root `apps/web/app/error.tsx` と同じ error boundary contract に揃えた。
`useRef<HTMLHeadingElement>` と `useEffect` で mount 後に `focus({ preventScroll: true })` を呼び、h1 は `tabIndex={-1}` を持つ。
`role="alert"` / `aria-live="assertive"` / digest 表示 / dev-only stack / structured logger を追加し、admin scope を logger payload に含める。

## Part 3: 実装対象

| Path | Change |
| --- | --- |
| `apps/web/app/(admin)/admin/error.tsx` | admin error boundary rewrite |
| `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` | focused component tests |

## Part 4: 検証コマンド

```bash
pnpm -F "@ubm-hyogo/web" typecheck
pnpm -F "@ubm-hyogo/web" lint
pnpm -F "@ubm-hyogo/web" test -- --run 'apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx'
pnpm verify:phase12-compliance --root docs/30-workflows/issue-801-admin-error-focus-transfer
```

## Part 5: Phase 11 Evidence

| Evidence | Path | Status |
| --- | --- | --- |
| manual result | `outputs/phase-11/manual-test-result.md` | local deterministic checks PASS / runtime visual pending |
| screenshot plan | `outputs/phase-11/screenshot-plan.json` | planned path: `outputs/phase-11/screenshots/admin-error-focus.png`; status `pending_user_gate` |
| visual review | `outputs/phase-11/ui-sanity-visual-review.md` | runtime screenshot not claimed |
| capture metadata | `outputs/phase-11/phase11-capture-metadata.json` | `runtimeVisualCaptured=false` |
| web test evidence | `outputs/phase-11/evidence/focused-web-test.txt` | PASS; package command executed apps/web suite and included the new admin error test file |
| typecheck evidence | `outputs/phase-11/evidence/typecheck.txt` | PASS |
| lint evidence | `outputs/phase-11/evidence/lint.txt` | PASS |
| grep gate evidence | `outputs/phase-11/evidence/grep-gate.txt` | PASS |

## Part 6: Next.js Boundary Scope

`apps/web/app/(admin)/admin/error.tsx` is the error boundary for `/admin` page and nested child route render errors. It does not catch errors thrown by the sibling parent layout `apps/web/app/(admin)/layout.tsx`; a parent-segment boundary such as `apps/web/app/(admin)/error.tsx` would be a separate task if layout failures need admin-specific UI.

## Part 7: 既知制限

Runtime screenshot and screen reader smoke are not executed automatically in this cycle.
They are tracked as VISUAL_ON_EXECUTION pending evidence because they need a browser/runtime setup and, for assistive technology, manual execution.
Commit, push, and PR remain user-gated.
