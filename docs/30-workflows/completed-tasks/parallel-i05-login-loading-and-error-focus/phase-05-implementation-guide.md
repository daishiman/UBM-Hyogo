---
phase: 5
title: 実装ガイド — loading.tsx 新規 / error.tsx 改修
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
---

# Phase 5: 実装ガイド

[実装区分: 実装仕様書]

## 0. 事前確認（[FB-MSO-002] 依存整合）

```bash
mise exec -- pnpm install
mise exec -- pnpm -F "@ubm-hyogo/web" list --depth 0 | grep -E "testing-library|vitest|jest-axe|user-event"
grep -nE "(--ubm-color-surface-bg-2|--color-surface-2|\\.bg-surface-2)" apps/web/src/styles/*.css
ls apps/web/src/components/ui/ 2>/dev/null | grep -i card  # Card primitive 存在確認
```

## 1. T-01 — token utility 確認 / 追加

`bg-surface-2` は Tailwind v4 の `@theme inline` bridge（`--color-surface-2: var(--ubm-color-surface-bg-2)`）で生成される。`apps/web/src/styles/globals.css` と `apps/web/src/styles/tokens.css` に bridge が存在する場合は何もしない。

手動 `.bg-surface-2` utility や `--ubm-color-surface-2` は追加しない。`--ubm-color-surface-bg-2` / `--color-surface-2` のどちらかが欠ける場合のみ、parallel-03 design token bridge の drift としてエスカレーションする。

## 2. T-02 — `loading.tsx` 新規作成

ファイル: `apps/web/app/login/loading.tsx`

```tsx
import type { ReactElement } from "react";

export default function LoginLoading(): ReactElement {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-md space-y-4 px-6 py-12"
      data-page="login-loading"
    >
      <span className="sr-only">ログイン画面を読み込み中</span>
      <div className="h-12 w-12 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-10 rounded bg-surface-2 motion-safe:animate-pulse" />
    </div>
  );
}
```

## 3. T-03 — `error.tsx` 改修

ファイル: `apps/web/app/login/error.tsx`

### 3.1 Before / After / 理由

| 観点 | Before | After | 理由 |
|------|--------|-------|------|
| ref | なし | `useRef<HTMLHeadingElement>(null)` を h1 に bind | focus 移譲 |
| useEffect | console.error のみ | console.error + h1 focus | a11y |
| section | `role="alert"` のみ | `role="alert"` + `aria-live="assertive"` + `data-page="login-error"` | SR 即時アナウンス |
| h1 | 平 h1 | `ref={headingRef} tabIndex={-1}` | プログラム focus 対象化 |
| digest 表示 | なし | `error.digest && <p><code>...</code></p>` | spec §4.2 digest 表示 |
| props 型 | inline / undefined | `export interface LoginErrorProps { readonly error: Error & { digest?: string }; readonly reset: () => void }` | 型契約明示 |

### 3.2 完成形

```tsx
"use client";
import { useEffect, useRef, type ReactElement } from "react";

export interface LoginErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function LoginError({ error, reset }: LoginErrorProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[login] route error", error);
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);

  return (
    <main>
      <section role="alert" aria-live="assertive" data-page="login-error">
        <h1 ref={headingRef} tabIndex={-1}>
          ログイン画面でエラーが発生しました
        </h1>
        <p>時間をおいて再度お試しください。</p>
        {error.digest ? (
          <p>
            <code>error id: {error.digest}</code>
          </p>
        ) : null}
        <button type="button" onClick={() => reset()}>
          再読み込み
        </button>
      </section>
    </main>
  );
}
```

## 4. T-04 — `loading.spec.tsx`

詳細は Phase 6 の TC-LL-01 / TC-LL-02 を参照。

## 5. T-05 — `error.spec.tsx`

詳細は Phase 6 の TC-LE-01〜TC-LE-05 を参照。

## 6. 変更ファイル一覧（[Feedback RT-03]）

| Path | 種別 | 概算 LOC |
|------|------|---------|
| `apps/web/app/login/loading.tsx` | create | +25 |
| `apps/web/app/login/error.tsx` | modify | +20 / -5 |
| `apps/web/app/login/loading.spec.tsx` | create | +20 |
| `apps/web/app/login/error.spec.tsx` | create or modify | +40 |
| `apps/web/src/styles/globals.css` | (条件付き) modify | +5 |

## 7. 既存コード再利用（[FB-SDK-07-1]）

- `Card` / `CardContent` が `apps/web/src/components/ui/` に存在する場合は採用検討（DoD 上は best-effort）
- 既存 `apps/web/app/login/page.tsx` の Tailwind class 体系（`mx-auto max-w-md` 等）と整合させる
- `apps/api` への新規呼び出しは行わない

## 8. 注意（パターン回避）

| パターン | 回避策 |
|---------|--------|
| HEX 直書き | OKLch token utility のみ |
| `useLayoutEffect` での focus | `useEffect` に統一（SSR warning 回避） |
| `process.env.*` 直接参照 | 本 SW では不要だが、必要になった場合 `getEnv()` 経由 |
| Card primitive を新規定義 | 本 SW スコープ外。`<section>` で代替 |


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 5 |
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
