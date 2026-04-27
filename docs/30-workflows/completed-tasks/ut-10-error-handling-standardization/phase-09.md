# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-27 |
| 前 Phase | 8 (リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |

## 目的

Phase 5〜8 で構築した `@ubm-hyogo/shared` のエラー基盤・`apps/api` の errorHandler ミドルウェア・設計ドキュメント (`apps/api/docs/error-handling.md`) について、line budget / link 検証 / mirror parity / typecheck / lint / test の 6 ゲートを通過させ、Phase 10 の最終レビューに必要な品質情報を完成させる。削除確認は「git delete OR stub 化かつ live import ゼロ」を PASS 条件とする（[FB-UI-02-1] 準拠）。

## 実行タスク

- Task 9-1: line budget / link / mirror parity のドキュメント品質ゲートを実行する
- Task 9-2: typecheck / lint / test のコード品質ゲートを実行する
- Task 9-3: Phase 8 の削除・stub 化判断を live import ゼロで確認する
- Task 9-4: Phase 10 の最終レビューに渡す品質保証サマリーを作成する

## 品質ゲート【必須】

### 1. Line budget

| ファイル | 上限行数 | 根拠 |
| --- | --- | --- |
| `packages/shared/src/errors.ts` | 250 行 | エラーコード定数 + ApiError + factory に限定 |
| `packages/shared/src/retry.ts` | 150 行 | withRetry + RetryPolicy preset のみ |
| `packages/shared/src/db/transaction.ts` | 200 行 | withCompensation + dead letter フック |
| `packages/shared/src/logging.ts` | 200 行 | createLogger + サニタイズキーリスト |
| `apps/api/src/middleware/error-handler.ts` | 150 行 | mapToApiError + ミドルウェア本体のみ |
| `apps/api/docs/error-handling.md` | 600 行 | 設計ドキュメントとして必要十分 |

> 上限超過時は Phase 8 のリファクタに差し戻す。

### 2. Link 検証

| 確認対象 | 確認内容 | 期待状態 |
| --- | --- | --- |
| `apps/api/docs/error-handling.md` 内の参照リンク | RFC 7807 / 01-api-schema.md / `@ubm-hyogo/shared/errors` への相対パスがすべて解決すること | リンク切れゼロ |
| `docs/30-workflows/ut-10-error-handling-standardization/index.md` から各 phase への back link | phase-01〜phase-13 すべてへの forward link が存在 | リンク切れゼロ |
| `index.md` から `apps/api/docs/error-handling.md` への参照 | 設計ドキュメントへの forward link が記載 | 記載あり |
| outputs/phase-XX/*.md 内の相対参照 | 同 outputs 配下および phase-XX.md への参照 | リンク切れゼロ |

### 3. Mirror parity（subpath export と consumer 側 import の一致）

| 観点 | 確認方法 | 期待状態 |
| --- | --- | --- |
| `@ubm-hyogo/shared/errors` subpath | `packages/shared/package.json#exports` に明示 | 明示あり |
| `@ubm-hyogo/shared/retry` subpath | 同上 | 明示あり |
| `@ubm-hyogo/shared/db` subpath | 同上 | 明示あり |
| `@ubm-hyogo/shared/logging` subpath | 同上 | 明示あり |
| consumer 側 import 一致 | `apps/api` / `apps/web` の `from "@ubm-hyogo/shared/*"` 経路が exports に一致 | 全件一致 |
| root barrel 経由 import の残存 | grep `from "@ubm-hyogo/shared"` で errors/retry/db/logging symbol を抽出 | live import ゼロ |

### 4. Typecheck

```bash
mise exec -- pnpm typecheck
```

- exit code 0 を PASS とする
- `apps/web` / `apps/api` / `packages/shared` 全パッケージで型エラーゼロ
- `ApiError` 型が apps/web 側で正しく narrowing されている

### 5. Lint

```bash
mise exec -- pnpm lint
```

- exit code 0 を PASS とする
- 警告ゼロを推奨（warning 残存時は Phase 10 の MINOR として記録）

### 6. Test 全件

```bash
mise exec -- pnpm test
```

- exit code 0 を PASS とする
- Phase 6 で設計したテスト資産が全件 GREEN
- 機密情報非開示テスト（4xx/5xx レスポンスにスタックトレース・DB 文字列・トークンが含まれない）が PASS

## 削除確認方針【必須】（[FB-UI-02-1] 準拠）

| 確認項目 | PASS 条件 | 確認方法 |
| --- | --- | --- |
| Phase 8 で廃止した root barrel 再 export | git delete されている、または stub 化かつ live import ゼロ | `git log -- packages/shared/src/index.ts` + grep |
| 旧 ApiError 型のローカル再定義（apps/web 側） | 削除されている、または stub かつ live import ゼロ | grep `interface ApiError` / `type ApiError` |
| 旧エラーコード文字列リテラル直書き | 削除されている、または stub 化 | grep `"UBM-[0-9]"` で `ERROR_CODES` 経由でない箇所がゼロ |

> 「機能影響なし」を理由に削除を見送らない（[Phase 12 漏れ防止] 準拠）。残存する場合は Phase 10 の MINOR として明示的に記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-08.md | リファクタ結果 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-06.md | テスト資産 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-07.md | AC トレース |
| 必須 | apps/api/docs/error-handling.md | 設計ドキュメント |
| 参考 | CLAUDE.md | シークレット管理方針 |
| 参考 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/phase-09.md | 雛形 |

## 実行手順

### ステップ 1: 6 ゲートの順次実行

- line budget → link 検証 → mirror parity → typecheck → lint → test の順に実行する
- 各ゲートの結果を `quality-report.md` に PASS / FAIL で記録する

### ステップ 2: 削除確認

- Phase 8 で廃止対象とした symbol / 再 export を一覧化する
- git delete または stub 化 + live import ゼロを 1 件ずつ確認する

### ステップ 3: 品質レポート作成

- `quality-report.md` に 6 ゲート結果と削除確認結果を集約する
- `link-checklist.md` にリンク検証の詳細を記録する
- `type-check-report.md` に typecheck 結果（パッケージ別エラー件数等）を記録する
- FAIL があれば Phase 8 / Phase 5 に差し戻す

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | line budget / mirror parity FAIL 時に差し戻す |
| Phase 6 | test FAIL 時に test 設計の見直しを行う |
| Phase 10 | 6 ゲート結果を最終レビューの前提とする |

## 多角的チェック観点（AIが判断）

- 価値性: 6 ゲートが下流タスクへの引き継ぎ品質を担保しているか
- 実現性: Workers 制約下で全テストが現実的に実行可能か
- 整合性: subpath export と consumer 側 import が一致しているか
- 運用性: 削除確認方針が「機能影響なし」を理由に PASS 化していないか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | line budget 計測 | 9 | spec_created | 6 ファイル対象 |
| 2 | link 検証 | 9 | spec_created | error-handling.md / index.md |
| 3 | mirror parity 確認 | 9 | spec_created | 4 subpath |
| 4 | typecheck 実行 | 9 | spec_created | `mise exec -- pnpm typecheck` |
| 5 | lint 実行 | 9 | spec_created | `mise exec -- pnpm lint` |
| 6 | test 全件実行 | 9 | spec_created | `mise exec -- pnpm test` |
| 7 | 削除確認 | 9 | spec_created | git delete OR stub + live import ゼロ |
| 8 | 品質レポート作成 | 9 | spec_created | quality-report.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/quality-report.md | 6 ゲート結果と削除確認結果の総括 |
| ドキュメント | outputs/phase-09/link-checklist.md | リンク検証の詳細 |
| ドキュメント | outputs/phase-09/type-check-report.md | typecheck 結果 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] line budget の全ファイルが上限内である
- [ ] link 検証でリンク切れがゼロ
- [ ] mirror parity が全 subpath で一致
- [ ] typecheck / lint / test が全件 PASS
- [ ] 削除確認が「git delete OR stub かつ live import ゼロ」で全件 PASS
- [ ] quality-report.md / link-checklist.md / type-check-report.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスクが spec_created
- 全成果物が指定パスに配置済み
- 異常系（テスト RED・lint warning・リンク切れ）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 10 (最終レビュー)
- 引き継ぎ事項: 6 ゲート結果（quality-report.md）と削除確認結果を Phase 10 の最終レビューに引き継ぐ
- ブロック条件: いずれかのゲートが FAIL の場合は Phase 10 に進まない
