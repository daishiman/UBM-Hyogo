# Phase 1: 要件定義 — `/profile/error.tsx` h1 自動 focus 横展開

**[実装区分: 実装仕様書]**

## 1. 機能要件

### FR-1: h1 自動 focus 移譲
`apps/web/app/profile/error.tsx` のマウント完了直後に h1 要素へプログラム的 focus を移譲する。screen reader 利用者がプロフィール画面エラー発生時に即座に見出しを読み上げできるようにする。root `app/error.tsx` と同等の挙動を満たす。

### FR-2: スクロール位置維持
`focus({ preventScroll: true })` により視覚的スクロールジャンプを抑制する。モバイル端末で表示位置がトップへスナップしないこと。

### FR-3: 副作用順序の固定
`useEffect` 内で `logger.error → headingRef.current?.focus({ preventScroll: true })` の順序で副作用を実行する。`logger.error` は throw しないことを root と同様に前提とし、ログ記録後に focus を移譲する。

### FR-4: `aria-live="assertive"` の付与
外側コンテナに `role="alert"` と `aria-live="assertive"` を同時に付与する。既存 `<section role="alert">` を `<div role="alert" aria-live="assertive">` へ置換し、root と要素種別・属性を揃える。

### FR-5: `error.digest` 表示
`error.digest` が存在する場合に「エラーID: <code>{digest}</code>」として表示する。root と同じ書式を踏襲する。

### FR-6: dev-only stack 表示
`process.env.NODE_ENV !== "production"` のときのみ `error.stack ?? error.message` を `<pre>` で表示する。root と同じ class 群 (`mt-6 max-h-64 overflow-auto rounded-md bg-surface-2 p-3 text-xs`) を再利用する。

### FR-7: 構造化ログ
`console.error("[profile] route error", error)` を `logger.error({ event: "error.boundary.caught", digest: error.digest, err: error })` に置換する。root と同じシグネチャを使用し、`scope: "profile"` 等の追加 field は最小差分原則で付加しない（追加観測性が必要になった時点で別 followup）。

### FR-8: 既存文言・リセット挙動の維持
- h1 文言「マイページの読み込みに失敗しました」を維持
- 補助文言「時間をおいて再度お試しください。」を維持
- `<button onClick={() => reset()}>再読み込み</button>` の reset 機能を維持

### FR-9: client component / SSR 整合
`"use client"` directive を維持し、`useRef` / `useEffect` が SSR 中に副作用を起こさないこと。hydration warning ゼロ。

## 2. 非機能要件

### NFR-1: 差分最小性
変更ファイルは `apps/web/app/profile/error.tsx` 1 ファイル + 新規 test 1 ファイルに限定する。`profile/page.tsx` / `loading.tsx` / `not-found.tsx` / `_components/**` には触れない。

### NFR-2: a11y 規格遵守
- `tabIndex={-1}` を h1 に付与しプログラム的 focus のみ許可、tab 移動 natural order から除外
- `:focus-visible` の outline が h1 に visible にならないこと（既存 focus-visible utility 経由）

### NFR-3: テスト可検証性
`@testing-library/react` で render 後に `document.activeElement` で focus 状態 / `error.digest` 表示 / aria 属性 / `logger.error` 呼び出しを assert できること。

### NFR-4: tokens / primitives 整合
root と同じ Tailwind class 群 (`text-2xl`, `font-semibold`, `text-danger`, `bg-surface-2` 等) を再利用し、新規 HEX / `bg-[#xxx]` を導入しない（CLAUDE.md 不変条件 2 / verify-design-tokens CI gate 遵守）。

## 3. 利害関係者

| ロール | 関心 |
|---|---|
| screen reader 利用者 | profile 画面エラー時の即時通知 |
| 開発者 / QA | issue-769 Phase 12 followup candidate `/profile/error.tsx` の消化 |
| solo 運用者 (daishiman) | a11y baseline の route 間統一 / regression 検知 |

## 4. 制約

- CLAUDE.md「重要な不変条件 8」: 新規 test ファイルは `*.spec.{ts,tsx}` のみ
- CLAUDE.md「UI prototype alignment / MVP recovery」不変条件 1〜4 継承（既存 API のみ / OKLch トークン正本 / プロトタイプ primitives / D1 直接アクセス禁止）
- 既存 `useEffect` クリーンアップ関数の追加禁止（focus は idempotent / teardown 不要）
- `console.error` を完全に除去すること（`logger.error` 移行で残骸を残さない）

## 5. 受入条件マッピング

| AC | 検証手段 |
|---|---|
| AC-1: h1 に `ref={headingRef}` + `tabIndex={-1}` | コード grep + vitest |
| AC-2: useEffect 内 `logger.error → focus()` 順 | vitest spy 順序検証 |
| AC-3: `useRef<HTMLHeadingElement>(null)` 生成 | コード grep |
| AC-4: 外側コンテナ `role="alert"` + `aria-live="assertive"` | vitest `getByRole('alert')` + attribute |
| AC-5: `error.digest` 表示 | vitest `getByText(/エラーID/)` |
| AC-6: focused tests が 5 files / 31 ケース PASS | hook + root/profile/login/admin Vitest |
| AC-7: typecheck / lint 0 error | `pnpm typecheck` / `pnpm lint` |
| AC-8: `/admin/error.tsx` `/login/error.tsx` の同等漏れも今回サイクルで回収 | `git diff --name-only` + focused tests |
| AC-9: profile の他ファイル未変更 | `git diff --name-only` |
| AC-10: CLAUDE.md 不変条件 1〜4 遵守 | verify-design-tokens gate |
