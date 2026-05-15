# Phase 4: テスト計画

> Phase: 4 / 13
> 名称: テスト計画
> React component / unit spec は **`.spec.tsx`** 固定（`.test.tsx` 禁止）。Playwright E2E は既存慣例に合わせ **`.spec.ts`** を許可する。

---

## 4.1 追加テストファイル一覧

| パス | 種別 | 対象 |
|------|------|------|
| `apps/web/app/login/__tests__/login-error.component.spec.tsx` | コンポーネント + jest-axe | `apps/web/app/login/error.tsx` / `apps/web/app/login/loading.tsx` |
| `apps/web/app/__tests__/error.component.spec.tsx` | コンポーネント + jest-axe | `apps/web/app/error.tsx` / `apps/web/app/loading.tsx` / `apps/web/app/not-found.tsx` |
| `apps/web/app/profile/__tests__/profile-loading.component.spec.tsx` | コンポーネント + jest-axe | `apps/web/app/profile/loading.tsx` |
| `apps/web/playwright/tests/auth-and-shared.spec.ts` | Playwright smoke | `/login` / `/profile` / root error |

> 既存 spec ファイル群に同名がないかは Phase 5 開始時に再確認する。重複時は同 spec への describe 追記で対応。

---

## 4.2 ユニットテスト（jest + jest-axe）

### login-error.component.spec.tsx

| # | describe / it | 期待値 |
|---|---------------|--------|
| U1 | renders Card layout with role="alert" | `getByRole("alert")` が解決、`data-state="error"` を持つ要素が存在 |
| U2 | focuses h1 on mount | `document.activeElement === h1` |
| U3 | shows reset button | `getByRole("button", { name: /再試行/ })` が解決 |
| U4 | invokes reset on click | `reset` モックが 1 回呼ばれる |
| U5 | renders error.digest when present | `getByText(/digest-hash/)` が解決 |
| U6 | jest-axe: 0 violations | `expect(await axe(container)).toHaveNoViolations()` |

### login loading coverage

| # | describe / it | 期待値 |
|---|---------------|--------|
| U7 | renders role="status" with aria-busy | `getByRole("status")` の `aria-busy === "true"` |
| U8 | includes sr-only loading text | `getByText("ログイン画面を読み込み中")` が解決 |
| U9 | applies motion-safe animation | クラスに `motion-safe:animate-pulse` が含まれる |
| U10 | uses bg-surface-2 only (no HEX) | innerHTML に `#` が含まれない（HEX 直書き 0） |
| U11 | jest-axe: 0 violations | toHaveNoViolations |

### error.component.spec.tsx

| # | describe / it | 期待値 |
|---|---------------|--------|
| U12 | preserves role="alert" / aria-live | 既存属性が変わらない |
| U13 | focuses h1 on mount | `document.activeElement === h1` |
| U14 | invokes reset on click | reset モックが呼ばれる |
| U15 | jest-axe: 0 violations | toHaveNoViolations |

### profile-loading.component.spec.tsx

| # | describe / it | 期待値 |
|---|---------------|--------|
| U16 | renders role="status" aria-busy | `aria-busy === "true"` |
| U17 | includes avatar / name / kv skeletons | querySelectorAll で 5 件以上の skeleton 要素 |
| U18 | uses bg-surface-2 only | HEX 直書き 0 |
| U19 | jest-axe: 0 violations | toHaveNoViolations |

---

## 4.3 E2E（Playwright smoke）

### auth-and-shared.spec.ts

| # | scenario | 期待値 |
|---|----------|--------|
| E1 | `/login` slow load → skeleton 表示 | `data-testid` ないし `role="status"` が短時間表示される |
| E2 | `/login` で error 強制発生 → h1 に focus | `page.evaluate(() => document.activeElement?.tagName)` が `H1` |
| E3 | root error 強制発生 → h1 に focus | 同上 |
| E4 | `/profile` slow load → skeleton 表示 | `role="status"` が表示 |
| E5 | light / dark テーマ切替で破綻なし | スクリーンショット差分が許容内 |

slow load の再現は Playwright の `page.route` で `/api/**` を 1.5s 遅延させる手法を採用。

---

## 4.4 a11y 共通基準

- jest-axe: violations === 0（全 unit spec）
- WCAG 2.1 4.1.3 Status Messages 適合
- prefers-reduced-motion: reduce 時に pulse 抑制（jsdom では `matchMedia` モックで検証）

---

## 4.5 視覚回帰（Phase 11 と連動）

| 画面 | テーマ | 保存先 |
|------|-------|--------|
| `/login` loading | light | `outputs/phase-11/login-loading-light.png` |
| `/login` loading | dark | `outputs/phase-11/login-loading-dark.png` |
| `/login` error | light | `outputs/phase-11/login-error-light.png` |
| `/login` error | dark | `outputs/phase-11/login-error-dark.png` |
| root error | light | `outputs/phase-11/root-error-light.png` |
| root error | dark | `outputs/phase-11/root-error-dark.png` |
| `/profile` loading | light | `outputs/phase-11/profile-loading-light.png` |
| `/profile` loading | dark | `outputs/phase-11/profile-loading-dark.png` |

---

## 4.6 カバレッジ目標

- 行・分岐: 80% 以上（Phase 7 で確認）
- 対象: `apps/web/app/login/error.tsx` / `loading.tsx`、`apps/web/app/error.tsx`、`apps/web/app/profile/loading.tsx`

---

## 次フェーズへの引き継ぎ

Phase 5 では本 test plan に従って component spec は `.spec.tsx`、Playwright spec は `.spec.ts` で先に骨格作成し、red → green の順で実装を進める。
