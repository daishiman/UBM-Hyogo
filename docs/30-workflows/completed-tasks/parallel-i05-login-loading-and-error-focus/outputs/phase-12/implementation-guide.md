# Implementation Guide

## Part 1: 中学生レベルの説明

ログイン画面で読み込みに時間がかかると、何も表示されない画面は利用者にとって不安になる。
この変更では、読み込み中に灰色の骨組み表示を出して、画面が準備中であることを伝える。
エラー時は見出しへ自動でフォーカスを移し、読み上げソフトでもすぐに異常が分かるようにする。

## Part 2: 技術者向けの要約

`apps/web/app/login/loading.tsx` を追加し、`role="status"` / `aria-busy="true"` / `aria-live="polite"` を持つ skeleton を描画する。
`apps/web/app/login/error.tsx` は `useRef<HTMLHeadingElement>` と `useEffect` で h1 に focus し、`role="alert"` と `aria-live="assertive"` を併用する。
`error.digest` は truthy の場合だけ `<code>error id: ...</code>` として表示する。

## Implementation Steps

1. `loading.tsx` を追加し、既存 Tailwind v4 bridge の `bg-surface-2` を使用する。
2. `error.tsx` に heading ref / `tabIndex={-1}` / focus side effect / digest conditional render を追加する。
3. `loading.spec.tsx` と `error.spec.tsx` で route boundary contract を検証する。

## Verification Commands

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/login/error.spec.tsx apps/web/app/login/loading.spec.tsx
```

Exit code: 0. Result: 2 files passed / 4 tests passed.

Additional local gates:

- `grep -rnE "#[0-9a-fA-F]{3,8}" apps/web/app/login/`: 0 hits
- `grep -rnE "(bg|text)-\\[#" apps/web/app/login/`: 0 hits
- `find apps/web/app/login -name "*.test.tsx" -type f`: 0 hits
- `pnpm typecheck`: exit 0
- `pnpm lint`: exit 0
- `pnpm --filter @ubm-hyogo/web build`: exit 0; existing Next middleware deprecation and Sentry/Prisma dynamic dependency warnings only
- `pnpm verify:phase12-compliance`: exit 0

## Phase 11 Evidence References

- Screenshot plan: `outputs/phase-11/screenshot-plan.json`
- Capture metadata: `outputs/phase-11/phase11-capture-metadata.json`
- Manual result: `outputs/phase-11/manual-test-result.md`
- UI sanity review: `outputs/phase-11/ui-sanity-visual-review.md`
- Runtime screenshot paths reserved for TC-01..TC-04: `outputs/phase-11/screenshots/login-loading-skeleton.png`, `login-error-default.png`, `login-error-with-digest.png`, `login-error-focused-heading.png`

## Known Limits

Runtime screenshot evidence is pending. Existing 1x1 placeholder PNGs are not accepted as evidence. No API, D1, auth flow, or Cloudflare configuration changes are included.
