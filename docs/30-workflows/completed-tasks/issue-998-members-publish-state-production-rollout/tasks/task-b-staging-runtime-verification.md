# Task B — Staging runtime 検証 runbook（原 issue #998 Gate-C）

`[実装区分: 実装仕様書 / runtime-ops runbook / user-gated]`

## 目的

staging 環境で auto-publish policy + backfill が実環境で機能し、`/members` の会員表示が復旧することを実証する。原 issue #998 の Gate-C をそのまま継承する。Task C（production rollout）の前提となる安全性 evidence を取得する。

## 前提条件

- Task A 完了（コード変更はまだ deploy していなくてよい。staging flag は既に `"true"`）。
- `SYNC_ADMIN_TOKEN`（staging 用）をユーザーが安全に提供できること。
- Cloudflare 操作は `bash scripts/cf.sh` 経由のみ。

## 実行手順（runbook / すべて user-gated）

| # | ステップ | コマンド | 成果物 |
|---|---------|---------|--------|
| 1 | before screenshot | staging `/members` をブラウザで開き保存 | `outputs/phase-11/staging-members-before.png` |
| 2 | staging deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | deploy log（summary に記録） |
| 3 | diagnose-pre | `SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env staging > outputs/phase-11/staging-diagnose-pre.json` | `staging-diagnose-pre.json` |
| 4 | backfill dry-run | `SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --dry-run > outputs/phase-11/staging-backfill-dry-run.json` | `staging-backfill-dry-run.json` |
| 5 | approval marker | dry-run の `candidates` 件数を記載した承認 marker を作成 | `outputs/phase-13/user-approval-staging-<timestamp>.md` |
| 6 | backfill apply | `SYNC_ADMIN_TOKEN=<redacted> bash scripts/backfill-publish-state.sh --env staging --apply > outputs/phase-11/staging-backfill-apply.json` | `staging-backfill-apply.json` |
| 7 | diagnose-post | `SYNC_ADMIN_TOKEN=<redacted> bash scripts/diagnose-members-pipeline.sh --env staging > outputs/phase-11/staging-diagnose-post.json` | `staging-diagnose-post.json` |
| 8 | after screenshot + summary | staging `/members` 再読込し screenshot + summary | `outputs/phase-11/staging-members-after.png`, `outputs/phase-11/staging-gate-c-summary.md` |

## 検証観点（入力 / 出力 / 期待）

- `diagnose-post` の `visiblePublicCount` が `diagnose-pre` より増加（または 0 件が正しい場合は `totals` / breakdown で根拠を summary に記録）。
- `backfill-apply` の `applied` 件数が dry-run の `candidates` 件数と整合。
- `skipped.adminExplicit`（admin override された hidden member）が apply 後も hidden を維持していることを spot check。
- after screenshot で public member が 1 件以上表示される。

## リスクと対策

| リスク | 対策 |
|--------|------|
| deploy が runtime 互換性で失敗 | deploy log を保存し `apps/api` build/typecheck green との差分を summary に記録 |
| evidence JSON に token 混入 | 保存後 `rg 'SYNC_ADMIN_TOKEN\|<token-prefix>' outputs/phase-11` でゼロ件確認 |
| dry-run / apply 間で D1 state 変化 | apply 直前に dry-run timestamp と candidate count を approval marker に記録。乖離大なら再 dry-run |
| admin override の誤公開 | `skipped.adminExplicit` と `updated_by != system:*` の policy evidence を確認、apply 後に hidden override 維持を spot check |
| API は改善するが `/members` UI が空のまま | browser smoke を必須成果物にし、UI 別原因があれば新規 follow-up 化 |

## DoD

- [ ] staging deploy 成功。
- [ ] diagnose pre/post JSON 保存・secret 非混入。
- [ ] dry-run の candidates / skipped breakdown 確認済み。
- [ ] approval marker 作成後にのみ apply 実行。
- [ ] apply の `applied` が dry-run の期待値と整合。
- [ ] post diagnostics で `visiblePublicCount` 増加（または 0 件根拠を summary 記録）。
- [ ] before/after screenshot 保存。
- [ ] commit / push / PR / production mutation を実行していない。

## 備考

すべての手順は user-gated runtime ops。本サイクルでは runbook を確定するのみで、実行はユーザーの明示承認後に行う。
