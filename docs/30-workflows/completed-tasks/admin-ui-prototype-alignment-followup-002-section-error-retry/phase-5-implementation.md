---
phase: 5
title: Implementation guide
workflow_id: admin-ui-prototype-alignment-followup-002-section-error-retry
status: spec_created
---

# Phase 5: 実装ガイド

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| phase | 5 |
| status | `spec_created` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |

## 目的

実装ガイドの責務を、既存本文の詳細に従って実装サイクルで迷わず実行できる状態に固定する。

## 実行タスク

1. 本 Phase の既存本文に定義された要件・手順・判定表を実装時の入力として確認する。
2. Phase 間の依存順序を守り、前 Phase の完了条件を満たしてから次へ進む。
3. 差分が発生した場合は Phase 11 evidence と Phase 12 strict 7 へ同一 wave で同期する。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本ファイル: `phase-5-implementation.md`
- 関連 evidence: `outputs/phase-11/` / `outputs/phase-12/`

## 完了条件

- [ ] 本 Phase の既存本文にある必須項目が実装サイクルの入力として確認されている。
- [ ] 参照 path と artifact ledger に矛盾がない。
- [ ] 後続 Phase の完了条件へ接続できる。

## 統合テスト連携

- 実装サイクルでは Phase 10 の focused unit / axe / grep gate を Phase 11 evidence として保存する。
- 本 Phase 自体は仕様書段階のため、実行ログは `outputs/phase-11/` に取得後追記する。

---


## 1. 変更ファイル一覧

| # | ファイル | 種別 | 内容 |
|---|---------|------|------|
| 1 | `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx` | 既存変更 | props 拡張（`onRetry` / `retryLabel` / `isRetrying`）+ button JSX を `onRetry` 指定時のみ条件付き描画 |
| 2 | `apps/web/src/features/admin/components/_shared/AdminSectionErrorClient.tsx` | 新規 | `"use client"` wrapper、`useRouter().refresh()` + `useTransition()` |
| 3 | `apps/web/src/features/admin/components/_shared/index.ts` | 既存変更 | `AdminSectionErrorClient` re-export 追加 |
| 4 | `apps/web/src/features/admin/components/_shared/__tests__/AdminSectionError.spec.tsx` | 既存変更 | regression assert 追加（既存 case 非変更） |
| 5 | `apps/web/src/features/admin/components/_shared/__tests__/AdminSectionErrorClient.spec.tsx` | 新規 | retry click / loading / aria / oklch class case |
| 6-16 | 採用 11 admin `page.tsx` | 既存変更 | error JSX 部分を `AdminSectionErrorClient` に差し替え |

## 2. 関数・型シグネチャ

### 2.1 `AdminSectionError`（拡張後）

```ts
export interface AdminSectionErrorProps {
  sectionLabel: string;
  code?: string;
  correlationId?: string;
  message?: string;
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
}

export function AdminSectionError(props: AdminSectionErrorProps): JSX.Element;
```

### 2.2 `AdminSectionErrorClient`（新規）

```ts
"use client";
export type AdminSectionErrorClientProps = Omit<
  AdminSectionErrorProps,
  "onRetry" | "isRetrying"
>;

export function AdminSectionErrorClient(
  props: AdminSectionErrorClientProps
): JSX.Element;
```

## 3. 雛形コード

### 3.1 `AdminSectionError.tsx`（差分後・完成形）

```tsx
import { cn } from "../../../../lib/cn";

export interface AdminSectionErrorProps {
  sectionLabel: string;
  code?: string;
  correlationId?: string;
  message?: string;
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
}

export function AdminSectionError({
  sectionLabel,
  code,
  correlationId,
  message,
  className,
  onRetry,
  retryLabel = "再読み込み",
  isRetrying = false,
}: AdminSectionErrorProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="admin-section-error"
      className={cn("admin-section-error", className)}
    >
      <p className="admin-section-error__title">
        {sectionLabel} の読み込みに失敗しました
      </p>
      <p className="admin-section-error__message">
        {message ?? "再読み込みしてください。"}
      </p>
      <dl className="admin-section-error__meta">
        {code ? (
          <>
            <dt>code</dt>
            <dd><code>{code}</code></dd>
          </>
        ) : null}
        {correlationId ? (
          <>
            <dt>correlation</dt>
            <dd><code>{correlationId}</code></dd>
          </>
        ) : null}
      </dl>
      {onRetry ? (
        <button
          type="button"
          data-testid="admin-section-error-retry"
          className="admin-section-error__retry"
          aria-label={`${sectionLabel} を再読み込み`}
          aria-busy={isRetrying ? "true" : "false"}
          disabled={isRetrying}
          onClick={() => {
            if (isRetrying) return;
            onRetry();
          }}
        >
          {isRetrying ? `${retryLabel}中…` : retryLabel}
        </button>
      ) : null}
    </div>
  );
}
```

### 3.2 `AdminSectionErrorClient.tsx`（新規・完成形）

```tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminSectionError,
  type AdminSectionErrorProps,
} from "./AdminSectionError";

export type AdminSectionErrorClientProps = Omit<
  AdminSectionErrorProps,
  "onRetry" | "isRetrying"
>;

export function AdminSectionErrorClient(props: AdminSectionErrorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <AdminSectionError
      {...props}
      isRetrying={isPending}
      onRetry={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
    />
  );
}
```

### 3.3 `_shared/index.ts`（追加 export）

```ts
// 既存 export はそのまま維持
export {
  AdminSectionError,
  type AdminSectionErrorProps,
} from "./AdminSectionError";

// 追加
export {
  AdminSectionErrorClient,
  type AdminSectionErrorClientProps,
} from "./AdminSectionErrorClient";
```

## 4. 11 page 差し替え方針

- import 行を `AdminSectionError` から `AdminSectionErrorClient` に差し替える（または併用する）
- JSX 内の `<AdminSectionError ... />` を `<AdminSectionErrorClient ... />` に差し替える
- `onRetry` / `isRetrying` props は **渡さない**（wrapper 内部で組み立てるため）
- page.tsx の冒頭に `"use client"` を **絶対に追加しない**（server fetch を維持）
- 各 page で `AdminSectionError` を retry CTA 不要な目的で使っている箇所は据え置き可（混在許容）

## 5. 差分方針

| 観点 | 方針 |
|------|------|
| 既存 caller 互換 | optional props 追加のみ・既存呼び出しは型エラーなく動作 |
| import path | `_shared/index.ts` の re-export 経由を推奨 |
| primitive 重複 | 新規追加なし。Button primitive は既存を再利用（変更不要） |
| token | OKLch token を `tokens.css` 経由で適用。本 component で HEX 書かない |
| test | 既存 case 非変更・追加 case のみ append |

## 6. Phase 6 への引き継ぎ

雛形コードに対応する test case シナリオは Phase 6 で網羅する。雛形で `data-testid="admin-section-error-retry"` を付与しているのは test 検索の安定性確保のため。
