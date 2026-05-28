# Phase 1: Requirements

## ユーザー要求

> Admin のタグキュー画面（`/admin/tags`）の UI/UX が設定通りになっておらず、プロトタイプの内容と乖離している。API も `GET /admin/tags/queue` が 404 を返している。タグキューの仕様を、既存ソースとプロトタイプ（`docs/00-getting-started-manual/claude-design-prototype/`）から再構築して整える。API エラーも対応する。

## 観測事実

| 観点 | 観測内容 | ソース |
|------|---------|--------|
| URL | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/tags` | screenshot |
| 表示 | `タグキュー の読み込みに失敗しました` / `admin api /admin/tags/queue failed: 404` / `code ADMIN_FETCH_404` | screenshot |
| Network | DevTools console 上には XHR error なし。Server Component fetch のため SSR 内部で `Error` を投げ、`AdminSectionErrorClient` でレンダリング | screenshot |
| Console | `1 Issue` の表示のみ。client-side 404 ではない | screenshot |
| 認証 | Chrome 「ゲスト」プロファイル。Auth.js session cookie の状態は不明 | screenshot |

## 仕様の正本

| 領域 | ソース | 参照範囲 |
|------|--------|---------|
| UI レイアウト | `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx#L369-L505`（`AdminTagsPage`） | page-head + grid-2 + 左 queue + 右 sticky editor |
| UI primitives | `docs/00-getting-started-manual/claude-design-prototype/primitives.jsx` | `Chip` / `Avatar` / `Icon` / `Button` / 既存 admin primitives へマッピング |
| Tokens | `apps/web/src/styles/tokens.css` | OKLch color tokens（`--accent` / `--warn` / `--ok` / `--text-2` / `--text-3` 等） |
| API contract | `apps/api/src/routes/admin/tags-queue.ts` | `GET /admin/tags/queue?status=...` → `{ total, items[] }` ／ `POST /admin/tags/queue/:queueId/resolve` |
| Queue モデル | `apps/api/src/repository/tagQueue.ts` + `apps/web/src/components/admin/TagQueuePanel.tsx#L8-L23` | `TagQueueItem` / `TagQueueListView` ／ status: `queued` / `reviewing` / `resolved` / `rejected` / `dlq` |

## 機能要件

### FR-1（API 404 の根本対応）

- staging `GET /admin/tags/queue` が 404 を返す原因を切り分け、Web 層で**原因コードを区別可能**にする。
- 区別すべき原因:
  - `ADMIN_FETCH_401` — Auth.js session cookie が `apps/api` に届かない / JWT 無効
  - `ADMIN_FETCH_403` — `claims.isAdmin=false`
  - `ADMIN_FETCH_404` — API route mount 不在（≒ staging API 未デプロイ）／ `INTERNAL_API_BASE_URL` 設定誤り
  - `ADMIN_FETCH_5xx` — `AUTH_SECRET` 未設定等の auth misconfigured
- `AdminSectionErrorClient` の表示内容を、コードごとに復旧ヒントを示す形に拡張する（UI コピーのみ。動作は維持）。
- `apps/web/src/lib/admin/server-fetch.ts` 既存の `throw new Error("admin api ${path} failed: ${res.status}")` の boundary を維持しつつ、ヘッダ送出（cookie / x-internal-auth）の宣言的可視化と、`res.status === 404` のときに `INTERNAL_API_BASE_URL` を debug log（production を除く）に残す。

### FR-2（UI プロトタイプ整合）

- `/admin/tags` を次の構造に変える:
  - `page-head`（eyebrow `ADMIN / TAGS` / `h-page` / `muted` 説明 / btn-row Chip）
  - `grid-2` + 左 `card card-pad-lg`（割当キュー）+ 右 `card card-pad-lg`（メンバー詳細 + ASSIGN TAGS）
  - 右ペインは `position: sticky`（プロトタイプ `top: 20`）
  - 各キューカードは `Avatar` + 氏名 + occupation + `chevronRight`
  - 右ペイン未選択時は `EmptyState` + `Icon` で「左のキューから項目を選択してください」
- 既存 contract（status filter / focusMemberId / drawer）を保持する。プロトタイプには無いフィルタ UI だが、`status` query を保持するチップ群は維持する（admin UX 上必要）。
- プロトタイプの "TAGGED 補足セクション" は今回スコープ。`status=resolved` のアイテムを補足表示するセクションを設ける。
- すべての色は token 経由のみ（HEX 禁止）。

### FR-3（staging visual evidence）

- `apps/web/playwright/tests/visual-staging-authenticated/admin-tags-authenticated.spec.ts` を新規追加し、staging に対し 2 screen（empty / with-items）を取得する。
- evidence は `outputs/phase-11/admin-tags-{empty,items}.png` として PR 本文に参照を残す。

## 非機能要件

- a11y: 既存 `aria-labelledby="tag-queue-h"` / `aria-pressed` / `aria-label` を保持し、新規追加の `Chip` / `Avatar` も `role="img"` / `aria-label` を適切に付与。
- パフォーマンス: 既存 `force-dynamic` SSR を維持。client island は drawer 経路のみ。
- 互換性: `TagQueuePanel` の props (`initial` / `filter` / `focusMemberId`) は据え置き。

## DoD（Phase 1 完了条件）

- 機能要件 FR-1 / FR-2 / FR-3 が網羅されていること
- プロトタイプ参照範囲 / 既存 contract / 不変条件のリストが特定できていること
