---
phase: 6
title: テスト方針 — layout 単体 spec + middleware regression
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 6 — テスト方針

[実装区分: 実装仕様書]

## 1. テストピラミッド

| 層 | 範囲 | ツール |
|----|------|--------|
| 1. layout 単体 | data-* 契約 / render snapshot / axe | Vitest + React Testing Library + jest-axe |
| 2. middleware regression | 既存 `apps/web/middleware.spec.ts` の維持確認 | Vitest（既存） |
| 3. visual regression | AppShell chrome がトークン経由で描画される | Playwright（serial-07 の責務） |

本サブワークフローは **1 と 2** を担う。3 は serial-07 へ委譲。

## 2. layout 単体 spec の正本

### 2.1 共通方針

- 新規 spec は `*.spec.tsx` で作成（`*.test.tsx` 禁止）
- 配置: 編集対象 layout と同じディレクトリの隣に `layout.spec.tsx` を置く
- Server Component は **関数を直接呼び出して** JSX を取得し `render(tree)` する（async layout は `await` する）
- 外部依存（`getSession`）は `vi.mock` で stub

### 2.2 Public layout spec

`apps/web/app/(public)/layout.spec.tsx`

検証項目:
- [ ] `data-testid="public-shell"` が存在
- [ ] `[data-theme="warm"]` が wrapper に付与
- [ ] `[data-route-group="public"]` が wrapper に付与
- [ ] `[data-shell="topbar"]` 要素が存在
- [ ] `[data-shell="footer"]` 要素が存在
- [ ] `<main data-route="public">` 要素が存在
- [ ] children が `<main>` 内に render される
- [ ] axe-core で critical 違反 0

### 2.3 Admin layout spec

`apps/web/app/(admin)/layout.spec.tsx`

検証項目:
- [ ] `getSession` mock: `null` → `redirect("/login?next=/admin")` 呼び出し
- [ ] `getSession` mock: `{ isAdmin: false }` → `redirect("/login?gate=forbidden")` 呼び出し
- [ ] `getSession` mock: `{ isAdmin: true }` → render 成功
- [ ] `data-testid="admin-shell"` / `[data-theme="cool"]` / `[data-route-group="admin"]` が wrapper に付与
- [ ] `[data-shell="sidebar"]` / `[data-shell="topbar"]` / `[data-route="admin"]` 全て存在
- [ ] children が `<main>` 内に render される
- [ ] axe-core critical 違反 0

mock 例:
```ts
vi.mock("../../src/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }) }));
```

### 2.4 Member layout spec

`apps/web/app/(member)/layout.spec.tsx`

検証項目:
- [ ] `data-testid="member-shell"` / `[data-theme="warm"]` / `[data-route-group="member"]` が wrapper に付与
- [ ] `[data-shell="topbar"]` 要素が存在
- [ ] `<main data-route="member">` 要素が存在
- [ ] children が `<main>` 内に render される
- [ ] axe-core critical 違反 0

## 3. middleware regression

- 既存 `apps/web/middleware.spec.ts` を変更しない
- 本サブワークフローで middleware ロジックを触らないため、CI 上で既存 spec が継続して green であれば OK
- 新規 middleware spec は追加しない

## 4. 既存 spec の干渉確認

| 既存 spec | 影響可能性 | 対応 |
|-----------|----------|------|
| `apps/web/middleware.spec.ts` | なし（middleware 未変更） | 継続実行 |
| `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx`（存在する場合） | なし（primitive 未変更） | 継続実行 |
| `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx`（存在する場合） | なし | 継続実行 |
| `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx`（存在する場合） | なし | 継続実行 |

## 5. テスト実行コマンド

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4

# 3 layout spec のみ
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(public)/layout.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(admin)/layout.spec.tsx"
mise exec -- pnpm --filter @ubm-hyogo/web test -- "app/(member)/layout.spec.tsx"

# web app 全 spec（regression 含む）
mise exec -- pnpm --filter @ubm-hyogo/web test
```

## 6. カバレッジ目標

- 3 layout の関数カバレッジ 100%
- 分岐カバレッジ: Admin layout の `!session` / `!session.isAdmin` / authorized の 3 分岐をすべて踏む
- coverage-guard hook の `--changed` モードで fail しないこと

## 7. axe-core 違反の取扱い

- critical / serious は 0 を必須
- moderate は許容（既存 primitive 側の改善で対応）
- 違反検出時は **layout 側で `aria-label` を補う**（primitive を改変しない）
