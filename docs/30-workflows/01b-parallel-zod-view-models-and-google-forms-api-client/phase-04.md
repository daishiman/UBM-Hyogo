# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 4 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 3 (設計レビュー) |
| 下流 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

型 / zod / Forms client / ESLint rule の 4 軸テスト戦略を設計し、AC-1〜AC-10 すべてに 1 個以上の test を割り当てる。

## 実行タスク

1. 4 軸テスト計画（type / zod / Forms / ESLint）
2. AC ↔ test 対応表
3. test fixtures 設計（31 項目 fixture / Forms API mock response）
4. coverage 目標
5. outputs/phase-04/test-strategy.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計 |
| 必須 | outputs/phase-01/main.md | AC 一覧 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | 31 項目 |

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 5 | runbook |
| 11 | manual smoke |

## 多角的チェック観点（不変条件参照）

- **#1/#3/#7**: type test に必須（distinct branded、schema 抽象、responseEmail system field）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | 4 軸計画 | 4 | pending |
| 2 | AC マッピング | 4 | pending |
| 3 | fixtures | 4 | pending |
| 4 | coverage | 4 | pending |
| 5 | outputs | 4 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-04/main.md |
| ドキュメント | outputs/phase-04/test-strategy.md |
| ドキュメント | outputs/phase-04/test-fixtures.md |
| メタ | artifacts.json |

## 完了条件

- [ ] 4 軸 test list 完成
- [ ] AC-1〜AC-10 全 100% カバー

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs/phase-04/ 3 ファイル
- [ ] AC カバレッジ 10/10

## 次 Phase

- 次: Phase 5
- 引き継ぎ事項: テスト戦略
- ブロック条件: AC カバレッジ < 100%

## 4 軸テスト計画

### 軸 1: type-level test（tsc strict）

| test | AC |
| --- | --- |
| `MemberId` と `ResponseId` の代入互換 NG | AC-7 |
| `viewmodel/PublicStatsView` の必須フィールド網羅 | AC-1, AC-4 |
| `FormResponse.responseEmail` が `ResponseEmail` branded であること | AC-3, AC-6 |

### 軸 2: zod runtime test（vitest）

| test | AC |
| --- | --- |
| 31 項目 fixture × valid input → parse PASS | AC-3 |
| 31 項目 × invalid input × edge case → parse FAIL | AC-3 |
| consent normalizer が legacy key を `publicConsent` / `rulesConsent` に変換 | AC-5 |
| viewmodel 10 種 × valid/invalid 各 1 ケース | AC-4 |

### 軸 3: Forms client test（vitest + msw / fetch mock）

| test | AC |
| --- | --- |
| auth: JWT 署名 → token endpoint → token 取得 | AC-8 |
| getForm 200 → FormSchema 返却 | AC-8 |
| listResponses 200 + nextPageToken → ページング | AC-8 |
| 429 → backoff retry → 200 | AC-9 |
| 5xx → backoff retry 上限到達で throw | AC-9 |
| 401 → token refresh → retry | AC-8 |

### 軸 4: ESLint rule test（RuleTester）

| test | AC |
| --- | --- |
| `apps/web/**` から `@ubm/integrations/google` を import → error | AC-10 |
| `apps/api/**` から import → ok | AC-10 |
| `apps/web/**` から `apps/api/**` import → error | AC-10 |

## AC ↔ test 対応表

| AC | test ID | 軸 |
| --- | --- | --- |
| AC-1 | type-test-viewmodel-fields | 1 |
| AC-2 | type-test-branded-7 | 1 |
| AC-3 | zod-31fields + zod-edge | 2 |
| AC-4 | zod-viewmodel-10 | 2 |
| AC-5 | zod-consent-normalize | 2 |
| AC-6 | type-test-responseEmail-system | 1 |
| AC-7 | type-test-distinct-branded | 1 |
| AC-8 | forms-auth + forms-get + forms-list | 3 |
| AC-9 | forms-backoff-429 + forms-backoff-5xx | 3 |
| AC-10 | eslint-boundary-3 | 4 |

## test fixtures

### 31 項目 fixture

`packages/shared/test/fixtures/form-31fields.json` に valid sample × 5 件 + invalid sample × 31 件（各項目 1 invalid）

### Forms API mock response

`packages/integrations/google/test/fixtures/forms-get-response.json` (forms.get sample)
`packages/integrations/google/test/fixtures/forms-list-page1.json` + `page2.json`

## coverage 目標

| package | 目標 |
| --- | --- |
| packages/shared/zod | 95%+ |
| packages/shared/branded | 100%（type-only） |
| packages/integrations/google/forms | 90%+ |
