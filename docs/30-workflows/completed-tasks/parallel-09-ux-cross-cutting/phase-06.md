# Phase 6: 実装手順（ファイル別 step-by-step）

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 5 で固定した変更対象ファイル（新規 4 / 編集 3 + 6 spec）に対し、**実コードを書く順序と内容**を step-by-step で固定する Phase。コード実装そのものを対象とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装手順 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | pending |

---

## 目的

Phase 5 の実装計画を、**ファイル別の step-by-step 実装手順** として固定する。各 step は単一 commit に対応する粒度で記述し、`mise exec --` 経由のローカル検証コマンドを各 step 末尾に配置する。

---

## 6-0. 事前確認（実装着手前）

```bash
# 1. ワークツリー位置確認
pwd
# 期待: .worktrees/task-20260515-193217-wt-4

# 2. ブランチ作成は user approval 後のみ（既に分離済の場合は不要）
# branch creation command omitted until explicit user approval

# 3. 依存準備
mise exec -- pnpm install

# 4. 既存 token / globals.css の現状確認
grep -E '^\s*--ubm-(color|spacing|text|ease|radius)-' apps/web/src/styles/tokens.css | head -50
grep -n "@layer components" apps/web/src/styles/globals.css

# 5. 既存 EmptyState / useAdminMutation の caller 全数把握
grep -rn "EmptyState" apps/web/src --include="*.tsx" --include="*.ts"
grep -rn "useAdminMutation" apps/web/src --include="*.tsx" --include="*.ts"

# 6. parallel-03 の現状（同時編集競合点把握）
ls docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/ | grep parallel-03
```

---

## 6-1. T1: FormField 実装

### Step 1-1: ファイル作成

`apps/web/src/components/ui/FormField.tsx` を新規作成。

```tsx
import { cloneElement, type ReactElement } from "react";

export interface FormFieldProps {
  name: string;
  label: string;
  error?: string;
  children: ReactElement<{
    id?: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }>;
}

export function FormField({ name, label, error, children }: FormFieldProps): JSX.Element {
  const errorId = `${name}-error`;
  const enhanced = cloneElement(children, {
    id: name,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
  });
  return (
    <div data-component="form-field">
      <label htmlFor={name}>{label}</label>
      {enhanced}
      {error ? (
        <span id={errorId} data-component="form-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
```

### Step 1-2: 型 / lint 検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

---

## 6-2. T2: EmptyState 拡張

### Step 2-1: 既存 props を破壊しない形で拡張

`apps/web/src/components/ui/EmptyState.tsx` を編集（既存 children-only 動作は維持）。

```tsx
import type { HTMLAttributes, ReactNode } from "react";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  className,
  ...rest
}: EmptyStateProps): JSX.Element {
  return (
    <div className={`ui-empty-state ${className ?? ""}`} {...rest}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {title ? <h2>{title}</h2> : null}
      {description ? <p>{description}</p> : null}
      {children}
      {action ? <div data-component="empty-state-action">{action}</div> : null}
    </div>
  );
}
```

### Step 2-2: 既存 caller を grep し、シグネチャ破壊なしを確認

```bash
grep -rn "EmptyState" apps/web/src --include="*.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

---

## 6-3. T3: Pagination 実装

### Step 3-1: ファイル作成

`apps/web/src/components/ui/Pagination.tsx` を新規作成。

```tsx
export interface PaginationProps {
  current: number;
  total?: number;
  pageSize?: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export function Pagination({
  current,
  total,
  pageSize = 20,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
}: PaginationProps): JSX.Element {
  const start = (current - 1) * pageSize + 1;
  const end = current * pageSize;
  return (
    <nav aria-label="pagination" data-component="pagination">
      {typeof total === "number" ? (
        <span>
          {start}-{Math.min(end, total)} of {total}
        </span>
      ) : null}
      <button type="button" disabled={!hasPrev} onClick={onPrev}>
        Previous
      </button>
      <button type="button" disabled={!hasNext} onClick={onNext}>
        Next
      </button>
    </nav>
  );
}
```

### Step 3-2: 検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

---

## 6-4. T4: Icon 実装

### Step 4-1: ファイル作成

`apps/web/src/components/ui/Icon.tsx` を新規作成。

```tsx
import type { CSSProperties } from "react";

export type IconSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<IconSize, string> = {
  sm: "12px",
  md: "16px",
  lg: "20px",
  xl: "24px",
};

export interface IconProps {
  size: IconSize;
  name: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ size, name, ariaLabel, className, style }: IconProps): JSX.Element {
  const isDecorative = !ariaLabel;
  return (
    <span
      className={className}
      data-icon-name={name}
      aria-label={ariaLabel}
      aria-hidden={isDecorative ? "true" : undefined}
      role={isDecorative ? undefined : "img"}
      style={{ fontSize: SIZE_MAP[size], display: "inline-block", lineHeight: 1, ...style }}
    />
  );
}
```

### Step 4-2: 既存 `icons.ts` 干渉確認

```bash
ls apps/web/src/components/ui/icons.ts apps/web/src/lib/icons.ts 2>&1 | grep -v "No such"
```

---

## 6-5. T5: Breadcrumb 実装

### Step 5-1: ファイル作成

`apps/web/src/components/admin/Breadcrumb.tsx` を新規作成。

```tsx
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: ReadonlyArray<BreadcrumbItem>;
}

export function Breadcrumb({ items }: BreadcrumbProps): JSX.Element {
  return (
    <nav aria-label="breadcrumb">
      <ol data-component="breadcrumb">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <a href={item.href}>{item.label}</a>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

---

## 6-6. T6: useAdminMutation 編集

### Step 6-1: 既存実装を Read

```bash
cat apps/web/src/lib/useAdminMutation.ts
```

### Step 6-2: 後方互換を維持しつつ guard 追加

既存シグネチャを optional 引数のみで拡張（破壊変更禁止）。

```tsx
import { useCallback, useState } from "react";
import { toast } from "@/lib/toast"; // 既存 toast 経路を再利用

export interface UseAdminMutationOptions<TOutput, TError> {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: TError) => void;
}

export interface UseAdminMutationResult<TInput, TOutput> {
  mutate: (data: TInput) => Promise<TOutput | undefined>;
  isLoading: boolean;
}

export function useAdminMutation<TInput, TOutput, TError = unknown>(
  mutationFn,
  options: UseAdminMutationOptions<TOutput, TError> = {}
): UseAdminMutationResult<TInput, TOutput> {
  const { onSuccess, onError } = options;
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(
    async (data: TInput): Promise<TOutput | undefined> => {
      if (isLoading) {
        toast({ type: "warn", message: "既に保存中です" });
        return undefined;
      }
      setIsLoading(true);
      try {
        const result = await mutationFn(data);
        onSuccess?.(result);
        return result;
      } catch (error) {
        onError?.(error as TError);
        // form state には触らない（caller responsibility）
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, mutationFn, onSuccess, onError]
  );

  return { mutate, isLoading };
}
```

### Step 6-3: 既存 caller 互換を確認

```bash
grep -rn "useAdminMutation" apps/web/src
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
```

---

## 6-7. T7 + T9: globals.css `@layer components` 追記 + parallel-03 共同編集ガード

### Step 7-1: 既存 `@layer components` ブロック末尾に section 追加

`apps/web/src/styles/globals.css` を編集。

```css
@layer components {
  /* === parallel-09 G9-1: form-field === */
  [data-component="form-field"] {
    display: flex;
    flex-direction: column;
    gap: var(--ubm-spacing-md);
  }
  [data-component="form-field"] label {
    font-size: var(--ubm-text-sm);
    font-weight: 600;
    color: var(--ubm-color-text-primary);
  }
  input[aria-invalid="true"],
  textarea[aria-invalid="true"],
  select[aria-invalid="true"] {
    border-color: var(--ubm-color-danger);
    background-color: var(--ubm-color-danger-soft, transparent);
  }
  [data-component="form-error"] {
    font-size: var(--ubm-text-xs);
    color: var(--ubm-color-danger);
  }

  /* === parallel-09 G9-3: pagination === */
  [data-component="pagination"] {
    display: flex;
    align-items: center;
    gap: var(--ubm-spacing-md);
    padding: var(--ubm-spacing-md);
    font-size: var(--ubm-text-sm);
    color: var(--ubm-color-text-secondary);
  }
  [data-component="pagination"] button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* === parallel-09 G9-5: breadcrumb === */
  [data-component="breadcrumb"] {
    display: flex;
    gap: var(--ubm-spacing-sm);
    font-size: var(--ubm-text-sm);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  [data-component="breadcrumb"] a {
    color: var(--ubm-color-accent);
  }
  [data-component="breadcrumb"] span[aria-current="page"] {
    color: var(--ubm-color-text-secondary);
  }
}

/* === parallel-09 G9-7: focus-visible / motion-reduce === */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

### Step 9-1: parallel-03 との section 分離確認

```bash
grep -n "=== parallel-" apps/web/src/styles/globals.css
# 期待: parallel-03 と parallel-09 の section が両方存在し、selector 重複がないこと

# HEX 直書きが混入していないか
grep -E '#[0-9a-fA-F]{3,8}' apps/web/src/styles/globals.css || echo "OK: no HEX"
```

> parallel-03 の PR と並行作業中の場合、本 step 着手前に `git fetch origin dev` で最新を取り込み、parallel-03 が先に merge されていれば conflict をローカルで解消する。

---

## 6-8. T8: Vitest + jest-axe spec 実装

### Step 8-1: jest-axe 導入確認

```bash
grep -E '"jest-axe"' apps/web/package.json || mise exec -- pnpm --filter @ubm-hyogo/web add -D jest-axe @types/jest-axe
```

### Step 8-2: 6 spec ファイル作成

各 primitive / hook に対応する spec を `__tests__/` 配下に配置（命名は `*.spec.{ts,tsx}` 厳守）:

- `apps/web/src/components/ui/__tests__/FormField.spec.tsx`
- `apps/web/src/components/ui/__tests__/EmptyState.spec.tsx`
- `apps/web/src/components/ui/__tests__/Pagination.spec.tsx`
- `apps/web/src/components/ui/__tests__/Icon.spec.tsx`
- `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx`
- `apps/web/src/lib/__tests__/useAdminMutation.spec.ts`

各 spec 共通テンプレート（FormField 例）:

```tsx
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";
import { FormField } from "../FormField";

expect.extend(toHaveNoViolations);

describe("FormField", () => {
  it("normal: label と input を render する", () => {
    render(
      <FormField name="email" label="メール">
        <input type="email" />
      </FormField>
    );
    expect(screen.getByLabelText("メール")).toBeInTheDocument();
  });

  it("error: aria-invalid と error helper を表示する", () => {
    render(
      <FormField name="email" label="メール" error="必須">
        <input type="email" />
      </FormField>
    );
    expect(screen.getByLabelText("メール")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("必須");
  });

  it("a11y: jest-axe 違反 0", async () => {
    const { container } = render(
      <FormField name="email" label="メール" error="必須">
        <input type="email" />
      </FormField>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### Step 8-3: 全 spec 実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test -- components/ui/__tests__ components/admin/__tests__ lib/__tests__
```

---

## 6-9. T10: Playwright visual snapshot 追加

### Step 10-1: visual spec 拡張

`apps/web/e2e/visual.spec.ts`（または既存 visual entry）に primitive 4 種の snapshot block を追加。テスト用の minimal harness route（例: `/__visual/primitives`）が無ければ既存 storybook 風 route の代替として `/admin` 配下の実利用箇所を撮影対象にする。

### Step 10-2: 実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test:visual
```

---

## 6-10. T11: ドキュメント更新

### Step 11-1: token 不足チェック

```bash
grep -E '\-\-ubm-color-danger-soft' apps/web/src/styles/tokens.css || echo "MISSING: use existing fallback token or stop implementation for user-approved token decision"
```

### Step 11-2: primitive リファレンス追記（任意）

`docs/00-getting-started-manual/specs/ui-primitives.md` に以下を記載:
- 各 primitive の使用例（FormField / EmptyState / Pagination / Icon / Breadcrumb）
- useAdminMutation の concurrent guard 挙動
- import path 一覧

> 詳細は Phase 8 の docs 計画に従う。

---

## 6-11. 最終統合検証

```bash
# 型 + lint
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# unit + a11y
mise exec -- pnpm --filter @ubm-hyogo/web test

# HEX 直書き 0 件
grep -rEn 'bg-\[#|text-\[#|border-\[#|focus:\[#' apps/web/src && echo "NG" || echo "OK"

# CSS section 確認
grep -n "=== parallel-" apps/web/src/styles/globals.css

# test ファイル命名規約
find apps/web/src -name "*.test.ts" -o -name "*.test.tsx" | head
# 期待: 0 件（block-test-suffix 違反なし）
```

---

## 不変条件チェック

- [ ] 全 step の検証コマンドが `mise exec --` 経由
- [ ] 全 spec ファイルが `*.spec.{ts,tsx}` 命名
- [ ] HEX 直書きなし
- [ ] OKLch token のみ参照
- [ ] `apps/api/` 変更なし
- [ ] D1 直接アクセスなし
- [ ] parallel-03 section 分離確認済

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/implementation-steps.md | 全 step の手順 + 検証ログ |
| メタ | artifacts.json | phase-06 を completed に更新 |

---

## 完了条件

- [ ] T1〜T11 の全 step が完了
- [ ] 6-11 最終統合検証が全 PASS
- [ ] HEX 直書き 0 件
- [ ] parallel-03 と globals.css section が分離

---

## 次 Phase 引き継ぎ事項

- 次: Phase 7（テスト計画）
- 引き継ぎ事項:
  - 6-9 で追加した Playwright snapshot 数を Phase 7 のテスト件数に転記
  - jest-axe 導入有無を Phase 7 の前提条件に転記
  - useAdminMutation 既存 caller 数（grep 結果）を Phase 7 の regression scope に転記
- ブロック条件: 6-11 最終統合検証で 1 件でも fail がある場合
