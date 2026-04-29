# API Runbook（04a 公開ディレクトリ）

## Step 1: public-filter helper
- `apps/api/src/_shared/public-filter.ts`
- `buildPublicWhereParams()` で `{ publicConsent:'consented', publishState:'public', isDeleted:0 }` を 1 箇所で生成
- SQL 文字列ではなく parameter object を返す。repository は SQL に直接埋める

## Step 2: search query parser
- `apps/api/src/_shared/search-query-parser.ts`
- 受理: `q / zone / status / tag (repeated) / sort / density / page / limit`
- 不正値 → default（`zone='all', status='all', sort='recent', density='comfy', page=1, limit=24`）
- `limit` 上限 100 で clamp（400 を返さない）

## Step 3: pagination helper
- `apps/api/src/_shared/pagination.ts`
- `buildPaginationMeta({ total, page, limit })` → `{ total, page, limit, totalPages, hasNext, hasPrev }`

## Step 4: visibility filter helper
- `apps/api/src/_shared/visibility-filter.ts`
- `keepPublicFields(fields, schemaIndex)` で `field.visibility === 'public'` のみ残す
- enum 直書き禁止（schema_questions の visibility 列を参照）

## Step 5: view-models（leak 二重チェック）
- `view-models/public/public-stats-view.ts` … KPI 集計
- `view-models/public/public-member-list-view.ts` … items 変換、forbidden keys delete + zod parse
- `view-models/public/public-member-profile-view.ts` … `Omit<MemberProfile, 'responseEmail'|'rulesConsent'|'adminNotes'>` 型 + visibility filter
- `view-models/public/form-preview-view.ts` … `schema_questions` 動的構築 + responderUrl 同梱
- 全て `Public*ViewZ.parse()`（`safeParse` ではなく fail close）

## Step 6: use-cases
- `get-public-stats.ts` … repository 呼び合成
- `list-public-members.ts` … parser → repository → view、tag AND は subquery
- `get-public-member-profile.ts` … 公開フィルタ EXISTS → 0 件 `ApiError(UBM-1404)`、適格なら repository → view
- `get-form-preview.ts` … `schema_questions` repository → view、`responderUrl` は env または fixed value

## Step 7: handlers
- `routes/public/stats.ts` → 200 JSON、`Cache-Control: public, max-age=60`
- `routes/public/members.ts` → 200 JSON、`Cache-Control: no-store`
- `routes/public/member-profile.ts` → 200 / 404、`Cache-Control: no-store`
- `routes/public/form-preview.ts` → 200 JSON、`Cache-Control: public, max-age=60`

## Step 8: router マウント
- `routes/public/index.ts` で 4 handler 集約
- `apps/api/src/index.ts` で `app.route('/public', publicRouter)`
- `/public/*` に session middleware 不適用（AC-9）

## Step 9: test 全 pass
- `pnpm --filter api test` で unit + contract + leak + authz + search を実行
- leak suite の 7 ケース全 pass まで Phase 6 に進まない

## Sanity check
- [ ] `/public/*` に session middleware なし
- [ ] view-models 4 ファイルで `responseEmail` / `rulesConsent` / `adminNotes` を runtime delete
- [ ] `public-filter` を import せずに where を直書きしている route が 0 件
- [ ] write 系 SQL が本タスク由来コードに 0 件
- [ ] form-preview の field 数 / section 数を enum 直書きしていない
- [ ] `:memberId` 取り出しは `routes/public/member-profile.ts` のみ
