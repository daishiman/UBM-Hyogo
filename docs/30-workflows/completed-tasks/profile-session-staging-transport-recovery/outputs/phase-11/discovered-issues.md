# Phase 11 Discovered Issues

## Issues

implemented_local_runtime_pending 段階のため Phase 11 実施由来の新規発見事項は 0 件（RT-A〜RT-D 未実施）。仕様書作成過程で確定済みの設計欠陥は F-A / F-B として SSOT §1 に記録済みで、本 WF の T02 / T03 が実装で根治する（新規 Issue 起票対象ではない）。

## User-Gated Items

- RT-A: staging deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`）。
- RT-B: 拡張後診断スクリプトの 2 系統 probe 実行。
- RT-C: ログイン済み `/profile` 正常描画確認 + 復旧後 screenshot（`profile-session-recovery-staging.png`）。
- RT-D: 非復旧時の新構造化ログ読解による S1〜S4 確定。
- S3 確定時のみ: `unassigned-task/task-api-worker-hard-error-root-fix.md` の着手（CONST_007 例外①）。
