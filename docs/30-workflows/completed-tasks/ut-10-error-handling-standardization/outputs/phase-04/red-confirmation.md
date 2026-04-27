# RED 確認結果（Phase 4 成果物）

## 確認方針

本プロジェクトでは現時点で `vitest` 等のテストランナーが未導入のため、`pnpm test` コマンドで通常の RED 確認は実施できない。代替として以下を実施した:

1. テストファイル仕様（test-design.md / test-cases.md）の完成
2. 仕様の中で参照するモジュールパス（`@ubm-hyogo/shared` の `errors.ts` / `retry.ts` 等）が現時点で存在しないことを `find` で確認 = 「import 失敗」相当の RED
3. Phase 5 で当該モジュール実装後、テストケース仕様を満たすシグネチャになることを type レベルで保証する

## 現状確認コマンドと結果

```bash
$ ls packages/shared/src
index.ts

# → errors.ts / retry.ts / logging.ts / db/transaction.ts いずれも存在しない
# → vitest 導入後にテストを書けば全 29 ケースが「Cannot find module '../errors'」等で FAIL する
```

```bash
$ ls apps/api/src
index.ts  sync/

# → middleware/error-handler.ts も存在しない
```

## 期待される RED の根拠（vitest 導入後の想定出力）

```
FAIL  packages/shared/src/__tests__/errors.test.ts
  ● Cannot find module '../errors' from 'errors.test.ts'

FAIL  packages/shared/src/__tests__/retry.test.ts
  ● Cannot find module '../retry' from 'retry.test.ts'

FAIL  packages/shared/src/__tests__/transaction.test.ts
  ● Cannot find module '../db/transaction' from 'transaction.test.ts'

FAIL  apps/api/src/middleware/__tests__/error-handler.test.ts
  ● Cannot find module '../error-handler' from 'error-handler.test.ts'

FAIL  apps/api/src/__tests__/error-handler.integration.test.ts
  ● Cannot find module './middleware/error-handler' from 'error-handler.integration.test.ts'

Test Suites: 5 failed, 0 passed
```

これは「assertion failed」ではなく「モジュールが存在しない」段階での RED であり、Phase 4 として正常な状態である（Phase 4 仕様の「RED 確認」項目に整合）。

## Phase 5 で GREEN 化する順序（再掲）

1. `packages/shared/src/errors.ts` 実装 → 1.1〜1.7 GREEN
2. `packages/shared/src/logging.ts` 実装 → サニタイズ系補強 GREEN
3. `packages/shared/src/retry.ts` 実装 → 2.1〜2.7 GREEN
4. `packages/shared/src/db/transaction.ts` 実装 → 3.1〜3.5 GREEN
5. `packages/shared/src/index.ts` / `package.json` exports 更新
6. `apps/api/src/middleware/error-handler.ts` 実装 → 4.1〜4.6 GREEN
7. `apps/api/src/index.ts` 配線 → 5.1〜5.3 GREEN
8. `apps/web` API クライアント型整合 → 5.4 GREEN

## RED 確認のフォロー（vitest 導入後）

vitest が導入された段階で本ドキュメントを更新し、以下を貼り付ける:

```
$ mise exec -- pnpm --filter @ubm-hyogo/shared test -- --run
$ mise exec -- pnpm --filter @ubm-hyogo/api test -- --run
```

の `--reporter=verbose` 出力（FAIL 一覧）。

## 結論

- **RED 確認**: モジュール不在状態（5 ファイルすべての import 不能）として確定
- **次 Phase に進む条件**: 充足（Phase 5 で実装し、各テスト仕様の期待値を満たす実装を行う）
