# Phase 4: テスト作成（TDD Red フェーズ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト作成（TDD Red フェーズ） |
| 作成日 | 2026-04-27 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装 / TDD Green) |
| 状態 | spec_created |

## 目的

Phase 2 / 3 で確定した設計（`ApiError` 型・UBM エラーコード体系・`errorHandler` ミドルウェア・`withRetry` 関数・D1 補償処理パターン・構造化ログ）に対して、実装よりも先にテストコードを記述し、すべて RED（失敗）で停止することを確認する。これにより Phase 5 の実装が「テストを GREEN にする」という単一の責務に集中でき、設計と実装の乖離を防ぐ。Issue #12 完了条件のうち、検証可能な項目（クライアント漏洩なし・retry の最大回数・補償処理の整合）をテスト仕様として固定化する。

## 実行タスク

- 5 つのテストファイルを設計し、テストケースを列挙する
- 各テストケースの「期待される失敗メッセージ」（RED 確認用）を明記する
- private method テスト方針（[Feedback P0-09-U1]）に整合した記述方式を選択する
- 命名規則（既存コード慣習）との整合を Phase 1 inventory から照合する
- すべてのテストが RED で停止することを確認するコマンドを記載する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/api-error-schema.md | ApiError 型仕様 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/error-code-taxonomy.md | エラーコード体系 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/error-handler-middleware-design.md | Hono onError 設計 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/retry-strategy-design.md | withRetry 仕様 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/d1-compensation-pattern.md | 補償処理パターン |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/structured-log-format.md | 構造化ログ仕様 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-03/gate-decision.md | GO 判定根拠 |
| 参考 | RFC 7807 Problem Details for HTTP APIs | レスポンス標準 |

## テストスイート設計

### 1. `packages/shared/src/__tests__/errors.test.ts`

| # | テストケース | 検証観点 | RED 期待理由 |
| --- | --- | --- | --- |
| 1.1 | `ApiError` コンストラクタが `code` / `status` / `title` / `detail` / `type` / `instance` を受理し、すべて public プロパティとして読み取れる | RFC 7807 + UBM 拡張 | `ApiError` 未実装 |
| 1.2 | `toJSON()` が RFC 7807 準拠キー（type/title/status/detail/instance）と UBM `code` を含む JSON を返す | シリアライズ契約 | 未実装 |
| 1.3 | `instance` 省略時に `urn:uuid:*` 形式の自動採番が行われる | トレース一意性 | 未実装 |
| 1.4 | UBM エラーコード定数（UBM-1xxx / UBM-4xxx / UBM-5xxx / UBM-6xxx）が export されている | コード体系 | 未実装 |
| 1.5 | `ApiError.fromUnknown(err)` が `Error` / `string` / `unknown` を `ApiError` に正規化する | 入口正規化 | 未実装 |
| 1.6 | `ApiError` が `Error` を継承し `instanceof Error === true` | 例外チェイン互換 | 未実装 |
| 1.7 | `code` が UBM 体系外（例: `OTHER-1`）の場合にコンストラクタが throw する | 不正値ガード | 未実装 |

### 2. `packages/shared/src/__tests__/retry.test.ts`

| # | テストケース | 検証観点 | RED 期待理由 |
| --- | --- | --- | --- |
| 2.1 | `withRetry(fn, { maxAttempts: 3 })` が成功時に 1 回だけ `fn` を呼ぶ | 正常系 | `withRetry` 未実装 |
| 2.2 | 連続失敗時に最大 3 回まで再試行し、最終失敗で `ApiError(code: UBM-6xxx)` を throw | 上限契約 | 未実装 |
| 2.3 | 指数バックオフ間隔（initialDelayMs × 2^n）でディレイされる（fake timer 検証） | バックオフ | 未実装 |
| 2.4 | `retryable` 判定 false のエラーは即座に re-throw（リトライしない） | 非リトライ | 未実装 |
| 2.5 | `signal: AbortSignal` で abort 後はリトライ停止 | キャンセル | 未実装 |
| 2.6 | `totalTimeoutMs` 超過時に `UBM-6002` を throw（Workers CPU 制限近接ガード） | タイムアウト | 未実装 |
| 2.7 | Workers 実行コンテキストが in-request の場合に `maxAttempts` が安全上限（例: 2）に丸められる旨の警告ログ | Workers 制約 | 未実装 |

### 3. `packages/shared/src/__tests__/transaction.test.ts`

| # | テストケース | 検証観点 | RED 期待理由 |
| --- | --- | --- | --- |
| 3.1 | `runWithCompensation(steps)` が全 step 成功時に compensation を呼ばない | happy path | 未実装 |
| 3.2 | 中間 step 失敗時に成功済み step の compensation を逆順で呼ぶ | ロールバック | 未実装 |
| 3.3 | compensation 自体が失敗した場合に `UBM-5101`（compensation_failed）を throw し、失敗詳細を `cause` chain に保持 | 二重失敗 | 未実装 |
| 3.4 | D1 batch 部分失敗（mock）に対して dead letter 記録ステップが呼ばれる | DLQ | 未実装 |
| 3.5 | private method `_buildCompensationPlan` を `(facade as unknown as Private)` キャストでテスト（[Feedback P0-09-U1] 準拠） | private 検証 | 未実装 |

### 4. `apps/api/src/middleware/__tests__/error-handler.test.ts`

| # | テストケース | 検証観点 | RED 期待理由 |
| --- | --- | --- | --- |
| 4.1 | 未捕捉例外（`throw new Error("boom")`）を `ApiError(UBM-5000)` に正規化して 500 を返す | 入口正規化 | middleware 未実装 |
| 4.2 | 5xx 応答ボディに stack trace / 環境変数 / DB 接続文字列 / token を含まない | 機密非開示 | 未実装 |
| 4.3 | 4xx の `ApiError` は `detail` をそのままクライアントに伝達する | UX 整合 | 未実装 |
| 4.4 | `console.error` が JSON 1 行（structured log 仕様）で出力され `code` / `status` / `requestId` / `instance` を含む | 構造化ログ | 未実装 |
| 4.5 | `Content-Type: application/problem+json` を設定する | RFC 7807 | 未実装 |
| 4.6 | 既知 `ApiError` の `instance` が response と log で同一値 | トレース整合 | 未実装 |

### 5. `apps/api/src/__tests__/error-handler.integration.test.ts`

| # | テストケース | 検証観点 | RED 期待理由 |
| --- | --- | --- | --- |
| 5.1 | Hono app に errorHandler を組み込み、ハンドラ内 `throw new ApiError(...)` が期待 status と body で返る | E2E 経路 | 未配線 |
| 5.2 | 認証ミドルウェアで throw された `UBM-4001` が 401 + RFC 7807 ボディで返る | 認証連携 | 未配線 |
| 5.3 | 不明ルート（404）が `UBM-1404` の ApiError 形式に正規化される | 既存 404 統一 | 未配線 |
| 5.4 | `apps/web` の API クライアント（`api-client.ts`）が返却 JSON を `ApiError` 互換型としてパースできる契約スナップショット | クライアント整合 | 未整合 |

## private method テスト方針

- 原則 public callback（`runWithCompensation` 等のファクター経由）でカバーする
- どうしても private 単体検証が必要な場合のみ `(facade as unknown as Private)` キャストを使用（[Feedback P0-09-U1]）
- `as any` は禁止。型安全な Private インターフェース宣言を `__tests__/types.ts` に集約する

## 命名規則整合確認

- ファイル: kebab-case（`error-handler.ts`, `transaction.ts`）
- 関数 / 変数: camelCase（`withRetry`, `runWithCompensation`）
- 型: PascalCase（`ApiError`, `RetryOptions`）
- エラーコード定数: SCREAMING_SNAKE 風 + ハイフン体系（`UBM_5000` シンボル / `"UBM-5000"` 値）
- Phase 1 inventory（outputs/phase-01/codebase-inventory.md）の既存慣習と矛盾がないことを確認すること

## 期待結果（RED 確認）

- 上記 5 ファイル合計 30 ケース前後がすべて FAIL する
- FAIL 理由は「import 失敗」「export 未定義」「ハンドラ未配線」のいずれかであり、「assertion failed」ではないことを許容（モジュールが存在しない時点の RED として正常）
- vitest の `--reporter=verbose` 出力を red-confirmation.md に貼り付ける

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test -- --run
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run
```

両者 exit code 非 0 で停止することを確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | GO 判定の設計成果物をテスト仕様の根拠として参照 |
| Phase 5 | RED 状態のテストを GREEN へ遷移させる実装計画の入力 |
| Phase 6 | 拡充テスト（異常系 / 回帰 guard）の土台 |
| Phase 9 | 品質保証時のテストインデックスとして利用 |

## 多角的チェック観点（AIが判断）

- 価値性: Issue #12 完了条件の各項目に対応するテストが少なくとも 1 件存在するか
- 実現性: Workers ランタイム制約下でも fake timer / mock で検証できる設計か
- 整合性: RFC 7807 + UBM 拡張のフィールドが過不足なく検証されているか
- 運用性: テスト失敗時の原因特定が容易（明確な assertion メッセージ・1 ファイル 1 関心）か
- セキュリティ: 機密情報非開示テストがレスポンス body / log の両方で検証されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | errors.test.ts 設計 | 4 | spec_created | 7 ケース |
| 2 | retry.test.ts 設計 | 4 | spec_created | 7 ケース |
| 3 | transaction.test.ts 設計 | 4 | spec_created | 5 ケース |
| 4 | error-handler.test.ts 設計 | 4 | spec_created | 6 ケース |
| 5 | error-handler.integration.test.ts 設計 | 4 | spec_created | 4 ケース |
| 6 | private テスト方針整合確認 | 4 | spec_created | [Feedback P0-09-U1] |
| 7 | 命名規則整合確認 | 4 | spec_created | inventory 参照 |
| 8 | RED 確認実行 | 4 | spec_created | 両 filter 失敗を確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-design.md | 5 ファイルのテスト設計総括 |
| ドキュメント | outputs/phase-04/test-cases.md | 全テストケース一覧（# / 観点 / 期待結果） |
| ドキュメント | outputs/phase-04/red-confirmation.md | vitest 失敗ログ抜粋と RED 状態確認結果 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 5 ファイル合計 25 ケース以上のテスト仕様が記述されている
- [ ] Issue #12 完了条件の検証可能項目すべてに対応テストが紐づいている
- [ ] private method テスト方針が [Feedback P0-09-U1] と整合
- [ ] 命名規則整合確認が Phase 1 inventory に基づいて記述されている
- [ ] vitest 実行結果が RED であることを red-confirmation.md に記録
- [ ] 機密情報非開示テストがレスポンス / ログの両側で定義されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- RED 確認のコマンド出力が証跡として保存されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 5 (実装 / TDD Green)
- 引き継ぎ事項: test-design.md / test-cases.md / red-confirmation.md と、各テストが期待する import パス・型シグネチャ一覧
- ブロック条件: RED が確認できないテスト（GREEN 状態でコミットされたテスト）が残っている場合は次 Phase に進まない
