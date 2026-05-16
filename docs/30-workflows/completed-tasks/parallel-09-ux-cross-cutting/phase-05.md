# Phase 5: 実装計画

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 4 で固定した T1〜T11 のうち T1〜T7 は `apps/web/src/` 配下に **実コードとして実装する**（新規 4 / 編集 3）。本 Phase はそのコード実装の着手前計画として、変更対象ファイル・関数シグネチャ・型定義・依存・実装順序・リスク（特に parallel-03 との `globals.css` 同時編集）を CONST_005 必須項目に沿って固定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装計画 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 4 (タスク分解) |
| 次 Phase | 6 (実装手順) |
| 状態 | pending |

---

## 目的

Phase 4 のサブタスク T1〜T11 を、Phase 6（実装手順）が即着手できる粒度まで具体化する。本 Phase の出力は CONST_005（変更対象ファイル / 関数シグネチャ / 型 / 入出力・副作用 / 依存ライブラリ / 実装順序 / リスク）の全項目を満たす `outputs/phase-05/implementation-plan.md` を中心に構成する。

---

## 5-1. 変更対象ファイル一覧

| 種別 | パス | 役割 | 担当サブタスク |
| --- | --- | --- | --- |
| 新規 | `apps/web/src/components/ui/FormField.tsx` | G9-1 form validation wrapper | T1 |
| 編集 | `apps/web/src/components/ui/EmptyState.tsx` | G9-2 既存 children-only に icon/title/description/action props を optional 追加 | T2 |
| 新規 | `apps/web/src/components/ui/Pagination.tsx` | G9-3 meta + cursor UI | T3 |
| 新規 | `apps/web/src/components/ui/Icon.tsx` | G9-4 size convention wrapper | T4 |
| 新規 | `apps/web/src/components/admin/Breadcrumb.tsx` | G9-5 breadcrumb trail | T5 |
| 編集 | `apps/web/src/lib/useAdminMutation.ts` | G9-8/9 concurrent guard + form state preserve | T6 |
| 編集 | `apps/web/src/styles/globals.css` | G9-1/6/7 規則を `@layer components` に追加（section コメント分離） | T7 / T9 |
| 新規 | `apps/web/src/components/ui/__tests__/FormField.spec.tsx` | T1 検証 + jest-axe | T8 |
| 新規 | `apps/web/src/components/ui/__tests__/EmptyState.spec.tsx` | T2 後方互換 + 拡張 props | T8 |
| 新規 | `apps/web/src/components/ui/__tests__/Pagination.spec.tsx` | T3 検証 + jest-axe | T8 |
| 新規 | `apps/web/src/components/ui/__tests__/Icon.spec.tsx` | T4 size + a11y | T8 |
| 新規 | `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx` | T5 検証 + jest-axe | T8 |
| 新規 | `apps/web/src/lib/__tests__/useAdminMutation.spec.ts` | T6 concurrent guard + state preserve | T8 |
| 編集 | `apps/web/e2e/visual.spec.ts` (or 同等) | T10 visual snapshot 4 primitive 追加 | T10 |
| 編集（任意） | `docs/00-getting-started-manual/specs/design-tokens.md` | token 不足 feedback / 新 primitive リファレンス | T11 |
| 新規（任意） | `docs/00-getting-started-manual/specs/ui-primitives.md` | primitive 使用例集約 | T11 |

> 削除ファイルなし。`apps/api/` は変更しない。`apps/web/wrangler.toml` 変更なし。

---

## 5-2. 主要関数・型シグネチャ

### 5-2-1. FormField (`apps/web/src/components/ui/FormField.tsx`)

```tsx
import { cloneElement, type ReactElement, type ReactNode } from "react";

export interface FormFieldProps {
  name: string;
  label: string;
  error?: string;
  children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
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

### 5-2-2. EmptyState 拡張 (`apps/web/src/components/ui/EmptyState.tsx`)

```tsx
import type { HTMLAttributes, ReactNode } from "react";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode; // 既存 children-only 互換
}

export function EmptyState({ icon, title, description, action, children, ...rest }: EmptyStateProps): JSX.Element;
```

> 既存 caller `<EmptyState>テキスト</EmptyState>` 形式は `children` のみ render として継続動作させる。

### 5-2-3. Pagination (`apps/web/src/components/ui/Pagination.tsx`)

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

export function Pagination(props: PaginationProps): JSX.Element;
```

### 5-2-4. Icon (`apps/web/src/components/ui/Icon.tsx`)

```tsx
export type IconSize = "sm" | "md" | "lg" | "xl";

export interface IconProps {
  size: IconSize;
  name: string; // 既存 icons.ts の IconName を import
  ariaLabel?: string;
  className?: string;
}

export function Icon({ size, name, ariaLabel, className }: IconProps): JSX.Element;
```

### 5-2-5. Breadcrumb (`apps/web/src/components/admin/Breadcrumb.tsx`)

```tsx
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: ReadonlyArray<BreadcrumbItem>;
}

export function Breadcrumb({ items }: BreadcrumbProps): JSX.Element;
```

### 5-2-6. useAdminMutation (`apps/web/src/lib/useAdminMutation.ts`)

```tsx
export interface UseAdminMutationOptions<TOutput, TError> {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: TError) => void;
}

export interface UseAdminMutationResult<TInput, TOutput> {
  mutate: (data: TInput) => Promise<TOutput | undefined>;
  isLoading: boolean;
}

export function useAdminMutation<TInput, TOutput, TError = unknown>(
  mutationFn: (data: TInput) => Promise<TOutput>,
  options?: UseAdminMutationOptions<TOutput, TError>
): UseAdminMutationResult<TInput, TOutput>;
```

> 2nd call は `Promise<undefined>` で reject + toast。エラー時 form state は触らず onError callback のみ invoke。

---

## 5-3. CSS 規則（`globals.css @layer components`）

```css
@layer components {
  /* === parallel-09 G9-1: form-field === */
  [data-component="form-field"] { /* ... */ }
  [data-component="form-field"] label { /* ... */ }
  input[aria-invalid="true"], textarea[aria-invalid="true"], select[aria-invalid="true"] { /* ... */ }
  [data-component="form-error"] { /* ... */ }

  /* === parallel-09 G9-3: pagination === */
  [data-component="pagination"] { /* ... */ }

  /* === parallel-09 G9-5: breadcrumb === */
  [data-component="breadcrumb"] { /* ... */ }

  /* === parallel-09 G9-7: focus-visible / motion-reduce === */
  /* :focus-visible は既存定義を上書きせず追加規則のみ */
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

> color / spacing / typography は `var(--ubm-color-*)` / `var(--ubm-spacing-*)` / `var(--ubm-text-*)` のみ参照。HEX 直書き禁止。

---

## 5-4. 実装順序（クリティカルパス転記）

1. **Wave 1（並列実行可）**: T1 / T2 / T3 / T4 / T5 / T6（primitive + hook 6 並列）
2. **Wave 2**: T7 (`globals.css` 追記) → T9 (parallel-03 と section コメント分離確認)
3. **Wave 3**: T8 (Vitest + jest-axe 6 spec)
4. **Wave 4**: T10 (Playwright visual snapshot)
5. **Wave 5**: T11 (ドキュメント更新)

---

## 5-5. 依存ライブラリ

| ライブラリ | 役割 | 既存 / 新規 |
| --- | --- | --- |
| react (>=19) | primitive 実装 | 既存 |
| @testing-library/react | unit test | 既存 |
| @testing-library/jest-dom | DOM matcher | 既存 |
| jest-axe (or vitest-axe) | a11y 違反検証 | 既存利用を優先。未導入なら依存追加は user approval 後の実装 wave で実施 |
| @playwright/test | visual snapshot | 既存 |

> 新規 npm 追加は **jest-axe のみ条件付き**。それ以外は追加なし。

---

## 5-6. 入出力・副作用

| primitive / hook | 入力 | 出力 / 副作用 |
| --- | --- | --- |
| FormField | name / label / error / children | DOM 生成、`aria-invalid` / `aria-describedby` 注入 |
| EmptyState | icon / title / description / action / children | DOM 生成、副作用なし |
| Pagination | current / total? / hasNext / hasPrev / onNext / onPrev | button click → caller callback。disabled 状態のみ |
| Icon | size / name / ariaLabel? | `<span>` 生成、`font-size` 切替。`ariaLabel` 未指定時 `aria-hidden="true"` |
| Breadcrumb | items | `nav > ol > li` 生成、最終項目 `aria-current="page"` |
| useAdminMutation | mutationFn / onSuccess? / onError? | mutation 実行 + `isLoading` 状態管理 + 2nd call 拒否時 toast |
| globals.css | - | visual のみ。CSS specificity を `@layer components` 内で明示 |

---

## 5-7. リスク・制約

| リスク | 影響 | 対策 |
| --- | --- | --- |
| **parallel-03 との `globals.css @layer components` 同時編集** | merge conflict / CSS 規則重複 / cascade 順序逆転 | T9 で section コメント (`/* === parallel-09 G9-x === */` / `/* === parallel-03 G3-x === */`) を物理的に隣接させず、両 spec が同じ selector を編集していないことを `grep -n` で確認。merge conflict 発生時は section ブロック単位で diff を読む |
| OKLch token 不足（特に danger-soft） | HEX 直書き混入リスク | T11 で `tokens.css` に存在しない token があれば task-09 に feedback。代替 token で吸収可能か Phase 6 着手前に確認 |
| Icon.tsx と既存 `icons.ts` の責務衝突 | 二重実装 | Icon.tsx は size wrapper のみ。`name` は既存 `icons.ts` から import する規約を Phase 6 手順に明記 |
| EmptyState 後方互換破壊 | 既存 caller fail | T2 で全 props を optional 化。T8 で `<EmptyState>テキスト</EmptyState>` 形式の spec を必ず含める |
| useAdminMutation 既存 caller シグネチャ破壊 | admin 全画面 fail | T6 で既存 caller を grep し、optional 引数のみ追加。破壊変更時は Phase 4 へ差し戻し |
| Pagination total 未提供時の表示 | UI fragmentation | `total === undefined` 時は meta 部を `<span>` 省略する仕様で統一 |
| FormField の `cloneElement` が複数 children に未対応 | runtime error | `children` 型を `ReactElement` 単一に限定（複数渡し時は型エラー）|
| jest-axe 未導入リポジトリの場合 | T8 fail | 依存追加が必要な場合は user approval を得てから実装 wave で追加する |

---

## 5-8. 不変条件チェック

- [ ] D1 直接アクセスなし（`apps/web` のみ編集）
- [ ] `apps/api/src/routes/` 変更なし
- [ ] HEX 直書きなし（`grep -rEn 'bg-\[#|text-\[#|border-\[#|focus:\[#' apps/web/src` で 0 件）
- [ ] OKLch token のみ参照
- [ ] 全 test ファイルが `*.spec.{ts,tsx}` 命名
- [ ] `apps/web/wrangler.toml` 変更なし

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md | T1〜T11 サブタスク |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md | 設計原典 |
| 必須 | apps/web/src/styles/tokens.css | OKLch token 正本 |
| 必須 | apps/web/src/styles/globals.css | `@layer components` 既存 |
| 必須 | apps/web/src/components/ui/EmptyState.tsx | 後方互換確認 |
| 必須 | apps/web/src/lib/useAdminMutation.ts | 後方互換確認 |
| 参考 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-* | `@layer components` 同時編集 spec |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-plan.md | CONST_005 全項目 |
| メタ | artifacts.json | phase-05 を completed に更新 |

---

## 完了条件

- [ ] 変更対象ファイル一覧が確定
- [ ] 6 primitive / hook の関数シグネチャ・型定義が確定
- [ ] CSS 規則の section 分離方針が確定
- [ ] 実装順序（Wave 1〜5）が確定
- [ ] リスク表（特に parallel-03 同時編集）が記録
- [ ] 不変条件チェック全 PASS

---

## タスク 100% 実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] artifacts.json の phase-05 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 6（実装手順）
- 引き継ぎ事項:
  - 関数シグネチャ・型定義を Phase 6 の step-by-step 手順に転記
  - CSS section コメント文字列 (`/* === parallel-09 G9-x === */`) を Phase 6 の手順に固定
  - parallel-03 共同編集ガード（`grep -n` 確認手順）を Phase 6 の最終 step に組み込む
- ブロック条件: 関数シグネチャ未確定、parallel-03 リスク対策未記載
