---
phase: 2
title: 設計 — loading / error コンポーネント構造と focus 移譲戦略
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
---

# Phase 2: 設計

[実装区分: 実装仕様書]

## 1. コンポーネント topology

```
apps/web/app/login/
├── page.tsx          (既存・変更なし)
├── layout.tsx        (既存・変更なし)
├── loading.tsx       (新規)   ── Server Component
└── error.tsx         (修正)   ── "use client"
```

| ファイル | 種別 | runtime |
|----------|------|---------|
| `loading.tsx` | Server Component（既定） | Edge / Workers |
| `error.tsx` | Client Component（`"use client"`） | Browser |

## 2. `LoginLoading` 設計

| 項目 | 内容 |
|------|------|
| export | `default function LoginLoading(): ReactElement` |
| 副作用 | なし（pure render） |
| 状態 | なし |
| 依存 | `react` のみ |
| アクセシビリティ | `role="status"` / `aria-busy="true"` / `aria-live="polite"` / sr-only テキスト |
| スタイル | `mx-auto max-w-md space-y-4 px-6 py-12` + `bg-surface-2` skeleton x3 |

## 3. `LoginError` 設計

| 項目 | 内容 |
|------|------|
| export | `default function LoginError(props: LoginErrorProps): ReactElement` |
| props | `{ readonly error: Error & { digest?: string }; readonly reset: () => void }` |
| state ownership | `headingRef`（DOM ref のみ、React state なし） |
| 副作用 | `useEffect` で `console.error` + `headingRef.current?.focus({ preventScroll: true })` |
| アクセシビリティ | `role="alert"` + `aria-live="assertive"` を section に付与、h1 に `tabIndex={-1}` |

### 3.1 focus 移譲戦略

| ケース | 動作 |
|--------|------|
| 初回 mount | `useEffect(() => { headingRef.current?.focus({ preventScroll: true }) }, [error])` で error 変化時に focus |
| reset → 再エラー | `error` 参照が変わるため `useEffect` 依存配列が再発火し、再度 focus |
| `preventScroll` 未対応古ブラウザ | TypeScript 型上は `FocusOptions` で許容、fallback として無視されるため安全 |

### 3.2 既存コード再利用可否（[FB-SDK-07-1]）

- `Card` / `CardContent` primitive は `apps/web/src/components/ui/` 配下に存在しない想定（事前 grep 確認は Phase 5 で実施）
- 既存があれば best-effort で採用、なければ素の `<section>` で代替（DoD は focus 管理必須、Card layout は任意）
- 既存 a11y helper（`apps/web/src/lib/a11y/` 等）が存在する場合、focus utility を再利用する

## 4. token / utility 配線

| token utility | 期待定義 | 未定義時の対応 |
|---------------|----------|----------------|
| `bg-surface-2` | Tailwind v4 `@theme inline` の `--color-surface-2: var(--ubm-color-surface-bg-2)` 経由 | 既存 bridge を使う。手動 `@layer utilities` 追加は不要 |

確認手順:

```bash
grep -nE "bg-surface-2|--color-surface-2|--ubm-color-surface-bg-2" apps/web/src/styles/*.css
```

## 5. data-attribute 設計

| attribute | 用途 |
|-----------|------|
| `data-page="login-loading"` | E2E / visual regression の selector |
| `data-page="login-error"` | 同上 |

`[data-page]` selector は既存 `globals.css` の selector 体系（`[data-route]` / `[data-section]` 系）と非衝突。

## 6. 責務境界

| レイヤ | 責務 |
|--------|------|
| Next.js App Router | loading / error boundary の発火 |
| `LoginLoading` | skeleton render のみ |
| `LoginError` | error UI render + focus 移譲 + console.error ログ |
| browser | screen reader アナウンス |

`apps/api` / D1 への参照は一切しない（UI 完結）。

## 7. 4 条件評価（要件レビュー）

| 観点 | 評価 |
|------|------|
| 価値性 | screen reader 利用者が `/login` でエラー発生時に即座に状況を把握できる |
| 実現性 | 2-3 ファイル編集、外部依存なし、Next.js 規約準拠 |
| 整合性 | parallel-07 spec / OKLch token 正本 / `*.spec.tsx` 規約と全て整合 |
| 運用性 | Phase 7 で grep gate / lint gate を通すため、回帰検知は CI で機械化 |

## 8. 非採用案

- `useState` で error を再render する設計 — Next.js Error Boundary の props で十分、複雑度を上げない
- `useLayoutEffect` での focus — SSR で warning が出る、`useEffect` で十分
- 自前 motion 制御 — `motion-safe:animate-pulse` で reduce-motion 対応済み

## 9. 参照

- Phase 1 FR-01〜FR-08
- 発注書 spec.md の Before/After スニペット
- Next.js App Router `loading.tsx` / `error.tsx` 規約


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 2 |
| status | completed |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的

/login loading boundary と error focus management を、実装・証跡・仕様の状態語彙が矛盾しない形で完了させる。

## 実行タスク

- 対象 phase の本文に従い、/login の loading / error / test / evidence contract を確認する。
- 実装済み差分と workflow state の整合を維持する。
- Phase 13 の commit / push / PR / runtime screenshot は user approval まで実行しない。

## 参照資料

- docs/30-workflows/parallel-i05-login-loading-and-error-focus/index.md
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/artifacts.json
- docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md

## 成果物

- apps/web/app/login/loading.tsx
- apps/web/app/login/error.tsx
- apps/web/app/login/loading.spec.tsx
- apps/web/app/login/error.spec.tsx
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-11/
- docs/30-workflows/parallel-i05-login-loading-and-error-focus/outputs/phase-12/

## 完了条件

- Focused Vitest が exit 0。
- Phase 12 compliance check が exit 0。
- 矛盾なし・漏れなし・整合性あり・依存関係整合の 4 条件が completed。

## 統合テスト連携

Focused Vitest: `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/app/login/error.spec.tsx apps/web/app/login/loading.spec.tsx`。Runtime screenshot は user-gated evidence として Phase 13 境界に残す。
