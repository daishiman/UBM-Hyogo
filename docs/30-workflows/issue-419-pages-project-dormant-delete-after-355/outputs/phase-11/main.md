# Phase 11 — 削除運用 evidence 取得（NON_VISUAL）

state: PENDING_RUNTIME_EXECUTION
workflow_state: spec_created
taskType: implementation
visualEvidence: NON_VISUAL
captured_at: -
operator: -
runtime_pass: PENDING

## 状況

NON_VISUAL。本サイクル（spec_created）では Cloudflare Pages の **物理削除を実行していない**。
declared evidence 8 ファイル（main 含む）の skeleton 配置のみで、値の埋めは user 明示承認後の runtime cycle で実施する。

## 取得時に作成・更新すべきファイル

| ファイル | AC リンク | 初期 state |
| --- | --- | --- |
| `preflight-ac1-ac2.md` | AC-1 / AC-2 | PENDING_RUNTIME_EXECUTION |
| `workers-pre-version-id.md` | AC-1 (rollback 戻り先 1段目) | PENDING_RUNTIME_EXECUTION |
| `dormant-period-log.md` | AC-3 (≥ 2 週間) | PENDING_RUNTIME_EXECUTION |
| `user-approval-record.md` | AC-4 | PENDING_RUNTIME_EXECUTION |
| `deletion-evidence.md` | (cf.sh pages project delete redacted) | PENDING_RUNTIME_EXECUTION |
| `post-deletion-smoke.md` | (Workers 200 OK 再確認) | PENDING_RUNTIME_EXECUTION |
| `redaction-check.md` | AC-5 | PENDING_RUNTIME_EXECUTION |

## runtime cycle 開始時のチェックリスト

- [ ] `bash scripts/cf.sh whoami` 成功
- [ ] AC-1: Workers production route + smoke evidence 完了確認 → `preflight-ac1-ac2.md` / `workers-pre-version-id.md`
- [ ] AC-2: Pages custom domain attachment 空 + 直近 deploy が cutover 以前 → `preflight-ac1-ac2.md`
- [ ] AC-3: dormant 観察開始日記録、≥ 2 週間経過後に終了日とエラー率推移 → `dormant-period-log.md`
- [ ] AC-4: user 明示承認文言を引用 → `user-approval-record.md`
- [ ] `bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes` exit code = 0 → `deletion-evidence.md`（redacted）
- [ ] AC-5: `rg -i "(CLOUDFLARE_API_TOKEN|Bearer |\?token=|access_key|secret)" outputs/phase-11/` 0 件 → `redaction-check.md`
- [ ] 削除後 Workers production smoke 200 OK → `post-deletion-smoke.md`
- [ ] 本ファイル `state` を `PASS` に書き換え、`captured_at` / `operator` / `runtime_pass=PASS` を埋める

## 境界

- destructive かつ revert 不可。`bypassPermissions` でも user 明示承認なしに実行しない。
- runtime evidence の値が埋まるまでは visual / runtime PASS の根拠にしない。
