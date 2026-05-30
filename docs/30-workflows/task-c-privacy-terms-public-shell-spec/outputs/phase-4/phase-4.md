# Phase 4 — テスト作成

## 1. テスト戦略

vitest + React Testing Library で `apps/web/app/{privacy,terms}/page.tsx` の SSR 出力を assert。`getAuthView` は `vi.mock` で固定 stub を返す。

## 2. 追加 spec ファイル

| パス | 種別 | 目的 |
|------|------|------|
| `apps/web/app/privacy/__tests__/page.spec.tsx` | 新規 | shell 構造 / header / footer / h1 / metadata 固定 |
| `apps/web/app/terms/__tests__/page.spec.tsx` | 新規 | 同上（terms 用） |

## 3. ケース一覧

### `apps/web/app/privacy/__tests__/page.spec.tsx`

| ID | ケース名 | 入力 | 期待 |
|----|---------|------|------|
| C1-guest | renders public shell for guest | `getAuthView` → `{ kind: "guest" }` | `data-testid="public-shell"` 存在、`data-component="public-header"` 存在、`data-auth-state="guest"` |
| C1-member | renders public shell for member | `getAuthView` → `{ kind: "member", ... }` | `data-auth-state="member"`、`data-role="member-cta"` |
| C1-admin | renders public shell for admin | `getAuthView` → `{ kind: "admin", ... }` | `data-auth-state="admin"`、`data-role="admin-cta"` |
| C1-footer | footer mounted | guest | `data-component="public-footer"`（PublicFooter root 属性に合わせる） |
| C1-h1 | h1 preserved | guest | `screen.getByRole("heading", { level: 1, name: "プライバシーポリシー" })` |
| C1-route | data attrs | guest | `data-route-group="public"` / `data-theme="warm"` / `data-page="privacy"` |
| C1-metadata | metadata exported | — | `import { metadata }` の `title` / `description` が現状値と完全一致 |

### `apps/web/app/terms/__tests__/page.spec.tsx`

C1-guest / C1-member / C1-admin / C1-footer / C1-route と同パターン、ただし:

- C1-h1: `name: "利用規約"`
- C1-route: `data-page="terms"`
- C1-metadata: `title: "利用規約 | UBM 兵庫支部会"`, `description: "UBM 兵庫支部会の利用規約"`

## 4. mock 方針

```ts
vi.mock("../../../src/lib/auth-view", () => ({
  getAuthView: vi.fn(),
}));

import { getAuthView } from "../../../src/lib/auth-view";

beforeEach(() => {
  vi.mocked(getAuthView).mockResolvedValue({ kind: "guest" });
});
```

各ケースで `mockResolvedValue` を上書きして state を切替。`PublicHeader` / `PublicFooter` 実体はそのまま render（mock しない）。

## 5. レンダリング方式

Server Component は async のため、render 補助:

```ts
const ui = await PrivacyPage();
render(ui);
```

（既存 `apps/web/app/(member)/profile/page.spec.tsx` パターンに準拠）

## 6. metadata assertion

```ts
import { metadata } from "../page";
expect(metadata.title).toBe("プライバシーポリシー | UBM 兵庫支部会");
expect(metadata.description).toBe("UBM 兵庫支部会のプライバシーポリシー");
```
