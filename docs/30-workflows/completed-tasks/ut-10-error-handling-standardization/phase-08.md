# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 作成日 | 2026-04-27 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |

## 目的

Phase 5〜7 で実装・検証した `@ubm-hyogo/shared/errors` / `retry` / `db/transaction` / `logging` および `apps/api` 側 `errorHandler` ミドルウェア群について、duplicate（重複定義・コピー実装）と navigation drift（barrel export 崩壊・import 経路の揺れ）を削る。さらに `apps/web` 側 API クライアントの `ApiError` 型整合を最終確認し、subpath export を優先した import パスへ揃える（[Feedback W0-01] 準拠）。コードの挙動は変えず、構造のみ整える docs + non-functional refactor 範囲で完結させる。

## 実行タスク

- Task 8-1: Phase 2 の設計成果物と Phase 7 の coverage 結果を照合し、重複・命名揺れ・import drift を抽出する
- Task 8-2: `@ubm-hyogo/shared` の subpath export と consumer import を揃える
- Task 8-3: `ApiError` と `apps/web` API クライアント型の契約整合を確認する
- Task 8-4: 動作変更なしのリファクタ結果を `対象/Before/After/理由` で記録する
- Task 8-5: リファクタ後に Phase 6 / 7 の検証を再実行し、coverage 低下がないことを確認する

## リファクタ対象テーブル【必須】（[Feedback RT-03] 準拠）

| # | 対象 | Before | After | 理由 |
| --- | --- | --- | --- | --- |
| 1 | `packages/shared/src/errors.ts` のエラーコード定数 | UBM-1xxx / 4xxx / 5xxx / 6xxx の文字列リテラルが各所にハードコード | `ERROR_CODES` 定数オブジェクト + `ErrorCode` 型 (`as const` + `keyof typeof`) に集約 | 文字列の typo を型で防止し、grep 容易性とリネーム安全性を確保 |
| 2 | `packages/shared/src/errors.ts` の `ApiError` 構築 | `new ApiError({ type, title, status, detail, code, instance })` を呼び出し側でコピー組み立て | `ApiError.from(code, overrides?)` ファクトリで code → status / title をルックアップ集約 | RFC 7807 マッピングを 1 箇所に固定し、呼び出し側の冗長さを排除 |
| 3 | `packages/shared/src/retry.ts` の `withRetry` callable interface | `withRetry(fn, { retries, baseMs, jitter })` 形式で Sheets / 他用途で個別の option 名差異が発生 | `withRetry<T>(fn, policy: RetryPolicy)` に統一し、`SHEETS_RETRY_POLICY` 等の preset を export | 用途間で option ドリフトを防ぎ、呼び出し側を 1 行で読める形に整える |
| 4 | `packages/shared/src/db/transaction.ts` の補償処理 | `try { ... } catch { manualRollbackQueries() }` を ad-hoc に記述 | `withCompensation(steps[], { idempotencyKey, deadLetter })` ヘルパに昇格 | D1 ネスト TX 不可前提の補償パターンを再利用可能にし、dead letter フックを標準化 |
| 5 | `packages/shared/src/logging.ts` の log フォーマット | `console.log(JSON.stringify({...}))` が module 内に散在 | `createLogger(context)` で `info/warn/error` を返し、サニタイズキーリストを内蔵 | DRY 化し、PII / トークンのサニタイズ抜け漏れを構造的に防ぐ |
| 6 | `apps/api/src/middleware/error-handler.ts` の例外分岐 | `if (err instanceof ApiError) ... else if (err instanceof ZodError) ...` の長い if 連鎖 | `mapToApiError(err)` 純関数に切り出し、ミドルウェア本体は map → response の 2 ステップへ縮小 | 単体テスト容易性を上げ、未知例外の fallthrough を 1 箇所に固定 |
| 7 | `apps/api/docs/error-handling.md` 内リンク | 親 spec (`doc/00-getting-started-manual/specs/01-api-schema.md`) への相対パスがズレるリスク | 相対パス + アンカーを明示し、index からの forward link / back link を双方向に整備 | ドキュメントの navigation drift を防ぐ |

## ナビゲーション・型整合確認【必須】（[Feedback W0-01] 準拠）

| 観点 | 方針 | 確認内容 |
| --- | --- | --- |
| subpath export 優先 | `@ubm-hyogo/shared/errors` / `@ubm-hyogo/shared/retry` / `@ubm-hyogo/shared/db` / `@ubm-hyogo/shared/logging` の 4 subpath を `package.json#exports` に明示 | root barrel (`@ubm-hyogo/shared`) からの再 export は廃止または `// re-export only for legacy` コメント付きに退避 |
| root barrel 衝突回避 | 同名 symbol（`ApiError` / `ErrorCode` 等）の root barrel 経由 import を禁止 | grep で `from "@ubm-hyogo/shared"` のうち errors/retry 系を抽出し、subpath import に置換 |
| consumer import 経路 | `apps/api` / `apps/web` の import を全件 subpath に統一 | tsconfig path alias の重複定義がないか確認 |
| circular import | `errors` ⇄ `logging` の相互参照禁止 | `logging` が `errors` を参照する片方向のみに限定 |

## ApiError と既存 API クライアント型同期確認【必須】

| 同期項目 | apps/api 側 | apps/web 側 | 整合方法 |
| --- | --- | --- | --- |
| `ApiError` shape | `@ubm-hyogo/shared/errors` の `ApiError` を throw / serialize | `@ubm-hyogo/shared/errors` の `ApiError` 型を import | 同一 type definition を参照（型コピー禁止） |
| エラーコード列挙 | `ERROR_CODES.UBM_1001` 等を使用 | `apps/web/app/lib/api-client.ts` で `ErrorCode` 型 narrowing | `as const` 由来の literal union を共有 |
| `application/problem+json` レスポンス body | errorHandler が出力 | api-client が parse | 契約テストで shape 一致を保証（Phase 6 の test 資産を参照） |
| HTTP ステータス対応 | `code → status` map を errors.ts に集約 | api-client は status 単独参照ではなく `code` を判断材料に追加 | 同一 lookup table を共有 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-05.md | 実装内容の確認 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/api-error-schema.md | 型設計との整合確認 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/error-code-taxonomy.md | エラーコード体系との整合確認 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-06.md | テスト網羅性 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/phase-07.md | 検証項目との突き合わせ |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-07/coverage-report.md | coverage 低下防止 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-07/coverage-matrix.md | 依存エッジ網羅性確認 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | API 契約整合 |
| 参考 | RFC 7807 Problem Details for HTTP APIs | 標準準拠性 |
| 参考 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/phase-08.md | 雛形 |

## 実行手順

### ステップ 1: duplicate / navigation drift の洗い出し

- 重複コード（同一エラーコード定数、同一サニタイズキーリスト等）を grep で抽出する
- root barrel 経由 import と subpath import の混在箇所を一覧化する
- `apps/web` の API クライアントで `ApiError` 型をローカル再定義していないか確認する

### ステップ 2: リファクタ案の確定

- 上記「リファクタ対象テーブル」の 7 件について Before/After を確定する
- 動作変更の有無を全件で No-functional-change と確認する（テストは Phase 6 のものをそのまま流用可能）

### ステップ 3: 適用と検証

- subpath export を `package.json#exports` に追加し、consumer 側 import を一括置換する
- typecheck / lint / test 全件を再実行し、grEEN を確認する（Phase 9 の品質ゲートで再確認する）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | 既存テスト資産がリファクタ後も全件 GREEN であることを確認 |
| Phase 9 | line budget / link 検証 / mirror parity を品質ゲートで再確認 |
| Phase 10 | リファクタ結果を AC-1 / AC-7 のトレースに反映 |

## 多角的チェック観点（AIが判断）

- 価値性: subpath export と DRY 化が下流タスク（UT-09 / UT-07 / UT-08）の参照容易性を上げるか
- 実現性: Workers / Hono の bundler 制約下で subpath export が正常に解決されるか
- 整合性: `apps/web` ApiError と `apps/api` ApiError が同一型を参照しているか
- 運用性: navigation drift（import 経路揺れ）を構造的に防げているか

## 削除確認方針

- duplicate 削除は「git delete OR stub 化かつ live import ゼロ」で PASS とする（[FB-UI-02-1] 準拠）
- root barrel からの再 export を廃止する場合は、live import がゼロであることを grep で確認する

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | duplicate 抽出 | 8 | spec_created | errors / retry / logging 対象 |
| 2 | navigation drift 抽出 | 8 | spec_created | root barrel vs subpath |
| 3 | リファクタ対象テーブル確定 | 8 | spec_created | 7 件 Before/After |
| 4 | subpath export 整備 | 8 | spec_created | `package.json#exports` |
| 5 | consumer import 一括置換 | 8 | spec_created | apps/api + apps/web |
| 6 | ApiError 型同期最終確認 | 8 | spec_created | apps/web api-client.ts |
| 7 | リファクタ決定表作成 | 8 | spec_created | refactor-decision-table.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/refactor-changes.md | 適用したリファクタの Before/After 一覧 |
| ドキュメント | outputs/phase-08/refactor-decision-table.md | 7 件の対象/Before/After/理由表 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] リファクタ対象テーブル 7 件すべての Before/After が記録されている
- [ ] subpath export (`@ubm-hyogo/shared/errors` 等) が package.json に明示されている
- [ ] root barrel 経由 import が live で残っていない（grep ゼロ）
- [ ] `apps/web` ApiError と `apps/api` ApiError の型同期が確認されている
- [ ] No-functional-change が typecheck / lint / test 全件 GREEN で確認されている
- [ ] 削除対象は git delete または stub 化で live import ゼロが確認されている

## タスク100%実行確認【必須】

- 全実行タスクが spec_created
- 全成果物が指定パスに配置済み
- 異常系（subpath 解決失敗・circular import）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: refactor-changes.md / refactor-decision-table.md と subpath export 整備状況を Phase 9 の品質ゲートに引き継ぐ
- ブロック条件: typecheck / lint / test のいずれかが RED の場合は Phase 9 に進まない
