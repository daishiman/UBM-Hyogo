# リファクタ決定表（Phase 8 成果物）

## 7 件のリファクタ対象 Before / After / 理由

| # | 対象 | Before | After | 理由 | 状態 |
| --- | --- | --- | --- | --- | --- |
| 1 | `packages/shared/src/errors.ts` のエラーコード定数 | UBM-1xxx / 4xxx / 5xxx / 6xxx の文字列リテラルが各所にハードコードされる懸念 | `UBM_ERROR_CODES` 定数オブジェクト + `UbmErrorCode` 型 (`as const satisfies Record<UbmErrorCode, UbmErrorCodeMeta>`) に集約。15 件のエントリが単一のソース | 文字列の typo を型で防止、grep 容易性とリネーム安全性を確保 | Phase 5 で実装済み（design-as-built） |
| 2 | `packages/shared/src/errors.ts` の `ApiError` 構築 | 呼び出し側で `type` / `title` / `status` をコピー組み立てる懸念 | コンストラクタが `code` のみを必須とし、`UBM_ERROR_CODES[code]` から `status`/`title`/`defaultDetail` を自動ルックアップ。`ApiError.fromUnknown(err, fallbackCode)` 静的ファクトリも提供 | RFC 7807 マッピングを 1 箇所に固定、呼び出し側の冗長さを排除 | Phase 5 で実装済み |
| 3 | `packages/shared/src/retry.ts` の `withRetry` callable interface | 用途別に `retries` / `baseMs` / `jitter` 等の option 名差異が発生する懸念 | `withRetry<T>(fn, opts: RetryOptions)` に統一。`SHEETS_RETRY_PRESET` を `as const satisfies RetryOptions` で export し、Sheets 用途の preset を共有 | 用途間の option ドリフトを防ぎ、呼び出し側を 1 行で読める形に整える | Phase 5 で実装済み |
| 4 | `packages/shared/src/db/transaction.ts` の補償処理 | `try { ... } catch { manualRollbackQueries() }` を ad-hoc に記述する懸念 | `runWithCompensation(steps, { recordDeadLetter, idempotencyKey })` ヘルパに昇格。逆順 compensate / 二重失敗時 `UBM-5101` / DLQ フックを標準化 | D1 ネスト TX 不可前提の補償パターンを再利用可能にし、dead letter フックを標準化 | Phase 5 で実装済み |
| 5 | `packages/shared/src/logging.ts` の log フォーマット | `console.log(JSON.stringify({...}))` が module 内に散在する懸念 | `logError` / `logWarn` / `logInfo` / `logDebug` 4 関数 + `sanitize` ヘルパを提供。`SENSITIVE_KEY_SUBSTRINGS` を内蔵し substring REDACT を自動適用 | DRY 化し、PII / トークンのサニタイズ抜け漏れを構造的に防ぐ | Phase 5 で実装済み |
| 6 | `apps/api/src/middleware/error-handler.ts` の例外分岐 | `if (err instanceof ApiError) ... else if (...)` の長い if 連鎖 | `isApiError(err) ? err : ApiError.fromUnknown(err, "UBM-5000")` の 1 行に集約。`ApiError.fromUnknown` 内部に Error/string/unknown の 3 分岐を局所化 | 単体テスト容易性を上げ、未知例外の fallthrough を 1 箇所に固定 | Phase 5 で実装済み |
| 7 | `apps/api/docs/error-handling.md` 内リンク | 親 spec への相対パスがズレるリスク | Phase 12 で `apps/api/docs/error-handling.md` 作成時に `doc/00-getting-started-manual/specs/01-api-schema.md` への相対パスとアンカーを明示し、双方向リンクを整備する | ドキュメントの navigation drift を防ぐ | Phase 12 で実施予定 |

## ナビゲーション・型整合確認結果

| 観点 | 方針 | 確認結果 |
| --- | --- | --- |
| subpath export 優先 | `@ubm-hyogo/shared/errors` / `/retry` / `/db/transaction` / `/logging` の 4 subpath を `package.json#exports` に明示 | ✅ Phase 5 時点で `packages/shared/package.json` に明示済み |
| root barrel 衝突回避 | `ApiError` / `UbmErrorCode` / `withRetry` 等の error handling シンボルを subpath 経由で import | ✅ Phase 8 で `apps/api/src/middleware/error-handler.ts` と `apps/web/app/lib/api-client.ts` を subpath import に置換完了 |
| consumer import 経路 | error handling 関連を全件 subpath に統一 | ✅ grep で `from "@ubm-hyogo/shared"` のうち error 系 import が残っていないことを確認（runtimeFoundation 系のみ root barrel 使用） |
| circular import | `errors` ⇄ `logging` の相互参照禁止 | ✅ `logging.ts` は `errors` を import しない（独立）。`errors.ts` も `logging` を import しない |

## ApiError 型同期確認

| 同期項目 | apps/api 側 | apps/web 側 | 状態 |
| --- | --- | --- | --- |
| `ApiError` shape | `ApiError` を throw / `toClientJSON()` で serialize | `ApiErrorClientView` 型を `@ubm-hyogo/shared/errors` から import | ✅ 同一型定義参照（型コピーなし） |
| エラーコード列挙 | `UBM_ERROR_CODES` 定数 + `UbmErrorCode` 型 | `UbmErrorCode` 型を `@ubm-hyogo/shared/errors` から import | ✅ literal union を共有 |
| `application/problem+json` レスポンス body | `errorHandler` が `Content-Type: application/problem+json` で出力 | `parseApiResponse` の `isProblemJson()` で判定 → `isApiErrorClientView()` で shape 検証 | ✅ Phase 6 のスナップショット契約と整合 |
| HTTP ステータス対応 | `code → status` map を `UBM_ERROR_CODES` に集約 | api-client は `error.status` と `error.code` の両方を判断材料に持つ | ✅ 同一 lookup table 参照（`UbmErrorCodeMeta.status`）|

## No-functional-change 確認

| 検証項目 | 結果 |
| --- | --- |
| `mise exec -- pnpm typecheck` | ✅ PASS（4 workspace projects 全件 Done） |
| `mise exec -- pnpm lint` | （Phase 9 で実行） |
| 公開シグネチャ変更 | なし。subpath import 化は import path のみの変更で、export 定義・型定義に変更なし |
| Phase 6 / 7 の coverage 仮定 | 影響なし（実装ファイルのコード行は変更されていない） |

## 削除確認方針の適用

| 削除対象 | 種別 | 確認方法 | 結果 |
| --- | --- | --- | --- |
| `apps/api/src/middleware/error-handler.ts` の root barrel import | ファイル削除なし、import 文置換のみ | grep `from "@ubm-hyogo/shared"` のうち errors/logging 系 import がゼロ | ✅ 確認済み（runtimeFoundation のみ root barrel 使用） |
| `apps/web/app/lib/api-client.ts` の root barrel import | ファイル削除なし、import 文置換のみ | 同上 | ✅ 確認済み |
| root barrel `packages/shared/src/index.ts` 内 error handling re-export | 削除しない（legacy / 段階的移行の互換性維持目的） | live import がゼロでも、外部 consumer（将来の docs 参照）のための補助として残す | ✅ 残置を許容（subpath が優先パス） |

## 完了条件チェック

- [x] リファクタ対象テーブル 7 件すべての Before/After が記録されている
- [x] subpath export (`@ubm-hyogo/shared/errors` 等) が `packages/shared/package.json` に明示されている
- [x] root barrel 経由 import が live で残っていない（error handling 系のみ。runtimeFoundation 系は意図的に root barrel）
- [x] `apps/web` ApiError と `apps/api` ApiError の型同期が確認されている
- [x] No-functional-change が typecheck PASS で確認されている（lint は Phase 9）
- [x] 削除対象は git delete または stub 化で live import ゼロが確認されている（該当なし: import path のみ変更）
