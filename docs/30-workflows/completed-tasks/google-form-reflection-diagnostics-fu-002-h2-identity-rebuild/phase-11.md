# Phase 11: 検証 evidence 取得計画

## 11.1 evidence 一覧

| id  | 取得タイミング | ファイル / 場所                                                         | 内容                                                                |
| --- | -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| E-01 | ローカル        | `outputs/phase-11/typecheck.log`                                       | `pnpm typecheck` の出力                                             |
| E-02 | ローカル        | `outputs/phase-11/lint.log`                                            | `pnpm lint` の出力                                                  |
| E-03 | ローカル        | `outputs/phase-11/api-test.log`                                        | `pnpm --filter @ubm-hyogo/api test` の出力                          |
| E-04 | staging         | `outputs/phase-11/staging-identityHealth-before.json`                  | migration 適用**前**の `/admin/diagnostics/snapshot` の identityHealth |
| E-05 | staging         | `outputs/phase-11/staging-identityHealth-after.json`                   | migration 適用**後**の identityHealth                               |
| E-06 | staging         | `outputs/phase-11/staging-member-diagnosis-sample-1.json` 〜 sample-3 | 3 sample memberId で H2_identityMissing=false                       |
| E-07 | staging         | `outputs/phase-11/staging-migration-rerun.log`                         | 冪等性確認: 2 回目適用で「No migrations to apply」                  |
| E-08 | production      | `outputs/phase-11/prod-d1-backup-path.txt`                             | backup SQL のパス（実ファイルは別保管）                              |
| E-09 | production      | `outputs/phase-11/prod-identityHealth-after.json`                      | production 適用後の identityHealth                                  |
| E-10 | production+24h | `outputs/phase-11/prod-autolink-log-summary.md`                        | UBM-AUTH-AUTOLINK-* の集計                                          |

## 11.2 取得スクリプト

```bash
# E-01〜E-03
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/typecheck.log
mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/lint.log
mise exec -- pnpm --filter @ubm-hyogo/api test 2>&1 | tee outputs/phase-11/api-test.log

# E-04 (staging before)
curl -s -H "x-internal-auth: $INTERNAL_AUTH_SECRET" \
  "$STAGING_API/admin/diagnostics/snapshot" \
  | jq '.identityHealth' > outputs/phase-11/staging-identityHealth-before.json

# E-05 (staging after) ← migration 適用後に再実行

# E-06 (3 sample)
for i in 1 2 3; do
  MID="${SAMPLE_MEMBER_ID_$i}"
  curl -s -H "x-internal-auth: $INTERNAL_AUTH_SECRET" \
    "$STAGING_API/admin/diagnostics/member/$MID" \
    > outputs/phase-11/staging-member-diagnosis-sample-$i.json
done
```

## 11.3 受け入れ判定

E-01〜E-07 が green / 期待値一致なら Gate-B 通過。E-08〜E-10 で Gate-C 通過。
