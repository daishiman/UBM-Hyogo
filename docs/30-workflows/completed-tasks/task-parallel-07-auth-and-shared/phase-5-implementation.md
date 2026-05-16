# Phase 5: 実装

> Phase: 5 / 13
> 名称: 実装
> implementation_mode: `implementation`

---

## 5.1 変更対象ファイル一覧

| # | パス | 種別 | 主要 diff 方針 |
|---|------|------|---------------|
| F1 | `apps/web/app/login/error.tsx` | 編集 | Card layout 化 / focus 管理 / OKLch クラスへ置換 |
| F2 | `apps/web/app/login/loading.tsx` | **新規** | OKLch skeleton + role=status |
| F3 | `apps/web/app/error.tsx` | 編集 | `headingRef` 追加 + `useEffect` focus |
| F4 | `apps/web/app/loading.tsx` | 検証 + 必要に応じ最小差分 | OKLch / motion-safe / role の完全性確認 |
| F5 | `apps/web/app/profile/loading.tsx` | 編集 | skeleton 統一（avatar + name + kv） |
| F6 | `apps/web/app/not-found.tsx` | 検証のみ | 変更なし。verification log 記録 |

---

## 5.2 事前確認 (M1 / M2 解消)

Phase 3 MINOR 指摘の解消:

1. `Card` の export 形と `header` 配置可否を `apps/web/src/components/ui/Card.tsx` で確認
2. token utility class の正式名を既存実装で確認し、CTA は `bg-accent text-panel`、skeleton は `bg-surface-2`、error text は `text-danger` に寄せる
3. 既存 token クラスに合わせて Phase 2 雛形を最終調整

---

## 5.3 関数 / 型シグネチャ

```ts
// apps/web/app/login/error.tsx
type LoginErrorProps = { error: Error & { digest?: string }; reset: () => void };
export default function LoginError(props: LoginErrorProps): React.ReactNode;

// apps/web/app/login/loading.tsx
export default function LoginLoading(): React.ReactNode;

// apps/web/app/error.tsx
type GlobalErrorProps = { error: Error & { digest?: string }; reset: () => void };
export default function GlobalError(props: GlobalErrorProps): React.ReactNode;

// apps/web/app/profile/loading.tsx
export default function ProfileLoading(): React.ReactNode;
```

---

## 5.4 import path

| import | from |
|--------|------|
| `Card`, `CardContent` | `@/components/ui/Card`（path alias が `apps/web/src/components/...` を指す前提。alias 未設定なら相対 path） |
| `useEffect`, `useRef` | `react` |

path alias `@/*` が tsconfig で未定義の場合は `../../src/components/ui/Card`（login/error から）などの相対 path で書く。

---

## 5.5 実装手順（red → green）

### Step 1: spec 骨格作成

Phase 4 の 4 ユニット spec + 1 E2E spec ファイルを **失敗する状態** で先に作成する。

```bash
# spec 骨格 (.spec.tsx) を作成し、red を確認
mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/app/login/__tests__/login-error.component.spec.tsx
```

### Step 2: F2（login/loading.tsx）新規作成

最も独立性が高いため最初に実装し、U7〜U11 を green に。

### Step 3: F1（login/error.tsx）編集

Card layout を適用、`useRef` + `useEffect` で focus。U1〜U6 を green に。

### Step 4: F5（profile/loading.tsx）編集

skeleton を統一。U16〜U19 を green に。

### Step 5: F3（root error.tsx）編集

既存構造を維持しつつ `headingRef` + `useEffect` を追加。U12〜U15 を green に。

### Step 6: F4（root loading.tsx）検証

`grep -nE '#[0-9a-fA-F]{3,8}' apps/web/app/loading.tsx` で HEX 検出 0 を確認。`motion-safe:` / `role="status"` / `aria-busy="true"` / `aria-live` の有無を grep で確認し、不足があれば最小差分で補完。

### Step 7: F6（not-found.tsx）検証

同 grep で HEX 0 と OKLch クラスの利用を確認。変更不要なら implementation-notes に「差分なし」と記録。

### Step 8: E2E spec を green に

`apps/web/playwright/tests/auth-and-shared.spec.ts` のシナリオ E1〜E5 を Playwright で実行し pass を確認。

---

## 5.6 エラーハンドリング

- `LoginError` / root `GlobalError` の `useEffect` は `error` を deps に取り、`console.error` を 1 回だけ呼ぶ
- `reset` 関数の throw は Next.js が上位 error boundary で捕捉する想定（本実装で握り潰さない）

---

## 5.7 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/app/login/__tests__/login-error.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/app/__tests__/error.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web test -- apps/web/app/profile/__tests__/profile-loading.component.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/tests/auth-and-shared.spec.ts
```

すべて exit 0 を確認後、Phase 6 へ進む。

---

## 5.8 完了判定

- 4 ファイル（F1/F2/F3/F5）の編集・新規が完了
- 2 ファイル（F4/F6）の検証ログ記録
- ユニット 19 ケース + E2E 5 シナリオすべて green
- typecheck / lint clean

---

## 次フェーズへの引き継ぎ

Phase 6 ではエッジケース（`error.digest` 不在 / focus が既に他要素にある / prefers-reduced-motion）を追加テストとして拡充する。
