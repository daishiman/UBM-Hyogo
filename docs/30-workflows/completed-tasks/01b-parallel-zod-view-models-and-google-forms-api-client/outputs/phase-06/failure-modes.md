# Phase 6: 異常系 18 ケース詳細

> Phase 6 サブ成果物。Phase 5 で実装した 4 軸の異常系を全列挙する。

## 1. 型レイヤ（5 件）

| # | ケース | 期待挙動 | 不変条件 |
| --- | --- | --- | --- |
| 1 | `MemberId` を `ResponseId` 引数に渡す | tsc error TS2322 | #7 |
| 2 | `viewmodel/SessionUser` から `email` 削除 | consumer tsc error | #1 |
| 3 | `FormResponse.responseEmail` が `string` ではなく `ResponseEmail` でないと代入不可 | tsc error | #3 |
| 4 | `FormSchema.sections` に specific question 名 hardcode 試行 | tsc error（型に存在しない） | #1 |
| 5 | `MemberIdentity` に `profileOverrides` 追加 | tsc error（型に存在しない） | #4 補強 |

## 2. zod レイヤ（7 件）

| # | ケース | 期待挙動 | 不変条件 |
| --- | --- | --- | --- |
| 6 | 必須 31 項目のうち 1 つ欠損 → parse | ZodError throw | #1 |
| 7 | email 不正形式 → parse | ZodError | #3 |
| 8 | `responseId` 空文字 → parse | ZodError | #7 |
| 9 | consent: `shareInfo: true` のみ → normalize | `publicConsent: true` に統一 | #2 |
| 10 | consent: 全旧キー混在 → normalize | 新キーで上書き、旧キー drop | #2 |
| 11 | viewmodel parse: 余剰フィールド | strict で reject | #1 |
| 12 | GAS prototype 由来 `companyType` 値 → parse | enum unknown で reject | #6 |

## 3. Forms client レイヤ（4 件）

| # | ケース | 期待挙動 | 不変条件 |
| --- | --- | --- | --- |
| 13 | auth: JWT 署名失敗（鍵不正） | error throw、secret を log に出さない | secret hygiene |
| 14 | getForm: 401 → token refresh → 401 | error throw（無限ループ防止） | #5 |
| 15 | listResponses: 429 連続 5 回 → maxRetry 到達 | error throw、retry log 記録 | #5 |
| 16 | listResponses: 5xx 連続 5 回 → maxRetry 到達 | error throw | #5 |

## 4. boundary レイヤ（2 件）

| # | ケース | 期待挙動 | 不変条件 |
| --- | --- | --- | --- |
| 17 | `apps/web/page.tsx` から `@ubm-hyogo/integrations-google` import | lint error | #5 |
| 18 | `apps/web/page.tsx` から `apps/api/handler` import | lint error | #5 |

## 5. ケース ↔ test ID 対応

| # | test ID（vitest / lint script） |
| --- | --- |
| 1, 3, 4, 5 | type-level test（tsc strict） |
| 2 | viewmodel field 必須テスト |
| 6 | zod-31fields-missing |
| 7 | zod-email-invalid |
| 8 | zod-responseId-empty |
| 9 | consent-normalize-legacy |
| 10 | consent-normalize-mixed |
| 11 | zod-viewmodel-strict |
| 12 | zod-gas-companyType-reject |
| 13 | forms-auth-keyfail |
| 14 | forms-getForm-401-loop |
| 15 | forms-list-429-maxretry |
| 16 | forms-list-5xx-maxretry |
| 17, 18 | boundary-lint-error |

## 6. secret hygiene 補足（ケース 13）

- JWT 署名失敗時のエラーメッセージに `FORMS_SA_KEY` を含めない。
- `error.cause` にも secret を渡さない。
- log 出力には secret の hash / 先頭数文字程度の hint のみ。
- test では `expect(error.message).not.toContain(secret)` を assert する。
