# Phase 1 主成果物 — 要件定義（04a 公開ディレクトリ API）

## 1. 真の論点（true issue）

| # | 論点 | 結論 |
| --- | --- | --- |
| T-1 | 不適格 member（declined / hidden / deleted）が response に leak しない保証 | SQL where + view converter の二重チェック |
| T-2 | `responseEmail` / `rulesConsent` / `adminNotes` 漏出 | converter で runtime delete + zod parse fail close |
| T-3 | 不適格 memberId への直アクセス | 404（403 ではない、存在示唆ゼロ） |
| T-4 | 検索 N+1 / LIKE 性能 | join 1 回 + MVP 数百規模で許容 |
| T-5 | form-preview の動的生成 | `schema_questions` 31 行 / 6 セクションを runtime で組み立て |
| T-6 | density は client side | server には届くが filter / sort には影響しない |

## 2. scope

### in
- `GET /public/stats` → `PublicStatsView`（KPI / zone 別 / 今年の支部会数 / 直近 5 件 / lastSync 状態）
- `GET /public/members` → `PublicMemberListView`（検索 q/zone/status/tag(repeated AND)/sort/density、pagination）
- `GET /public/members/:memberId` → `PublicMemberProfile`（`Omit<MemberProfile, 'responseEmail' | 'rulesConsent' | 'adminNotes'>`、FieldVisibility=public のみ）
- `GET /public/form-preview` → `FormPreviewView`（schema_questions 動的構築 + responderUrl 同梱）
- 公開フィルタ helper / search query parser / pagination / visibility-filter
- response zod schema による contract test
- leak 独立 suite（不適格 6 種）

### out
- `/me/*`（04b） / `/admin/*`（04c）
- web 側 UI（06a）
- admin による `publishState` 設定（04c）
- 同期 job（03a / 03b）
- 全文検索エンジン導入（MVP は D1 LIKE）

## 3. 上流引き渡し物（02a / 02b / 03b / 01b）

| 関数 / 型 | 提供元 | 用途 |
| --- | --- | --- |
| `findMemberById(ctx, memberId)` | 02a (`repository/members.ts`) | identity ベース取得 |
| `findCurrentResponse(ctx, memberId)` | 02a (`repository/responses.ts`) | current_response_id 解決済み回答 |
| `listFieldsByResponseId(ctx, responseId)` | 02a (`repository/responseFields.ts`) | response_fields read |
| `listSectionsByResponseId(ctx, responseId)` | 02a (`repository/responseSections.ts`) | sections read |
| `getStatus(ctx, memberId)` / `listStatusesByMemberIds` | 02a (`repository/status.ts`) | member_status snapshot |
| `listMeetings` / `listRecentMeetings` | 02b (`repository/meetings.ts`) | meeting_sessions list |
| `listTagsByMemberId` / `listTagsByMemberIds` | 02b (`repository/memberTags.ts`) | member_tags + tag_definitions JOIN |
| `listAllTagDefinitions` | 02b (`repository/tagDefinitions.ts`) | tag definition |
| `listFieldsByVersion` (schema_questions) | 02b (`repository/schemaQuestions.ts`) | form-preview 動的生成 |
| `findLatestPerKind(['schema_sync','response_sync'])` | 02b/共通 (`repository/syncJobs.ts`) | lastSync status |
| `member_identities.current_response_id` | 03b | 入力前提（最新 response 切替済み） |
| `member_status.public_consent` | 03b | snapshot として最新 |
| `PublicStatsViewZ` / `PublicMemberListViewZ` / `PublicMemberProfileZ` / `FormPreviewViewZ` | 01b (`packages/shared/src/zod/viewmodel.ts`) | response zod schema |

## 4. AC（quantitative）

| AC | 検証 | 数値 |
| --- | --- | --- |
| AC-1 | `/public/members` items に不適格 member が 0 件 | fixture: 適格 6 / declined 2 / hidden 1 / deleted 1 → items=6 |
| AC-2 | `PublicMemberProfile` zod parse PASS | `responseEmail` / `rulesConsent` / `adminNotes` の key を持たない |
| AC-3 | `sections[].fields[]` に visibility != 'public' が 0 件 | schema_questions visibility=public 件数と完全一致 |
| AC-4 | 不適格 `memberId` 直接叩き → 404 | body=`{"code":"UBM-1404","title":"Not Found",...}` |
| AC-5 | `?tag=ai&tag=dx` → AND | subquery `HAVING COUNT(DISTINCT code)=2` |
| AC-6 | 不正 query → default fallback | zone/status='all', sort='recent', density='comfy', page=1, limit=24 |
| AC-7 | `lastSync` の status mapping | `sync_jobs.kind ∈ {schema_sync, response_sync}` の MAX(started_at) |
| AC-8 | form-preview 31 項目 / 6 セクション + `responderUrl` 一致 | `schema_questions` row count=31, distinct section_key=6 |
| AC-9 | 全 endpoint 未認証で 200 | `/public/*` は session middleware 不適用 |
| AC-10 | 検索対象 9 列限定 | `responseEmail` / `rulesConsent` / `adminNotes` / 非 searchable は対象外 |
| AC-11 | `limit` 上限 100 で clamp | `limit=200` → 100、400 を返さない |
| AC-12 | 圧縮（gzip / brotli） | Cloudflare Workers 標準（明示無効化しない） |

## 5. 公開フィルタ条件

```sql
WHERE s.public_consent = 'consented'
  AND s.publish_state  = 'public'
  AND s.is_deleted     = 0
```

`apps/api/src/_shared/public-filter.ts` の `buildPublicWhereParams()` で 1 箇所に集約。
view converter で再度 `if (status.public_consent !== 'consented' || status.publish_state !== 'public' || status.is_deleted) throw NotFound()` を実施し二重チェック。

## 6. 不変条件マッピング

| # | 条件 | 適用 |
| --- | --- | --- |
| 1 | schema 固定禁止 | form-preview は `schema_questions` 動的構築 |
| 2 | consent キー統一 | フィルタは `publicConsent='consented'` のみ |
| 3 | `responseEmail` system field | view converter で delete + zod schema で除外 |
| 4 | profile 本文 D1 override 禁止 | 本タスクは read のみ |
| 5 | apps/web → D1 直禁止 | D1 access は本 API の repository 経由 |
| 10 | 無料枠 | write 0、stats / form-preview のみ 60s cache |
| 11 | admin-managed 分離 | `adminNotes` は exclude、不適格 404 で隠蔽 |
| 14 | schema 集約 | form-preview は schema sync output を反映 |

## 7. 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 公開ディレクトリが「不適格 leak ゼロ」で動く | PASS |
| 実現性 | D1 read のみ、無料枠内、MVP 数百規模 OK | PASS |
| 整合性 | 04b/04c と router / view 境界が衝突しない | PASS |
| 運用性 | write 0 で破壊なし、handler 単位の hotfix 可 | PASS |

## 8. 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 初回価値 | 未ログインで会員ディレクトリ閲覧、KPI 公開、Form プレビュー |
| 払わないコスト | leak、N+1 暴走、未公開フィールド露出、admin notes 混入、form-preview ハードコード |
| 残余リスク | LIKE 性能（数百で OK）、cache 整合（form-preview ETag は Phase 9） |

## 9. open question（次 Phase 持ち越し）

- Q-1: pagination 総件数の cache 化 → 都度 `count(*)` で MVP 開始（Phase 9 で再評価）
- Q-2: form-preview の ETag → Phase 9 / 09a のスコープで再評価
- Q-3: density は server に届くが filter / sort 不適用、response の `appliedQuery` 内で echo する（client 表示状態の往復確認用）

## 10. Phase 2 への引き継ぎ

- scope in/out（本ドキュメント §2）
- AC quantitative（本ドキュメント §4）
- 上流引き渡し物表（本ドキュメント §3）
- 公開フィルタ条件（本ドキュメント §5）
- 不変条件 #1/#2/#3/#4/#5/#10/#11/#14 の適用方針
- open question Q-1/Q-2/Q-3
