# Phase 12 — Implementation Guide（後続 03.実装.md / PR 本文転記用）

## 概要

`/profile/error.tsx` を起点に、root / profile / login / admin の error boundary focus 管理を `useAutoFocusOnMount` hook へ統一し、未消化の login/admin 横展開漏れも今回サイクルで回収する。

## 変更対象ファイル

| パス | 種別 |
|---|---|
| `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` | 新規 |
| `apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx` | 新規 |
| `apps/web/app/error.tsx` | 編集 |
| `apps/web/app/profile/error.tsx` | 編集 |
| `apps/web/app/profile/__tests__/error.component.spec.tsx` | 新規 |
| `apps/web/app/login/error.tsx` | 編集 |
| `apps/web/app/login/__tests__/error.component.spec.tsx` | 新規 |
| `apps/web/app/(admin)/admin/error.tsx` | 編集 |
| `apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx` | 新規 |

## 主要 diff（要約）

- `useAutoFocusOnMount(ref)` を追加し、focus 副作用を共通化
- root/profile/login/admin で `logger.error({ event: "error.boundary.caught", digest, err })` と h1 focus を統一
- 外側を `<div role="alert" aria-live="assertive">` に統一（`<main><section>` 構造を廃止）
- h1 に `ref={headingRef}` + `tabIndex={-1}`
- `error.digest` 表示 + dev-only `<pre>` stack
- `console.error` を `logger.error` に置換
- `Link href="/"` の「トップへ戻る」CTA を追加

## ローカル実行コマンド

```bash
pnpm -F "@ubm-hyogo/web" typecheck
pnpm -F "@ubm-hyogo/web" lint
pnpm exec vitest run apps/web/src/lib/a11y/__tests__/useAutoFocusOnMount.spec.tsx apps/web/app/__tests__/error.component.spec.tsx apps/web/app/profile/__tests__/error.component.spec.tsx apps/web/app/login/__tests__/error.component.spec.tsx 'apps/web/app/(admin)/admin/__tests__/error.component.spec.tsx'
```

## DoD

1. web typecheck / web lint 0 error
2. focused vitest 5 files / 31 tests PASS
3. root/profile/login/admin + hook の実装差分が Phase 文書と一致
4. Manual SR smoke は runtime_pending として Phase 13 以降に user-gated

## PR 本文骨子

- Summary: error boundary focus hook を追加し root/profile/login/admin の a11y / observability を統一
- Issue link: Refs #800（CLOSED 状態のため `Closes` / `Fixes` / `Resolves` は使わない）
- 関連: issue-769（root 実装の正本）/ followup-002 spec / 親 workflow ui-prototype-alignment-mvp-recovery
- Test plan: web typecheck / web lint / focused vitest 31 ケース / 手動 SR smoke（runtime_pending）
