# Phase 11 手動 smoke 手順ログ（runtime, user-gated）

> 実 staging 実行はユーザー承認後。以下は実行予定手順。

1. GitHub repository variable を設定: `gh variable set AUDIT_COLD_STORAGE_EXPORT_PAUSED --body "true"`。
2. `gh workflow run audit-log-cold-storage.yml -f dry_run=true` を実行する。
3. 期待: workflow log の JSON result が `status: "paused"`、`objectKey: null`、`rowCount: 0`。R2 object と `audit_log_export_manifest` は増えない。
4. `gh variable set AUDIT_COLD_STORAGE_EXPORT_PAUSED --body "false"` で復旧する。
5. dry-run / apply の通常 export は別 user gate で確認する。

| 手順 | 結果（実行時記入） |
| --- | --- |
| 1-5 | pending（user-gated） |
