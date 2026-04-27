# Phase 4: テスト戦略詳細

> Phase 4 サブ成果物。4 軸テスト計画を詳細化する。

## 軸 1: type-level test（tsc strict）

| test | AC |
| --- | --- |
| `MemberId` と `ResponseId` の代入互換 NG | AC-7 |
| `viewmodel/PublicStatsView` の必須フィールド網羅 | AC-1, AC-4 |
| `FormResponse.responseEmail` が `ResponseEmail` branded であること | AC-3, AC-6 |
| `FormQuestion.stableKey` が `StableKey` branded であること | AC-2 |
| `MemberIdentity.currentResponseId` が `ResponseId | undefined` | AC-7 |

## 軸 2: zod runtime test（vitest）

| test | AC |
| --- | --- |
| 31 項目 fixture × valid input → parse PASS | AC-3 |
| 31 項目 × invalid input × edge case → parse FAIL | AC-3 |
| consent normalizer が legacy key を `publicConsent` / `rulesConsent` に変換 | AC-5 |
| viewmodel 10 種 × valid/invalid 各 1 ケース | AC-4 |
| `FormResponseZ` strict mode で余剰フィールド reject | AC-3 |
| `MemberIdentityZ` で `responseEmail` 不正形式 → reject | AC-3, AC-6 |

## 軸 3: Forms client test（vitest + fetch mock）

| test | AC |
| --- | --- |
| auth: JWT 署名 → token endpoint → token 取得 | AC-8 |
| getForm 200 → FormSchema 返却 | AC-8 |
| listResponses 200 + nextPageToken → ページング | AC-8 |
| 429 → backoff retry → 200 | AC-9 |
| 5xx → backoff retry 上限到達で throw | AC-9 |
| 401 → token refresh → retry | AC-8 |
| mapper: Google API レスポンス → FormSchema 変換正常系 | AC-8 |
| mapper: 未知の question type → reject | AC-3 |

## 軸 4: boundary lint test

| test | AC |
| --- | --- |
| `apps/web/**` から `@ubm-hyogo/integrations-google` を import → error | AC-10 |
| `apps/api/**` から import → ok | AC-10 |
| `apps/web/**` から `apps/api/**` import → error | AC-10 |

## テスト実行コマンド

```bash
mise exec -- pnpm -F @ubm-hyogo/shared test
mise exec -- pnpm -F @ubm-hyogo/integrations-google test
mise exec -- pnpm -w typecheck
mise exec -- pnpm -w lint
```

## 実行結果

- vitest 130 件 PASS（packages/shared + packages/integrations/google 合算）
- typecheck PASS
- lint PASS（boundary 含む）
