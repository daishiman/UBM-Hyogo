# Phase 11: 手動テスト

## NON_VISUAL 宣言

- **タスク種別**: CI / 運用設定変更
- **非視覚的理由**: UI/UX 変更なし。GitHub Actions 実行ログと secret 一覧が証跡となる
- **代替証跡**: 自動テスト結果 + `gh workflow run` 再実行ログ + `gh api .../secrets` 出力

## 証跡の主ソース

| ソース | ファイル / 場所 |
|--------|----------------|
| local guard 実行 | `outputs/phase-11/evidence/verify-workflow-doc-refs.txt` |
| guard test | `outputs/phase-11/evidence/verify-workflow-doc-refs-test.txt`（TC-01〜TC-07 PASS） |
| bash syntax | `outputs/phase-11/evidence/bash-syntax.txt` |
| runtime pending marker | `outputs/phase-11/evidence/runtime-pending.md` |
| secret 投入後の登録確認 | user-gated。取得時は secret 名のみ（5 行・値は記録しない） |
| runtime-smoke-staging 再実行ログ | user-gated。job URL + step 単位の exit code、bearer / member id 等は記録しない |

## スクリーンショットを作らない理由

UI を持たないため。GitHub Actions web UI のスクリーンショットは取得しない（PII / secret マスキングの誤り混入リスクを避けるため）。

## 実行手順

```bash
# 1. guard test
bash scripts/ci/__tests__/verify-workflow-doc-refs.spec.sh \
  | tee outputs/phase-11/evidence/verify-workflow-doc-refs-test.txt

# 2. secrets list（user 操作後の確認）
gh api repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke/secrets \
  --jq '.secrets[].name' | sort > outputs/phase-11/secrets-list.txt

# 3. 再実行
gh workflow run runtime-smoke-staging.yml --ref dev
# run-id を取得し watch
gh run watch
# 完了後、結果サマリを記録（secret 値や bearer は記録しない）
```

## 完了条件

- guard test SUMMARY が `7 passed / 0 failed`
- local repo guard evidence が PASS
- secrets-list は user 操作後に 5 行
- runtime-smoke-staging job の `smoke` step は user-approved rerun 後に exit 0
