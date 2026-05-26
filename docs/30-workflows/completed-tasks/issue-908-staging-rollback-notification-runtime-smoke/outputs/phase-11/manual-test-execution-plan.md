# Phase 11 Manual Test Execution Plan — issue-908-staging-rollback-notification-runtime-smoke

> 本ファイルは Phase 11 実行用プラン雛形（spec-only roots における strict-7 #7 代替）。
> 実行記録（実値・redact 済）は親 root の `outputs/phase-11/evidence/staging-smoke.md` に転記する。

## Status

`runtime_pending`（helper 実行・evidence MD 転記は user-gated）

## Execution Order

1. Phase 10 PASS 確認
2. 自動検証（typecheck / lint / `bash -n` / `--dry-run`）
3. staging deploy（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging`）
4. S-sent 実行 → 親 evidence MD `Scenario S-sent` に転記
5. S-skipped 実行（または unit test 代替記録）
6. S-failed 実行（意図的無効 webhook）
7. 親 `manual-test-result.md` Status mutation
8. 親 `artifacts.json` Gate-C / Phase 11 status 更新
9. AC-1..AC-7 を親 evidence MD に記録

## Cross-link

- 親 evidence MD（実行後生成）: `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md`
- 親 manual-test-result.md（mutation 対象）: 同上 root `outputs/phase-11/manual-test-result.md`

## Runtime Boundary

helper script の本実行、evidence MD 転記、親ファイル mutation、commit/push/PR はすべて user-gated。本仕様書策定時点では未実施。

## Redaction Note

evidence MD には helper の `redact()` pipe を必ず通した出力のみ転記する。直接の curl/cf.sh 生出力を貼らないこと。
