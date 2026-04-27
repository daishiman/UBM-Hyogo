# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 4（テスト戦略） |
| 次 Phase | 6（異常系検証） |
| 状態 | pending |

## 目的

Phase 3 で採用した案 A（router → use-case → repository → view、leak 二重チェック）を、後続実装タスクが順番通りに迷わず実装できる粒度の runbook + 擬似コード placeholder に落とす。本タスクは spec_created なので実コードは書かず、step / placeholder / sanity check の 3 点で実装範囲を固定する。

## Runbook

### Step 1: 公開フィルタ helper を最初に実装

1. `apps/api/src/_shared/public-filter.ts` を作成
2. `buildPublicWhere()` で `s.public_consent = 'consented' AND s.publish_state = 'public' AND s.is_deleted = 0` を 1 箇所で生成
3. SQL 文字列ではなく prepared parameter object を返し、repository が消費する形にする
4. helper を import せずに where を直書きする箇所が出ないよう、eslint rule（後続 wave）で禁止候補にする
5. 不変条件 #2（`publicConsent` キー統一）と #11（admin-managed 分離）を helper の docstring に明記

### Step 2: search query parser を実装

1. `apps/api/src/_shared/search-query-parser.ts` を作成
2. `q / zone / status / tag (repeated) / sort / density / page / limit` を zod safeParse
3. 不正値は黙って default に fallback（zone=`'all'` / status=`'all'` / sort=`'recent'` / density=`'medium'` / page=1 / limit=24）
4. `limit` 上限 100 で clamp（400 を返さない、運用優先）
5. `tag` repeated は `tags: string[]` に正規化、空配列なら filter 不適用

### Step 3: pagination helper を実装

1. `apps/api/src/_shared/pagination.ts` を作成
2. `buildPaginationMeta({ total, page, limit })` で `{ total, page, limit, totalPages, hasNext, hasPrev }` を返す
3. limit clamp 結果と total を view で利用

### Step 4: visibility filter helper を実装

1. `apps/api/src/_shared/visibility-filter.ts` を作成
2. `keepPublicFields(fields, schemaQuestions)` で `field.visibility !== 'public'` を除外
3. 不変条件 #1（schema 固定禁止）に従い、判定は `schema_questions.visibility` を参照（コードに enum 直書きしない）

### Step 5: view-models を実装（leak 二重チェック）

1. `apps/api/src/view-models/public/public-stats-view.ts`: KPI（公開メンバー数 / zone 別 / 今年のミーティング数 / 直近 5 件 / lastSync 状態）を組成
2. `apps/api/src/view-models/public/public-member-list-view.ts`: items に変換、`responseEmail` / `rulesConsent` / `adminNotes` を runtime delete + zod parse
3. `apps/api/src/view-models/public/public-member-profile-view.ts`: `Omit<MemberProfile, 'responseEmail' | 'rulesConsent' | 'adminNotes'>` 型 + visibility filter
4. `apps/api/src/view-models/public/form-preview-view.ts`: `schema_questions` から sections / fields を組み立て、`responderUrl` を同梱
5. すべて 01b の zod schema で `parse`（`safeParse` ではなく）し、leak があれば 500 で fail close

### Step 6: use-cases を実装

1. `apps/api/src/use-cases/public/get-public-stats.ts`: 02a/02b repository → view
2. `apps/api/src/use-cases/public/list-public-members.ts`: parser → repository（公開フィルタ + tag AND subquery）→ view
3. `apps/api/src/use-cases/public/get-public-member-profile.ts`: 公開フィルタ EXISTS チェック → 0 件なら 404 throw、適格なら repository → view
4. `apps/api/src/use-cases/public/get-form-preview.ts`: schema repository → view、`responderUrl` は env または 01-api-schema.md の固定値

### Step 7: handlers を実装（4 endpoint）

1. `apps/api/src/routes/public/stats.ts`: `GET /public/stats` → use-case → 200 JSON、Cache-Control: `public, max-age=60`
2. `apps/api/src/routes/public/members.ts`: `GET /public/members` → parser → use-case → 200、Cache-Control: `no-store`（管理者操作の即時反映）
3. `apps/api/src/routes/public/member-profile.ts`: `GET /public/members/:memberId` → use-case → 200 / 404、Cache-Control: `no-store`
4. `apps/api/src/routes/public/form-preview.ts`: `GET /public/form-preview` → use-case → 200、Cache-Control: `public, max-age=60`、ETag は Phase 9 で再評価

### Step 8: router マウント

1. `apps/api/src/routes/public/index.ts` で 4 handler を集約し、`app.route('/public', publicRouter)`
2. session middleware は本 `/public/*` には適用しない（不変条件 #5 / 公開境界）
3. `app.onError` で `{ code, message?, issues? }` を 04b/04c と統一

### Step 9: test 走らせる

1. `pnpm --filter api test` で unit + contract + leak + authz + search を一括実行
2. leak suite が独立して green になることを確認（Phase 4 の 7 ケース）
3. 全 pass するまで Phase 6 に進まない

## 擬似コード

```ts
// apps/api/src/_shared/public-filter.ts (placeholder)
// 不変条件 #2 (publicConsent キー), #11 (admin-managed 分離) を 1 箇所で表現
export type PublicWhereParams = { publicConsent: 'consented'; publishState: 'public'; isDeleted: 0 }
export const buildPublicWhereParams = (): PublicWhereParams => ({
  publicConsent: 'consented',
  publishState: 'public',
  isDeleted: 0,
})

// apps/api/src/_shared/search-query-parser.ts (placeholder)
export const parsePublicMemberQuery = (raw: URLSearchParams): ParsedPublicMemberQuery => {
  const result = PublicMemberQuerySchema.safeParse({
    q: raw.get('q') ?? '',
    zone: raw.get('zone') ?? 'all',
    status: raw.get('status') ?? 'all',
    tags: raw.getAll('tag'),
    sort: raw.get('sort') ?? 'recent',
    density: raw.get('density') ?? 'medium',
    page: Number(raw.get('page') ?? 1),
    limit: Math.min(Number(raw.get('limit') ?? 24), 100), // AC-11 clamp
  })
  return result.success ? result.data : DEFAULT_PUBLIC_MEMBER_QUERY
}

// apps/api/src/use-cases/public/get-public-member-profile.ts (placeholder)
export const getPublicMemberProfile = async (memberId: string, deps: Deps) => {
  const exists = await deps.membersRepository.existsPublic(memberId, buildPublicWhereParams())
  if (!exists) throw new NotFoundError('NOT_FOUND') // 不変条件 #11: 403 ではなく 404 で存在を隠す (AC-4)
  const member = await deps.membersRepository.findByIdPublic(memberId)
  const response = await deps.responsesRepository.findByResponseId(member.currentResponseId)
  const fields = await deps.responseFieldsRepository.findByResponseId(response.responseId)
  const schema = await deps.schemaQuestionsRepository.list()
  return toPublicMemberProfile({ member, response, fields, schema }) // converter で leak 二重チェック
}

// apps/api/src/view-models/public/public-member-profile-view.ts (placeholder)
export const toPublicMemberProfile = (src: ProfileSource): PublicMemberProfile => {
  const safe = {
    ...src.member,
    sections: buildSections(src.fields, src.schema).map(sec => ({
      ...sec,
      fields: sec.fields.filter(f => f.visibility === 'public'), // AC-3 / 不変条件 #1
    })),
  }
  delete (safe as Record<string, unknown>).responseEmail   // 不変条件 #3
  delete (safe as Record<string, unknown>).rulesConsent    // 不変条件 #2
  delete (safe as Record<string, unknown>).adminNotes      // 不変条件 #11
  return PublicMemberProfileSchema.parse(safe) // fail close
}

// apps/api/src/routes/public/member-profile.ts (placeholder)
export const getPublicMemberProfileHandler: Handler = async (c) => {
  const memberId = c.req.param('memberId')
  const profile = await getPublicMemberProfile(memberId, c.var.deps)
  c.header('Cache-Control', 'no-store')
  return c.json(profile, 200)
}
```

## Sanity check

- [ ] `/public/*` 配下の handler に session middleware が適用されていない（AC-9 / 不変条件 #5 公開境界）
- [ ] view-models 4 ファイルすべてで `responseEmail` / `rulesConsent` / `adminNotes` を runtime delete している（不変条件 #3 / #2 / #11）
- [ ] `public-filter` を import せずに where を直書きしている route が 0 件
- [ ] `:memberId` を取り出すのは `routes/public/member-profile.ts` のみ、他 route が `c.req.param('memberId')` を呼ばない
- [ ] write 系（INSERT / UPDATE / DELETE）の SQL が本タスク由来のコードに 0 件（不変条件 #10 無料枠 / read only）
- [ ] form-preview の field 数 / section 数を enum として直書きせず、`schema_questions` の row count から導出（不変条件 #1 / #14）

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | endpoint flow |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | view model 型 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | query parser |
| 必須 | outputs/phase-02/main.md | module 配置 |
| 必須 | outputs/phase-04/test-matrix.md | test 連動 step |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | テーブル定義 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook 各 step の異常系を洗う |
| Phase 7 | AC × runbook step の trace |
| Phase 8 | helper 共通化を Wave 4 内で評価 |
| 04b / 04c | `app.onError` / エラー型 / `consumeAuthSession`（04a は consume せず） を共通化 |

## 多角的チェック観点（不変条件マッピング）

- #1（schema 固定禁止）— form-preview を `schema_questions` 動的構築（Step 4 / Step 5-4）
- #2（consent キー統一）— `buildPublicWhereParams` で 1 箇所表現（Step 1）
- #3（`responseEmail` system field）— view converter で delete + zod parse（Step 5）
- #5（apps/web → D1 直禁止）— D1 access は本 API の repository 経由のみ（Step 6）
- #10（無料枠）— 全 endpoint GET、write 0、Cache-Control 戦略を Step 7 に明示
- #11（admin-managed 分離）— `adminNotes` を converter で delete、404 で存在を隠す（Step 6 / Step 7）
- #14（schema 集約）— form-preview は schema sync output を反映（Step 4 / Step 5-4）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 9 step 確定 | 5 | pending | outputs/phase-05/api-runbook.md |
| 2 | 擬似コード 4 endpoint + 4 helper | 5 | pending | outputs/phase-05/pseudocode.md |
| 3 | sanity check 6 項目 | 5 | pending | チェックリスト |
| 4 | apps/api/src 配置確認 | 5 | pending | path レベルで一意 |
| 5 | Cache-Control 方針確定 | 5 | pending | stats / form-preview のみ 60s、others は no-store |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | Phase 5 主成果物 |
| ドキュメント | outputs/phase-05/api-runbook.md | 9 step 詳細 |
| ドキュメント | outputs/phase-05/pseudocode.md | 4 endpoint + 4 helper placeholder |
| メタ | artifacts.json | Phase 5 を `completed` に更新 |

## 完了条件

- [ ] 9 step が順序付きで記述されている
- [ ] 4 endpoint × 4 helper の擬似コードが配置されている
- [ ] Sanity check 6 項目が pass する設計
- [ ] 上流 02a / 02b / 03b / 01b の helper / 関数名が runbook 内に登場
- [ ] Cache-Control の方針が endpoint ごとに明示

## タスク100%実行確認【必須】

- [ ] サブタスク 5 件すべて completed
- [ ] 全成果物配置済み
- [ ] sanity check 6 項目すべてが擬似コードと整合
- [ ] artifacts.json の Phase 5 を `completed` に更新

## 次 Phase

- 次: 6（異常系検証）
- 引き継ぎ事項: runbook の各 step に対し失敗系シナリオ（不正 query / 不適格 / sync 未完 / D1 障害 等）を洗い出す
- ブロック条件: 擬似コードに write 系 SQL が紛れている、または `responseEmail` を返している場合は次 Phase に進まない
