[実装区分: 実装仕様書]

# Phase 1 Output: 要件定義 / AC

仕様本体: `../../phase-01.md`

## Acceptance Criteria（番号付け列挙）

- **AC-1**: `UPDATE schema_questions SET stable_key` を含む文字列リテラル / template literal を検出
- **AC-2**: `.update(schemaQuestions).set({ stable_key | stableKey })` 形式の builder を検出
- **AC-3**: multiline SQL（`UPDATE schema_questions` と `SET stable_key` が別行）も検出
- **AC-4**: 例外許可は `migrations/`, `**/__fixtures__/**`, `**/__tests__/**`, `**/*.spec.{ts,tsx,mjs,js}`, `node_modules`, `.next`, `.open-next`, `coverage`, `dist`
- **AC-5**: 失敗 message に `schema_aliases` と `POST /admin/schema/aliases` 誘導文
- **AC-6**: `--strict` flag / `STABLE_KEY_UPDATE_LINT_MODE=error` で warning → error 昇格
- **AC-7**: CI workflow `verify-stable-key-update.yml` が `dev` / `main` の push / PR で発火
- **AC-8**: dead code `apps/api/src/repository/schemaQuestions.ts:153-172` `updateStableKey()` 削除

## P50 結果

- `rg -n "updateStableKey" apps packages` → 定義 1 件のみ（caller 0 件）
- 既存 `lint-stablekey-literal.mjs`（文字列リテラル直書き検出）と本タスク（direct UPDATE 検出）は責務が異なる
- `artifacts.json.metadata.visualEvidence = "NON_VISUAL"` 確定

## 状態

`completed`
