# Phase 2: 設計 — `/profile/error.tsx` 横展開実装設計

**[実装区分: 実装仕様書]**

## 1. アーキテクチャ

Next.js App Router の segment-level error boundary (`apps/web/app/profile/error.tsx`) を、root `apps/web/app/error.tsx` と同等の a11y / observability 実装パターンに揃える単純な置換タスク。新規モジュール抽出は行わず、root の構造をそのまま `/profile` segment に複写する。

## 2. 変更対象ファイル

| パス | 種別 | 概要 |
|---|---|---|
| `apps/web/app/profile/error.tsx` | 編集（≈25 行差分） | root と同等の a11y / logger / digest 実装へ置換 |
| `apps/web/app/profile/__tests__/error.component.spec.tsx` | 新規（≈80 行） | focus / digest / aria / logger を検証 |

## 3. 関数シグネチャ / コンポーネント構造

### 3.1 `ProfileError` コンポーネント

```ts
// apps/web/app/profile/error.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { logger } from "../../src/lib/logger";

export interface ProfileErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ProfileError({ error, reset }: ProfileErrorProps): JSX.Element;
```

- 入力: `{ error, reset }`（Next.js App Router error boundary 規約）
- 出力: `JSX.Element`
- 副作用:
  1. `useEffect` 内で `logger.error({ event: "error.boundary.caught", digest: error.digest, err: error })`
  2. 続けて `headingRef.current?.focus({ preventScroll: true })`
- 依存: `next/link` (任意 / トップへ戻る CTA を root と揃える場合), `react`, `../../src/lib/logger`

### 3.2 JSX 構造（最終形）

```tsx
<div role="alert" aria-live="assertive" className="mx-auto max-w-2xl px-6 py-16">
  <h1
    ref={headingRef}
    tabIndex={-1}
    className="text-2xl font-semibold text-danger"
  >
    マイページの読み込みに失敗しました
  </h1>
  <p className="mt-2 text-sm text-text-3">
    時間をおいて再度お試しください。
  </p>
  {error.digest && (
    <p className="mt-4 text-xs text-text-3">
      エラーID: <code>{error.digest}</code>
    </p>
  )}
  {isDev && (
    <pre className="mt-6 max-h-64 overflow-auto rounded-md bg-surface-2 p-3 text-xs">
      {error.stack ?? error.message}
    </pre>
  )}
  <div className="mt-6 flex gap-3">
    <button
      type="button"
      onClick={reset}
      className="rounded-md bg-accent px-4 py-2 text-sm text-panel"
    >
      再読み込み
    </button>
    <Link
      href="/"
      className="rounded-md border border-border px-4 py-2 text-sm"
    >
      トップへ戻る
    </Link>
  </div>
</div>
```

> 既存 `<main><section role="alert">` 構造は廃止し、root に揃えた `<div role="alert" aria-live="assertive">` に統一する。`<main>` ラッパー除去の影響は `_components` 配下 / page 側の `<main>` 二重ネスト懸念がなく、profile route の他ファイルは `<main>` を直接持たない（Next.js layout 経由）ため安全。

## 4. データ構造

新規データ型は導入しない。`ProfileErrorProps` は既存 export を維持する（後方互換）。

## 5. 入出力 / 副作用契約

| 項目 | 内容 |
|---|---|
| input | `error: Error & { digest?: string }` / `reset: () => void`（Next.js から供給） |
| output | `JSX.Element` |
| 副作用1 | `logger.error({ event: "error.boundary.caught", digest, err })` |
| 副作用2 | `headingRef.current?.focus({ preventScroll: true })` |
| 副作用3 | `reset()`（button click 時のみ、Next.js App Router 規約） |
| エラー伝搬 | `logger.error` は throw しない前提（root と同条件） |

## 6. テスト方針概要（詳細は Phase 4）

| テスト ID | 観点 |
|---|---|
| T1 | マウント直後に h1 が `document.activeElement` になる |
| T2 | `error.digest` 存在時に「エラーID: ...」が表示される |
| T3 | 外側コンテナが `role="alert"` かつ `aria-live="assertive"` |
| T4 | `logger.error` が `{ event: "error.boundary.caught", digest, err }` で 1 度呼ばれる |

## 7. ローカル実行 / 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
pnpm exec vitest run apps/web/app/profile/__tests__/error.component.spec.tsx
```

## 8. DoD（Definition of Done）

1. `pnpm typecheck` 0 error
2. `pnpm lint` 0 error / 0 new warning
3. focused Vitest が hook + root/profile/login/admin の 5 files / 31 ケース PASS
4. `git diff --name-only` の変更ファイルが Phase 5 の実装対象一覧と一致
5. `bash scripts/verify-pr-ready.sh` が PASS（docs-only gate / artifacts.json zod 検証 / phase12 compliance / indexes drift なし）

## 9. 関連設計判断（Struggle Points からの引き継ぎ）

- **共通 hook 抽出 (issue-769-followup-001) との依存**: 現時点で `apps/web/src/lib/a11y/useAutoFocusOnMount.ts` 等は存在しない（`grep useAutoFocusOnMount` 0 hit）。本タスクはインライン実装で進める。3 箇所目 (`/admin/error.tsx` / `/login/error.tsx`) 追加時に hook 抽出を別タスクで実施する。
- **`<main>` 除去の妥当性**: profile route の layout (`apps/web/app/profile/layout.tsx`) が存在しないため、root layout `apps/web/app/layout.tsx` の `<main>` 直下に error boundary が描画される。`<main>` 二重ネスト回避のため root と同じ `<div>` 直接配置に揃える。
- **`Link` の `/` 戻り先**: profile が会員 route であっても、未認証エラー時の安全な戻り先として `/`（公開 top）を root と同じく採用する。`/login` への動的分岐は別 followup（過剰スコープ）。
