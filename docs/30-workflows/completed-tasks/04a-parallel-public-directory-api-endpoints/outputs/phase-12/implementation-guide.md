# Implementation Guide — 04a Public Directory API Endpoints

## 1. 概要

`apps/api` (Cloudflare Workers + Hono) に未認証で叩ける 4 つの公開 endpoint を実装した。

| endpoint | 用途 | Cache-Control |
| --- | --- | --- |
| `GET /public/stats` | KPI / zone / meetings / lastSync | `public, max-age=60` |
| `GET /public/members` | 検索 + pagination | `no-store` |
| `GET /public/members/:memberId` | 公開プロフィール | `no-store` |
| `GET /public/form-preview` | schema_questions の動的プレビュー | `public, max-age=60` |

## 2. ディレクトリ構成

```
apps/api/src/
  _shared/
    public-filter.ts          # 公開フィルタ条件（SQL bind と converter 二重チェック）
    pagination.ts             # PaginationMeta 算出
    search-query-parser.ts    # q/zone/status/tag/sort/density/page/limit
    visibility-filter.ts      # schema_questions.visibility に基づく field filter
    __tests__/                # unit tests
  repository/
    publicMembers.ts          # 公開フィルタ込みの list/count/exists/aggregate
  view-models/public/
    public-stats-view.ts
    public-member-list-view.ts
    public-member-profile-view.ts
    form-preview-view.ts
    __tests__/                # converter unit tests
  use-cases/public/
    get-public-stats.ts
    list-public-members.ts
    get-public-member-profile.ts
    get-form-preview.ts
  routes/public/
    index.ts                  # createPublicRouter() — session middleware 非適用
    stats.ts
    members.ts
    member-profile.ts
    form-preview.ts
```

`index.ts` で `app.route("/public", createPublicRouter())` を `/public/healthz` 直後に mount。

## 3. leak 防御の 6 層

1. SQL where (`buildPublicWhereParams`)
2. Repository EXISTS check (`existsPublicMember` → `UBM-1404`)
3. Converter status 二重チェック (`isPublicStatus`)
4. Visibility filter (`keepPublicFields`)
5. Runtime delete (`FORBIDDEN_KEYS = ['responseEmail','rulesConsent','adminNotes']`)
6. Zod `.strict()` parse fail close

leak が疑われる schema 変更を行う場合、まず `_shared/public-filter.ts` を更新すること。

## 4. AC 充足

詳細: `outputs/phase-07/ac-matrix.md`。

## 5. 不変条件 trace

詳細: `outputs/phase-09/main.md`。

## 6. テスト戦略

- unit (`_shared/__tests__/`, `view-models/public/__tests__/`) — converter / parser / pagination / visibility の結線確認 + leak リグレッション。
- contract / integration (miniflare) は本タスク範囲外（Phase 10 で 06a に移送）。

## 7. 既知の制約と TODO

- `apps/web` 側の query parser 重複実装は 06a で `packages/shared` 配置を検討。
- `/public/members/:id` の KV cache 化は traffic 増（>3k/day）の閾値到達時。

## 8. 動作確認手順

`outputs/phase-11/manual-evidence.md` の 7 ステップに従う。
