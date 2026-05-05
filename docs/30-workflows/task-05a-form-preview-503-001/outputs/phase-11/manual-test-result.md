# Phase 11 — 手動テスト結果（NON_VISUAL）

## NON_VISUAL 宣言

| 項目 | 値 |
| --- | --- |
| タスク種別 | API endpoint HTTP status verification |
| 非視覚的理由 | UI 変更なし。HTTP status と JSON shape で AC が完結 |
| 代替証跡 | curl 実測ログ + vitest 出力サマリ |
| screenshots ディレクトリ | **作成しない**（`.gitkeep` も含めて作らない） |

## 実測サマリ

| AC | URL / コマンド | 期待 | 実測 | 結果 |
| --- | --- | --- | --- | --- |
| AC-1 | `curl https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` | 200 | **503**（2026-05-05 review 実測） | **BLOCKED → active manifest 投入/確認待ち** |
| AC-2 | `curl https://ubm-hyogo-api.daishimanju.workers.dev/public/form-preview` | 200 | **503**（2026-05-05 review 実測。旧「production 200」記述を撤回） | **BLOCKED → production D1 確認は user approval 必須** |
| AC-3 | `curl https://<web-staging-domain>/register` | 200 | **未実行**（API 200 未達のため） | **BLOCKED → API 200 後に確認** |
| AC-4 | `pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts` | 全 PASS | **17/17 PASS / latest review rerun 5.77s** | **GO** |

## 実コマンドログ

### staging API（DEFER）

```
$ curl -s -o /dev/null -w "%{http_code}\n" \
    https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview
HTTP status: 503（2026-05-05 review 実測）。D1 write は user approval gate のため未実行。
```

実行手順（staging operator 用）:

```bash
# 1. 現状確認（503 再現）
curl -s -o /dev/null -w "%{http_code}\n" \
  https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview
# → 503 を期待（schema_versions 0 件のため）

# 2. schema_versions 投入（implementation-guide.md Part 2 の runbook を参照）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "INSERT INTO schema_versions(...) VALUES (...);"

# 3. 投入後再確認
curl -s -o /dev/null -w "%{http_code}\n" \
  https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview
# → 200 を期待（`schema_versions.state` は必ず `active`）

curl -s https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview \
  | jq '{ formId: .manifest.formId, fieldCount, sectionCount }'
```

### production API（DEFER）

```
$ curl -s -o /dev/null -w "%{http_code}\n" \
    https://ubm-hyogo-api.daishimanju.workers.dev/public/form-preview
HTTP status: 503（2026-05-05 review 実測）。production は本タスクで変更しない。修復は別途 user approval gate が必要。
```

> production の hostname は実測前に `wrangler.toml` または apps/web の env 設定で確定する。

### staging /register page（DEFER）

```
$ curl -s -o /dev/null -w "%{http_code}\n" https://<web-staging-domain>/register
未実行。/public/form-preview の runtime 200 確認後に連動確認する。
```

### vitest（実測）

```
$ pnpm exec vitest run \
    apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts \
    apps/api/src/routes/public/index.test.ts

 ✓ apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts (9 tests)
 ✓ apps/api/src/routes/public/index.test.ts (8 tests)

 Test Files  2 passed (2)
      Tests  17 passed (17)
   Start at  ...
   Duration  5.77s
```

### vitest coverage（実測）

```
$ mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
    --coverage \
    --coverage.include='apps/api/src/use-cases/public/get-form-preview.ts' \
    --coverage.reportsDirectory=apps/api/coverage-form-preview \
    apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts \
    apps/api/src/routes/public/index.test.ts

File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
get-form-preview.ts|    100  |   100    |   100   |   100   |
```

`apps/api/coverage-form-preview/` は一時生成先で、review 後に削除済み。証跡は本 summary に固定する。

## 503 → 200 再現性メモ

- staging / production public curl は 2026-05-05 review で 503 を再現
- `wrangler d1 execute ... INSERT INTO schema_versions ...` 実行後の 200 は未取得。placeholder PASS と扱わない
- 詳細手順は `outputs/phase-12/implementation-guide.md` Part 2 の runbook を参照

## スクリーンショット

なし（NON_VISUAL のため）。`screenshots/` ディレクトリ自体を作成していない。
