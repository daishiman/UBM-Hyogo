# Phase 6 Test Results

## TC-1 / TC-2: workflow-env-scope.test.sh

```
$ bash scripts/__tests__/workflow-env-scope.test.sh
workflow-env-scope.test.sh: all assertions passed
exit=0
```

期待通り、新規 gate を含む全 assertion が pass。

### 検証された assertion 群（Issue #718 追加分）

1. backend-ci 内で legacy 無修飾 `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}` が 0 件
2. staging D1 step が `CF_TOKEN_D1_STAGING` を参照
3. staging Workers step が `CF_TOKEN_WORKERS_STAGING` を参照
4. production D1 step が `CF_TOKEN_D1_PRODUCTION` を参照
5. production Workers step が `CF_TOKEN_WORKERS_PRODUCTION` を参照

## 既存 test の regression 検証

| Test | exit code | 結果 |
|------|-----------|------|
| `scripts/__tests__/cf-token-arg.test.sh` | 0 | PASS |
| `scripts/__tests__/redaction-check.test.sh` | 0 | PASS（12 assertions） |
| `scripts/__tests__/workflow-env-scope.test.sh` | 0 | PASS (exact `with.apiToken` assertions) |

## 2026-05-16 Review Cycle Re-run

| Command | exit code | Result |
| --- | --- | --- |
| `bash scripts/__tests__/workflow-env-scope.test.sh` | 0 | PASS |
| `bash scripts/__tests__/cf-token-arg.test.sh` | 0 | PASS |
| `bash scripts/__tests__/redaction-check.test.sh` | 0 | PASS (12 assertions) |
| temporary-copy negative detector | 0 | legacy `apiToken` regression detected in temp file |

## 負例試験

作業ツリーを破壊せず、temporary copy で実施済み。

- `backend-ci.yml` を一時ファイルへコピー
- 一時ファイル内の `CF_TOKEN_D1_STAGING` を `CLOUDFLARE_API_TOKEN` に置換
- `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}` detector が検知することを確認
- 本番ファイルは未変更

## 完了条件

- [x] TC-1 / TC-2 が pass
- [x] 負例試験で gate が fail を返す条件を temporary copy で確認
- [x] 既存 test 2 件が pass
- [x] TC-3 は対象外として `rotation-reminder-output.log` に記録（当該 script に `--dry-run` が存在せず、backend-ci scoped token rename を検査しないため）
- [x] coverage-guard は workflow-only 変更のため適用外
