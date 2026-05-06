# Phase 10: 最終レビュー / Rollback 経路

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 作成日 | 2026-05-06 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 依存 | Phase 9 PASS |

## 目的

PR merge 前の最終レビューと、merge 後に問題が発覚した場合の **完全に逆順実行可能な rollback 経路** を確定する。本タスクは production の D1 schema / GitHub Secret / GitHub Actions workflow の 3 層に副作用を持つため、各層の戻し方を明文化する。

## 成果物

| ファイル | 役割 |
| --- | --- |
| `outputs/phase-10/phase-10.md` | 本 index |
| `outputs/phase-10/rollback-runbook.md` | 5 ステップの逆順 rollback 手順 |
| `outputs/phase-10/review-checklist.md` | CODEOWNERS-aligned レビューチェックリスト |

## Rollback 経路（要約）

1. `gh workflow disable cf-audit-log-monitor.yml`
2. `gh workflow disable cf-audit-log-monitor-watchdog.yml`
3. Cloudflare Dashboard で監視 Token (`CF_AUDIT_TOKEN_PROD`) を revoke（deploy Token と独立）
4. （オプション）D1 `DROP TABLE cf_audit_log; DROP TABLE cf_audit_baseline;` を `bash scripts/cf.sh d1 execute` で実行
5. `gh pr revert <PR>` または `git revert <merge-sha>`

詳細は `outputs/phase-10/rollback-runbook.md` を参照。

## レビュー観点（要約）

- `apps/api` / `apps/web` 配下が **無変更** であること（CODEOWNERS path 影響なし）
- D1 migration が **可逆** であること（`down` migration が用意されているか、`DROP TABLE` で完全に戻せるか）
- 監視 Token の scope が deploy Token と分離・最小であること
- SSOT (`deployment-secrets-management.md` / `observability-monitoring.md` / `15-infrastructure-runbook.md`) が更新済
- source unassigned-task (`U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md`) の status が link 済

## DoD

- [ ] `rollback-runbook.md` が 5 ステップを順序付き・コマンド付きで網羅
- [ ] `review-checklist.md` の全項目が check 済
- [ ] staging mirror があれば dry-run 実施、なければ「production-direct rollback リスク受容」を runbook に明記
- [ ] reviewer による外形レビュー（solo dev のため self-review）完了

## 関連

- `outputs/phase-10/rollback-runbook.md`
- `outputs/phase-10/review-checklist.md`
- 上流: `outputs/phase-9/`
- 下流: `outputs/phase-11/`
