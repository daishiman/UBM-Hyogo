# Phase 4: 検証戦略

`[実装区分: 実装仕様書]`

## 1. テストレイヤ

| レイヤ | テスト対象 | ファイル | 追加 / 編集 |
| --- | --- | --- | --- |
| API client unit | `postSchemaAlias` が status code を保持し、202 でも `ok=true` で body を data に格納する | `apps/web/src/lib/admin/__tests__/api.test.ts` | 編集 |
| API client unit | `isSchemaAliasRetryableContinuation` が 202 / 200 / 422 / 409 / status だけ 202 で retryable=false 等を区別 | 同上 | 編集 |
| Component | `SchemaDiffPanel` が 4 状態 fixture で異なる role / 文言を出す | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx` | 編集 |
| Component | retryable 状態でも `active` selection が維持され、再送信できる | 同上 | 編集 |

## 2. テストケース一覧

### 2.1 `api.test.ts`

| TC-ID | 入力 | 期待 |
| --- | --- | --- |
| API-01 | mock fetch が 200 + `{ok:true, mode:'apply', confirmed:true, backfill:{status:'completed'}}` を返す | `r.ok===true` / `r.status===200` / `r.data.backfill.status==='completed'` / `isSchemaAliasRetryableContinuation(r)===false` |
| API-02 | 202 + `{ok:true, mode:'apply', confirmed:true, backfill:{status:'exhausted', retryable:true, code:'backfill_cpu_budget_exhausted'}}` | `r.ok===true` / `r.status===202` / `isSchemaAliasRetryableContinuation(r)===true` |
| API-03 | 202 + `backfill.status='pending'` retryable=true | `isSchemaAliasRetryableContinuation(r)===false`（status='exhausted' の合致を要求） |
| API-04 | 422 + `{ok:false, error:'invalid'}` | `r.ok===false` / `r.status===422` / predicate=false |
| API-05 | 409 + `{ok:false, error:'conflict'}` | `r.ok===false` / `r.status===409` / predicate=false |

### 2.2 `SchemaDiffPanel.test.tsx`

| TC-ID | mock postSchemaAlias 戻り値 | 期待 |
| --- | --- | --- |
| UI-01 | API-01 と同じ success | `role="status"` で「alias を割当てました」/ form 閉じる / `router.refresh` が呼ばれる |
| UI-02 | API-02 retryable | `role="status"` で「Back-fill 再試行可能」を含む / 補助文「続きから処理」を含む / form open のまま / 「割当」ボタンが再度 enable |
| UI-03 | API-04 422 | `role="alert"` で「入力内容に誤り」を含む |
| UI-04 | API-05 409 | `role="alert"` で「他の操作と競合」を含む |
| UI-05 | UI-02 後に再度 form submit → 200 success | retryable label が消え success label が出る（regress 防止） |

## 3. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.test.ts
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

> filter 名は `apps/web/package.json#name` を Phase 5 着手時に確認すること。`@ubm-hyogo/web` 以外なら実値に置き換える。

## 4. 完了条件

- [ ] テストレイヤ表が API / Component の 2 層に分離されている
- [ ] TC が 5 + 5 = 10 件以上で 4 状態（success / retryable / validation / conflict）を網羅
- [ ] ローカル実行コマンドが `mise exec` 経由で記述
