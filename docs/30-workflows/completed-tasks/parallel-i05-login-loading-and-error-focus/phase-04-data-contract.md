---
phase: 4
title: データ契約 — 型・props・関数シグネチャ
workflow_id: parallel-i05-login-loading-and-error-focus
status: completed
---

# Phase 4: データ契約

[実装区分: 実装仕様書]

## 1. `LoginLoading` シグネチャ

```ts
// apps/web/app/login/loading.tsx
import type { ReactElement } from "react";

export default function LoginLoading(): ReactElement;
```

| 項目 | 値 |
|------|----|
| 入力 | なし |
| 出力 | `ReactElement`（status コンテナ + sr-only + skeleton 3 段） |
| 副作用 | なし |
| throws | なし |

## 2. `LoginError` シグネチャ

```ts
// apps/web/app/login/error.tsx
"use client";
import type { ReactElement } from "react";

export interface LoginErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function LoginError(props: LoginErrorProps): ReactElement;
```

| 項目 | 値 |
|------|----|
| 入力 | `LoginErrorProps`（Next.js App Router が boundary 経由で渡す） |
| 出力 | `ReactElement`（`<main><section role=alert>...</section></main>`） |
| 副作用 | `console.error("[login] route error", error)` / h1 への focus 移譲 |
| throws | なし |

## 3. DOM 契約

### 3.1 loading.tsx の DOM 形

```
<div role="status" aria-busy="true" aria-live="polite" data-page="login-loading"
     class="mx-auto max-w-md space-y-4 px-6 py-12">
  <span class="sr-only">ログイン画面を読み込み中</span>
  <div class="h-12 w-12 rounded bg-surface-2 motion-safe:animate-pulse" />
  <div class="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
  <div class="h-10 rounded bg-surface-2 motion-safe:animate-pulse" />
</div>
```

### 3.2 error.tsx の DOM 形

```
<main>
  <section role="alert" aria-live="assertive" data-page="login-error">
    <h1 tabIndex={-1}>ログイン画面でエラーが発生しました</h1>
    <p>時間をおいて再度お試しください。</p>
    {error.digest && <p><code>error id: {error.digest}</code></p>}
    <button type="button" onClick={reset}>再読み込み</button>
  </section>
</main>
```

## 4. focus 契約

| 状態 | 期待 |
|------|------|
| `LoginError` 初回 mount | `document.activeElement === h1` |
| `error` prop 変化 | `useEffect` 再発火 → 再 focus |
| `preventScroll: true` | viewport が予期せずスクロールしない |

## 5. アクセシビリティ契約

| 要素 | role | aria-live | tabIndex |
|------|------|-----------|----------|
| loading コンテナ | `status` | `polite` | — |
| error section | `alert` | `assertive` | — |
| error h1 | — | — | `-1` |

## 6. テスト契約

| テスト ID | 対象 | アサーション |
|-----------|------|-------------|
| TC-LL-01 | loading role / aria | `role=status` + `aria-busy=true` + `aria-live=polite` |
| TC-LL-02 | loading sr-only | テキスト「ログイン画面を読み込み中」存在 |
| TC-LE-01 | error focus | mount 後 h1 が `toHaveFocus()` |
| TC-LE-02 | error digest 表示 | `digest=abc123` を含むとき `abc123` が text に出現 |
| TC-LE-03 | error digest 非表示 | `digest=undefined` のとき `code` 要素が DOM に不在 |
| TC-LE-04 | reset 呼び出し | button click で `reset()` が 1 回呼ばれる |
| TC-LE-05 | error aria-live | section が `aria-live=assertive` を持つ |

詳細テスト本体は Phase 6 に記載する。

## 7. 既存命名規則との整合

- 既存 `apps/web/app/error.tsx` / `apps/web/app/not-found.tsx` のシグネチャ慣習を踏襲（default export, props readonly）
- `LoginErrorProps` interface 名は `<Component>Props` パターンに準拠
- `headingRef` 命名は既存 ref 命名規則（camelCase + Ref suffix）に準拠


## メタ情報

| Key | Value |
| --- | --- |
| workflow_id | parallel-i05-login-loading-and-error-focus |
| phase | 4 |
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
