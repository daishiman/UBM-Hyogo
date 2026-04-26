# 04a-parallel-public-directory-api-endpoints - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-directory-api-endpoints |
| ディレクトリ | doc/02-application-implementation/04a-parallel-public-directory-api-endpoints |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | api / public |
| 状態 | pending |
| タスク種別 | spec_created |

## purpose

`apps/api` (Hono) に未認証で叩ける公開ディレクトリ系 4 endpoints を実装する spec を確定する。
`PublicStatsView` / `PublicMemberListView` / `PublicMemberProfile` / `FormPreviewView` の view model を返し、
不適格 member（`publicConsent != 'consented'`、`publishState != 'public'`、`isDeleted = true`）が leak しないこと、`FieldVisibility = 'public'` 以外の field が leak しないこと、`responseEmail` / `rulesConsent` / `adminNotes` が response から exclude されることを保証する。

## scope in / out

### scope in
- `GET /public/stats` → `PublicStatsView`（KPI / 最近の支部会 / lastSync 状態）
- `GET /public/members` → `PublicMemberListView`（検索 query 解釈 q/zone/status/tag/sort/density、複数 tag は AND、密度は client 側、検索対象は fullName/nickname/occupation/location/businessOverview/skills/canProvide/selfIntroduction/tags）
- `GET /public/members/:memberId` → `PublicMemberProfile`（`Omit<MemberProfile, 'responseEmail' | 'rulesConsent' | 'adminNotes'>`、FieldVisibility=public のみ）
- `GET /public/form-preview` → `FormPreviewView`（`schema_questions` から visibility 含む全項目を返す、Google Form `responderUrl` も同梱）
- 公開フィルタ実装（`publicConsent='consented' AND publishState='public' AND isDeleted=0`）の SQL helper
- search query パラメータ解釈と zod parse、不正値は default にフォールバック
- pagination meta（`PaginationMeta`）算出
- response zod schema による contract test

### scope out
- 認証必要な endpoint（`/me/*` は 04b、`/admin/*` は 04c）
- web 側 UI（06a 担当）
- 公開フィルタの管理 UI（admin の publishState 設定は 04c）
- 同期 job（03a / 03b）
- search の全文検索エンジン導入（D1 LIKE で MVP）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02a-parallel-member-identity-status-and-response-repository | members / identities / status / responses / sections / fields の repository を read |
| 上流 | 02b-parallel-meeting-tag-queue-and-schema-diff-repository | meetings / tag_definitions / schema_questions を read |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | `current_response_id` / `member_status.public_consent` 等を入力前提 |
| 上流 | 01b-parallel-zod-view-models-and-google-forms-api-client | `PublicStatsView` / `PublicMemberListView` / `PublicMemberProfile` / `FormPreviewView` zod schema を import |
| 下流 | 06a-parallel-public-landing-directory-and-registration-pages | `/`, `/members`, `/members/[id]`, `/register` から呼ぶ |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | contract test 対象 |
| 下流 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | E2E から呼ばれる |
| 並列 | 04b / 04c | 同 Wave 4 内、router 共通基盤を共有 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | 31 項目 / FieldVisibility / system fields |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | endpoint 一覧 / 公開フィルタ条件 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | view model 型定義（PublicStatsView / PublicMemberListView / PublicMemberProfile / FormPreviewView） |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | 公開画面ルーティング |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | q/zone/status/tag/sort/density の正式仕様 |
| 必須 | doc/00-getting-started-manual/specs/14-implementation-roadmap.md | 順序 |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | テーブル read 観点 |
| 参考 | doc/00-getting-started-manual/specs/09-ui-ux.md | a11y / 検索 UI |

## AC

- AC-1: `GET /public/members` の結果に `publicConsent != 'consented'` または `publishState != 'public'` または `isDeleted = true` の member が 0 件含まれる（contract test で fixture 比対）
- AC-2: `GET /public/members/:memberId` の response が `PublicMemberProfile` 型（`responseEmail`, `rulesConsent`, `adminNotes` の key を持たない）に zod parse PASS
- AC-3: `GET /public/members/:memberId` の `sections[].fields[]` に `FieldVisibility != 'public'` の field が 0 件含まれる
- AC-4: 不適格 member の `:memberId` を直接叩いても 404 を返す（403 ではなく 404 で存在を隠す）
- AC-5: `GET /public/members?q=...&zone=...&status=...&tag=...&tag=...&sort=...&density=...` で `tag` repeated query は AND 条件で適用される
- AC-6: 不正な `zone` / `status` / `sort` / `density` 値は黙って default に落ちる（zod safeParse + fallback）
- AC-7: `GET /public/stats.lastSync` が `sync_jobs` の最新 `kind in ('schema_sync','response_sync')` から `ok / running / failed / never` を返す
- AC-8: `GET /public/form-preview` が 31 項目・6 セクションを返し、`responderUrl` が `01-api-schema.md` の固定値と一致
- AC-9: 全 endpoint 未ログインで 200（401 / 403 を返さない、未認証で叩ける）
- AC-10: 検索対象列が `fullName / nickname / occupation / location / businessOverview / skills / canProvide / selfIntroduction / tags` に限定される（`responseEmail` 等の system field では検索しない）
- AC-11: pagination 既定 `limit=24, page=1`、`limit` 上限 100、超過は 400 ではなく clamp（運用優先）
- AC-12: response payload が gzip / brotli 自動で圧縮（Cloudflare Workers 標準）

## 13 phases

| Phase | 名称 | ファイル | 状態 | 概要 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | true issue / scope / 4条件 / AC ドラフト |
| 2 | 設計 | phase-02.md | pending | Mermaid / endpoint module / 公開フィルタ SQL / view 組み立て |
| 3 | 設計レビュー | phase-03.md | pending | alternative 4 案 / PASS-MINOR-MAJOR |
| 4 | テスト戦略 | phase-04.md | pending | unit / contract / leak test / authz |
| 5 | 実装ランブック | phase-05.md | pending | runbook + 擬似コード + sanity check |
| 6 | 異常系検証 | phase-06.md | pending | 404 / 422 / 5xx / 不正 query |
| 7 | AC マトリクス | phase-07.md | pending | AC-1〜AC-12 |
| 8 | DRY 化 | phase-08.md | pending | view model converter / public filter helper |
| 9 | 品質保証 | phase-09.md | pending | 無料枠 / cache / a11y |
| 10 | 最終レビュー | phase-10.md | pending | GO / NO-GO |
| 11 | 手動 smoke | phase-11.md | pending | curl / fixture |
| 12 | ドキュメント更新 | phase-12.md | pending | 6 成果物 |
| 13 | PR 作成 | phase-13.md | pending | 承認後 PR |

## outputs

- `outputs/phase-01/main.md` 〜 `outputs/phase-13/main.md`
- `outputs/phase-02/api-flow.mermaid`
- `outputs/phase-04/test-matrix.md`
- `outputs/phase-05/api-runbook.md` + `outputs/phase-05/pseudocode.md`
- `outputs/phase-06/failure-cases.md`
- `outputs/phase-07/ac-matrix.md`
- `outputs/phase-09/free-tier-estimate.md` + `outputs/phase-09/leak-test-report.md`
- `outputs/phase-11/manual-evidence.md`
- `outputs/phase-12/implementation-guide.md` ほか 6 成果物
- `outputs/phase-13/change-summary.md` + `outputs/phase-13/local-check-result.md`

## services / secrets

| サービス | 用途 |
| --- | --- |
| Cloudflare Workers (apps/api) | Hono router + handler |
| Cloudflare D1 | members / identities / status / responses / response_fields / meetings / tag_definitions / member_tags / schema_questions / sync_jobs を read |

| secret 名 | 配置先 | 用途 |
| --- | --- | --- |
| - | - | 公開 endpoint は secret を新規追加しない |

## invariants touched

- #1（schema 固定禁止）— form-preview は `schema_questions` から動的生成
- #2（consent キーは `publicConsent` / `rulesConsent`）— 公開フィルタで `publicConsent='consented'` のみ統一
- #3（`responseEmail` は system field）— `PublicMemberProfile` で除外、検索対象にも含めない
- #4（profile 本文 D1 override 禁止）— 本タスクは read のみ、override しない
- #5（apps/web → D1 直禁止）— D1 access は本 API 経由
- #10（無料枠）— 公開 endpoint は GET のみで write 0、Workers / D1 read 内
- #11（admin-managed data 分離）— `adminNotes` を `PublicMemberProfile` から除外
- #14（schema 集約）— form-preview は schema sync の output を反映

## completion definition

- 全 13 phase の status が `completed`
- AC-1〜AC-12 が Phase 7 / 10 で完全トレース
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の 6 成果物が生成済み
- Phase 13 はユーザー承認まで blocked

## 関連リンク

- 上位 README: ../README.md
- 設計書: ../_design/phase-2-design.md（Wave 4a 詳細）
- 共通テンプレ: ../_templates/phase-template-app.md
- 並列タスク: ../04b-parallel-member-self-service-api-endpoints / ../04c-parallel-admin-backoffice-api-endpoints
- 上流: ../02a / ../02b / ../03b / ../01b
- 下流: ../06a / ../08a / ../08b
