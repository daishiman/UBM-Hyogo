# Phase 4 — Test Plan

## 1. テストファイル

| パス | 種別 |
|------|------|
| `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | 新規 or 編集（React Testing Library + Vitest） |
| `apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts` | 新規（純関数 unit） |

## 2. テストケース

| ID | 入力 | 期待アサーション |
|----|------|------------------|
| TC-1 | `<MemberHeader />` | `data-auth-state="member"`、`querySelector('[data-role="admin-cta"]')` = null |
| TC-2 | `<MemberHeader authView={{ kind: "member", profileHref: "/profile" }} />` | TC-1 と同等 |
| TC-3 | `<MemberHeader authView={{ kind: "admin", profileHref: "/profile", adminHref: "/admin" }} />` | `data-auth-state="admin"`、`[data-role="admin-cta"]` 存在、`href="/admin"` |
| TC-4 | TC-1〜3 全ケース | `data-testid="sign-out-button"` 要素存在 |
| TC-5 | TC-1〜3 全ケース | brand（"UBM 兵庫"）+ "マイページ" link + "公開ページ" link 存在 |
| TC-6 | TC-3 | `[data-role="admin-cta"]` の `aria-label="管理ダッシュボードへ移動"` |
| TC-7 | `resolveAuthView(null)` / empty memberId / memberId / admin | guest / member / admin に正規化 |

## 3. 静的チェック

| コマンド | 期待 |
|---------|------|
| `mise exec -- pnpm typecheck` | exit 0 |
| `mise exec -- pnpm lint` | exit 0 |
| `rg -n "#[0-9a-fA-F]{3,8}" apps/web/src/components/layout/MemberHeader.tsx` | 0 件（HEX 直書きなし） |
| `rg -n "data-auth-state=" apps/web/src/components/layout/MemberHeader.tsx` | 1 件（`isAdmin ? "admin" : "member"` 経由） |

## 4. layout 検証

`(member)/layout.tsx` は async コンポーネントになるため、既存 layout 単体テストがある場合は async 化に追随。e2e（親 workflow Task G）で `data-auth-state` を 3 状態 × `/profile` で検証する前提。本 workflow 単体では unit test のみ。

## 5. 実行コマンド（単体）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/components/layout/__tests__/MemberHeader.spec.tsx
```

実行済みコマンド:

```bash
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx
```

## 6. CI gate

- `verify-design-tokens`（既存）: HEX 直書きなしを担保
- `block-test-suffix`（既存）: `*.test.*` を禁止し `*.spec.tsx` のみ許容
