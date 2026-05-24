# Phase 8: ユニット・コンポーネントテスト仕様

**[実装区分: 実装仕様書]**

Vitest + React Testing Library 前提。新規 test ファイル名は CLAUDE.md 不変条件 #8 に従い `*.spec.{ts,tsx}` のみ。

## 1. 追加・編集する spec ファイル

| パス | 種別 | 主目的 |
|------|------|--------|
| `apps/web/app/login/_components/__tests__/LoginShell.spec.tsx` | 新規 | auth-shell wrapper 構造 |
| `apps/web/app/login/_components/__tests__/OrDivider.spec.tsx` | 新規 | separator role + OR text + a11y |
| `apps/web/app/login/_components/__tests__/LoginCard.spec.tsx` | 新規 or 編集 | brand-mark "兵" / 2 段タイトル / h1 / data-state |
| `apps/web/app/login/_components/__tests__/LoginPanel.spec.tsx` | 新規 or 編集 | input state DOM 順序 |
| `apps/web/app/login/_components/MagicLinkForm.component.spec.tsx` | 編集 | primary / send icon / 文言 / cooldown 維持 |
| `apps/web/app/login/_components/__tests__/GoogleOAuthButton.spec.tsx` | 新規 | ghost / google icon / busy |
| `apps/web/app/login/_components/__tests__/LoginStatus.spec.tsx` | 新規 or 編集 | sent state inbox icon block / 戻る button |

実在 spec の有無は Phase 5 Step 0 で `find apps/web/app/login -name "*.spec.*"` を実行して再確認。既存があれば編集、無ければ新規。

## 2. テストケース表

### 2.1 `LoginShell.spec.tsx`

| ケース | Arrange | Act | Assert |
|--------|---------|-----|--------|
| children を描画する | `<LoginShell><span data-testid="child"/></LoginShell>` | render | `getByTestId("child")` が存在 |
| auth-shell class を持つ | 上記 | render | 親要素が `class="auth-shell"` |

### 2.2 `OrDivider.spec.tsx`

| ケース | Assert |
|--------|--------|
| role="separator" 要素が存在する | `getByRole("separator")` |
| aria-label="または" を持つ | `getByLabelText("または")` |
| "OR" テキストを表示 | `getByText("OR")` |
| line span 2 本が aria-hidden | `container.querySelectorAll('[aria-hidden="true"]').length === 2` |

### 2.3 `LoginCard.spec.tsx`

| ケース | Arrange | Assert |
|--------|---------|--------|
| brand-mark "兵" を表示 | state=input / title="..." で render | `getByText("兵")` |
| 2 段タイトル jp + en | 上記 | `getByText("UBM兵庫支部会")` と `getByText("Member Portal")` 両方 |
| h1 にタイトル | title="会員ログイン" | `getByRole("heading", { level: 1, name: "会員ログイン" })` |
| subtitle が省略可能 | subtitle なしで render | description `<p>` が存在しない |
| data-state 属性反映 | state="sent" | `container.querySelector('[data-state="sent"]')` 存在 |

### 2.4 `LoginPanel.spec.tsx`

| ケース | Arrange | Assert |
|--------|---------|--------|
| input state の DOM 順序 | state="input" redirect="/" | querySelectorAll の順序が `form` → `[role="separator"]` → `button[type="button"]`（OAuth）→ `p.login-register-cta` |
| gate=admin_required で warning Banner 表示 | state="input" gate="admin_required" | `getByText("管理者権限が必要です")` |
| error クエリで danger Banner 表示 | state="input" error="送信失敗" | `getByText("送信失敗")` かつ tone=danger 相当 |
| input 以外で LoginStatus に委譲 | state="sent" | LoginStatus DOM (data-panel="sent") が存在 |

### 2.5 `MagicLinkForm.component.spec.tsx` (編集)

既存テスト維持＋以下追加 / 変更:

| ケース | Assert |
|--------|--------|
| Button が primary variant で render | button が `data-variant="primary"` または `class*="primary"` |
| Button が size=lg / block | `data-size="lg"` / `class*="block"` |
| send icon が描画される | `getByTestId("icon-send")` または `svg[data-icon="send"]` |
| label が "マジックリンクを送る" | `getByRole("button", { name: /マジックリンクを送る/ })` |
| cooldown 中 label が "${n}s 後に再送可能" | (既存テスト維持) |
| email 空で submit ボタン disabled | (既存テスト維持) |

### 2.6 `GoogleOAuthButton.spec.tsx`

| ケース | Assert |
|--------|--------|
| ghost variant | button が `data-variant="ghost"` |
| google icon 描画 | `svg[data-icon="google"]` |
| label "Googleでログイン" (半角スペース無し) | `getByRole("button", { name: "Googleでログイン" })` |
| busy 中 disabled + loading 表示 | onClick 後 button が disabled |

### 2.7 `LoginStatus.spec.tsx`

| ケース | Arrange | Assert |
|--------|---------|--------|
| sent state で inbox icon block | state="sent" email="a@b.com" | `.login-status-icon` 要素存在、内部に `svg[data-icon="inbox"]` |
| email が `<strong>` で強調 | 上記 | `getByText("a@b.com").tagName === "STRONG"` |
| 戻る button が arrow-left icon | sent | `svg[data-icon="arrow-left"]` |

## 3. 実行コマンド

```bash
# 全 UI ユニット
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/app/login

# 個別
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/app/login/_components/__tests__/LoginShell.spec.tsx
```

期待: `Tests`  XX passed, `0` failed, `0` skipped (`it.todo` 残留禁止 — skill quality-gates §7.3)。

## 4. カバレッジ保護

- 既存 `MagicLinkForm.component.spec.tsx` の cooldown / submit / error 系は保持し、Button props 変更で実装側 ID 名が変わる場合のみ selector を更新
- Component 単位の line coverage は既存比 -5% 以内
- 全体 lines coverage ≥ 80% を維持（skill quality-gates §7.5）

## 5. Mock 方針

- `magic-link-client.ts` の `sendMagicLink` は vi.mock で stub（既存テストパターン踏襲）
- `oauth-client.ts` の `signInWithGoogle` も vi.mock
- `useRouter` は `vi.mock("next/navigation", ...)` で `refresh / push` を stub
- D1・実 API は触らない（CLAUDE.md 不変条件 #5）

## 6. DoD

- [ ] §1 の全 spec ファイルが存在
- [ ] §2 のすべてのケースが pass
- [ ] todo / skip 0 件
- [ ] `pnpm --filter @ubm-hyogo/web test` exit 0
- [ ] 既存テスト regression 0 件
