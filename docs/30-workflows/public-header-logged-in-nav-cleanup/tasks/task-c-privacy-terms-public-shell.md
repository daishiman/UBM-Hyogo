# Task C — `/privacy`, `/terms` を公開シェルに統一

**[実装区分: 実装仕様書]**

## 1. 目的

`/privacy`, `/terms` は現状ヘッダ / フッタを一切 mount していない（page.tsx 内で `<main>` 直書き）。公開系ナビゲーションが消失しており、ユーザーがホームや会員一覧に戻る導線がない。Task A の PublicHeader async 化に併せ、両ページを公開シェル（`<PublicHeader authView />` + `<PublicFooter />`）でラップする。

## 2. 変更対象ファイル

| # | パス | 種別 |
|---|------|------|
| 1 | `apps/web/app/privacy/page.tsx` | 編集（async 化 + shell ラップ） |
| 2 | `apps/web/app/terms/page.tsx` | 編集（同上） |
| 3 | `apps/web/app/privacy/__tests__/page.spec.tsx` | 新規 or 編集 |
| 4 | `apps/web/app/terms/__tests__/page.spec.tsx` | 新規 or 編集 |

> `(public)` route group への移動は不採用（Phase 2 案 X）。最小差分で各 `page.tsx` に shell を直接 mount する。

## 3. 編集内容（privacy / terms 共通パターン）

```tsx
import { PublicHeader } from "../../src/components/public/PublicHeader";
import { PublicFooter } from "../../src/components/public/PublicFooter";
import { getAuthView } from "../../src/lib/auth-view";

export default async function PrivacyPage() {
  const authView = await getAuthView();
  return (
    <div
      className="grid min-h-screen grid-rows-[auto_1fr_auto] bg-[var(--ubm-color-surface-bg)] text-[var(--ubm-color-text-primary)]"
      data-theme="warm"
      data-route-group="public"
      data-testid="public-shell"
    >
      <header data-shell="topbar"><PublicHeader authView={authView} /></header>
      <main data-page="privacy" data-route="public" data-section-rhythm="comfortable">
        <LegalProse>
          {/* 既存内容そのまま */}
        </LegalProse>
      </main>
      <footer data-shell="footer"><PublicFooter /></footer>
    </div>
  );
}
```

terms も同パターン（`data-page="terms"` のみ変更）。

## 4. 既存 metadata の保持

両ファイルの `export const metadata: Metadata = { title: ..., description: ... }` は変更しない。

## 5. テスト方針

各 page spec で:

1. レンダー後 `data-testid="public-shell"` を確認（shell が適用されている）
2. `data-component="public-header"` が含まれる
3. `data-component="public-footer"` 系（既存 PublicFooter の root 属性に合わせる）が含まれる
4. 既存 `<h1>プライバシーポリシー</h1>` / `<h1>利用規約</h1>` テキストが描画される

`getAuthView` は `vi.mock` で `{ kind: "guest" }` 固定。

## 6. ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  app/privacy/__tests__/page.spec.tsx \
  app/terms/__tests__/page.spec.tsx
```

## 7. DoD

- [ ] `/privacy` / `/terms` で `<PublicHeader />` + `<PublicFooter />` がレンダーされる
- [ ] `data-auth-state` が session 状態に応じて切替
- [ ] 既存 metadata（title/description）が変わらない
- [ ] LegalProse 配下の本文テキストが変わらない（法務確認済み暫定版を温存）
- [ ] typecheck / lint / vitest green

## 8. 依存

- **前提**: Task A 完了
- **並列**: Task B / D / E / F と並列実装可
