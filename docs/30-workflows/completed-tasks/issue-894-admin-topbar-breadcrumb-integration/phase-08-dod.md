# Phase 8: Definition of Done

## 1. Overview

Issue #894 §6（受け入れ条件）に基づき、本タスクの DoD を具体化する。

## 2. Acceptance Criteria

| # | 内容 | 検証方法 |
|---|------|----------|
| AC-1 | breadcrumb 責務所有権が確定し canonical workflow に明記されている（topbar=ルートトップ静的 / AdminPageHeader=ページ内現在地） | `phase-02-architecture.md` §2 を参照 |
| AC-2 | topbar の breadcrumb slot が固定テキスト直書きではなく既存 `Breadcrumb` primitive 経由 | `(admin)/layout.tsx` 差分 + layout.spec.tsx 追記 assertion |
| AC-3 | 「管理」ラベルが topbar と AdminPageHeader で二重表示されない | `grep -rn 'label: "管理"' "apps/web/app/(admin)/admin/"` → 0 件 |
| AC-4 | 新規 primitive を追加していない | `git diff` で `apps/web/src/components/` 配下に新規ファイルなし |
| AC-5 | `(admin)/layout.spec.tsx` の data-* 契約が pass（`data-shell="topbar"` / `data-component="admin-breadcrumb-slot"` 両維持 + `data-component="breadcrumb"` 新規 assertion） | vitest pass log |
| AC-6 | `(admin)/layout.tsx` に `usePathname` / `"use client"` を持ち込んでおらず server component のまま | `head -1 apps/web/app/(admin)/layout.tsx` で `"use client"` なし確認 |
| AC-7 | `pnpm typecheck` / `pnpm lint` 0 error / 0 warning | コマンド実行ログ |
| AC-8 | axe critical violation 0 | layout.spec.tsx の axe assertion pass |
| AC-9 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない | `git diff` 上で `#[0-9a-fA-F]{3,6}` / `bg-\[#` / `text-\[#` の追加 0 件 |
| AC-10 | API endpoint・D1 schema・Google Form 仕様の変更なし | `git diff` 上で `apps/api/` / migrations / google-form 配下に差分なし |

## 3. 非 DoD（明示）

- AdminPageHeader 未導入 page への AdminPageHeader 導入は本タスク対象外
- AdminTopbar `actions` slot の具体ボタン実装は対象外
- design token の改変は対象外

## 4. ユーザー明示承認 (user_gated)

以下はユーザー明示承認後にのみ実行する:

- `git commit`
- `git push`
- `gh pr create`
