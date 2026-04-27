# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認 |
| 作成日 | 2026-04-27 |
| 前 Phase | 6 (テスト拡充) |
| 次 Phase | 8 (DRY / 設定整理) |
| 状態 | spec_created |

## 目的

Phase 5 / 6 で配置 / 拡充されたテストに対して vitest のカバレッジを計測し、UT-10 で**変更したファイルのみ**を対象に line / branch カバレッジが目標値を満たすことを確認する。広域カバレッジ（パッケージ全体一律 90%）の指定は避け（[Feedback BEFORE-QUIT-002 / Feedback 5]）、「本タスクが導入したコード」に焦点を絞る。

## 実行タスク

- Task 7-1: Phase 6 の拡充テスト込みで対象ファイル限定の coverage を計測する
- Task 7-2: 関心ごと・依存エッジごとの coverage matrix を作成する
- Task 7-3: 未到達行と `c8 ignore` の理由を全件記録する
- Task 7-4: line / branch しきい値達成を確認し、未達時は Phase 6 または Phase 5 へ差し戻す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-06.md | 拡充テスト設計 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-06/edge-case-tests.md | 異常系テスト一覧 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-06/regression-guards.md | 回帰 guard 一覧 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-06/security-leak-tests.md | セキュリティテスト一覧 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-05/file-change-list.md | coverage 対象ファイル |

## カバレッジ目標

### 対象範囲（変更ファイルのみ）

| ファイル | 役割 | 目標 line | 目標 branch |
| --- | --- | --- | --- |
| `packages/shared/src/errors.ts` | ApiError 型 + コード定数 | 95% | 90% |
| `packages/shared/src/retry.ts` | withRetry | 95% | 90% |
| `packages/shared/src/db/transaction.ts` | 補償処理 | 95% | 90% |
| `packages/shared/src/logging.ts` | 構造化ログ | 95% | 90% |
| `apps/api/src/middleware/error-handler.ts` | Hono onError | 95% | 90% |

### 対象外

- `packages/shared/src/index.ts`（barrel）: re-export のみのため除外
- `apps/api/src/index.ts`: 配線箇所のみのため統合テストでカバー
- `apps/web/app/lib/api-client.ts`: 型整合のみのため契約スナップショットでカバー（line 数値目標は設定しない）

### 例外条件

- 防御的 `default:` 分岐で実害なく到達不能なケースは `/* c8 ignore next */` を許容（本数を coverage-report.md に記録）
- Workers 専用の制約検出分岐（`globalThis.WebSocketPair` 検出等）は手動テスト fallback を許容しコメントで明示

## カバレッジ可視化

### 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test -- --run --coverage
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run --coverage
```

### 計測対象指定

- `vitest.config.ts` の `coverage.include` を上記対象 5 ファイルに限定したプロファイルを Phase 7 用に追加（既存設定は変更しない）
- レポータは `text-summary` + `json-summary` + `lcov` の 3 種を出力
- HTML レポート（`coverage/lcov-report/index.html`）の該当ファイル抜粋スクリーンショットを保存（任意）

### 集計結果記録項目

- ファイル別 line / branch / function / statement の 4 指標
- 未到達行（uncovered lines）の行番号と簡易理由
- スナップショットしきい値（lcov ベース）

## 関心ごと・依存エッジのカバレッジマトリクス

| 関心ごと | 担当ファイル | 検証テスト | 目標カバレッジ寄与 |
| --- | --- | --- | --- |
| ApiError 構築 / シリアライズ | errors.ts | errors.test.ts 1.1 / 1.2 / 1.6 | line + branch |
| 不正コード reject | errors.ts | errors.test.ts 1.7 | branch |
| `fromUnknown` 正規化 | errors.ts | errors.test.ts 1.5 | branch（unknown / Error / string 各分岐） |
| 指数バックオフ | retry.ts | retry.test.ts 2.3 | branch（attempt 増加） |
| 上限到達 | retry.ts | retry.test.ts 2.2 / 異常系 1.2 | line |
| 非リトライ判定 | retry.ts | retry.test.ts 2.4 / 異常系 1.7 | branch |
| Workers 制約丸め込み | retry.ts | retry.test.ts 2.7 / 異常系 1.3 | branch |
| 補償処理逆順実行 | db/transaction.ts | transaction.test.ts 3.2 / 異常系 1.1 | line + branch |
| 二重失敗（compensation 失敗） | db/transaction.ts | transaction.test.ts 3.3 / 異常系 1.6 | branch |
| 構造化ログ | logging.ts | error-handler.test.ts 4.4 / security 3.4 | line + branch（redact 分岐） |
| 5xx 機密マスク | error-handler.ts | error-handler.test.ts 4.2 / security 3.1-3.3 | branch（status >= 500 分岐） |
| 4xx detail 透過 | error-handler.ts | error-handler.test.ts 4.3 | branch |
| 不明ルート → UBM-1404 | error-handler.ts (notFound 経由) | integration 5.3 | branch |
| RFC 7807 ヘッダ | error-handler.ts | error-handler.test.ts 4.5 / 回帰 2.3 | line |
| トレース整合 | error-handler.ts + logging.ts | error-handler.test.ts 4.6 / 回帰 2.4 | line |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 拡充テストの寄与によりカバレッジ目標到達を確認 |
| Phase 8 | カバレッジ低下を伴わない DRY 整理を要件化 |
| Phase 9 | 品質保証時にしきい値再確認 |

## 多角的チェック観点（AIが判断）

- 価値性: カバレッジ目標が「本タスクの変更行」に正しく集中しているか
- 実現性: 既存パッケージ全体のしきい値設定と衝突していないか
- 整合性: マトリクスの各関心ごとに少なくとも 1 つのテストが対応しているか
- 運用性: c8 ignore の使用が最小限で、理由が記録されているか
- 安全性: カバレッジ未達の分岐を見過ごさないため、未到達行を全件レビュー

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | vitest coverage 設定追加 | 7 | spec_created | include を 5 ファイルに限定 |
| 2 | shared パッケージ coverage 計測 | 7 | spec_created | 4 ファイル対象 |
| 3 | api パッケージ coverage 計測 | 7 | spec_created | 1 ファイル対象 |
| 4 | カバレッジマトリクス作成 | 7 | spec_created | 関心 × テスト |
| 5 | 未到達行レビュー | 7 | spec_created | 行番号 + 理由 |
| 6 | しきい値達成確認 | 7 | spec_created | 95 / 90 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/coverage-report.md | ファイル別 line / branch / function / statement と未到達行 |
| ドキュメント | outputs/phase-07/coverage-matrix.md | 関心ごと × テスト × 担当ファイルのマトリクス |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 対象 5 ファイルすべてが line 95% 以上
- [ ] 対象 5 ファイルすべてが branch 90% 以上
- [ ] 未到達行がすべて記録され、c8 ignore は理由付きで最小限
- [ ] coverage-matrix.md に全関心ごとが網羅されている
- [ ] 既存パッケージ全体のしきい値設定と衝突していない
- [ ] vitest --coverage の生ログ抜粋が証跡として保存

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- カバレッジ目標未達がある場合は Phase 6 に差し戻し記録
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 8 (DRY / 設定整理)
- 引き継ぎ事項: coverage-report.md / coverage-matrix.md と、カバレッジ未達があった場合の差し戻し履歴
- ブロック条件: いずれかの対象ファイルで line 95% 未満 / branch 90% 未満が残っている場合は次 Phase に進まない
