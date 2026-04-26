# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 04a-parallel-public-directory-api-endpoints |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 4 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 3（設計レビュー） |
| 次 Phase | 5（実装ランブック） |
| 状態 | pending |

## 目的

unit / contract / leak / authorization / search query test を設計。leak test を独立 suite として強調する。

## 実行タスク

1. unit test 対象列挙（converter / public-filter / search-query-parser / pagination / visibility-filter）。
2. contract test 列挙（4 endpoint の response zod parse、fixture 比対）。
3. leak test 独立 suite（不適格 6 種、`responseEmail` / `rulesConsent` / `adminNotes` 漏出 0）。
4. authorization test（401 / 403 が出ない、未認証で 200）。
5. search test（q/zone/status/tag/sort/density、tag AND）。
6. fixture 設計。
7. test matrix を outputs/phase-04/test-matrix.md。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC |
| 必須 | outputs/phase-02/main.md | module |
| 必須 | outputs/phase-03/main.md | リスク |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | 検索仕様 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | view model |

## 実行手順

### ステップ 1: unit
- `public-filter.spec`: WHERE clause 生成
- `search-query-parser.spec`: 不正値 fallback
- `pagination.spec`: limit clamp / offset 計算
- `visibility-filter.spec`: `field.visibility !== 'public'` を除外
- `to-public-stats.spec` / `to-public-member-list.spec` / `to-public-member-profile.spec` / `to-form-preview.spec`: converter 単体

### ステップ 2: contract
- `GET /public/stats`: `PublicStatsView` zod parse
- `GET /public/members`: `PublicMemberListView` zod parse + items[].keys に `responseEmail` / `publicConsent` がない
- `GET /public/members/:memberId`: `PublicMemberProfile` zod parse + `responseEmail` / `rulesConsent` / `adminNotes` keys がない
- `GET /public/form-preview`: `FormPreviewView` zod parse + sections.length=6 + 全 fields count=31

### ステップ 3: leak test
- fixture: `members` 10 件（適格 6 + declined 2 + hidden 1 + deleted 1）
- assert: `/public/members` items.length=6、不適格 4 件は items に含まれない
- assert: `/public/members/m_hidden` → 404 / `/public/members/m_declined` → 404 / `/public/members/m_deleted` → 404
- assert: `/public/members/:適格` で sections[].fields[].visibility が全て public

### ステップ 4: authorization
- 未ログイン → 200（4 endpoint）
- 認証 cookie あり → 200 (同じ response、cookie に依存しない)

### ステップ 5: search
- `?tag=ai&tag=dx` で AND
- `?zone=invalid` → fallback to 'all'
- `?sort=invalid` → fallback to 'recent'
- `?density=anything` → server side では使わない (response に含めるが filter 影響なし)
- `?q=` (空) → 全件
- `?limit=200` → clamp 100

### ステップ 6: fixture
- `apps/api/tests/fixtures/public/members.json`: 10 member（status / response / fields / tags）
- `apps/api/tests/fixtures/public/sync-jobs.json`: 直近 schema_sync / response_sync
- `apps/api/tests/fixtures/public/schema-questions.json`: 31 行・6 セクション

### ステップ 7: matrix
- 後述参照、独立保存。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook sanity check |
| Phase 7 | AC matrix 実装 column |
| Wave 8a | contract test 取り込み |
| Wave 8b | E2E から呼び出し |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| consent leak | #2 | leak suite で declined 0 件 assert |
| responseEmail leak | #3 | converter test + contract test |
| visibility leak | #1 | visibility-filter.spec |
| admin leak | #11 | adminNotes keys なし assert |
| 検索 | search | tag AND / fallback / clamp |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | unit 列挙 | 4 | pending | 8 spec |
| 2 | contract 列挙 | 4 | pending | 4 endpoint |
| 3 | leak suite | 4 | pending | 6 種不適格 |
| 4 | authz | 4 | pending | 未ログイン 200 |
| 5 | search | 4 | pending | tag AND / fallback / clamp |
| 6 | fixture | 4 | pending | 3 種 |
| 7 | matrix 出力 | 4 | pending | test-matrix.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | サマリ |
| ドキュメント | outputs/phase-04/test-matrix.md | matrix |
| メタ | artifacts.json | phase 4 を `completed` |

## 完了条件

- [ ] AC-1〜AC-12 が test に対応
- [ ] leak suite が独立
- [ ] fixture 3 種

## タスク100%実行確認【必須】

- [ ] サブタスク 7 件すべて completed
- [ ] AC-1〜AC-12 が test に mapping
- [ ] leak test に 6 種不適格 fixture
- [ ] artifacts.json の phase 4 が `completed`

## 次 Phase

- 次: 5（実装ランブック）

## verify suite

### unit

| 対象 | 検証 |
| --- | --- |
| public-filter | WHERE 生成 |
| search-query-parser | 不正値 fallback |
| pagination | limit clamp / offset |
| visibility-filter | public 以外除外 |
| to-public-stats | KPI 集計 |
| to-public-member-list | items 形 |
| to-public-member-profile | leak exclusion |
| to-form-preview | 31 / 6 |

### contract

| 対象 | 検証 |
| --- | --- |
| GET /public/stats | PublicStatsView zod parse |
| GET /public/members | PublicMemberListView zod parse + leak keys なし |
| GET /public/members/:memberId | PublicMemberProfile zod parse + leak keys なし |
| GET /public/form-preview | FormPreviewView zod parse + 31 fields |

### leak suite（独立）

| ケース | 期待 |
| --- | --- |
| declined member 一覧含まず | items に含まれない |
| hidden member 一覧含まず | items に含まれない |
| deleted member 一覧含まず | items に含まれない |
| `/public/members/m_declined` | 404 |
| `/public/members/m_hidden` | 404 |
| `/public/members/m_deleted` | 404 |
| 適格 member 詳細 | visibility=public 以外 0、responseEmail/rulesConsent/adminNotes keys なし |

### authorization

| ケース | 期待 |
| --- | --- |
| 未ログイン | 200 |
| 認証あり | 200（同 response） |

### search

| ケース | 期待 |
| --- | --- |
| tag=ai&tag=dx | AND filter |
| zone=invalid | fallback 'all' |
| sort=invalid | fallback 'recent' |
| q='' | 全件 |
| limit=200 | clamp 100 |

## test matrix

| AC | unit | contract | leak | authz | search | fixture |
| --- | --- | --- | --- | --- | --- | --- |
| AC-1 公開フィルタ | public-filter | members list | declined/hidden/deleted | - | - | members.json |
| AC-2 PublicMemberProfile 型 | to-public-member-profile | profile zod | leak keys | - | - | members.json |
| AC-3 visibility=public | visibility-filter | profile fields | visibility leak | - | - | members.json |
| AC-4 不適格 404 | - | - | 404 三種 | - | - | members.json |
| AC-5 tag AND | - | - | - | - | tag AND | members.json |
| AC-6 fallback | search-query-parser | - | - | - | invalid → default | - |
| AC-7 lastSync | - | stats | - | - | - | sync-jobs.json |
| AC-8 form-preview 31/6 | to-form-preview | form-preview | - | - | - | schema-questions.json |
| AC-9 未認証 200 | - | - | - | 4 endpoint | - | - |
| AC-10 検索対象限定 | search-query-parser | - | - | - | q with email field 検索しない | - |
| AC-11 limit clamp | pagination | - | - | - | limit=200 | - |
| AC-12 圧縮 | - | - | - | - | - | - (workers 自動) |

## fixture 設計

```
apps/api/tests/fixtures/public/
├── members.json           # 10 member (適格 6 + declined 2 + hidden 1 + deleted 1)
├── sync-jobs.json         # 直近 schema_sync / response_sync
└── schema-questions.json  # 31 行・6 セクション
```
