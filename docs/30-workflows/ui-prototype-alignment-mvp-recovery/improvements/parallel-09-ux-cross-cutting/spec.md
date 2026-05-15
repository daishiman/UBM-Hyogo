# parallel-09-ux-cross-cutting 実装仕様書

**[実装区分: 実装仕様書]** — UX primitives 統一のみ。API 変更なし。

## 1. 目的

19 routes 全体に横断する UI primitives (form validation, empty state, pagination, icon size, breadcrumb, responsive, focus-visible, mutation guard, form state preserve) を一元化し、UI fragmentation を防止。各 parallel spec の実装側で即座に参照できる共通仕様書。

## 2. スコープ

**含む:**
- Form validation 共通仕様（G9-1）
- Empty state 表示（G9-2）
- Pagination meta + cursor UI（G9-3）
- Icon size convention（G9-4）
- Breadcrumb primitive（G9-5）
- Mobile responsive contract（G9-6）
- focus-visible 統一（G9-7）
- Concurrent mutation guard（G9-8）
- Form state preserve on error（G9-9）

**含まない:**
- API endpoint 変更・追加
- state management 再設計
- データベース schema 変更

## 3. 変更対象ファイル一覧

| パス | 種別 | 理由 |
|------|------|------|
| `apps/web/src/styles/globals.css` | 編集 | `@layer components` に G9-1/6/7 の CSS 規則を追加 |
| `apps/web/src/components/ui/FormField.tsx` | 新規 | G9-1 form validation wrapper (label + input + error helper) |
| `apps/web/src/components/ui/Pagination.tsx` | 新規 | G9-3 meta + cursor UI |
| `apps/web/src/components/admin/Breadcrumb.tsx` | 新規 | G9-5 breadcrumb trail |
| `apps/web/src/components/ui/Icon.tsx` | 新規 | G9-4 icon size convention |
| `apps/web/src/lib/useAdminMutation.ts` | 編集 | G9-8/9 mutation guard + form state preserve hook |

## 4. 設計

### 4.1 G9-1: Form validation 共通仕様

```css
/* globals.css @layer components に追加 */
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
  background-color: var(--ubm-color-danger-soft);
}

[data-component="form-error"] {
  font-size: var(--ubm-text-xs);
  color: var(--ubm-color-danger);
  margin-top: -0.25rem;
}

@media (prefers-reduced-motion: no-preference) {
  input[aria-invalid="true"],
  textarea[aria-invalid="true"],
  select[aria-invalid="true"] {
    transition: border-color 150ms var(--ubm-ease-standard);
  }
}
```

**実装ルール:**
- `<input>`, `<textarea>`, `<select>` に `aria-invalid="true|false"` を付与
- error 時は `aria-describedby="field-id-error"` で helper text を参照
- helper text は `<span id="field-id-error" data-component="form-error">` とする
- border: 2px solid (default gray, error时 var(--ubm-color-danger))
- helper text color: var(--ubm-color-danger), font-size: var(--ubm-text-xs)

**既存利用箇所:** NoteForm (step-01), IdentityConflictsMergeModal (step-02), TagsQueueResolveDrawer (step-04)

### 4.2 G9-2: Empty state 共通仕様

既存 `apps/web/src/components/ui/EmptyState.tsx` を拡張:
```tsx
export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}
```

**CSS:**
```css
.ui-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ubm-spacing-lg);
  padding: var(--ubm-spacing-xl);
  min-height: 200px;
  color: var(--ubm-color-text-secondary);
}

.ui-empty-state span[aria-hidden="true"] {
  font-size: 2rem;
}

.ui-empty-state h2 {
  font-size: var(--ubm-text-lg);
  margin: 0;
}

.ui-empty-state p {
  margin: 0;
  font-size: var(--ubm-text-sm);
}
```

**既存利用箇所:** AttendanceList, members list (filter後), tags queue, audit, identity-conflicts

### 4.3 G9-3: Pagination meta + cursor UI 共通

```tsx
// Pagination.tsx
export interface PaginationProps {
  current: number;
  total?: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export function Pagination({ current, total, hasNext, hasPrev, onNext, onPrev }: PaginationProps) {
  return (
    <div data-component="pagination">
      {total && <span>{(current - 1) * 20 + 1}-{current * 20} of {total}</span>}
      <button disabled={!hasPrev} onClick={onPrev}>Previous</button>
      <button disabled={!hasNext} onClick={onNext}>Next</button>
    </div>
  );
}
```

**CSS:**
```css
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
```

**用途:** AttendanceList (parallel-04), admin/audit (step-08), members list paging

### 4.4 G9-4: Icon size convention

```tsx
// Icon.tsx
export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  size: "sm" | "md" | "lg" | "xl";
  name: IconName;
}

export function Icon({ size, name, ...props }: IconProps) {
  const sizeMap = { sm: "12px", md: "16px", lg: "20px", xl: "24px" };
  return <span {...props} style={{ fontSize: sizeMap[size], ...props.style }} />;
}
```

**サイズ規約:**
- sm 12px: button inline, table compact
- md 16px: sidebar nav, header
- lg 20px: stat card, feature icon
- xl 24px: page hero, modal title

### 4.5 G9-5: Breadcrumb（admin 深い階層）

```tsx
// components/admin/Breadcrumb.tsx
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: ReadonlyArray<BreadcrumbItem>;
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb">
      <ol data-component="breadcrumb">
        {items.map((item, i) => (
          <li key={i}>
            {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
            {i < items.length - 1 && <span>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

**CSS:**
```css
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

[data-component="breadcrumb"] span {
  color: var(--ubm-color-text-secondary);
}
```

**用途:** /admin/members/[id], /admin/identity-conflicts/[id], admin drawer/modal deep nesting

### 4.6 G9-6: Mobile responsive contract

**Breakpoints (Tailwind default):**
```css
@media (max-width: 639px) {
  /* sm: mobile */
}

@media (min-width: 640px) and (max-width: 767px) {
  /* md: tablet */
}

@media (min-width: 768px) and (max-width: 1023px) {
  /* lg: small desktop */
}

@media (min-width: 1024px) {
  /* xl: desktop */
}
```

**Component-level rules:**
- Admin sidebar: drawer collapse (hidden sm, flex md+)
- Members list grid: 1col sm / 2col md / 3col lg
- Form: stacked sm / two-column md+
- Admin form: full width sm / max-w-2xl md+

### 4.7 G9-7: focus-visible 統一

**既存 globals.css ℓ98-101:**
```css
:focus-visible {
  outline: 2px solid var(--ubm-color-accent);
  outline-offset: 2px;
}
```

**追加: motion-reduce 対応**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

@layer components {
  :focus-visible {
    transition: outline 0ms;
  }
}
```

**適用対象:** button, a, input, [tabindex] (自動継承で OK)

### 4.8 G9-8: Concurrent mutation guard

**useAdminMutation hook 実装:**
```tsx
export function useAdminMutation<T, E>(
  mutationFn: (data: T) => Promise<any>,
  onSuccess?: (data: any) => void,
  onError?: (error: E) => void
) {
  const [isLoading, setIsLoading] = React.useState(false);
  
  const mutate = React.useCallback(async (data: T) => {
    if (isLoading) {
      toast({ type: "warn", message: "既に保存中です" });
      return;
    }
    setIsLoading(true);
    try {
      const result = await mutationFn(data);
      onSuccess?.(result);
    } catch (error) {
      onError?.(error as E);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, mutationFn, onSuccess, onError]);
  
  return { mutate, isLoading };
}
```

**ルール:**
- button に `disabled={isLoading}` を付与
- 同一 endpoint への 2nd call は reject + toast "既に保存中です"
- mutation 중: cursor: not-allowed, opacity: 0.6

### 4.9 G9-9: Form state preserve on error

**要件:**
- mutation 失敗時に form state (input.value) をリセットしない
- error toast + form field error helper text を同時表示
- form.reset() は user action 経由でのみ（例: "저장되었습니다" toast 후 수동)

**useAdminMutation 補強:**
```tsx
const handleSubmit = async (formData: FormData) => {
  try {
    await mutate(formData);
    toast({ type: "success", message: "저장되었습니다" });
    form.reset(); // user がこの時点で reset したければ
  } catch (error) {
    // form state はそのまま
    toast({ type: "error", message: error.message });
    // field error を个別に set
    form.setFieldError("name", error.details.name);
  }
};
```

## 5. 関数・型シグネチャ

```tsx
// FormField.tsx
export interface FormFieldProps {
  name: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ name, label, error, children }: FormFieldProps) {
  const errorId = `${name}-error`;
  return (
    <div data-component="form-field">
      <label htmlFor={name}>{label}</label>
      {/* React.cloneElement で children に aria-invalid/aria-describedby を注入 */}
      {error && <span id={errorId} data-component="form-error">{error}</span>}
    </div>
  );
}

// Icon.tsx
export type IconSize = "sm" | "md" | "lg" | "xl";
export function Icon({ size, name }: { size: IconSize; name: IconName }): JSX.Element;

// Pagination.tsx
export interface PaginationProps {
  current: number;
  total?: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
}

// Breadcrumb.tsx
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: ReadonlyArray<BreadcrumbItem> }): JSX.Element;

// useAdminMutation.ts
export function useAdminMutation<T, E>(
  mutationFn: (data: T) => Promise<any>,
  onSuccess?: (data: any) => void,
  onError?: (error: E) => void
): { mutate: (data: T) => Promise<void>; isLoading: boolean };
```

## 6. 入出力・副作用

- **FormField.tsx**: DOM 생성 + aria-invalid 속성 주입
- **Icon.tsx**: CSS font-size 변경 (DOM 구조 변경 없음)
- **Pagination.tsx**: button disabled 상태 변경
- **Breadcrumb.tsx**: nav + ol 구조 생성
- **useAdminMutation.ts**: mutation 상태 관리 + toast 트리거
- **globals.css**: CSS layer 추가 (visual only)

## 7. テスト方針

- **Vitest + Testing Library**
  - FormField: aria-invalid, aria-describedby 속성 검증
  - Pagination: hasNext/hasPrev 상태에 따른 button disabled 검증
  - Breadcrumb: items 수만큼 li 렌더링 검증
  - Icon: size prop에 따른 font-size 검증
  - useAdminMutation: isLoading 중복 호출 거부, error 케이스 toast 검증

- **Playwright (visual)**
  - FormField error state: border color, helper text 표시
  - Icon sizes: 12px/16px/20px/24px 시각 확인
  - Breadcrumb: separator "/" 표시, href 링크 동작
  - focus-visible: all interactive element에 2px outline 표시
  - Pagination: disabled button 투명도 0.5

- **a11y (jest-axe / axe-core)**
  - FormField: aria-invalid + aria-describedby 조합 위반 0
  - Breadcrumb: nav aria-label 존재 확인
  - Icon: aria-hidden 적절히 설정된 경우만 검증
  - 모든 button/input: :focus-visible 접근성 위반 0

## 8. ローカル実行・検証コマンド

```bash
# Type check + lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# Unit tests
mise exec -- pnpm --filter @ubm-hyogo/web test

# a11y tests with jest-axe
mise exec -- pnpm --filter @ubm-hyogo/web test:a11y

# Visual regression (Playwright)
mise exec -- pnpm --filter @ubm-hyogo/web test:visual

# Verify no HEX hardcoding
grep -rEn 'bg-\[#|text-\[#|border-\[#|focus:\[#' apps/web/src && echo "HEX 直書き (NG)" || echo "OK"

# CSS @layer validation
grep -n "@layer components" apps/web/src/styles/globals.css
```

## 9. DoD

- [ ] FormField.tsx 작성 + label, input, error 구조 검증
- [ ] Icon.tsx 작성 + 4가지 size 렌더링 확인
- [ ] Pagination.tsx 작성 + prev/next button disabled 상태 동작
- [ ] Breadcrumb.tsx 작성 + breadcrumb trail 렌더링
- [ ] globals.css @layer components 추가 (G9-1/6/7)
- [ ] useAdminMutation.ts 수정 + 동시 호출 거부, error 후 form state 보존 검증
- [ ] focus-visible outline 모든 interactive element에 표시
- [ ] motion-reduce media query 추가
- [ ] 기존 Vitest / Playwright smoke 통과
- [ ] axe a11y violations 0 유지
- [ ] HEX 직서기 0건 확인
- [ ] parallel-03과 merge conflict 없음 (@layer components 동시 편집 주의)

## 10. リスク・制約

| リスク | 対策 |
|--------|------|
| @layer components 동시 편집 (parallel-03과) | 두 spec의 CSS 규칙을 명확히 분리 (G3-1..3 vs G9-1..9), merge conflict 발생 시 @layer 내 순서 조정 |
| OKLch token 재확인 필요 | tokens.css의 --ubm-color-*, --ubm-spacing-*, --ubm-text-* 정본으로 사용, HEX 직서기 금지 |
| Icon.tsx 기존 icons.ts와 충돌 | Icon.tsx는 size convention wrapper, IconName은 icons.ts에서 import |
| form state preserve 후 user가 수동 reset 요청 | button 추가 ("초기화" / "다시 작성") 또는 form.reset() 명시적 호출 경로 제공 |
| Breadcrumb href 없는 마지막 항목 (현재 페이지) | href 없으면 <span> 렌더링, aria-current="page" 추가 검토 |
| Pagination total 미제공 시 (cursor-only) | total이 undefined면 "1-20 of ?" 표시 또는 생략 (백엔드 API response에 따름) |

---

**변경이력**
- 2026-05-15 신규 작성 (parallel-09-ux-cross-cutting)
