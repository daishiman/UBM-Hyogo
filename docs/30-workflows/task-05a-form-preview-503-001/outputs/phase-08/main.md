# Phase 8 main — リファクタリング詳細

## サマリ

`/public/form-preview` 503 修復後、`apps/api/src/use-cases/public/get-form-preview.ts` および test helper の DRY 化候補を整理する。スコープは use-case 1 本と test helper のみ。API 仕様・他 public route には手を入れない。

## リファクタ対象 / Before / After / 理由

| # | 対象ファイル | Before | After | 理由 | 適用条件 |
| --- | --- | --- | --- | --- | --- |
| 1 | `apps/api/src/use-cases/public/get-form-preview.ts` | `if (!latest) throw new ApiError({ code: "UBM-5500" })` のみで silent | 同分岐に structured warn log（`event: "schema_versions_missing"`, `formId`, `requestedVersion`）を追加 | staging `wrangler tail` で root cause を即時識別。503 の再発時に切り分け工数を削減 | apps/api に logger utility が存在する場合のみ。無ければ見送り |
| 2 | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | 各テストが D1 mock オブジェクトをインライン定義 | `buildEmptySchemaD1()`（schema_versions 0 件）と `buildSchemaD1WithVersion(version, questions)` を export | AC-4 で追加するケース（503 / 200 両分岐）の可読性向上、DRY | 既存 helper が同名関数を持たない場合に追加 |
| 3 | `apps/api/src/routes/public/form-preview.ts` | 既存実装 | 変更なし | error mapping は `packages/shared/src/errors.ts` に閉じる契約を維持。API 仕様不変条件遵守 | — |
| 4 | `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | 直書き mock | helper 経由に置換 | 上記 #2 と連動 | helper 追加が確定した場合のみ |

## structured logging 採否判断

- 既存 `apps/api/src/` に logger が**ある場合**: 採用（差分 1〜3 行）。
- **ない場合**: console.warn の追加は禁止（lint 違反 + 本番ノイズ）。代わりに見送り、本タスクのスコープ外として `unassigned-task-detection.md` の参考情報に記録（タスク化はしない）。
- 判断結果は実装サイクル時に Phase 8 ログとして本ファイル末尾に追記する。

## スコープ外（明示）

- `apps/api/src/use-cases/public/` 配下の他 use-case (get-public-stats, get-public-events など) のリファクタ
- `/public/form-preview` の response shape 変更（`schemaVersion`, `questions[]` 構造）
- `packages/shared/src/errors.ts` の UBM-5500 → 503 mapping 変更
- production schema sync 自動化の運用設計

## 検証コマンド（Phase 9 へ引き継ぐ）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts
```

## 完了条件

- [x] Before/After 表が完成
- [x] logger 採否が決定し記録される（採用: `@ubm-hyogo/shared/logging` の `logWarn` を使用）
- [x] helper 追加 PR が `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` 1 ファイルに閉じる
- [x] スコープ外への波及がない（`form-preview.ts` route / API response shape / 他 public route 不変）

## 実装結果ログ

| # | 対象 | 適用 | 実差分 |
| --- | --- | --- | --- |
| 1 | `apps/api/src/use-cases/public/get-form-preview.ts` | **採用** | `@ubm-hyogo/shared/logging` の `logWarn` を import し、`manifest === null` 分岐に `code: "UBM-5500"` / `message: "schema_versions row missing — returning 503"` / `context: { where, formId, usedFallback }` を 1 行 emit。`logWarn` は既に `apps/api/src/middleware/error-handler.ts` で `logError` が import されている前例があり、追加の依存導入は不要。 |
| 2 | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | **採用** | `bindLog?: Array<{ sql; bindings }>` フィールドを追加、`MockStmt.bind()` で push。`buildEmptySchemaD1()` 等の追加ファクトリは不要と判断（`createPublicD1Mock({ latestVersion: null })` の 1 行で同等に表現できるため過剰実装回避）。 |
| 3 | `apps/api/src/routes/public/form-preview.ts` | **見送り** | 想定通り変更なし。 |
| 4 | `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | 部分採用 | bindLog 経路を TC-RED-02 で利用。helper factory は #2 の判断により直書きのまま。 |

API response shape / `packages/shared/src/errors.ts` / 他 public route には差分なし（`git diff --stat` で確認）。
