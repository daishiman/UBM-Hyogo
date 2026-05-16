# Phase 2: 設計

[実装区分: 実装仕様書]

> **実装区分判定根拠**: 本 Phase は新規 primitive 4 件 (FormField/Pagination/Icon/Breadcrumb)、既存 primitive 編集 1 件 (EmptyState)、hook 編集 1 件 (useAdminMutation)、CSS 編集 1 件 (globals.css `@layer components`) のコード設計を含む。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 で確定した 4 論点採用案 ((A)-(A)-(A)-(A)) を、コード実装可能な粒度の設計に落とし込む。本 Phase は G9-1〜G9-9 に対応する 9 個の設計ドキュメントを `outputs/phase-02/g9-{1..9}-*-design.md` として出力する。

各設計ドキュメントは以下を含む:
1. 該当 primitive の関数・型シグネチャ (TypeScript)
2. CSS 規則 (該当する場合 `globals.css` 追記分)
3. a11y 要件 (`aria-*` 属性、role)
4. 既存資産との衝突回避 (Phase 01 inventory との照合)
5. 単体テストケース一覧 (Vitest)
6. visual smoke 観点 (Playwright)
7. AC への紐付け

## 変更対象ファイル一覧

| パス | 区分 | 概要 | 関連 G9 |
| --- | --- | --- | --- |
| `apps/web/src/components/ui/FormField.tsx` | 新規 | label + children + error helper の wrapper, `aria-invalid` / `aria-describedby` 注入 | G9-1 |
| `apps/web/src/components/ui/EmptyState.tsx` | 編集 | 既存 props を保持しつつ `icon?` / `title` / `description?` / `action?` を後方互換 optional として追加 | G9-2 |
| `apps/web/src/components/ui/Pagination.tsx` | 新規 | `current` / `total?` / `hasNext` / `hasPrev` / `onNext` / `onPrev` props、disabled button 実装 | G9-3 |
| `apps/web/src/components/ui/Icon.tsx` | 新規 | `IconSize = "sm"\|"md"\|"lg"\|"xl"` (12/16/20/24px) wrapper | G9-4 |
| `apps/web/src/components/admin/Breadcrumb.tsx` | 新規 | `nav[aria-label="breadcrumb"]` + `ol`、最終項目に `aria-current="page"` | G9-5 |
| `apps/web/src/styles/globals.css` | 編集 | `@layer components` に G9-1 / G9-6 / G9-7 規則を section コメント付きで追記 | G9-1/6/7 |
| `apps/web/src/lib/useAdminMutation.ts` | 編集 | `isLoading` ガード + 2nd call 拒否 + toast 通知 + form state preserve 補強 | G9-8/9 |
| `apps/web/src/components/ui/__tests__/FormField.spec.tsx` | 新規 | Vitest + Testing Library | G9-1 |
| `apps/web/src/components/ui/__tests__/EmptyState.spec.tsx` | 新規/編集 | 後方互換確認 + 4 props 確認 | G9-2 |
| `apps/web/src/components/ui/__tests__/Pagination.spec.tsx` | 新規 | hasNext/hasPrev による disabled 検証 | G9-3 |
| `apps/web/src/components/ui/__tests__/Icon.spec.tsx` | 新規 | size prop に応じた font-size 検証 | G9-4 |
| `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx` | 新規 | items 数, `aria-current` 検証 | G9-5 |
| `apps/web/src/lib/__tests__/useAdminMutation.spec.ts` | 新規/編集 | 2nd call 拒否 / form state preserve 検証 | G9-8/9 |

> 既存 caller (例: 既存 `<EmptyState>` 利用箇所) のソース改修は本 task のスコープ外 (parallel-01〜08 の責務)。

## 設計ドキュメント分割計画

Phase 02 では以下 9 ファイルを `outputs/phase-02/` 配下に作成する。

### outputs/phase-02/g9-1-form-validation-design.md (AC-1)

**対象**: `apps/web/src/components/ui/FormField.tsx` 新規 + `globals.css` `@layer components` 規則

**主要内容**:
```tsx
export interface FormFieldProps {
  name: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ name, label, error, children }: FormFieldProps): JSX.Element;
```
- `React.cloneElement(children, { id: name, "aria-invalid": !!error, "aria-describedby": error ? `${name}-error` : undefined })` で children に属性注入
- error 時は `<span id="{name}-error" data-component="form-error" role="alert">` で helper text を表示
- CSS: `[data-component="form-field"]` で flex/gap、`input[aria-invalid="true"]` で `border-color: var(--ubm-color-danger)`、`prefers-reduced-motion: no-preference` 時のみ transition
- a11y: `aria-invalid` / `aria-describedby` の組み合わせ、jest-axe 違反 0
- 既存利用想定: NoteForm (parallel-01), IdentityConflictsMergeModal (parallel-02), TagsQueueResolveDrawer (parallel-04)

### outputs/phase-02/g9-2-empty-state-design.md (AC-2)

**対象**: `apps/web/src/components/ui/EmptyState.tsx` 編集

**主要内容**:
- 既存 API (`children` ベース) を保持
- 拡張 props: `icon?: ReactNode` / `title?: string` / `description?: string` / `action?: ReactNode`
- 描画ルール:
  - `title` 指定時 → `<h2>{title}</h2>` を出力
  - `description` 指定時 → `<p>{description}</p>` を出力
  - `icon` 指定時 → `<span aria-hidden="true">{icon}</span>` を出力
  - `action` 指定時 → action 領域 ( `<div>{action}</div>` ) を最下部に配置
  - 上記が一つも指定されない場合は `children` をそのまま render (後方互換)
- CSS: 既存 `.ui-empty-state` (もしくは `data-component="empty-state"`) に padding / min-height / 中央配置を維持
- 後方互換テスト: 既存 caller `<EmptyState>テキスト</EmptyState>` 形式が変わらず描画されることを `__tests__/EmptyState.spec.tsx` で検証

### outputs/phase-02/g9-3-pagination-design.md (AC-3)

**対象**: `apps/web/src/components/ui/Pagination.tsx` 新規

**主要内容**:
```tsx
export interface PaginationProps {
  current: number;          // 1-based page index
  total?: number;           // 未提供時は cursor-only API として meta 表示を省略
  pageSize?: number;        // default 20
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
}
```
- meta 表示: `total` 提供時のみ `${(current - 1) * pageSize + 1}-${Math.min(current * pageSize, total)} of ${total}` を render
- `<button disabled={!hasPrev}>Previous</button>` / `<button disabled={!hasNext}>Next</button>`
- a11y: `<nav aria-label="pagination">` で wrap、disabled button は `aria-disabled="true"` 相当の `disabled` 属性
- 既存利用想定: AttendanceList (parallel-04), admin/audit (parallel-08), members list paging

### outputs/phase-02/g9-4-icon-size-design.md (AC-4)

**対象**: `apps/web/src/components/ui/Icon.tsx` 新規

**主要内容**:
```tsx
export type IconSize = "sm" | "md" | "lg" | "xl";
export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  size: IconSize;
  name: IconName; // 既存 icons.ts から import
  "aria-label"?: string;
}

const SIZE_MAP: Record<IconSize, string> = { sm: "12px", md: "16px", lg: "20px", xl: "24px" };

export function Icon({ size, name, ...props }: IconProps): JSX.Element;
```
- サイズ規約: sm 12px (button inline / table compact), md 16px (sidebar nav / header), lg 20px (stat card / feature icon), xl 24px (page hero / modal title)
- a11y: `aria-label` 指定なしの場合は `aria-hidden="true"` を自動付与（装飾用途デフォルト）
- 既存 `icons.ts` (もしくは相当ファイル) との衝突回避: 本 file は size convention wrapper のみ。`IconName` 型と icon glyph 実装は既存 module を import

### outputs/phase-02/g9-5-breadcrumb-design.md (AC-5)

**対象**: `apps/web/src/components/admin/Breadcrumb.tsx` 新規

**主要内容**:
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
- 構造: `<nav aria-label="breadcrumb"><ol data-component="breadcrumb"><li>...</li></ol></nav>`
- 各項目: `href` あり → `<a href={item.href}>{item.label}</a>`、`href` なし (= 最終項目想定) → `<span aria-current="page">{item.label}</span>`
- separator: 各 `<li>` 間に `<span aria-hidden="true">/</span>` を挿入 (最終項目の後ろには出さない)
- CSS: `[data-component="breadcrumb"]` で flex / gap / list-style: none、リンク色は `var(--ubm-color-accent)`、span は `var(--ubm-color-text-secondary)`
- 既存利用想定: /admin/members/[id], /admin/identity-conflicts/[id], admin drawer/modal deep nesting

### outputs/phase-02/g9-6-mobile-responsive-design.md (AC-6)

**対象**: `apps/web/src/styles/globals.css` `@layer components` 編集 + 設計指針ドキュメント

**主要内容**:
- breakpoint: Tailwind 既定 (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`) を踏襲
- component-level rules (CSS or className 規約):
  - Admin sidebar: `hidden md:flex` (drawer collapse on mobile)
  - Members list grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Form layout: stacked (`flex-col`) on sm / two-column (`md:grid md:grid-cols-2`) on md+
  - Admin form: `w-full md:max-w-2xl`
- CSS は新規追加せず、各 spec 内で Tailwind utility class を組み合わせて対応するのが原則。本ドキュメントは規約参照書として機能
- ただし `@layer components` には `[data-component="responsive-grid-3"]` 等の汎用 helper を追加検討 (Phase 03 で要否判定)

### outputs/phase-02/g9-7-focus-visible-design.md (AC-7)

**対象**: `apps/web/src/styles/globals.css` `@layer components` 編集

**主要内容**:
- 既存 `:focus-visible` 規則 (Phase 01 grep で確認) を尊重しつつ、以下を追加:
```css
@layer components {
  /* === parallel-09 G9-7 focus-visible 統一 === */
  :focus-visible {
    outline: 2px solid var(--ubm-color-accent);
    outline-offset: 2px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
- 適用対象: `<button>`, `<a>`, `<input>`, `<textarea>`, `<select>`, `[tabindex]` (ブラウザ自動継承)
- a11y: WCAG 2.4.7 (Focus Visible) Level AA 準拠
- 既存規則との重複時は section コメントで本 task 由来であることを明示し、上書きしない

### outputs/phase-02/g9-8-mutation-guard-design.md (AC-8)

**対象**: `apps/web/src/lib/useAdminMutation.ts` 編集 (concurrent guard 部分)

**主要内容**:
```tsx
export function useAdminMutation<TInput, TOutput, TError = Error>(
  mutationFn: (data: TInput) => Promise<TOutput>,
  options?: {
    onSuccess?: (data: TOutput) => void;
    onError?: (error: TError) => void;
  }
): {
  mutate: (data: TInput) => Promise<TOutput | undefined>;
  isLoading: boolean;
};
```
- 内部に `isLoading` state を持ち、`mutate` 呼出時に既に `isLoading === true` なら early return + `toast({ type: "warn", message: "既に保存中です" })`
- 2nd call で reject された場合は `Promise<undefined>` を返す (caller 側は undefined チェックで判定可能)
- caller side: `<button disabled={isLoading}>` で UI 上も二重送信防止
- 既存 caller との互換性: 既存シグネチャを維持しつつ guard を追加（既存 caller の挙動変更なし）

### outputs/phase-02/g9-9-form-state-preserve-design.md (AC-9)

**対象**: `apps/web/src/lib/useAdminMutation.ts` 編集 (form state preserve 部分)

**主要内容**:
- mutation 失敗時、hook 側では form state に一切触れない（onError callback を invoke するのみ）
- caller 側のパターン:
```tsx
const { mutate, isLoading } = useAdminMutation(saveFn, {
  onSuccess: () => { toast({ type: "success", message: "保存しました" }); /* form.reset() は user 操作で */ },
  onError: (err) => { toast({ type: "error", message: err.message }); /* form 値は維持 */ },
});
```
- form library (例: react-hook-form) の `reset()` は呼び出さないことを規約として `outputs/phase-02/g9-9-*` に明示
- error 時 field-level validation は caller 側 `form.setError(...)` で個別設定する規約
- a11y: error toast と form field error helper text (G9-1) の組み合わせで視覚 + スクリーンリーダー両方に通知

## 主要関数シグネチャ集約

```tsx
// apps/web/src/components/ui/FormField.tsx (G9-1)
export interface FormFieldProps {
  name: string;
  label: string;
  error?: string;
  children: ReactNode;
}
export function FormField(props: FormFieldProps): JSX.Element;

// apps/web/src/components/ui/EmptyState.tsx (G9-2 拡張)
export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode; // 後方互換
}
export function EmptyState(props: EmptyStateProps): JSX.Element;

// apps/web/src/components/ui/Pagination.tsx (G9-3)
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

// apps/web/src/components/ui/Icon.tsx (G9-4)
export type IconSize = "sm" | "md" | "lg" | "xl";
export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  size: IconSize;
  name: IconName;
}
export function Icon(props: IconProps): JSX.Element;

// apps/web/src/components/admin/Breadcrumb.tsx (G9-5)
export interface BreadcrumbItem { label: string; href?: string; }
export interface BreadcrumbProps { items: ReadonlyArray<BreadcrumbItem>; }
export function Breadcrumb(props: BreadcrumbProps): JSX.Element;

// apps/web/src/lib/useAdminMutation.ts (G9-8/9)
export function useAdminMutation<TInput, TOutput, TError = Error>(
  mutationFn: (data: TInput) => Promise<TOutput>,
  options?: { onSuccess?: (data: TOutput) => void; onError?: (error: TError) => void; }
): { mutate: (data: TInput) => Promise<TOutput | undefined>; isLoading: boolean };
```

## 入出力・副作用

- **FormField.tsx**: DOM 生成 (`<div>` + `<label>` + cloned children + `<span>`) + children への aria 属性注入。ネットワーク I/O なし
- **EmptyState.tsx**: DOM 生成のみ。副作用なし
- **Pagination.tsx**: button click → onNext / onPrev callback 呼出。状態管理は caller 側
- **Icon.tsx**: CSS font-size 適用のみ。DOM 構造変更なし
- **Breadcrumb.tsx**: `<nav>` + `<ol>` 生成。href 経由の遷移は browser 既定動作
- **useAdminMutation.ts**: `mutationFn` 経由で API を叩く副作用 + toast 通知 + isLoading state 更新
- **globals.css**: CSS layer 規則追加 (visual only、JS 副作用なし)

## テスト方針

### Vitest + Testing Library (`*.spec.tsx`)

| primitive | 主要テストケース |
| --- | --- |
| FormField | error 未指定時 `aria-invalid` が "false" / 指定時 "true"・`aria-describedby` 一致・helper text の `id` 一致・children に id が cloneElement で injection されている |
| EmptyState | 既存 children-only 形式が変わらず描画される (後方互換)・title/description/icon/action それぞれ単独 / 全部入りパターン |
| Pagination | hasPrev=false で Previous button disabled、hasNext=false で Next button disabled、total 未提供時に meta が render されない、total 提供時に "1-20 of 100" 形式の文字列が含まれる |
| Icon | sm/md/lg/xl それぞれの font-size が style に反映、aria-label 未指定時に aria-hidden="true" 付与 |
| Breadcrumb | items 数だけ `<li>` が render、最終項目に `aria-current="page"`、href あり項目は `<a>`、href なし項目は `<span>` |
| useAdminMutation | isLoading=true 時の 2nd call が undefined を返し toast が出る、onError 経由で form state は外部で保持される (mock で確認)、成功時に onSuccess が呼ばれる |

### a11y test (jest-axe)

- FormField + 各 input 種別 (text/textarea/select) の組み合わせで違反 0
- Breadcrumb 単独で違反 0
- Pagination 単独で違反 0
- Icon (aria-label あり/なし) で違反 0
- focus-visible 適用後の `<button>` `<a>` `<input>` で違反 0

### Playwright visual smoke

- FormField error state: border 色 (`oklch` 系) と helper text の存在
- Icon 4 size のスクリーンショット並べ表示
- Breadcrumb separator "/" の表示と link/span の見分け
- focus-visible: 各 interactive element に 2px outline
- Pagination disabled button のオパシティ低下表示

## ローカル実行・検証コマンド

```bash
# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# unit test (parallel-09 関連のみ)
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/ui/__tests__/FormField.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/ui/__tests__/EmptyState.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/ui/__tests__/Pagination.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/ui/__tests__/Icon.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test src/components/admin/__tests__/Breadcrumb.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/__tests__/useAdminMutation.spec.ts

# a11y test (jest-axe)
mise exec -- pnpm --filter @ubm-hyogo/web test:a11y

# Playwright visual smoke
mise exec -- pnpm --filter @ubm-hyogo/web test:visual

# HEX 直書き禁止 (verify-design-tokens 相当の手動 grep)
grep -rEn 'bg-\[#|text-\[#|border-\[#|focus:\[#' apps/web/src \
  apps/web/src/components/ui/FormField.tsx \
  apps/web/src/components/ui/Pagination.tsx \
  apps/web/src/components/ui/Icon.tsx \
  apps/web/src/components/admin/Breadcrumb.tsx \
  && echo "HEX 直書き検出 (NG)" || echo "OK"

# globals.css `@layer components` 構造確認
grep -n '@layer components\|=== parallel-09' apps/web/src/styles/globals.css

# 新規 test ファイル命名規約 (`*.spec.{ts,tsx}` のみ) 確認
find apps/web/src -name '*.test.ts' -o -name '*.test.tsx' && echo "禁止 test 拡張子 (NG)" || echo "OK"
```

## DoD (Phase 2 完了条件)

- [ ] 9 つの outputs/phase-02 ドキュメント全てが作成され、AC-1〜AC-9 にそれぞれ紐付いている
- [ ] 7 個の変更対象ファイル (新規 4 + 編集 3) 全ての関数シグネチャ・I/O 契約が本 phase-02.md に明記されている
- [ ] alert-relay 本体への影響がゼロ (apps/api 全配下不変)
- [ ] 既存 EmptyState API の後方互換が `g9-2-empty-state-design.md` に明示されている
- [ ] parallel-03 との `@layer components` 共存方針 (section コメント) が `g9-1` / `g9-6` / `g9-7` 全てで適用されている
- [ ] OKLch token (Phase 01 grep 結果) の参照のみで構成され、新規 token 追加が無いことが明示されている
- [ ] テストケース一覧 (Vitest + jest-axe + Playwright) が本 phase-02.md および各 g9-* ドキュメントに記録されている
- [ ] 検証コマンドが `mise exec --` 経由で示されている
- [ ] CONDITIONAL の Phase 1 解消条件 5 件 (整合性 3 + 運用性 2) が本 Phase で具体化されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/requirements.md | Phase 1 確定事項 (4 論点採用案、既存資産インベントリ) |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md | 原典 G9-1〜G9-9 設計案 |
| 必須 | apps/web/src/styles/tokens.css | OKLch token 正本 |
| 必須 | apps/web/src/styles/globals.css | `@layer components` 編集対象 |
| 必須 | apps/web/src/components/ui/EmptyState.tsx | G9-2 拡張対象 |
| 必須 | CLAUDE.md | OKLch / D1 / 新規 test 命名 不変条件 |
| 参考 | https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ | Breadcrumb ARIA pattern |
| 参考 | https://developer.mozilla.org/ja/docs/Web/CSS/:focus-visible | focus-visible 仕様 |
| 参考 | https://www.w3.org/TR/WCAG21/#focus-visible | WCAG 2.4.7 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/g9-1-form-validation-design.md | G9-1 設計 (AC-1) |
| ドキュメント | outputs/phase-02/g9-2-empty-state-design.md | G9-2 設計 (AC-2) |
| ドキュメント | outputs/phase-02/g9-3-pagination-design.md | G9-3 設計 (AC-3) |
| ドキュメント | outputs/phase-02/g9-4-icon-size-design.md | G9-4 設計 (AC-4) |
| ドキュメント | outputs/phase-02/g9-5-breadcrumb-design.md | G9-5 設計 (AC-5) |
| ドキュメント | outputs/phase-02/g9-6-mobile-responsive-design.md | G9-6 設計 (AC-6) |
| ドキュメント | outputs/phase-02/g9-7-focus-visible-design.md | G9-7 設計 (AC-7) |
| ドキュメント | outputs/phase-02/g9-8-mutation-guard-design.md | G9-8 設計 (AC-8) |
| ドキュメント | outputs/phase-02/g9-9-form-state-preserve-design.md | G9-9 設計 (AC-9) |

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ事項: Phase 2 成果物 9 件、変更対象ファイル一覧、関数シグネチャ集約、テストケース観点
- ブロック条件: outputs/phase-02 配下 9 ファイル未作成、または DoD 未充足の場合 Phase 3 へ進まない
