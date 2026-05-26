# Implementation Guide

## Part 1: 中学生レベル

学校の校舎に「管理棟」という大きな案内板があり、各教室の入口にも毎回「管理棟 / 1年A組」と書いてあるとします。大きな案内板がすでに場所を教えているなら、教室の入口には「1年A組」だけで十分です。今回の変更はこれと同じで、上の共通バーが「管理」を担当し、各ページは自分の名前だけを表示します。

| 用語 | 言い換え |
| --- | --- |
| breadcrumb | 今どこにいるかの道しるべ |
| topbar | 画面上の共通案内板 |
| primitive | 何度も使う小さな部品 |
| server component | サーバーで先に作る画面部品 |
| a11y | 読み上げなど誰でも使いやすくする工夫 |

## Part 2: 技術者レベル

実装内容:

- `(admin)/layout.tsx` が `Breadcrumb` を import し、`AdminTopbar` の `breadcrumb` slot に `<Breadcrumb items={[{ label: "管理" }]} />` を渡す。
- `Breadcrumb` は最終 item を current span として描画する既存契約を維持する。
- admin 配下 8 page の page-local breadcrumb から root item `{ label: "管理", href: "/admin" }` を除去する。
- `layout.spec.tsx` に topbar slot 内 primitive assertion を追加する。
- `Breadcrumb.spec.tsx` を追加し、empty items / non-final link / final current span 契約を固定する。
- Playwright authenticated admin fixture で `/admin` を撮影し、topbar slot の current label「管理」を `outputs/phase-11/screenshots/admin-dashboard-breadcrumb-desktop.png` に保存する。

変更ファイル:

- `apps/web/app/(admin)/layout.tsx`
- `apps/web/app/(admin)/layout.spec.tsx`
- `apps/web/src/components/admin/__tests__/Breadcrumb.spec.tsx`
- `apps/web/app/(admin)/admin/{page,members,requests,tags,schema,audit,identity-conflicts,meetings}/page.tsx`
- `docs/30-workflows/issue-894-admin-topbar-breadcrumb-integration/outputs/phase-11/screenshots/admin-dashboard-breadcrumb-desktop.png`

境界:

- client API (`usePathname`, `useRouter`) は使わず RSC 境界を維持。
- API / D1 / Google Form / design token は変更しない。
- commit / push / PR は user-gated。
