# Phase 4 outputs: テスト作成 (RED) — task-05a-form-preview-503-001

## 1. 対象ファイル

| 区分 | 絶対パス |
| --- | --- |
| 既存 unit test（追加対象） | `apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` |
| 既存 mock helper（再利用） | `apps/api/src/use-cases/public/__tests__/helpers/public-d1.ts` |
| use-case 本体（テスト対象） | `apps/api/src/use-cases/public/get-form-preview.ts` |
| route 層 test（条件付き追加） | `apps/api/src/routes/public/index.test.ts` |
| view-model（参照のみ） | `apps/api/src/view-models/public/form-preview-view.ts` |
| エラーマッピング（参照のみ） | `packages/shared/src/errors.ts` |

## 2. 関数シグネチャ・モック構造

### テスト対象関数

```ts
export const getFormPreviewUseCase = async (
  deps: { ctx: DbCtx; env: GetFormPreviewEnv },
): Promise<FormPreviewResponse>;
```

### モック構造（既存 `createPublicD1Mock` 利用）

- `createPublicD1Mock({ latestVersion, schemaFields, failOnSql })`
- `buildSchemaVersionRow(overrides?)` — `schema_versions` 1 行
- `buildSchemaQuestionRow(overrides?)` — `schema_questions` 1 行（`stable_key` / `position` / `section_key` / `choice_labels_json` 等を上書き可）

## 3. 追加テストケース

### TC-RED-01: schema_versions のみ存在し schema_questions が 0 件 → 200 で `fieldCount: 0`

- **目的**: 503 への暴発を防ぎ、空 fields でも view が成立することを担保する。staging で manifest だけ投入された段階の整合性を保証。
- **mock**:
  - `latestVersion`: `buildSchemaVersionRow({ field_count: 0 })`
  - `schemaFields`: `[]`
- **入力**: `env = { GOOGLE_FORM_ID: "form-test", FORM_ID: undefined, GOOGLE_FORM_RESPONDER_URL: "https://example.test/forms/test/respond" }`
- **assert**:
  - `result.fieldCount === 0`
  - `result.sectionCount === 0`
  - `result.fields.length === 0`
  - `result.responderUrl === env.GOOGLE_FORM_RESPONDER_URL`
  - `result.manifest.formId === "form-test"`
- **RED 期待理由**: 既存 view-model が空配列で 0 を返す前提が未保証なら fail / 配線確認の anchor として機能する。

### TC-RED-02: `GOOGLE_FORM_ID` 未設定時に `FORM_ID` → `FALLBACK_FORM_ID` の順で fallback する

- **目的**: env 経路の回帰 guard。`FORM_ID` のみ・両方 undefined の 2 サブケースで `getLatestVersion` 呼び出し引数を検証する。
- **mock**: `createPublicD1Mock` を spy 付きで wrap し、`prepare` の SQL 引数 (`bind` 値) を capture する。簡易には `latestVersion` getter を関数化して呼び出された `formId` 引数を assert する。
- **入力**:
  - サブケース A: `env = { GOOGLE_FORM_ID: undefined, FORM_ID: "form-from-FORM_ID", GOOGLE_FORM_RESPONDER_URL: "https://example.test" }` → `manifest.formId === "form-from-FORM_ID"`
  - サブケース B: `env = { GOOGLE_FORM_ID: undefined, FORM_ID: undefined, GOOGLE_FORM_RESPONDER_URL: "https://example.test" }` → `manifest.formId === "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg"`（FALLBACK_FORM_ID）
- **assert**: `result.manifest.formId` が期待 form_id と一致。`result.responderUrl` が env または fallback URL と一致。
- **RED 期待理由**: 現実装は `??` の順序が `GOOGLE_FORM_ID ?? FORM_ID ?? FALLBACK` だが、env 経路を網羅するテストが欠落している。

### TC-RED-03: route 層で UBM-5500 → HTTP 503 + Cache-Control 整合

- **目的**: use-case throw → route mapping の経路が `503` を返し、Cache-Control に成功時 caching が漏れないこと（`s-maxage` を 503 で付与しない or default のままであること）を担保する。
- **mock**: `apps/api/src/routes/public/index.test.ts` で `getFormPreviewUseCase` を `vi.mock` し `ApiError({ code: "UBM-5500" })` を throw させる。
- **入力**: `app.request("/public/form-preview")`
- **assert**:
  - `res.status === 503`
  - `res.headers.get("Cache-Control")` に `s-maxage=` を含まない（成功時のみ付与される設計のため）
  - body JSON に `code: "UBM-5500"` が含まれる
- **route 層追加判定**: **追加する**。理由 — 現状 `routes/public/index.test.ts` に `/public/form-preview` の error path が無い。本タスクの主因が route 層 mapping を経由する 503 のため、回帰 guard として必須。

## 4. 入出力・期待値・assert 内容

| ID | 入力 | 出力 | assert |
| --- | --- | --- | --- |
| TC-RED-01 | manifest 1 件 + fields 0 件 | `FormPreviewResponse` (`fieldCount=0`) | `fieldCount/sectionCount/fields.length` |
| TC-RED-02-A | `FORM_ID` only | `manifest.formId="form-from-FORM_ID"` | `manifest.formId` |
| TC-RED-02-B | env 全て undefined | `manifest.formId=FALLBACK_FORM_ID` | `manifest.formId` |
| TC-RED-03 | use-case が UBM-5500 throw | HTTP 503 | `res.status / Cache-Control / body.code` |

## 5. ローカル実行コマンド

```bash
# unit test 単体（RED 確認）
pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts

# route 層 test 単体（RED 確認）
mise exec -- pnpm --filter @ubm-hyogo/api test -- routes/public

# 全 RED 確認
mise exec -- pnpm --filter @ubm-hyogo/api test
```

## 6. RED 確認手順

1. 上記 3 ケースを `__tests__/get-form-preview.test.ts`（TC-RED-01, TC-RED-02）と `routes/public/index.test.ts`（TC-RED-03）に追加。
2. `mise exec -- pnpm --filter @ubm-hyogo/api test` を実行。
3. **TC-RED-01**: 既存 view-model が空 fields で動く設計なら GREEN になる可能性あり。その場合 anchor として残し Phase 7 のカバレッジで回収。
4. **TC-RED-02**: 既存実装で fallback 動作が正しいなら GREEN だが、env 分岐の coverage を確保する目的で追加。
5. **TC-RED-03**: route 層に該当 case 未実装のため確実に RED → Phase 5 で実装後に GREEN 化。

## 7. DoD（Phase 4）

- [ ] テストケース 3 件が `__tests__/get-form-preview.test.ts` および `routes/public/index.test.ts` に追加される（実装は Phase 5 で行うため、本 Phase は仕様書のみ）。
- [ ] 各テストの mock fixture / 期待値が文章レベルで再現可能。
- [ ] route 層追加判定が「追加」で確定。
- [ ] Phase 5 への引き渡し情報（mock 構造・assert・実行コマンド）が揃っている。
