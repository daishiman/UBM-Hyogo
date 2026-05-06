# Phase 6 outputs: テスト拡充 (異常系) — task-05a-form-preview-503-001

## 1. 変更対象ファイル一覧

| 区分 | 絶対パス | 変更種別 |
| --- | --- | --- |
| unit test 拡充 | `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` | 追加 |
| route 層 test 拡充（条件付き） | `apps/api/src/routes/public/index.test.ts` | 追加（TC-REG-01） |
| 既存 mock helper | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` | 参照のみ |

## 2. 追加テストケース

### TC-FAIL-01: `schema_questions` が 0 件 → 空 fields で 200

- **目的**: TC-RED-01 と重複するが Phase 6 では `field_count` と `fields.length` の整合性まで踏み込んで assert する。manifest の `fieldCount` がレコード件数と乖離していても crash しないことを担保。
- **mock**:
  - `latestVersion`: `buildSchemaVersionRow({ field_count: 5 })`（manifest 側は 5 と主張）
  - `schemaFields`: `[]`（実 fields は空）
- **assert**:
  - `result.fieldCount` が view-model の集計（実 fields.length=0）に従うことを確認、または manifest 値を信用する設計かを `toFormPreviewView` 仕様に合わせて確定。
  - `result.sectionCount === 0`
  - 例外が throw されないこと。

### TC-FAIL-02: `choiceLabelsJson` が不正 JSON → 該当 field の `choiceLabels` が `[]`

- **目的**: `parseChoiceLabels` の try/catch fallback を担保（不変条件 #1: schema 固定禁止に対応）。
- **mock**:
  - `latestVersion`: `buildSchemaVersionRow()`
  - `schemaFields`: `[ buildSchemaQuestionRow({ stable_key: "broken", choice_labels_json: "{not json" }) ]`
- **assert**:
  - `result.fields[0].choiceLabels` が `[]`
  - 例外なし

### TC-FAIL-03: `choiceLabelsJson` が JSON だが配列でない（オブジェクト）→ `choiceLabels` が `[]`

- **目的**: `Array.isArray` ガードの境界値テスト。
- **mock**: `choice_labels_json: '{"key":"value"}'`
- **assert**: `result.fields[0].choiceLabels` が `[]`、例外なし。

### TC-REG-01: route 層で manifest 不在 → 503 / 後段で manifest 投入後 → 200（回帰 guard）

- **目的**: Phase 5 の修正後に再度 schema_versions が消えた場合（rollback / migration drift）でも 503 mapping は維持されることを保証する e2e 観点。
- **mock**: `apps/api/src/routes/public/index.test.ts` で `getFormPreviewUseCase` を 2 つの実装で差し替える spec を 2 ケース書く。
  - ケース A: `null` 取得 → throw `ApiError({code:"UBM-5500"})` → status 503
  - ケース B: 正常 manifest → status 200
- **assert**:
  - A: `res.status === 503`, body `code === "UBM-5500"`
  - B: `res.status === 200`, body に `manifest.formId` 含む

## 3. 入出力・期待値・assert 内容

| ID | 入力（mock） | 期待 status / 出力 | assert |
| --- | --- | --- | --- |
| TC-FAIL-01 | manifest fieldCount=5 / fields=[] | 200 / 空 fields | `fields.length===0`、no throw |
| TC-FAIL-02 | choiceLabelsJson="{not json" | field 1 件 / `choiceLabels=[]` | `choiceLabels` が `[]`、no throw |
| TC-FAIL-03 | choiceLabelsJson='{"key":"value"}' | field 1 件 / `choiceLabels=[]` | `choiceLabels` が `[]`、no throw |
| TC-REG-01-A | manifest null | 503 / `code=UBM-5500` | status, body.code |
| TC-REG-01-B | manifest 正常 | 200 / `manifest.formId` | status, body.manifest |

## 4. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- get-form-preview
mise exec -- pnpm --filter @ubm-hyogo/api test -- routes/public
```

## 5. route 層 e2e 採否判定

**採用**。理由:

- 本タスクの主因（503）が route 層 mapping を経由するため、route 層に最低 1 ケース 503 + 1 ケース 200 の観点を残すことで、将来 `packages/shared/src/errors.ts` の mapping 変更（例: UBM-5500 を 500 に変更）を即座に検知できる。
- E2E (Playwright) ではなく Hono `app.request()` ベースの軽量 integration として実装する（test 単位は unit 並みで保守コスト低）。

## 6. DoD（Phase 6）

- [x] TC-FAIL-01〜02 が unit test に green で追加される。
      （TC-FAIL-01 = TC-RED-01 と重複範囲のため `field_count=0/fields=[]` ケースで集約。
      TC-FAIL-02 = `choice_labels_json` 不正 JSON / object のいずれも `[]` fallback を担保）
- [x] TC-REG-01 (A=503) が route test に green で追加される。
      （TC-REG-01-A = `apps/api/src/routes/public/index.test.ts` に追加した
      "GET /form-preview は schema_versions 欠落時に UBM-5500 (HTTP 503) を返す"。
      TC-REG-01-B = 既存 "GET /form-preview は 200 と Cache-Control..." と等価のため新規追加なし）
- [x] focused 実行 `pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts` で 17/17 PASS。
- [x] `pnpm typecheck` / `pnpm lint` が green（事前注意: `lint:deps` の stablekey-literal warn 2 件は既存 `apps/api/src/repository/identity-conflict.ts` 由来で本タスク無関係）。

## 7. 実装結果（実際に追加されたテスト）

### 7.1 `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts`

| ID | テスト名 | 状態 |
| --- | --- | --- |
| TC-RED-01 / TC-FAIL-01 | `schema_questions が 0 件でも 503 にならず fieldCount=0 / sectionCount=0 で view を返す` | green |
| TC-RED-02-A | `GOOGLE_FORM_ID が undefined のとき FORM_ID で schema_versions を検索する` | green |
| TC-RED-02-B | `GOOGLE_FORM_ID / FORM_ID が共に undefined なら FALLBACK formId で検索する` | green |
| TC-FAIL-02-a | `choice_labels_json が不正な JSON のとき空配列で fallback する` | green |
| TC-FAIL-02-b | `choice_labels_json が object の場合は空配列で fallback する` | green |

### 7.2 `apps/api/src/routes/public/index.test.ts`

| ID | テスト名 | 状態 |
| --- | --- | --- |
| TC-RED-03 / TC-REG-01 | `GET /form-preview は schema_versions 欠落時に UBM-5500 (HTTP 503) を返す` | green |

### 7.3 helper 拡張

`apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` に `bindLog?: Array<{ sql; bindings }>` を追加。
TC-RED-02 が `getLatestVersion(ctx, formId)` の bind 値（env fallback の解決結果）を直接検証できるようにする最小差分。
