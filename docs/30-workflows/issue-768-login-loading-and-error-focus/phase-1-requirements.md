# Phase 1: 要件定義

> Source issue: [#768](https://github.com/daishiman/UBM-Hyogo/issues/768)（CLOSED のまま仕様書化）
> Parent spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md`
> Unassigned-task spec: `docs/30-workflows/unassigned-task/integration-fixes-i05-login-loading-and-error-focus.md`
> implementation_mode: `implementation_pending`
> task classification: code task (Next.js App Router boundary file)
> visual classification: VISUAL（loading skeleton + error focus 視覚変更あり）
> 実装区分: **実装仕様書**（CONST_005 必須項目すべてを含む / CONST_007 1サイクル完了スコープ）

---

## 1. 真の論点

- 現象: `apps/web/app/login/loading.tsx` が**不在**、`apps/web/app/login/error.tsx` は `useRef + tabIndex={-1} + useEffect(.focus())` パターン未適用かつ `aria-live="assertive"` 不在、digest 表示・Card layout も未適用。
- 主問題: screen reader 利用者が `/login` ロード状況およびエラー状況を把握できず WCAG 2.1 SC 4.1.3 (Status Messages) 不適合。キーボード利用者も reset CTA まで多数 Tab を要する。
- why now: parallel-07 DoD line 141, 142 が `implemented_local_runtime_pending` のまま固定。Issue #764 (i02) は PR #787 で解消済みのため、i05 が integration-fixes の残最高優先項目。
- why this way: 公開系 / shared error 系で確立済みの「`useRef<HTMLHeadingElement>` + `tabIndex={-1}` + `useEffect` で `.focus({ preventScroll: true })`」パターンを `/login` に**そのまま**横展開し、新規 hook 抽出は i06 完了後の refactor に委ねる（spec 横展開メモ準拠）。

## 2. P50 チェック結果

| 項目 | 結果 |
|---|---|
| current branch に実装が存在する | No（`apps/web/app/login/loading.tsx` 不在、`error.tsx` に focus 管理なし） |
| upstream にマージ済み | No |
| 前提タスク完了 | Yes（parallel-07 公開系部分は merge 済み、`Card` / `CardContent` primitive は `apps/web/src/components/ui/Card.tsx` に存在） |

→ `implementation_mode: "implementation_pending"`

## 3. 背景

### 3.1 parallel-07 取り残し経緯

parallel-07 spec section 4.1 / 4.2 は公開系 (`/`) / shared / `/login` / `/profile` の loading・error UI を一括統一する設計だったが、PR #743 merge 時点で `/login` 系のみ実装漏れが発生。integration-fixes 接続検証で初めて検出され、本 issue #768 として line-item 化された。

### 3.2 既存資産

- `apps/web/src/components/ui/Card.tsx` に `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` 一式が export 済み（→ Card layout を必須項目に昇格可）。
- OKLch token は `apps/web/src/styles/tokens.css`（task-09 正本）に定義済み。`bg-surface-2` utility の有無は Phase 2 で確認する。

## 4. 機能要件

- F-1: `apps/web/app/login/loading.tsx` を新規作成し、`role="status"` / `aria-busy="true"` / `aria-live="polite"` / `.sr-only` text 「ログイン画面を読み込み中」を持つ OKLch skeleton で render する。
- F-2: `apps/web/app/login/error.tsx` の h1 へ `useRef<HTMLHeadingElement>` + `tabIndex={-1}` を bind し、`useEffect` で `.focus({ preventScroll: true })` を呼ぶ。
- F-3: `section role="alert"` に `aria-live="assertive"` を付与し、screen reader への即時アナウンスを保証する。
- F-4: `error.digest` が truthy のときのみ `<p><code>error id: {digest}</code></p>` を条件 render する。
- F-5: 既存 `Card` / `CardContent` を loading / error 双方に適用し、公開系 error UI と視覚リズムを整合させる。
- F-6: 既存 `console.error("[login] route error", error)` の副作用は維持する。

## 5. 非機能要件

| 観点 | 要件 |
|---|---|
| a11y | WCAG 2.1 SC 1.3.1 / 4.1.3 / 2.4.3 を満たす。focus は preventScroll: true で scroll jump を起こさない |
| デザイン整合 | OKLch token 経由（HEX 直書き / `bg-[#xxx]` 禁止、task-18 `verify-design-tokens` gate を通過すること） |
| パフォーマンス | loading boundary は zero-runtime JS（client directive 不要）で SSR fallback |
| 互換性 | `LoginErrorProps` の `error` / `reset` シグネチャは Next.js App Router 規約に従い変更しない |
| テスト | Vitest + Testing Library で role / aria 属性 / focus 移譲 / digest 条件 render を検証 |
| 観測性 | error.tsx の `console.error` log 形式 `[login] route error` を保持（既存運用 grep を破壊しない） |

## 6. スコープ確定（CONST_007）

### 含む（in-scope / 1サイクル内完了）

- `apps/web/app/login/loading.tsx` 新規作成
- `apps/web/app/login/error.tsx` の focus 管理 / aria-live=assertive / digest 表示 / Card layout 追加
- `apps/web/app/login/loading.spec.tsx` 新規作成
- `apps/web/app/login/error.spec.tsx` 新規作成（既存ファイルがあれば修正）
- `bg-surface-2` utility が未定義時のみ `apps/web/src/styles/globals.css` に追加（task-09 token 経由）
- parallel-07 DoD line 141, 142 の消し込み記録、integration-fixes index の i05 状態更新

### 含まない（out-of-scope）

- root `apps/web/app/error.tsx` の focus 管理 → i06 で別 issue 管理
- `apps/web/app/profile/loading.tsx` skeleton 化 → i07 で別 issue 管理
- 共通 hook `useAutoFocusOnMount(ref)` の抽出 → i05/i06 完了後の refactor PR
- 新規 API endpoint / D1 schema 変更（不変条件1, 5 違反）
- HEX 直書き color（不変条件2 / task-18 gate 違反）

## 7. ユビキタス言語

| 用語 | 定義 |
|---|---|
| login loading boundary | `apps/web/app/login/loading.tsx` が export する default function。Next.js が `/login` route の Suspense fallback として render する |
| login error boundary | `apps/web/app/login/error.tsx` が export する `LoginError` client component。Next.js が `/login` route の SSR/RSC 例外時に render する |
| focus 移譲 | `useEffect` 内で h1 ref に `.focus({ preventScroll: true })` を呼び、screen reader と keyboard cursor を h1 へ移動させる動作 |
| OKLch skeleton | `bg-surface-2` utility（OKLch token `--ubm-color-surface-2` 経由）で表現する pulse skeleton block |
