# Task C — Production runtime rollout runbook

`[実装区分: 実装仕様書 / runtime-ops runbook / user-gated]`

## 目的

Task A の production flag enablement を production へ deploy し、production の `member_status` を backfill apply して、production `/members` で form 回答済み会員の表示を復旧する。根本問題の最終解決。

## 前提条件

- Task A 完了（`wrangler.toml` production flag = `"true"`）。
- **Task B 完了**（staging で安全性が実証され、`applied` 件数・admin override 保護・`/members` 復旧が確認済み）。staging evidence なしに production を実行しない。
- `SYNC_ADMIN_TOKEN`（production 用）をユーザーが安全に提供できること。
- production D1 のバックアップを apply 前に取得すること。

## 実行手順（runbook / すべて user-gated・本番 D1 mutation）

| # | ステップ | コマンド | 成果物 |
|---|---------|---------|--------|
| 0 | D1 backup | `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output outputs/phase-11/prod-backup-<timestamp>.sql` | backup SQL（リポジトリにはコミットせず安全保管。path のみ summary 記録） |
| 1 | before screenshot | production `/members` をブラウザで開き保存 | `outputs/phase-11/prod-members-before.png` |
| 2 | production deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` | deploy version id（summary 記録） |
| 3 | diagnose-pre | `SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env production > outputs/phase-11/prod-diagnose-pre.json` | `prod-diagnose-pre.json` |
| 4 | backfill dry-run | `SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env production --dry-run > outputs/phase-11/prod-backfill-dry-run.json` | `prod-backfill-dry-run.json` |
| 5 | approval marker | dry-run の `candidates` 件数 + staging 実績との比較を記載した本番承認 marker | `outputs/phase-13/user-approval-production-<timestamp>.md` |
| 6 | backfill apply | `SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env production --apply > outputs/phase-11/prod-backfill-apply.json` | `prod-backfill-apply.json` |
| 7 | diagnose-post | `SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env production > outputs/phase-11/prod-diagnose-post.json` | `prod-diagnose-post.json` |
| 8 | after screenshot + summary | production `/members` 再読込し screenshot + rollout summary | `outputs/phase-11/prod-members-after.png`, `outputs/phase-11/prod-rollout-summary.md` |

## rollback 手順

| 事象 | rollback |
|------|----------|
| deploy 後に新 worker が異常 | `bash scripts/cf.sh rollback <PREVIOUS_VERSION_ID> --config apps/api/wrangler.toml --env production` |
| backfill apply が想定外 record を公開 | backup SQL から該当 `member_status` を復元、または admin UI で `publish_state='hidden'` へ手動再設定 |
| flag を再度 OFF にしたい | `wrangler.toml` production flag を `"false"` に戻して再 deploy（既に public 化した record は backfill では戻らないため手動対応） |

## 検証観点

- `prod-diagnose-post` の `visiblePublicCount` が `prod-diagnose-pre` より増加。
- `prod-backfill-apply` の `applied` が dry-run `candidates` と整合し、staging 実績と矛盾しない比率。
- admin override された hidden member が apply 後も hidden を維持（spot check）。
- production `/members` after screenshot で会員表示復旧。

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| 本番 D1 mutation の不可逆性 | 高 | step 0 で必ず backup を取得してから apply |
| admin override の誤公開 | 高 | dry-run の `skipped.adminExplicit` を staging と照合、apply 後に spot check |
| evidence に token 混入 | 高 | 保存後 redaction grep でゼロ件確認 |
| staging と production で data 分布が異なり想定外件数 | 中 | dry-run 件数を approval marker で承認、乖離大なら中止して再調査 |

## DoD

- [ ] Task B（staging）evidence で安全性が確認済み。
- [ ] production D1 backup 取得済み。
- [ ] production deploy 成功（version id 記録）。
- [ ] dry-run → approval marker → apply の順序を厳守。
- [ ] apply の `applied` が dry-run と整合・admin override 保護を spot check。
- [ ] production `/members` after screenshot で表示復旧。
- [ ] rollback 手順を summary に明記。
- [ ] commit / push / PR を実行していない（すべて user-gated）。Issue #998 は CLOSED 維持。

## 備考

すべて user-gated runtime ops（本番 mutation）。本サイクルでは runbook を確定するのみ。実行はユーザーの明示承認 + staging evidence 取得後に限る。
