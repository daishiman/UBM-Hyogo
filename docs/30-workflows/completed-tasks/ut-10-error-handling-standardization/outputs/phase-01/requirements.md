# UT-10 要件定義（Phase 1 成果物）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | エラーハンドリング標準化 (UT-10) |
| 作成日 | 2026-04-27 |
| 入力 | docs/30-workflows/ut-10-error-handling-standardization/index.md, phase-01.md |
| 状態 | spec_created |

## 1. スコープ確認と前提

### 対象範囲

- **対象**: `apps/api`（Hono ランタイム）+ `packages/shared`（横断ユーティリティ）
- **整合のみ**: `apps/web` 側は API クライアントの型整合確認のみ。UI 実装は対象外
- **非対象**: UT-09（Sheets→D1 同期）の業務ロジック・UT-07（通知）・UT-08（モニタリング）の統合実装

### 前提

- 上流タスク 02-serial-monorepo-runtime-foundation により `packages/shared`（実体: `@ubm-hyogo/shared`）と `apps/api` の Hono ランタイムは利用可能
- 上流タスク 03-serial-data-source-and-storage-contract により D1 / Sheets の I/O 契約が確定済み
- 仕様書では `@ubm-hyogo/shared` / `@ubm-hyogo/api` の placeholder 名称を使うが、実装は `@ubm-hyogo/shared` / `@ubm-hyogo/api` にマップする

### 仕様書 placeholder と実体の対応

| 仕様書名 | 実体 |
| --- | --- |
| `@ubm-hyogo/shared` | `@ubm-hyogo/shared` |
| `@ubm-hyogo/api` | `@ubm-hyogo/api` |
| `apps/web/app/lib/api-client.ts` | `apps/web/app/lib/api-client.ts`（新規作成扱い、現状未配置） |

## 2. 5 領域の要件確定

### 領域 1: API エラーレスポンス形式

| 要件 ID | 内容 |
| --- | --- |
| R1-1 | レスポンスは RFC 7807 (`application/problem+json`) を基本に、`type` / `title` / `status` / `detail` / `instance` の 5 標準フィールドを保持する |
| R1-2 | UBM 固有の `code`（例: `UBM-5000`）と `traceId` を拡張フィールドとして追加する |
| R1-3 | 標準フィールドの上書きは禁止。`code` 等の独自項目はキー名衝突しないものに限定する |
| R1-4 | 開発環境（`ENVIRONMENT === "development"`）のみ内部詳細（stack 等）を `debug` フィールドに含めることを許容、staging / production では必ず strip |

### 領域 2: Sheets API リトライ戦略

| 要件 ID | 内容 |
| --- | --- |
| R2-1 | 主戦略は Cron Triggers の「次回実行で再処理」。in-request の bounded retry は補助のみ |
| R2-2 | in-request リトライは `maxAttempts` 上限 2、累計待機 < 1 秒。Workers の CPU 制限近接ガードを設ける |
| R2-3 | `setTimeout` による長時間 sleep は禁止。短時間（< 200ms）の `await new Promise(r => setTimeout(r, ms))` のみ許容 |
| R2-4 | リトライ可否は分類関数で判定。transient（network・5xx・rate limit）はリトライ、permanent（400・認証）は即失敗 |
| R2-5 | `AbortSignal` でキャンセル可能 |

### 領域 3: D1 ロールバック方針

| 要件 ID | 内容 |
| --- | --- |
| R3-1 | D1 のネスト TX 不可・`db.batch()` 部分失敗の自動ロールバック不可を前提にする |
| R3-2 | 複数ステップ書き込みは「事前状態保存 → 主処理 → 失敗時に逆操作」の compensating transaction パターンで補う |
| R3-3 | 冪等性キー（`runId` 等）を補償処理の前提条件として設計する |
| R3-4 | 補償処理失敗（二重失敗）は dead letter として `sync_audit` または専用 DLQ テーブルに記録する |

### 領域 4: 構造化ログフォーマット

| 要件 ID | 内容 |
| --- | --- |
| R4-1 | `console.error` / `console.warn` は JSON シリアライズ可能なオブジェクト 1 引数に統一する |
| R4-2 | 必須フィールド: `level` / `timestamp` / `traceId` / `code` / `message` / `context` |
| R4-3 | サニタイズキーリスト（`authorization` / `cookie` / `private_key` / `client_email` / `password` / `token` 等）を機械的にマスクする |
| R4-4 | UT-08 のメトリクス基盤が後段で取り込めるスキーマ互換性を意識する |

### 領域 5: クライアント向けメッセージガイドライン

| 要件 ID | 内容 |
| --- | --- |
| R5-1 | `code`（機械可読）と `message` / `title`（人間可読）を分離。MVP は日本語のみだが i18n 拡張時に辞書差し替えで対応可能とする |
| R5-2 | クライアント返却フィールドはホワイトリスト方式: `code` / `title` / `status` / `detail`（安全）/ `traceId` のみ |
| R5-3 | stack trace / SQL / 外部 API レスポンス本文 / 認証情報の片鱗 はサーバーログのみ。レスポンスから自動 strip する |

## 3. AC の検証可能化

| AC | 検証手段 | 判定基準 |
| --- | --- | --- |
| AC-1 | 型ファイル存在 + named export 確認 | `packages/shared/src/errors.ts` から `ApiError` 型と `UBM_ERROR_CODES` 定数が export されている |
| AC-2 | ユニットテスト + Hono onError 配線確認 | `apps/api/src/middleware/error-handler.ts` が存在し、`app.onError(errorHandler)` が `apps/api/src/index.ts` で登録されている |
| AC-3 | 異常系テスト（負例検証）| 5xx レスポンス body / problem+json に `stack` / `private_key` / `INSERT` 等の禁止文字列が含まれない |
| AC-4 | 関数 export + 利用配線確認 | `withRetry` が `packages/shared/src/retry.ts` から export され、Sheets クライアント呼び出しで利用される設計となっている |
| AC-5 | ファイル配置 + ユニットテスト | `packages/shared/src/db/transaction.ts` に `runWithCompensation` テンプレートが存在し、テストで成功・失敗の両系が通過 |
| AC-6 | ドキュメント存在 + 必須セクション網羅 | `apps/api/docs/error-handling.md` に「Workers 制約 / リトライ戦略 / 補償処理 / 構造化ログ / クライアント整合」5 章が存在 |
| AC-7 | 契約スナップショット | `apps/web` API クライアントが返却 JSON を `ApiError` 互換型でパースできるテスト or 型レベル整合 |

## 4. 4 条件評価

| 条件 | 評価 | 理由 |
| --- | --- | --- |
| 価値性 | PASS | 共通標準化により UT-09 / UT-07 / UT-08 はエラー扱いを都度判断する必要がなくなる。`withRetry` / `runWithCompensation` / `errorHandler` の 3 部品で下流のボイラープレートを除去できる |
| 実現性 | PASS | Workers 制約（`setTimeout` 不可・ネスト TX 不可）に対し、Cron 主戦略 + bounded in-request retry + compensating transaction で対応可能 |
| 整合性 | PASS | RFC 7807 を採用しつつ、UBM 拡張は標準フィールドと衝突しないキー（`code` / `traceId`）に限定。既存 API スキーマ（01-api-schema.md）との矛盾なし |
| 運用性 | PASS | ホワイトリスト方式 + ミドルウェアでの自動サニタイズにより、機密非開示はコードレビュー無しで自動強制可能。`errorHandler` が単一ゲートウェイになる |

## 5. 内部エラー漏洩判定基準（ホワイトリスト方式）

### クライアント返却を許可するキー（ホワイトリスト）

```
type, title, status, detail, instance, code, traceId
```

開発環境のみ `debug` の追加を許容（`ENVIRONMENT === "development"` のときに限る）。

### サーバーログのみに記録するキー（ブラックリスト相当）

```
stack, sqlStatement, externalResponseBody, requestHeaders.authorization,
requestHeaders.cookie, env.GOOGLE_SERVICE_ACCOUNT_JSON, error.cause（チェーン全体）
```

### 自動サニタイズ対象（substring マッチ）

```
private_key, client_email, password, token, authorization, cookie, secret
```

これらはログ出力時にも値を `"[REDACTED]"` に置換する。

### 判定アルゴリズム

`errorHandler` ミドルウェアが「`ApiError` のホワイトリスト fields のみを `Response` body に詰める」+「ログ出力前に sanitize 関数を通過させる」の二段で強制する。レスポンス組み立てとログ出力でロジックを共有しないことで、片側の漏洩がもう片側に波及しない構造とする。

## 6. 既存コード inventory（carry-over）

### 6.1 前タスク成果物棚卸し

```
$ git log --oneline -5
6cc7a2d Merge pull request #68 from daishiman/feat/ut-05-cicd-pipeline-impl
26d226d feat(ut-05): CI/CD パイプライン実装と pending skill / cleanup の同期バンドル
6888677 Merge pull request #43 from daishiman/docs/ut-03-sheets-api-auth-task-spec
87bd913 feat(ut-03): Sheets API JWT bearer 認証実装と Phase 1-12 成果物完了
5966602 Merge branch 'main' into docs/ut-03-sheets-api-auth-task-spec
```

UT-05 で CI/CD（typecheck + lint）が整備され、UT-03 で Sheets API クライアントが既に存在。本タスクは UT-03 の `fetchSheetRows` を `withRetry` で巻き直す配線も視野に入れる（ただし業務ロジック改修は UT-09 担当）。

### 6.2 命名規則 inventory

- ファイル名: kebab-case（`sheets-client.ts`, `worker.ts`）
- 関数名: camelCase（`fetchSheetRows`, `runSync`）
- 型名: PascalCase（`SheetRow`, `SyncResult`, `Env`）
- 例外送出: 現状 `throw new Error(...)`（標準 Error）のみ。`ApiError` 派生は未導入

### 6.3 既存ユーティリティ重複確認

```
$ rg -n "ApiError|withRetry|compensat|problem\+json|traceId|requestId" packages apps
（該当なし）
```

既存実装との重複・上書きはなし。完全な新規追加で問題なし。

### 6.4 targeted run 方針

- テストランナー（vitest）は現状未導入（CI も typecheck + lint のみ）
- Phase 4 のテストファイル設計は仕様通り実施するが、実行検証（`pnpm test`）は infrastructure 側の整備が前提
- Phase 9 の品質保証では `pnpm typecheck` / `pnpm lint` を主軸とし、テスト実行は将来の vitest 導入後に補完
- 本タスクスコープ内に vitest 導入は含めない（UT-10 のスコープを超えるため）

## 7. 次 Phase への引き継ぎ

| 引き継ぎ事項 | Phase 2 での利用 |
| --- | --- |
| エラーコード体系枠組み（4 大区分・命名規則 `UBM-Nxxx`）| 確定版 taxonomy へ展開 |
| AC 検証可能化（AC-1〜AC-7）| 設計成果物の網羅性チェックリストへ |
| 4 条件評価結果（全 PASS）| 設計レビュー（Phase 3）の入力 |
| ホワイトリスト方式 + サニタイズキーリスト | `errorHandler` ミドルウェア設計の入力 |
| placeholder→実体 マッピング（`@repo/*`→`@ubm-hyogo/*`）| 全 Phase で統一適用 |
| テスト実行 infra 不在 | Phase 4 の RED 確認は「ファイル設計」までとし、実行は将来補完 |

## 完了確認

- [x] 5 領域の要件確定（R1〜R5）
- [x] AC-1〜AC-7 検証可能化
- [x] エラーコード体系枠組み確定（次節 `error-code-taxonomy-draft.md` 参照）
- [x] 4 条件評価 全 PASS
- [x] 内部エラー漏洩判定基準（ホワイトリスト方式）確定
