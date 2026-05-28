# admin-tag-queue-ui-and-404-recovery

[実装区分: 実装仕様書]

`/admin/tags`（タグキュー画面）のプロトタイプ整合と、staging 上で `GET /admin/tags/queue` が `ADMIN_FETCH_404` を返す事象の根本対応を 1 PR サイクルで完遂する。

## 背景

staging URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/tags`

現状の症状:

- ページ全体が `AdminSectionErrorClient` に置き換わり、`admin api /admin/tags/queue failed: 404` / `code ADMIN_FETCH_404` が表示される。
- 期待される UI（プロトタイプ `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` の `AdminTagsPage` ＝ page-head + grid-2 + 未タグキュー + 右ペイン editor）が描画されない。
- 既存 `apps/web/app/(admin)/admin/tags/page.tsx` / `apps/web/src/components/admin/TagQueuePanel.tsx` は最小限の `<button>` / `<ul>` で組まれており、token / primitives / chip / avatar / sticky 等プロトタイプ規約に未整合。

## スコープ

含む:

- API `GET /admin/tags/queue` 404 の根本原因切り分けと、エラーコード細分化（401 / 403 / 404 / 5xx を Web 層で識別）
- `/admin/tags` のプロトタイプ整合（page-head / grid-2 / sticky 右ペイン / avatar / chip / empty-state / divider / TAGGED 補足セクション）
- `AdminSectionErrorClient` 経由のエラー表示を、原因コード別に runtime trace 付きで残す
- staging 上での視認 evidence（Phase 11 screenshots）

含まない:

- D1 schema 変更 / Google Form 仕様変更 / 新規 API endpoint 追加（不変条件 #1, #5）
- `POST /admin/tags/queue/:queueId/resolve` 内部ロジック変更（接続のみ・既存 contract を維持）
- 認証経路（Auth.js / Magic Link）自体の変更

## 不変条件

1. `apps/web` から D1 直接アクセス禁止（既存 invariant #5）
2. 色は `apps/web/src/styles/tokens.css` の OKLch token のみ。HEX / `bg-[#xxx]` 直書き禁止
3. `apps/web/app/(admin)/admin/tags/page.tsx` は Server Component を維持（`force-dynamic`）し、客クライアント分割は最小限に保つ
4. 既存 `TagQueuePanel` の状態遷移 contract（filter / focusMemberId / drawer）を破壊しない
5. `apps/api` のルート mount / middleware 構成を変更しない（root cause は env / cookie / fetch path の側で対処）
6. 既存 `*.spec.{ts,tsx}` の green を維持する

## 正本順位（衝突時の優先度）

1. 本 workflow の Phase 1-3 設計書
2. `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` の `AdminTagsPage` 実装
3. `docs/00-getting-started-manual/specs/*.md`
4. 既存 `apps/web/src/components/admin/TagQueuePanel.tsx`

## タスク表

| タスク | 区分 | 概要 | 主担当 |
|--------|------|------|--------|
| [task-A](tasks/task-A-api-404-root-cause-and-diagnostics.md) | 実装 | `/admin/tags/queue` 404 の根本原因切り分け（cookie / AUTH_SECRET / INTERNAL_API_BASE_URL）＋ Web 層のエラー細分化 | apps/web + apps/api |
| [task-B](tasks/task-B-tags-page-prototype-alignment.md) | 実装 | `/admin/tags` プロトタイプ整合（page-head / grid-2 / sticky 右ペイン / chip / avatar） | apps/web |
| [task-C](tasks/task-C-staging-visual-and-runtime-evidence.md) | 実装 | staging visual smoke spec + Phase 11 evidence 取得 | apps/web/playwright |

3 タスクは **1 PR サイクル**で完遂する（CONST_007）。task-A → task-B → task-C は実装順に直列、ただし設計レベルでは並列可能。

## 想定 PR 範囲

- `apps/web/app/(admin)/admin/tags/page.tsx`（Server Component / エラー分岐強化）
- `apps/web/src/components/admin/TagQueuePanel.tsx`（プロトタイプ整合 / chip / avatar / sticky）
- `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx`（追加ケース）
- `apps/web/src/lib/admin/server-fetch.ts` または `apps/web/src/lib/server-fetch/safe-fetch.ts`（エラー細分化）
- `apps/web/playwright/tests/visual-staging-authenticated/admin-tags-authenticated.spec.ts`（新規 visual smoke）
- `apps/api/src/middleware/require-admin.ts`（401/403 維持。debug log のみ追加可。挙動変更なし）
- `outputs/phase-11/`（screenshots / runtime evidence）
- `outputs/phase-12/implementation-guide.md`
