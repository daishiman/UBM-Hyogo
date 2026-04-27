# AC マトリクス（AC-1〜AC-10 × test ID × evidence × 不変条件）

## evidence パス（共通）

| ログ種別 | パス |
| --- | --- |
| typecheck | `outputs/phase-11/typecheck.log` |
| vitest | `outputs/phase-11/vitest.log` |
| ESLint boundary | `outputs/phase-11/eslint-boundary.log` |

## マトリクス

| AC | 内容 | test ID（実装ファイル / case） | evidence | 閾値 | 実測 | 不変条件 | 判定 |
| --- | --- | --- | --- | --- | --- | --- | :---: |
| AC-1 | 4 層型カバー（schema / response / identity / viewmodel） | `tsc-noEmit` (`pnpm typecheck`) | `outputs/phase-11/typecheck.log` | 0 typecheck error | 5 / 5 project Done, 0 error | #1 | PASS |
| AC-2 | branded 7 種を export | `packages/shared/src/types/ids.test.ts` :: branded export 確認 | `outputs/phase-11/vitest.log`（ids.test.ts 10 tests） | 7 / 7 export 確認 | 7 / 7 PASS（MemberId / ResponseId / ResponseEmail / StableKey / SessionId / TagId / AdminId） | #7 | PASS |
| AC-3 | zod 31 項目（FieldByStableKeyZ） | `packages/shared/src/zod/field.test.ts` :: `FieldByStableKeyZ` 31 stable key | `outputs/phase-11/vitest.log`（field.test.ts 63 tests） | 31 / 31 fixture PASS | 63 / 63 PASS（31 項目 × OK / NG ペア） | #1 | PASS |
| AC-4 | viewmodel 10 種 parser | `packages/shared/src/zod/viewmodel.test.ts` :: `VIEWMODEL_PARSER_LIST` × 10 + 一覧整合 1 | `outputs/phase-11/vitest.log`（viewmodel.test.ts 11 tests） | 10 / 10 viewmodel test PASS | 11 / 11 PASS | #1 | PASS |
| AC-5 | consent キー統一（publicConsent / rulesConsent） | `packages/shared/src/utils/consent.test.ts` :: 旧キー → 新キー normalize 8 cases | `outputs/phase-11/vitest.log`（consent.test.ts 8 tests） | 0 件の旧キー残存 | 8 / 8 PASS、旧キーは normalize でのみ受理 | #2 | PASS |
| AC-6 | responseEmail を schema 外の system field 扱い | `packages/shared/src/zod/field.test.ts` :: `responseEmail` が `FieldByStableKeyZ` に含まれない | `outputs/phase-11/vitest.log` | schema 内に responseEmail 0 件 | schema 0 件、`MemberResponse.responseEmail` のみで保持 | #3 | PASS |
| AC-7 | branded 同士の distinct（MemberId ≠ ResponseId 等） | `packages/shared/src/types/ids.test.ts` :: distinct 検証 | `outputs/phase-11/vitest.log`（ids.test.ts 内） | 1 / 1 distinct test PASS | PASS（型レベルで相互代入不可） | #7 | PASS |
| AC-8 | Forms auth chain（service account JWT → Bearer） | `packages/integrations/google/src/forms/auth.test.ts` (4 tests) + `client.test.ts` の `getForm` / `listResponses` 経路 | `outputs/phase-11/vitest.log`（auth 4 / client 4） | 3 / 3 test PASS | 4 + 4 = 8 / 8 PASS（auth + client 経路） | – | PASS |
| AC-9 | Forms backoff（exponential, 408/425/429/500/502/503/504） | `packages/integrations/google/src/forms/backoff.test.ts` (4 tests: 429 / 5xx / non-retryable / max retries) | `outputs/phase-11/vitest.log`（backoff 4 tests） | 2 / 2 test PASS | 4 / 4 PASS（429 系・5xx 系・非リトライ・上限を網羅） | – | PASS |
| AC-10 | apps/web boundary（D1 / integrations-google 直接 import 禁止） | `scripts/lint-boundaries.mjs`（`@ubm-hyogo/integrations-google` 追加済） | `outputs/phase-11/eslint-boundary.log` | 3 / 3 ESLint test PASS, 0 violation | 0 violation（boundary script 完走） | #5 | PASS |

## カバレッジ確認

- AC 充足率: **10 / 10 (100 %)**
- 不変条件カバー: **#1, #2, #3, #5, #7（実装関連 5 件）+ AC 非紐付の #4, #6（運用ガード）も Phase 9 で別途確認**
- evidence ログ件数: **3 種すべて存在（typecheck / vitest / eslint-boundary）**

## test 一覧（Vitest 抜粋・evidence: phase-11/vitest.log）

| ファイル | tests | 主な役割 |
| --- | --- | --- |
| `packages/shared/src/types/ids.test.ts` | 10 | branded 7 種 + distinct |
| `packages/shared/src/utils/consent.test.ts` | 8 | consent normalize（AC-5） |
| `packages/shared/src/zod/field.test.ts` | 63 | 31 項目 zod（AC-3 / AC-6） |
| `packages/shared/src/zod/viewmodel.test.ts` | 11 | viewmodel 10 種 parser（AC-4） |
| `packages/integrations/google/src/forms/auth.test.ts` | 4 | service account JWT（AC-8） |
| `packages/integrations/google/src/forms/backoff.test.ts` | 4 | retry / backoff（AC-9） |
| `packages/integrations/google/src/forms/client.test.ts` | 4 | getForm / listResponses（AC-8） |
| `apps/web/src/lib/tones.test.ts` | 7 | 既存（範囲外） |
| `apps/web/src/components/ui/__tests__/primitives.test.tsx` | 19 | 既存（範囲外） |
| **合計** | **130** | – |

## 結論

- 10 / 10 AC が evidence 付きで PASS。
- Phase 10 の GO 判定に進める。
