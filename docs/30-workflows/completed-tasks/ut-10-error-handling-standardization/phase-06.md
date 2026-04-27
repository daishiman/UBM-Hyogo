# Phase 6: テスト拡充（異常系 / 回帰 guard / セキュリティ leak）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充（異常系 / 回帰 guard / セキュリティ leak） |
| 作成日 | 2026-04-27 |
| 前 Phase | 5 (実装 / TDD Green) |
| 次 Phase | 7 (カバレッジ確認) |
| 状態 | spec_created |

## 目的

Phase 5 で GREEN になった最小実装に対し、異常系・境界値・将来回帰を防ぐ guard・クライアント漏洩防止のセキュリティテストを追加し、Issue #12 の品質要件を充足する。本 Phase の追加テストはすべて GREEN で着地することを前提とし、RED が出た場合は Phase 5 の実装欠落として差し戻す。

## 実行タスク

- Task 6-1: Phase 5 実装を対象に異常系テストを追加する
- Task 6-2: API エラー形式・エラーコード・ヘッダの回帰 guard を追加する
- Task 6-3: クライアント漏洩防止のセキュリティテストを追加する
- Task 6-4: 補助 CLI 仕様を UT-08 連携候補として記録する
- Task 6-5: 拡充テストの GREEN 結果を Phase 7 へ引き継ぐ

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-05.md | 実装対象と変更ファイル |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-05/implementation-summary.md | GREEN 化済み実装の証跡 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-05/file-change-list.md | 拡充テスト対象ファイル |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/structured-log-format.md | redact / log 仕様 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/d1-compensation-pattern.md | D1 異常系仕様 |

## 拡充テスト設計

### 1. 異常系テスト

| # | 対象 | テストケース | 期待挙動 |
| --- | --- | --- | --- |
| 1.1 | `runWithCompensation` | D1 `batch()` の途中ステップが部分失敗（例: 3 件中 2 件目で UNIQUE 制約） | 成功済みステップの compensation が逆順実行され、`UBM-5101` を throw |
| 1.2 | `withRetry` | Sheets API 5xx を連続 N 回返す mock 配下でリトライ上限到達 | `UBM-6001` を throw、`attempts` プロパティに試行回数 |
| 1.3 | `withRetry` | Workers CPU 制限近接（`AbortSignal` が timeout 起源） | リトライ抑制し即時 `UBM-6002` を throw、構造化ログに `aborted_by_runtime` フラグ |
| 1.4 | `errorHandler` | ハンドラ内で 2 度例外が連鎖（`cause` chain 深さ 3） | 最外殻のみ `ApiError` 化し、`cause` chain は log には残すが response body には含めない |
| 1.5 | `errorHandler` | レスポンス書込中に throw（stream 途中失敗） | Hono の二重ヘッダ送信を回避、最低限のフォールバック JSON を返す |
| 1.6 | `runWithCompensation` | compensation 自身が throw する二重失敗 | `UBM-5101`（compensation_failed）+ `originalError` / `compensationError` の両方を log に記録 |
| 1.7 | `withRetry` | `retryable: () => false` 判定のエラーは即時 throw（バックオフを呼ばない） | fake timer の `advanceTimersByTime` を呼ぶ前に reject |

### 2. 回帰 guard テスト

| # | 対象 | テストケース | guard 目的 |
| --- | --- | --- | --- |
| 2.1 | `ApiError.toJSON()` | スナップショット（フィールド集合・型） | RFC 7807 + UBM フィールドの欠落 / 余剰を検出 |
| 2.2 | `UBM_ERROR_CODES` | 定数値（`"UBM-1xxx"` 等）の不変スナップショット | 既存クライアントとの後方互換破壊検出 |
| 2.3 | `errorHandler` | 5xx response の Content-Type が常に `application/problem+json` | ヘッダ仕様回帰検出 |
| 2.4 | `errorHandler` | `instance` が response と log で一致 | トレース ID 整合の回帰 |
| 2.5 | `apps/web` `api-client` | 契約スナップショット（受領 JSON → ApiError 互換型） | クライアント整合の回帰 |
| 2.6 | `withRetry` | デフォルト `maxAttempts` / `initialDelayMs` のスナップショット | 設計値の意図せぬ変更検出 |

### 3. セキュリティ leak 防止テスト

| # | 対象 | テストケース | 検証パターン |
| --- | --- | --- | --- |
| 3.1 | `errorHandler` 5xx body | スタックトレースが含まれない | response body 文字列に `at ` / `:line:col` 形式が出現しないこと |
| 3.2 | `errorHandler` 5xx body | DB 接続文字列 / `D1_*` バインディング名が含まれない | 環境変数キー名のサンプルを混入させた error → body に含まれない |
| 3.3 | `errorHandler` 5xx body | 認証トークン（Bearer / Cookie）が含まれない | `Authorization` ヘッダ値を意図的に error.message に詰めた場合でも response にマスクされる |
| 3.4 | 構造化ログ | log には stack を含めて良いが、`token` / `password` / `secret` キーは redact される | `redactKeys` リストとの整合 |
| 3.5 | 4xx body | `detail` のクライアント可視文言にユーザー入力がエスケープされて含まれる | XSS 文字列を入力した際、JSON エスケープのみ（HTML レンダリングはクライアント責務） |

### 4. 補助 command（オプショナル）

- `packages/shared/scripts/parse-error-log.ts`（CLI tool）: `console.error` で出力された JSON 1 行ログを stdin から読み、`code` 別件数集計と最近 N 件の `instance` を出力
- 本 Phase では仕様化のみ。実装は UT-08（モニタリング）で取り込む可能性を記載

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test -- --run
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run
```

すべて exit 0 / 全 GREEN を確認する。RED が出た場合は Phase 5 の実装欠落として記録し差し戻す。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 拡充テストで判明した実装欠落を差し戻し |
| Phase 7 | 拡充テスト込みのカバレッジ計測 |
| Phase 8 | DRY 整理時に redact ロジックの重複排除候補 |
| Phase 9 | 品質保証で security leak テストを最終確認 |

## 多角的チェック観点（AIが判断）

- 価値性: 実運用で発生しうる失敗パターン（部分失敗 / CPU 近接 / 二重失敗）を網羅しているか
- 実現性: fake timer / mock D1 / mock fetch のみで再現可能か
- 整合性: 回帰 guard が他タスク（UT-09 等）の利用契約を保護しているか
- 運用性: redactKeys が運用変更で容易に拡張可能か
- セキュリティ: leak テストが「stack / 認証情報 / 接続文字列」3 軸を覆っているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 異常系 7 ケース追加 | 6 | spec_created | edge cases |
| 2 | 回帰 guard 6 ケース追加 | 6 | spec_created | snapshot |
| 3 | セキュリティ leak 5 ケース追加 | 6 | spec_created | redact 検証 |
| 4 | 補助 CLI 仕様化 | 6 | spec_created | UT-08 連携候補 |
| 5 | 全 GREEN 確認実行 | 6 | spec_created | exit 0 を verify |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/edge-case-tests.md | 異常系テスト一覧と期待挙動 |
| ドキュメント | outputs/phase-06/regression-guards.md | スナップショット / 不変条件 guard 一覧 |
| ドキュメント | outputs/phase-06/security-leak-tests.md | クライアント漏洩防止テストと redact 規則 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 異常系テスト 7 ケース以上が追加され GREEN
- [ ] 回帰 guard テスト 6 ケース以上が追加され GREEN
- [ ] セキュリティ leak テスト 5 ケース以上が追加され GREEN
- [ ] `redactKeys` 一覧が security-leak-tests.md に明記
- [ ] 補助 CLI の仕様（オプショナル）が記載
- [ ] 全 GREEN 確認の vitest ログが保存

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 拡充テスト追加によって既存 GREEN テストが REGRESS していないことを確認
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 7 (カバレッジ確認)
- 引き継ぎ事項: edge-case-tests.md / regression-guards.md / security-leak-tests.md と、カバレッジ計測対象ファイルパス確定リスト
- ブロック条件: 拡充テストに RED が残る、または回帰 guard が壊れている場合は次 Phase に進まない
