# parallel-07-auth-and-shared 実装仕様書

**[実装区分: 実装仕様書]** — 認証・共通システム (未カバー routes) の UX/a11y 改善

## 1. 目的

`/login`, `error.tsx`, `not-found.tsx`, `loading.tsx` の4未カバー routes について、Prototype準拠性・API連携・a11y・動線を監査し、改善が必要な箇所を実装する。

## 2. スコープ

### G7-1: `/login` route の統一 (CardLayout + StateManagement)

- `/login/error.tsx` のスタイリング改善（既: 簡素）
- `/login/loading.tsx` 新規追加（既: なし）
- Focus管理: エラー/loading 後の focus 移譲

### G7-2: `/` root loading の OKLch token 対応

- `apps/web/app/loading.tsx`: OKLch token 完全性確認
- segment-level (admin/loading, profile/loading) の skeleton 統一

### G7-3: Root error / 404 の UBM ブランディング検証

- `apps/web/app/error.tsx`: focus管理 + Card layout 検討
- `apps/web/app/not-found.tsx`: 既にOK（検証のみ）

## 3. 変更対象ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/login/error.tsx` | 編集 | Card layout 適用 + OKLch styling |
| `apps/web/app/login/loading.tsx` | 作成 | `/login` segment 専用 skeleton |
| `apps/web/app/error.tsx` | 編集 | focus管理 + Card layout 検討 |
| `apps/web/app/loading.tsx` | 検証 | OKLch token 完全性確認 |
| `apps/web/app/profile/loading.tsx` | 編集 | root loading と統一設計 |
| `apps/web/app/not-found.tsx` | 検証 | ブランディング確認（変更なし） |

## 4. 設計

### 4.1 `/login/error.tsx` の改善

**現状:** Simple main/section/button。Styling が Card layout と不統合。Focus管理なし。

**要件:**
- Card layout を適用（LoginCard 外枠の reuse または同様構造）
- OKLch token による styling（`--ubm-color-danger` warning tone）
- Focus: エラー表示直後に h1 に自動focus

**実装方針:**
```tsx
"use client";
import { useEffect, useRef } from "react";
import { Card, CardContent } from "../../../src/components/ui/Card";

export default function LoginError({ error, reset }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    console.error("[login] error", error);
    headingRef.current?.focus({ preventScroll: true });
  }, [error]);
  
  return (
    <Card data-state="error">
      <header>{/* SVG logo */}</header>
      <CardContent role="alert" aria-live="assertive">
        <h1 ref={headingRef} tabIndex={-1}>
          ログイン処理でエラーが発生しました
        </h1>
        <button onClick={() => reset()}>再試行する</button>
      </CardContent>
    </Card>
  );
}
```

### 4.2 `/login/loading.tsx` 新規作成

**要件:**
- Root loading と同じ OKLch skeleton pattern（`--ubm-color-surface-2`）
- Login card 形状に合わせた skeleton（logo + title + form）
- a11y: role="status" aria-busy="true" aria-live="polite"

**JSX:**
```tsx
export default function LoginLoading() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="mx-auto max-w-md space-y-4 px-6 py-12">
      <span className="sr-only">ログイン画面を読み込み中</span>
      <div className="h-12 w-12 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-8 w-2/3 rounded bg-surface-2 motion-safe:animate-pulse" />
      <div className="h-10 rounded bg-surface-2 motion-safe:animate-pulse" />
    </div>
  );
}
```

### 4.3 Root error.tsx の改善

**現状:** role="alert" + aria-live 既実装。Focus管理なし。

**要件:**
- Focus: h1 への自動focus（screen reader読み上げ促進）
- Digest コピー可能な code block

### 4.4 Root loading.tsx の検証

OKLch token (`--ubm-color-surface-2`) の完全性確認。既に実装済み（OK）。

### 4.5 `/profile/loading.tsx` の改善

**現状:** Issue #770 で local 実装済み。`apps/web/app/profile/loading.tsx` は `role="status"` / `aria-busy="true"` / `aria-live="polite"` / `bg-surface-2` skeleton 6 blocks に更新済み。Authenticated browser screenshot / staging runtime visual evidence は user-gated。

**要件:**
- Root loading と統一した OKLch skeleton pattern
- Profile card layout（avatar + KV pairs）

## 5. 関数・型シグネチャ

```typescript
// LoginError.tsx (既存 Props 継承)
export default function LoginError(props: LoginErrorProps): ReactNode

// LoginLoading.tsx (新規)
export default function LoginLoading(): ReactNode
```

## 6. 入出力・副作用

- エラー/loading後の自動focus（screen reader読み上げ）
- aria-live regions による動的アナウンス
- prefers-reduced-motion 尊重

## 7. テスト方針

- Component tests: LoginError/LoginLoading の render + focus確認
- A11y (jest-axe): aria-live/focus-visible/role violations 0
- E2E (Playwright): `/login` error → focus移譲 / root slow load → skeleton → data

## 8. DoD

- [ ] `/login/error.tsx` Card layout + focus管理実装
- [ ] `/login/loading.tsx` 新規作成、OKLch skeleton
- [ ] Root `error.tsx` に focus管理追加
- [x] `/profile/loading.tsx` 統一skeleton実装（Issue #770 local 実装済み、runtime visual evidence pending）
- [ ] OKLch token完全性確認、HEX直書き0
- [ ] jest-axe violations 0
- [ ] TypeCheck/ESLint clean

**CONST_005:**
- **変更対象:** セクション3参照
- **不変条件:** OKLch token のみ、API endpoint surface利用のみ、D1アクセス禁止
- **テスト:** セクション7参照

**状態:** Issue #770 により `/profile/loading.tsx` は local 実装済み。Authenticated browser screenshot / staging runtime visual evidence は user-gated のため、親 workflow 全体は引き続き runtime evidence 待ち。
