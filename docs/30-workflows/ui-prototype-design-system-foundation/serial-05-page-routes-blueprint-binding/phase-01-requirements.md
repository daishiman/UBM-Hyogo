---
phase: 1
title: 要件定義 — 19 routes blueprint binding
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-05-page-routes-blueprint-binding
status: draft
depends_on:
  - parallel-01-globals-css-rhythm
  - parallel-02-prototype-css-rules-port
  - parallel-03-appshell-layouts
  - parallel-04-shared-page-chrome
---

# Phase 1 — 要件定義

[実装区分: 実装仕様書]

> **前提**: 本サブワークフロー `serial-05` は `parallel-01..04` の 4 並列サブワークフローが
> 完了している状態を**強い前提**とする。具体的には globals.css の `@layer components` 拡張、
> プロトタイプ selector 規則の移植、`(public)/(admin)/(member)` の 3 系統 AppShell layout、
> `app/layout.tsx` + `error.tsx` / `not-found.tsx` / `loading.tsx` の Root chrome が
> 揃った前提で 19 routes 全 page.tsx を 09e/f/g blueprint に bind する。

## 1. 解決する問題

`apps/web/app/` 配下の 19 routes は task-11 系で骨格が揃っているが、`docs/00-getting-started-manual/specs/09e/f/g-screen-blueprints-*.md` の blueprint section と 1:1 で照合された状態ではない。具体的には:

1. 各 page.tsx が利用する primitive / feature component の組み合わせが blueprint と乖離している箇所がある（例: 管理画面で `Card` / `KVList` / `Stat` の使い分け、register/legal の Hero / Prose 分割）
2. プロトタイプ未掲載の管理画面群（`/(admin)/admin/{schema,requests,identity-conflicts,audit}`）が既存 primitive 組み合わせのみで構成されているかが未保証
3. `(member)` route group は `layout.tsx` のみで配下に page が無い。`/profile` は既存 `app/profile/` 直下の契約を維持し、本 SW では route group 移送を行わず、root 配下で blueprint / chrome / rhythm を揃える。`login/` も **未認証 entry point** として root 配下に維持する。
4. Server Component / Client Component 境界、suspense boundary、`revalidate` 設定が route ごとに統一されていない

## 2. スコープ（19 routes 全件）

| # | Route | 既存 page.tsx の位置 | blueprint 参照 | 新規/編集 |
|---|-------|---------------------|---------------|-----------|
| 1 | `/` | `apps/web/app/page.tsx` | `09e:67-160` | 編集 |
| 2 | `/(public)/members` | `apps/web/app/(public)/members/page.tsx` | `09e:208-338` | 編集 |
| 3 | `/(public)/members/[id]` | `apps/web/app/(public)/members/[id]/page.tsx` | `09e:339-472` | 編集（serial-06 でさらに調整） |
| 4 | `/(public)/register` | `apps/web/app/(public)/register/page.tsx` | `09e:473-560` | 編集 |
| 5 | `/privacy` | `apps/web/app/privacy/page.tsx` | `09e:561-620` | 編集 |
| 6 | `/terms` | `apps/web/app/terms/page.tsx` | `09e:621-680` | 編集 |
| 7 | `/login` | `apps/web/app/login/page.tsx` | `09f:30-110` | 編集 |
| 8 | `/profile` | `apps/web/app/profile/page.tsx` | `09f:111-280` | 編集 |
| 9 | `/(admin)/admin` | `apps/web/app/(admin)/admin/page.tsx` | `09g:4-161` | 編集 |
| 10 | `/(admin)/admin/members` | `apps/web/app/(admin)/admin/members/page.tsx` | `09g:162-280` | 編集 |
| 11 | `/(admin)/admin/tags` | `apps/web/app/(admin)/admin/tags/page.tsx` | `09g:281-400` | 編集 |
| 12 | `/(admin)/admin/meetings` | `apps/web/app/(admin)/admin/meetings/page.tsx` | `09g:401-520` | 編集 |
| 13 | `/(admin)/admin/schema` | `apps/web/app/(admin)/admin/schema/page.tsx` | `09g:521-640` | 編集 |
| 14 | `/(admin)/admin/requests` | `apps/web/app/(admin)/admin/requests/page.tsx` | `09g:641-740` | 編集 |
| 15 | `/(admin)/admin/identity-conflicts` | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | `09g:741-840` | 編集 |
| 16 | `/(admin)/admin/audit` | `apps/web/app/(admin)/admin/audit/page.tsx` | `09g:841-940` | 編集 |
| 17 | `error.tsx`（root） | `apps/web/app/error.tsx` | `09h:fallback` | 編集（chrome 整合確認） |
| 18 | `not-found.tsx`（root） | `apps/web/app/not-found.tsx` | `09h:fallback` | 編集 |
| 19 | `loading.tsx`（root） | （SW-04 で新規作成 / 本 SW では参照のみ） | `09h:fallback` | 参照 |

> **注 1**: 既存の `app/(member)/layout.tsx` は children を持たない vestigial 状態。本 SW では `app/profile/` 配下一式（`page.tsx` / `error.tsx` / `loading.tsx` / `not-found.tsx` / `_components/`）を root 配下のまま編集し、`git mv` による route group 移送は行わない。`login/` も root 配下に維持する。
> **注 2**: `app/(public)/page.tsx` は存在せず `app/page.tsx`（root の `/`）が公開トップ。これは Next.js App Router の挙動として正規。
> **注 3**: `app/(admin)/admin/dashboard/attendance/page.tsx` および `app/(admin)/admin/meetings/[id]/page.tsx` は 19 routes 外だが既存実装で参照される。本 SW の DoD には含めないが、build green の確保は必要。

## 3. 機能要件

1. 19 routes 全 page.tsx が 09e/f/g blueprint の対応 section と 1:1 で照合されている
2. 各 page.tsx の主要 component 構成が phase-02 §4.2 の対応表と一致
3. Server Component を既定とし、interactivity が必要な部分のみ `.client.tsx` boundary で wrap
4. データ取得は既存 API client（`apps/web/src/lib/api/`, `apps/web/src/lib/admin/`, `apps/web/src/lib/auth/`）経由
5. 既存 feature components / primitives のみで構成。新規 primitive 追加禁止

## 4. 非機能要件（NFR）

| ID | 要件 | 検証手段 |
|----|------|---------|
| NFR-1 | OKLch トークン正本性（HEX 直書き禁止） | `verify-design-tokens` CI gate |
| NFR-2 | D1 直接アクセス禁止 | `apps/web/app/` 配下で `D1Database` / `env.DB` の grep 0 件 |
| NFR-3 | 新規 API endpoint 禁止 | `apps/api/src/routes/` の diff が空 |
| NFR-4 | 新規 primitive 禁止 | `apps/web/src/components/ui/` の追加なし |
| NFR-5 | test suffix | 新規テストは `*.spec.{ts,tsx}` のみ |
| NFR-6 | OpenNext Workers build 互換 | `next build --webpack` が green |
| NFR-7 | localhost endpoint 焼き込み禁止 | `apps/web/src/` `apps/web/app/` 配下で `127.0.0.1:8888` 0 件 |

## 5. 成功基準（Phase 1 視点 — 詳細 DoD は Phase 8）

- 19 routes 全 page.tsx が `pnpm typecheck` / `pnpm lint` / `pnpm build` で green
- 4 screens (top / members list / member detail / admin dashboard) の Playwright visual snapshot が安定取得
- 各 page.tsx の冒頭コメント `// serial-05: <route> — blueprint 09X:LLL-MMM` を埋め、blueprint 参照を機械抽出可能にする

## 6. スコープ外

- 新規 primitive / feature component の追加（SW-06 の MemberDetail だけ最小例外）
- 新規 API endpoint / D1 schema 変更
- form 再回答経路の本人更新フロー実装（MVP 仕様維持）
- (member) route group への `login` 移動（未認証 entry point として root に維持）
- visual regression baseline の固定化（SW-07 担当）

## 7. 関連参照

- `docs/30-workflows/ui-prototype-design-system-foundation/serial-00-design/phase-02-architecture.md` §4
- `docs/00-getting-started-manual/specs/09a-prototype-map.md`
- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`
- `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`
- `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
- `docs/00-getting-started-manual/specs/05-pages.md`
- `apps/web/app/*` 既存実装
