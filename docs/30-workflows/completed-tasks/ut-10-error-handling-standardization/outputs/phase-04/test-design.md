# テスト設計（Phase 4 成果物）

## 前提

- 本プロジェクトには現状 `vitest` 等のテストランナーが未導入。CI は typecheck + lint のみ
- 本タスクのスコープに「テストインフラ導入」は含まれないため、テストは「設計仕様」として完成させ、将来 vitest 導入時にそのまま `*.test.ts` として配置できる粒度で記述する
- 機能的検証は Phase 5 の実装で `pnpm typecheck`（型レベル）+ Phase 9 の `pnpm typecheck` / `pnpm lint` で担保
- Phase 6 の異常系検証は手動シナリオ + 型レベル検証で代替

## テストファイル一覧（5 ファイル）

| # | ファイル | 主対象 | ケース数 |
| --- | --- | --- | --- |
| 1 | `packages/shared/src/__tests__/errors.test.ts` | `ApiError` / `UBM_ERROR_CODES` / `isApiError` / `fromUnknown` | 7 |
| 2 | `packages/shared/src/__tests__/retry.test.ts` | `withRetry` / `defaultClassify` / `SHEETS_RETRY_PRESET` | 7 |
| 3 | `packages/shared/src/__tests__/transaction.test.ts` | `runWithCompensation` | 5 |
| 4 | `apps/api/src/middleware/__tests__/error-handler.test.ts` | `errorHandler` ミドルウェア | 6 |
| 5 | `apps/api/src/__tests__/error-handler.integration.test.ts` | Hono app への配線 + e2e | 4 |

合計: 29 ケース

## 命名規則整合確認（Phase 1 inventory より）

| 種別 | 規則 | 適用例 |
| --- | --- | --- |
| ファイル名 | kebab-case | `error-handler.ts` / `transaction.ts` / `errors.test.ts` |
| 関数 / 変数 | camelCase | `withRetry` / `runWithCompensation` / `logError` |
| 型 / クラス | PascalCase | `ApiError` / `RetryOptions` / `CompensationStep` |
| 定数 | SCREAMING_SNAKE | `UBM_ERROR_CODES` / `SHEETS_RETRY_PRESET` |
| エラーコード値 | `UBM-Nxxx` | `"UBM-5000"` |

## private method テスト方針

- 原則 public callback / 公開 API 経由でカバー（`runWithCompensation` の戻り値・throw の有無で検証）
- どうしても private 単体検証が必要な場合のみ `(facade as unknown as Private)` キャスト方式を採用
- `as any` は禁止
- `__tests__/types.ts` に Private インターフェースを集約（vitest 導入時）

## モック戦略

| 対象 | モック手法 |
| --- | --- |
| Hono `Context` | `new Hono()` でテスト用 app を組み立て、`app.request()` でリクエスト発行 |
| D1Database | `Miniflare` または手書き mock（`prepare()/bind()/run()/all()/first()` の最小実装）|
| `crypto.randomUUID` | `vi.spyOn(crypto, "randomUUID")` で固定値返却 |
| `Date.now` | `vi.useFakeTimers()` で進行制御 |
| `setTimeout` | fake timer で即時進行 |
| `console.error/warn` | `vi.spyOn(console, "error")` で呼び出し検証 |

## 期待結果（RED 確認）

- 5 ファイル合計 29 ケースが「`Cannot find module`」「export 未定義」のいずれかで失敗
- `assertion failed` ではなく「モジュール不在」での失敗を許容（vitest 導入前の正常な RED 状態）
- 本プロジェクトには vitest 未導入のため、「実行確認」は将来 vitest セットアップ後に補完
- Phase 5 で実装が完了すれば、上記 29 ケース全てが GREEN になる構造を保証

## 実行コマンド（将来）

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test -- --run
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run
```

## 統合テスト連携

| 連携先 | 内容 |
| --- | --- |
| Phase 5 | テスト仕様を実装ガイドとして使用、各テストケースの期待値をそのまま実装の receiver にする |
| Phase 6 | 異常系（5xx 連続失敗・補償処理二重失敗・サニタイズ漏洩）を実装後の検証ケースとして追加 |
| Phase 9 | typecheck/lint で型レベル検証、テスト本数（29）を baseline として記録 |

## 不変条件

| # | 不変条件 |
| --- | --- |
| INV-T1 | 各ファイルが「1 ファイル 1 関心」を守る（cross-cutting テストは禁止）|
| INV-T2 | private 検証は `(facade as unknown as Private)` キャスト方式のみ |
| INV-T3 | Workers 制約（fake timer での `setTimeout` 検証）を含む |
| INV-T4 | レスポンスボディとログの両方で漏洩なしを確認するテストが含まれる |
