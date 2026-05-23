---
phase: 1
title: 要件定義 — root error.tsx h1 自動 focus
workflow_id: parallel-i06-root-error-focus
status: completed
taskType: implementation
visualEvidence: NON_VISUAL
implementation_mode: existing-component-hardening
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 1. 背景

`apps/web/app/error.tsx`（Client Component / Next.js App Router の global error boundary）は次の状態で実装済み:

- `role="alert"` + `aria-live="assertive"` ✓
- `error.digest` 表示 ✓
- dev 環境での stack 表示 ✓
- logger 経由の構造化ログ ✓
- **h1 への自動 focus 移譲 ✗（本 Phase で追加）**

`parallel-07` spec section 4.3 の Acceptance Criteria「error boundary catch 時に focus を h1 に移譲し、screen reader が見出しを最初に読み上げる」が未充足。

## 2. 機能要件 (FR)

| ID | 要件 | 対象ファイル |
|----|------|------------|
| FR-01 | `useRef<HTMLHeadingElement>` を生成し、h1 要素に `ref` として bind する | `apps/web/app/error.tsx` |
| FR-02 | h1 要素に `tabIndex={-1}` を付与し programmatic focus を可能にする | `apps/web/app/error.tsx` |
| FR-03 | `useEffect`（`[error]` deps）で `headingRef.current?.focus({ preventScroll: true })` を呼ぶ | `apps/web/app/error.tsx` |
| FR-04 | 既存の `logger.error` 呼び出しは同一 useEffect 内で **focus より先に** 実行する | `apps/web/app/error.tsx` |
| FR-05 | `apps/web/app/error.spec.tsx` を新規作成（または既存があれば追記）し、focus 移譲を assert する | `apps/web/app/error.spec.tsx` |
| FR-06 | 同 spec で `error.digest` 表示も assert する（regression 防止） | `apps/web/app/error.spec.tsx` |

## 3. 非機能要件 (NFR)

| ID | 要件 |
|----|------|
| NFR-01 | `useRef` import は既存 `useEffect` import に追記する形で 1 行のみ変更（diff 最小化） |
| NFR-02 | `preventScroll: true` 指定により視覚スクロール ジャンプを抑制する |
| NFR-03 | `tabIndex={-1}` 付与による visual outline は既存 `:focus-visible` policy で抑制される（CSS 変更不要） |
| NFR-04 | hydration mismatch を発生させない（focus 副作用は client only useEffect 内のみ） |
| NFR-05 | `pnpm typecheck` / `pnpm lint` / `pnpm -F "@ubm-hyogo/web" test` が green |
| NFR-06 | テスト suffix は `*.spec.tsx`（`*.test.tsx` 禁止） |
| NFR-07 | 差分は 4 行 + 1 test ファイル（spec section 4 既定）を超えない |

## 4. ステークホルダー観点

| 系統 | 観点 |
|------|------|
| システム系 | App Router の Client Error Boundary contract（`{ error, reset }` props）に違反しないこと |
| 戦略・価値系 | a11y compliance（WCAG 2.1 SC 2.4.3 Focus Order / SC 4.1.3 Status Messages）の充足 |
| 問題解決系 | screen reader 利用者が error 発生時に最初に「画面を表示できませんでした」を読み上げる |

## 5. Acceptance Criteria

- [ ] error boundary catch 直後、`document.activeElement === <h1>` となる
- [ ] `preventScroll: true` により window scroll position が変動しない
- [ ] digest が prop に含まれる場合、画面に表示される
- [ ] 既存 reset ボタン / トップへ戻る Link の挙動は変更されない
- [ ] `parallel-07` spec section 4.3 DoD が達成される

## 6. スコープ外

- `/login/error.tsx` などサブツリーの error boundary（別タスク i05）
- error.tsx の文言・スタイル変更
- logger schema 変更
