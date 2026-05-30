# Phase 6 — テスト拡充

## 1. fail-path / 回帰 guard 追加

### 1.1 `resolveAuthView.spec.ts` 追加

| TC | 内容 | 期待 |
|----|------|------|
| TC-RAV-05 | `undefined` session | guest |
| TC-RAV-06 | `{ user: null }` | guest |
| TC-RAV-07 | `{ user: { memberId: null } }` | guest |
| TC-RAV-08 | `{ user: { memberId: "m1", isAdmin: false } }` | member（admin 扱いしない） |
| TC-RAV-09 | `{ user: { memberId: "m1", isAdmin: null } }` | member |

### 1.2 `PublicHeader.spec.tsx` 追加

| TC | 内容 | 期待 |
|----|------|------|
| TC-PH-03 | member authView | `member-cta` + sign-out、`/login` 不存在 |
| TC-PH-04 | admin authView | `member-cta` + `admin-cta`、`/login` 不存在 |
| TC-PH-05 | currentPath | 対象 nav link に `aria-current="page"` |
| TC-PH-06 | guest authView | `auth-cta` 1 件、member/admin CTA 不存在 |
| TC-PH-07 | admin authView で `/login` link 不存在 | `queryByRole("link", { name: "ログイン" })` → null |
| TC-PH-08 | HEX 直書き回帰チェック（snapshot ではなく `data-auth-state` 列挙テスト） | 値は `guest\|member\|admin` のみ |

### 1.3 `getAuthView` 補助テスト（NON_VISUAL）

新規 `apps/web/src/lib/auth-view/__tests__/getAuthView.spec.ts`:

| TC | 内容 | 期待 |
|----|------|------|
| TC-GAV-01 | `getAuth().auth()` が throw | `{ kind: "guest" }` |
| TC-GAV-02 | `getAuth().auth()` が null 返す | `{ kind: "guest" }` |
| TC-GAV-03 | `getAuth().auth()` が member session 返す | `{ kind: "member", profileHref: "/profile" }` |
| TC-GAV-04 | admin session を返す | `{ kind: "admin", profileHref: "/profile", adminHref: "/admin" }` |

実装方針: `vi.mock("@/src/auth", () => ({ getAuth: () => ({ auth: vi.fn() }) }))` でモック化。

## 2. 追加テスト件数

| ファイル | 既存 | 追加 | 合計 |
|---------|------|------|------|
| resolveAuthView.spec.ts | 4 | 5 | 9 |
| PublicHeader.spec.tsx | 2 | 6 | 8 |
| getAuthView.spec.ts | 0 | 4 | 4 |
| PublicLayout.spec.tsx | 0 | 3 | 3 |
| **合計** | **10** | **14** | **24** |

## 3. 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/auth-view/__tests__/resolveAuthView.spec.ts \
  src/lib/auth-view/__tests__/getAuthView.spec.ts \
  src/components/public/__tests__/PublicHeader.spec.tsx \
  app/'(public)'/layout.spec.tsx
```

## 4. 完了条件

- [ ] 24 ケース全 PASS
- [ ] artifacts.json の `test_files` リスト同期
