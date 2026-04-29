# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | なし（task entry） |
| 次 Phase | 2（設計） |
| 状態 | pending |

## 目的

公開ディレクトリ API 4 endpoints の責務を確定する。
未認証で叩け、`publicConsent='consented' AND publishState='public' AND isDeleted=false` の member のみが leak し、
field レベルでも `FieldVisibility='public'` のみが返ること、`responseEmail` / `rulesConsent` / `adminNotes` が response から除外されることを Phase 1 で固定する。

## 実行タスク

1. 02a / 02b / 03b / 01b の AC を読み、**何が既に提供されるか**を表に書き出す（repository 関数、view model 型、`current_response_id` 切替、`member_status` snapshot）。
2. `04-types.md` の `PublicStatsView` / `PublicMemberListView` / `PublicMemberProfile` / `FormPreviewView` を本タスクの output schema として固定する。
3. `12-search-tags.md` の query 仕様（q/zone/status/tag/sort/density、tag は AND）を本タスクの input schema として固定する。
4. `03-data-fetching.md` の公開フィルタを本タスクの SQL where 条件として固定する。
5. AC（AC-1〜AC-12）を index.md と一致させ、quantitative 表現に書き直す。
6. 真の論点（true issue）/ 依存境界 / 価値とコスト / 4 条件を主成果物に記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | 31 項目 / FieldVisibility |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | endpoint 一覧 / 公開フィルタ条件 |
| 必須 | docs/00-getting-started-manual/specs/04-types.md | view model 型 |
| 必須 | docs/00-getting-started-manual/specs/05-pages.md | 公開画面ルーティング |
| 必須 | docs/00-getting-started-manual/specs/12-search-tags.md | 検索 query |
| 必須 | docs/30-workflows/_design/phase-2-design.md | Wave 4a 詳細 |
| 必須 | docs/30-workflows/README.md | 不変条件 |
| 参考 | docs/00-getting-started-manual/specs/09-ui-ux.md | 検索 UI 連携 |

## 実行手順

### ステップ 1: 上流引き渡し物の確定
- 02a が公開する `membersRepository.findPublic(query)` / `memberIdentitiesRepository.findByMemberId` / `memberStatusRepository.findByMemberId` / `responsesRepository.findCurrentByMemberId` / `responseFieldsRepository.findByResponseId` の関数シグネチャを outputs/phase-01/main.md に列挙。
- 02b が公開する `meetingsRepository.list` / `tagDefinitionsRepository.list` / `memberTagsRepository.findByMemberId` / `schemaQuestionsRepository.list` / `syncJobsRepository.findLatestPerKind` を列挙。
- 03b の output（current_response_id / member_status snapshot）が前提として存在する旨を明記。
- 01b が公開する zod schema を import 対象として列挙。

### ステップ 2: scope 確定
- in: 4 endpoints / 公開フィルタ helper / search query parser / view model converter / response zod schema by contract test
- out: 認証必要 endpoints（04b/04c）、UI（06a）、admin による publishState 変更（04c）、同期 job（03a/03b）

### ステップ 3: AC quantitative 化
- AC-1: 「公開フィルタ test fixture: total 10 member（うち consent declined 2、hidden 1、deleted 1、適格 6）に対し response.items.length = 6」
- AC-3: 「31 項目中 visibility=public 項目の count を fixture から事前算出し、response.sections[].fields[].length と一致」
- AC-4: 「不適格 memberId = `m_hidden` を直接叩いて 404、Body は `{ "code":"NOT_FOUND" }`」
- AC-5: 「`?tag=ai&tag=dx` で `member_tags.code IN ('ai','dx')` を AND（HAVING count(distinct code) = 2）」
- AC-7: 「`sync_jobs` の `kind in ('schema_sync','response_sync')` で `MAX(started_at)` を取り、status マッピング」
- AC-8: 「`schema_questions` row count = 31、distinct section_key count = 6、`responderUrl` 一致」

### ステップ 4: 4 条件評価
- 価値性: 公開ディレクトリが「不適格 leak ゼロ」で動く。
- 実現性: D1 LIKE + INDEX で MVP 規模（< 数百 member）で十分。
- 整合性: 03b の current_response が前提として存在、04b/04c とは router 層を分離。
- 運用性: write 0 なので無料枠を消費しない、cache は Cloudflare 標準。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | scope / AC を入力に設計 |
| Phase 4 | AC ごとに verify 設計 |
| Phase 7 | AC matrix の起点 |
| Phase 10 | GO/NO-GO 判定の根拠 |
| 下流タスク 06a | 4 endpoint の response 形を引き渡し |
| 下流タスク 08a | contract test 対象 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| stableKey 直書き禁止 | #1 | form-preview は `schema_questions` 動的生成 |
| consent キー | #2 | 公開フィルタは `publicConsent='consented'` |
| responseEmail | #3 | `PublicMemberProfile` から exclude、検索対象から除外 |
| profile 本文編集禁止 | #4 | 本タスクは read のみ |
| apps/api 限定 | #5 | D1 access は本 API 経由 |
| 無料枠 | #10 | write 0 |
| admin-managed 分離 | #11 | `adminNotes` exclude |
| schema 集約 | #14 | form-preview は schema sync output |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流 AC を読み引き渡し物を表化 | 1 | pending | outputs/phase-01/main.md |
| 2 | scope in/out 確定 | 1 | pending | 04b / 04c との境界 |
| 3 | AC quantitative 化 | 1 | pending | fixture count |
| 4 | 4 条件評価 | 1 | pending | TBD → PASS/MINOR/MAJOR |
| 5 | 真の論点 / 依存境界 / 価値とコスト | 1 | pending | 主成果物末尾 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義（true issue / scope / AC / 4 条件） |
| メタ | artifacts.json | phase 1 を `completed` へ更新 |

## 完了条件

- [ ] 主成果物が作成され、上流 AC の引き渡し物が網羅されている
- [ ] AC が quantitative に書かれている（fixture 件数 / row 件数で表現）
- [ ] 真の論点 / 依存境界 / 価値とコスト / 4 条件が必須セクションとして記載
- [ ] artifacts.json の phase 1 が `completed`

## タスク100%実行確認【必須】

- [ ] 全実行タスク 1〜5 が completed
- [ ] 主成果物 outputs/phase-01/main.md が存在
- [ ] 不変条件 #1, #2, #3, #4, #5, #10, #11, #14 が触れられている
- [ ] 公開フィルタ条件が `publicConsent='consented' AND publishState='public' AND isDeleted=false` で明記
- [ ] 次 Phase 2 への引き継ぎ（scope / AC / open question）を末尾に列挙
- [ ] artifacts.json の該当 phase を `completed` に更新

## 次 Phase

- 次: 2（設計）
- 引き継ぎ事項: scope in/out、AC（quantitative）、上流 AC 引き渡し物表
- ブロック条件: 主成果物未作成、AC が定性的、不変条件番号未引用

## 真の論点（true issue）

- **leak 防止**: フィルタ漏れ 1 件で個人情報が公開される。SQL where に加え view model converter でも二重チェックする。
- **404 vs 403**: 不適格 member の存在を隠蔽するため 404 を返す（403 は存在示唆）。
- **検索の N+1**: `members` + `member_status` + `response_fields` + `member_tags` の join をどう設計するか（Phase 2 で確定）。
- **form-preview の整合**: schema_questions 31 行 / section 6 件を runtime で組み立て、admin sync の最新を反映する。
- **density は client side**: query で受けるが server side では使わない（filter / sort には影響しない）。

## 依存境界

| 境界 | 含む | 含まない |
| --- | --- | --- |
| HTTP method | GET のみ | POST/PATCH/DELETE は 04b/04c |
| 認可 | 未認証 OK | 認証必要 endpoint は 04b/04c |
| D1 read | members / status / responses / fields / meetings / tags / schema_questions / sync_jobs | 書き込み一切なし |
| view model | Public* / FormPreview | Member* / Admin* は 04b/04c |
| 検索 | LIKE ベース MVP | 全文検索エンジン非対象 |

## 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 初回価値 | 未ログインで会員ディレクトリ閲覧、KPI 公開、Form プレビュー |
| 払わないコスト | leak、N+1 暴走、未公開フィールド露出、admin notes 混入、form-preview のハードコード |
| 残余リスク | 検索 LIKE の性能（数百 member までは MVP 想定で OK）、cache の整合 |

## 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 公開ディレクトリの利用者が leak 不安なく検索できるか | PASS |
| 実現性 | 無料枠 + D1 read 内に収まるか | PASS |
| 整合性 | 04b/04c と router / view model 境界が衝突しないか | PASS |
| 運用性 | 失敗しても read のみで data 破壊なし、handler 単位で hotfix 可能 | PASS |

## open question

- pagination の総件数は `count(*)` で都度計算するか cache するか（MVP は都度計算で良いが、無料枠 read 影響を Phase 9 で再評価）。
- 検索キーワードに対する relevance ranking はせず、`sort=recent | name` 二択で良いか（12-search-tags.md と整合）。
- form-preview を動的にすると admin sync 直後に response が変わる。ETag を出すか（Phase 9）。
