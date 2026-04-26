# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | pending |

## 目的

5 画面の component ツリー、data fetch path、mutation flow、admin gate の middleware 配置、エラー / 空状態 UI を設計し、Phase 5 の実装ランブックの土台を提供する。

## 実行タスク

1. 5 画面の component 階層と client/server 境界を確定（完了条件: Mermaid 図）
2. data fetch を Server Component で行うか Client + SWR で行うかを決める（完了条件: dependency matrix 表）
3. admin layout（AdminSidebar + admin gate redirect）の middleware 設計（完了条件: middleware.ts の擬似コード）
4. mutation 後の再 fetch パターンを 5 画面ごとに定義（完了条件: revalidatePath / mutate キー一覧）
5. ESLint rule で D1 直接 import を禁止する設計（完了条件: rule 名と対象パターン）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | URL とページ責務 |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | 管理 UX 原則 |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 操作権限と UI 原則 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | Drawer / Switch / Modal / TagQueuePanel ほか |
| 必須 | outputs/phase-01/main.md | scope 表と AC quantitative |

## 実行手順

### ステップ 1: 構成図と画面別 component
- 5 画面ごとに `page.tsx → ServerComponent → ClientShell → Drawer/Panel` の階層を Mermaid で `outputs/phase-02/admin-pages-design.md` に描く
- AdminSidebar は `apps/web/src/components/layout/AdminSidebar.tsx`、共通 layout は `apps/web/src/app/admin/layout.tsx`

### ステップ 2: data flow と mutation
- `GET /admin/dashboard` は `app/admin/page.tsx` の Server Component で fetch、no-store
- `GET /admin/members` 一覧は Server Component、ドロワー詳細は Client + SWR で `useAdminMember(memberId)`
- mutation は `apps/web/src/lib/admin/api.ts` に `patchMemberStatus`, `postMemberNote`, `resolveTagQueue` 等を集約

### ステップ 3: admin gate
- `apps/web/src/app/admin/layout.tsx` で `auth()` を呼び、`session?.user?.adminFlag !== true` なら `redirect('/login?next=/admin')`
- middleware.ts は配置しない（layout.tsx で完結、Edge runtime コスト削減）

### ステップ 4: ESLint rule
- `eslint-plugin-import` の `no-restricted-imports` で `apps/web` から `@repo/api/*`, `wrangler`, `cloudflare:*`, `**/repository/**` を ban

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビューで alternative 評価 |
| Phase 4 | component / data flow を test 戦略へ |
| Phase 5 | 擬似コード作成の入力 |
| Phase 8 | DRY 化対象の特定 |

## 多角的チェック観点

| 不変条件 | チェック | 理由 |
| --- | --- | --- |
| #5 | ESLint rule で D1 直接 import を error に | apps/web から D1 アクセス禁止 |
| #11 | ドロワー内に profile 本文編集 form の component がない | 本人本文の管理者編集を防ぐ |
| #13 | TagQueuePanel が `/admin/tags` でのみ render される | tag 直接編集禁止 |
| #14 | SchemaDiffPanel が `/admin/schema` でのみ render される | schema 集約 |
| #15 | MeetingPanel の attendance Combobox に `members.filter(m => !m.isDeleted)` を強制 | 削除済み除外 |
| 認可境界 | layout.tsx の admin gate が全 `/admin/*` をカバー | 未認証 redirect |
| 無料枠 | dashboard 1 fetch、一覧は Server Component で hydration cost 最小化 | Workers 100k 内 |
| a11y | Drawer に `role="dialog"` + `aria-labelledby` を強制 | スクリーンリーダー対応 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 5 画面 component 階層 Mermaid | 2 | pending | outputs/phase-02/admin-pages-design.md |
| 2 | data fetch / mutation 表 | 2 | pending | dependency matrix |
| 3 | admin gate 設計 | 2 | pending | layout.tsx 擬似コード |
| 4 | ESLint rule 設計 | 2 | pending | no-restricted-imports |
| 5 | 環境変数表 | 2 | pending | secret 一覧 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | Phase 2 サマリー |
| ドキュメント | outputs/phase-02/admin-pages-design.md | Mermaid + component 表 + data flow |
| メタ | artifacts.json | Phase 2 を completed |

## 完了条件

- [ ] 5 画面の component 階層が Mermaid で記載
- [ ] data fetch / mutation の表が完成
- [ ] admin gate 擬似コードが記載
- [ ] ESLint rule の対象パターンが列挙
- [ ] 環境変数表（既存 secrets の使用箇所）

## タスク100%実行確認

- 全成果物が outputs/phase-02 配下に配置
- Mermaid の構文 valid
- 不変条件 7 件すべてに「設計上の防御策」が紐付く
- artifacts.json で phase 2 を completed に更新

## 次 Phase

- 次: 3 (設計レビュー)
- 引き継ぎ: 設計図 + dependency matrix を alternative 評価へ
- ブロック条件: Mermaid と data flow 表が未完成なら次へ進めない

## 構成図 (Mermaid)

```mermaid
graph TD
  L[app/admin/layout.tsx<br/>admin gate + AdminSidebar] --> D[/admin page.tsx<br/>Dashboard KPI]
  L --> M[/admin/members page.tsx<br/>List + MemberDrawer]
  L --> T[/admin/tags page.tsx<br/>TagQueuePanel]
  L --> S[/admin/schema page.tsx<br/>SchemaDiffPanel]
  L --> Mt[/admin/meetings page.tsx<br/>MeetingPanel]

  D -->|GET /admin/dashboard| API[apps/api Hono]
  M -->|GET /admin/members| API
  M -->|GET /admin/members/:id| API
  M -->|PATCH /admin/members/:id/status| API
  M -->|POST/PATCH .../notes| API
  T -->|GET /admin/tags/queue| API
  T -->|POST /admin/tags/queue/:queueId/resolve| API
  S -->|GET /admin/schema/diff| API
  S -->|POST /admin/schema/aliases| API
  Mt -->|GET/POST /admin/meetings| API
  Mt -->|POST/DELETE .../attendance| API

  API -->|D1 binding| DB[(D1)]

  L -.session check.-> AUTH[Auth.js<br/>05a admin gate]
```

## 環境変数一覧

| 区分 | 代表値 | 置き場所 | 利用箇所 |
| --- | --- | --- | --- |
| Auth.js | AUTH_SECRET | Cloudflare Secrets | layout.tsx の `auth()` |
| Google OAuth | GOOGLE_CLIENT_ID | Cloudflare Secrets | session 確立 |
| Google OAuth | GOOGLE_CLIENT_SECRET | Cloudflare Secrets | session 確立 |

## 設定値表

| 項目 | 方針 | 根拠 |
| --- | --- | --- |
| 画面 routing | App Router の `app/admin/*` セグメント | Next.js 標準 |
| data fetch | dashboard と list は Server Component / 詳細は Client + SWR | hydration cost 最小化 |
| mutation | client から `lib/admin/api.ts` 経由で fetch、成功後 `mutate` か `router.refresh()` | URL を正本にする |
| admin gate | layout.tsx 内で `auth()` + adminFlag check | middleware を回避 |

## 依存マトリクス

| 種別 | 対象 | 役割 |
| --- | --- | --- |
| 上流 | 04c admin API | 全 endpoint |
| 上流 | 05a admin gate | session.adminFlag |
| 上流 | 05b AuthGateState | 未認証 redirect |
| 上流 | 00 UI primitives | Drawer / Switch / Modal / Toast |
| 下流 | 07a tag workflow | TagQueuePanel から resolve POST |
| 下流 | 07b schema workflow | SchemaDiffPanel から aliases POST |
| 下流 | 07c attendance / audit | MeetingPanel から POST/DELETE |

## Module 設計

| module | path | 責務 |
| --- | --- | --- |
| AdminSidebar | apps/web/src/components/layout/AdminSidebar.tsx | dashboard / members / tags / schema / meetings へのナビ |
| MemberDrawer | apps/web/src/components/admin/MemberDrawer.tsx | 詳細 + status switch + notes + tags 導線 |
| TagQueuePanel | apps/web/src/components/admin/TagQueuePanel.tsx | 左 queue + 右 review |
| SchemaDiffPanel | apps/web/src/components/admin/SchemaDiffPanel.tsx | added/changed/removed/unresolved の 4 ペイン |
| MeetingPanel | apps/web/src/components/admin/MeetingPanel.tsx | 開催日追加 + attendance 編集 |
| adminApi | apps/web/src/lib/admin/api.ts | mutation 関数集約 |
