# Phase 1 — 要件定義

[実装区分: 実装仕様書]

## 1. 目的

`/admin/members` を **プロトタイプ正本** (`docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L162-366) と視覚言語整合させ、staging 404 fetch failure を復旧する。

## 2. ユースケース

| UC | 主体 | 操作 | 期待結果 |
| --- | --- | --- | --- |
| UC-1 | 管理者 | `/admin/members` を開く | 認証済セッション cookie で 200 が返り、会員一覧（avatar + name + email + 状態 chip + 公開 Switch + lastSubmittedAt + edit icon）が描画される |
| UC-2 | 管理者 | 検索 box に "山田" を入力して blur | URL `?q=山田` に同期し、一覧が絞り込み再 fetch される |
| UC-3 | 管理者 | 状態フィルタの "公開中" pill を選択 | URL `?filter=published` に同期し、一覧が絞り込み再 fetch される |
| UC-4 | 管理者 | 行をクリック | Drawer が開き、当該会員の詳細（VISIBILITY / TAGS / FORM RESPONSE / DELETED）が表示される |
| UC-5 | 管理者 | Drawer の公開 Switch を切替 | `PATCH /admin/members/:id/status` が呼ばれ、楽観更新 + 成功 toast。失敗時は rollback + error toast |
| UC-6 | 管理者 | Drawer の "退会処理（論理削除）" を押下 | 確認 dialog 後 `POST /admin/members/:id/delete` が呼ばれ、行が "退会" chip 表示に切替わる |
| UC-7 | 管理者 | 退会済み行の Drawer で "復元する" を押下 | `POST /admin/members/:id/delete` の復元 endpoint or 同等経路で復元 |
| UC-8 | 管理者 | fetch 失敗時 | `AdminSectionErrorClient` の retry CTA で再 fetch（既存挙動継続） |

## 3. 受入基準（AC）

- **AC-1**: `/admin/members` の **page-head** が prototype の `page-head + eyebrow + h-page + p.muted + btn-row` 構造と DOM/style 等価。eyebrow テキストは `"ADMIN / MEMBERS"`、h1 は `"メンバー管理"`、description は `"回答データ・公開フラグ・タグ付けをここから操作します。"`
- **AC-2**: FilterCard が prototype の grid（検索 + pill-nav 状態 + 件数 small）レイアウトと整合。pill-nav 値は `all|public|private|deleted` の 4 つで、サーバ側 filter enum `""|"published"|"hidden"|"deleted"` にマップされる
- **AC-3**: MembersTable の列順は **avatar(40px) / メンバー(name+occupation 派生 placeholder) / メール / 区画-ステータス chip 列 / タグ / 最終更新 / 公開(140px) / edit(60px)**。`zone` / `tags` / `occupation` が list response に不足する列は `—` プレースホルダ + tooltip "drawer で確認" を表示
- **AC-4**: 行クリックで Drawer が開き、prototype の4セクション構成（VISIBILITY card-flat / TAGS card-flat / FORM RESPONSE KVList / DELETED card-flat）が描画される
- **AC-5**: table / Drawer 共通の公開 Switch primitive が `useAdminMutation` 経由で `PATCH /admin/members/:id/status` を呼ぶ。失敗時は switch が元の値に戻り error toast
- **AC-6**: Drawer の "退会処理（論理削除）" が `confirm()` 経由（または `Dialog`）で `POST /admin/members/:id/delete` を呼ぶ
- **AC-7**: HEX 直書き 0 件。`bg-[#...]` / `text-[#...]` / `border-[#...]` 0 件（`verify-design-tokens` PASS）
- **AC-8**: 全 admin form input は `FormField` 経由（CLAUDE.md #9）
- **AC-9**: staging cookie で `/admin/members` の HTTP status が 200。`ADMIN_FETCH_404` が出ない（auth 失敗時は 401 が返る健全な分岐になる）
- **AC-10**: Playwright `admin-members-visual.spec.ts` が 4 viewport（mobile-portrait 390×844 / tablet 834×1112 / laptop 1280×800 / desktop 1440×900）× 4 state（loaded / empty / error / drawer-open）で baseline PNG を生成する
- **AC-11**: a11y: keyboard で行 → Drawer 開閉 → Switch 切替 → 閉じる、までフォーカストラップが効く。`jest-axe` で 0 violation
- **AC-12**: `pnpm typecheck` / `pnpm lint` / `pnpm build` / `pnpm --filter @ubm-hyogo/web test` 全 PASS

## 4. 404 根因の仮説（Phase 5 Lane A で 1 つに絞る）

| 仮説 | 根拠 | 検証方法 |
| --- | --- | --- |
| H1: `INTERNAL_API_BASE_URL` が staging で誤値（または `/api` prefix の有無不一致） | `apps/web/src/lib/admin/server-fetch.ts` の `resolveApiBase()` が trailing slash のみ整流 | `wrangler tail --env staging` で実 fetch URL を確認 |
| H2: `requireAdmin` middleware が unauth 時に 401 ではなく Hono notFound 経路へ落ちて 404 を返す | `apps/api/src/index.ts` の app.notFound 配線、`requireAdmin` の throw 経路 | staging に未認証 / 失効済 cookie で curl して response status を観測 |
| H3: admin route mount path の二重 prefix（`/admin/members` ではなく `/api/admin/members` を期待しているなど） | `apps/api/src/index.ts` の `app.route("/admin", ...)` 配線 | wrangler tail で実 path 観測 |

仮説の優先度: H2 > H1 > H3（一覧描画が成立しているが fetch だけ 404 → 認証境界の確率が高い）。

## 5. 不変条件（再掲）

index.md 「不変条件」セクション 1〜10 を準拠。本 Phase で追加する固有不変条件はなし。

## 6. スコープ確認

index.md 「スコープ内 / 外」と一致。スコープ外項目（list response への zone/tags/occupation/hue 追加、tag chip の list 表示、Drawer タグ pill の write 永続化、avatar 画像、新規 endpoint）は **本サイクル完了の妨げにならず、UX 上「drawer で確認」「未保存表示」で完結する** ため CONST_007 の「分割禁止」原則と矛盾しない。

## 7. 外部依存・前提

- staging deploy に必要な Cloudflare Secrets / Vars は親 workflow で投入済
- `useAdminMutation` hook、`AdminSectionErrorClient`、`AdminPageHeader`、`FormField` が既存
- `tokens.css` の OKLch token が充足（`--ubm-color-danger-soft` を含む）
