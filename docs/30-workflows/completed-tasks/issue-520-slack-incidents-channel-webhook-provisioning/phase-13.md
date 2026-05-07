# Phase 13: PR 作成 — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 13 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 自走実行可否 | G1〜G4 はユーザー明示承認必須（外部 SaaS 不可逆操作）/ Phase 13 の commit / push / PR もユーザー指示後に実行 |

## 目的

本タスクの spec / implementation guide / channel + webhook provisioning evidence を含む PR 作成手順を仕様化する。**G ゲート方式**（G1〜G4 の各承認 + Phase 13 の commit / push / PR の独立承認、合算承認禁止）に従い、本仕様書 cycle では PR を作成しない。

## 入力

- Phase 1〜12 全成果物
- Phase 2: `outputs/phase-02/main.md`
- Phase 5: `outputs/phase-05/main.md`
- Phase 6: `outputs/phase-06/main.md`
- Phase 7: `outputs/phase-07/main.md`
- Phase 8: `outputs/phase-08/main.md`
- Phase 9: `outputs/phase-09/main.md`
- Phase 10: `outputs/phase-10/main.md`
- `.claude/commands/ai/diff-to-pr.md`
- `outputs/phase-12/implementation-guide.md`

## Task 13-1: branch 名

- 既定（既に作成済の本ブランチを使用）: `docs/issue-520-slack-incidents-channel-webhook-provisioning`
- 実装作業ブランチに昇格する場合: `feat/issue-520-slack-incidents-channel-webhook-provisioning`
- branch 命名規約: spec 段階は `docs/`、コード変更を伴う実装段階は `feat/`

## Task 13-2: PR title

- spec PR: `docs(issue-520): provision ubm-hyogo-incidents Slack channel + webhook secrets`
- 70 文字以内 / Conventional Commits 準拠

## Task 13-3: PR body 骨子（Phase 12 implementation-guide.md を反映）

```
## Summary
- Slack incidents channel `#ubm-hyogo-incidents` を新規プロビジョニングし、incoming webhook を発行する仕様を確定
- `SLACK_WEBHOOK_INCIDENT` を 1Password / Cloudflare staging / Cloudflare production / GitHub Actions の 4 配置先に redaction-safe に投入する手順と evidence template を確定
- G1〜G4 multi-stage approval gate で staging→production の段階的疎通契約を定義（合算承認禁止）

## Scope In
- Slack channel `#ubm-hyogo-incidents` 作成 / incoming webhook 発行
- 1Password 正本 item path 規約（`op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>`）
- Cloudflare Workers staging / production secret 投入（`bash scripts/cf.sh secret put` 経由）
- GitHub Actions secret 登録
- staging / production smoke 着弾確認 evidence template
- aiworkflow-requirements 同期（observability-monitoring.md / deployment-secrets-management.md）
- redaction grep gate 4 系統 + runbook

## Scope Out
- `apps/api/src/routes/admin/smoke-observability.ts` の route 実装（issue-495-09b-A 側）
- PagerDuty 連携 / Sentry-to-Slack 公式統合 / bot token 化 / production deploy 自体

## Channel / Secret 配置結果（runtime wave で実体化）
- Slack channel: `#ubm-hyogo-incidents` (channel id: <provisioned>, redacted)
- 1Password item: `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_PRODUCTION`
- 1Password item: `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING`
- Cloudflare staging: `bash scripts/cf.sh secret list --env staging` で `SLACK_WEBHOOK_INCIDENT` を name-only 確認
- Cloudflare production: `bash scripts/cf.sh secret list --env production` で `SLACK_WEBHOOK_INCIDENT` を name-only 確認
- GitHub Actions: `gh secret list --repo daishiman/UBM-Hyogo` で name-only 確認
- webhook URL 実値は op:// 参照のみ。本 PR / commit / log に一切記載しない

## AC-1〜AC-8 通過 evidence path
- AC-1: outputs/phase-11/channel-provisioning-log.md (G1 セクション)
- AC-2: outputs/phase-11/channel-provisioning-log.md (op:// path 参照)
- AC-3: outputs/phase-11/webhook-smoke-log.md (G3 セクション / cf.sh secret list name-only 出力)
- AC-4: outputs/phase-11/webhook-smoke-log.md (gh secret list name-only 出力)
- AC-5: outputs/phase-11/webhook-smoke-log.md (staging permalink redacted)
- AC-6: outputs/phase-11/webhook-smoke-log.md (production permalink redacted)
- AC-7: outputs/phase-11/evidence/grep-gate.log (4 系統 0 hit)
- AC-8: aiworkflow-requirements 2 reference の diff（observability-monitoring.md / deployment-secrets-management.md）

## G1〜G4 通過記録
- G1 (channel + webhook 作成): outputs/phase-11/channel-provisioning-log.md G1 timestamp / approver
- G2 (1Password + Cloudflare staging secret): outputs/phase-11/channel-provisioning-log.md G2
- G3 (Cloudflare production secret + staging smoke PASS): outputs/phase-11/webhook-smoke-log.md G3
- G4 (production smoke PASS + redaction grep 0 hit): outputs/phase-11/webhook-smoke-log.md G4
- 合算承認禁止: G1〜G4 と Phase 13 (commit / push / PR) は独立した user approval を取得

## Test plan
- [ ] mise exec -- pnpm typecheck
- [ ] mise exec -- pnpm lint
- [ ] redaction grep gate 4 系統 0 hit:
      rg -n 'hooks\.slack\.com/services/[A-Z0-9]' .
      rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}' .
      rg -n 'xox[bp]-' .
      rg -n "${WORKSPACE_FRAGMENT_PATTERN:?set from 1Password}" .
- [ ] bash scripts/cf.sh secret list --env staging で SLACK_WEBHOOK_INCIDENT 存在確認
- [ ] bash scripts/cf.sh secret list --env production で SLACK_WEBHOOK_INCIDENT 存在確認
- [ ] gh secret list で SLACK_WEBHOOK_INCIDENT 存在確認
- [ ] staging smoke 実 POST → `[STAGING SMOKE]` prefix 着弾（permalink redacted）
- [ ] production smoke 実 POST → `[PRODUCTION SMOKE]` prefix 着弾（permalink redacted）
- [ ] aiworkflow-requirements indexes rebuild 後 drift 0

## Redaction confirmation
- [ ] PR 本文に webhook URL fragment / token / workspace ID 完全形が含まれていない
- [ ] PR 本文 / commit message / branch 名に workspace 固有 URL fragment（実値は 1Password 管理）が一切ない
- [ ] evidence ファイルの redaction grep gate（4 系統）が 0 hit
```

スクリーンショットセクションは作成しない（`visualEvidence: NON_VISUAL` / N/A）。

## Task 13-4: PR 本文 webhook URL fragment 最終 grep 確認手順

PR 作成直前（`gh pr create` 発火前）に必ず以下を実行し、出力に hit が無いことを目視確認する:

```bash
# PR body 文面候補を /tmp/pr-body.md に保存した状態で実行
rg -n 'hooks\.slack\.com/services/[A-Z0-9]' /tmp/pr-body.md && echo "ABORT: webhook URL fragment detected" && exit 1
rg -n 'B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}'      /tmp/pr-body.md && echo "ABORT: B-id/token fragment detected" && exit 1
rg -n 'xox[bp]-'                            /tmp/pr-body.md && echo "ABORT: Slack token detected" && exit 1
rg -n "${WORKSPACE_FRAGMENT_PATTERN:?set from 1Password}" /tmp/pr-body.md && echo "ABORT: workspace fragment detected" && exit 1
echo "OK: PR body redaction verified (4 patterns, 0 hit)"
```

PASS 条件: `OK: PR body redaction verified (4 patterns, 0 hit)` のみが出力されること。1 件でも hit したら PR 作成を中断し evidence / body を修正。

## Task 13-5: PR 作成前 self-check

- [ ] redaction grep gate 4 系統 0 hit（repo 全域 + PR body 候補）
- [ ] `outputs/phase-11/main.md` に G1〜G4 通過 timestamp + approver が記録されている
- [ ] `outputs/phase-11/channel-provisioning-log.md` / `webhook-smoke-log.md` の `<provisioned>` placeholder が runtime wave 後に実測値（redaction 形式）に置換済み
- [ ] `outputs/phase-12/` 配下 7 ファイル実体存在
- [ ] aiworkflow-requirements 2 reference の diff が `system-spec-update-summary.md` と整合
- [ ] indexes rebuild 後 `git status` drift 0
- [ ] PR body に webhook URL fragment / token / workspace ID 完全形が含まれていない
- [ ] G1〜G4 + Phase 13 (commit / push / PR) が **独立した user approval** で取得される設計が PR body 上で明示されている
- [ ] PR body にスクリーンショット専用セクションが残っていない（NON_VISUAL）
- [ ] branch 名が `docs/issue-520-slack-incidents-channel-webhook-provisioning`（または昇格時 `feat/...`）

## Task 13-6: 承認 gate G-05（PR 作成許可）

- 条件: 13-5 self-check 全 PASS かつ Phase 13 commit / push / PR について独立した user approval を取得
- 自走禁止: `git commit` / `git push` / `gh pr create` を本仕様書 cycle で実行しない
- 自律実行可否: G ゲート（G1〜G4）は user 明示承認必須（外部 SaaS 不可逆操作 / 副作用大）。Phase 13 commit / push / PR も user 指示後に実行する

## 自走禁止操作（再掲）

1. `git commit` / `git push` / `gh pr create`
2. 実 Slack channel 作成 / 実 incoming webhook 発行
3. 1Password / Cloudflare staging / Cloudflare production / GitHub Actions への実 secret 投入
4. staging / production smoke 実 POST
5. `wrangler` 直接実行
6. webhook URL 実値・token・workspace 固有 URL fragment（実値は 1Password 管理）を含む文字列の docs / log / PR body / commit message への記載

## 制約事項

- PR body には webhook URL 実値を絶対に記載しない（op:// 参照のみ）
- スクリーンショットは N/A（NON_VISUAL）/ PR body にスクリーンショットセクションを残さない
- G1〜G4 + Phase 13 の合算承認禁止
- Phase 13 自体の commit / push / PR は user 指示後に実行

## 成果物

- `outputs/phase-13/main.md`（PR title / body 骨子 / branch / self-check / G-05 / G1〜G4 説明 / 最終 grep 確認手順）

## 完了条件（本仕様書 cycle）

- [ ] `outputs/phase-13/main.md` が PR template として完成
- [ ] PR body 骨子に webhook URL fragment が含まれていない
- [ ] G1〜G4 + Phase 13 commit / push / PR の独立承認設計が明示
- [ ] 最終 grep 確認手順（4 系統）が記述
- [ ] 本タスクで `git commit` / `git push` / `gh pr create` を実行していない

## タスク 100% 実行確認

- [ ] PR body 骨子が Phase 12 implementation-guide.md と整合
- [ ] 自律実行可否（G ゲート user approval 必須 / Phase 13 user 指示後）が明記
- [ ] スクリーンショットセクション N/A の明記

## 次工程

本サイクルは spec + local static hardening PR を先行して作成できる状態までを定義する。PR 作成後、別途 user approval を経て runtime execution wave（G1→G2→G3→G4）に着手し、`channel-provisioning-log.md` / `webhook-smoke-log.md` を順次実体化する。runtime evidence 取得後は同PRへの追加commit、またはユーザーが指定する後続PRで merge ready 化する。

## 実行タスク

- 本 Phase の確定事項を対応する outputs/phase-* 成果物へ反映する。

## 参照資料

- 本 workflow の前段 Phase。
- task-specification-creator / aiworkflow-requirements の該当 reference。

## 完了条件

- 必須成果物が存在し、runtime pending と static PASS の境界が明記されている。

## 統合テスト連携

- ローカル静的検証は focused test / validator / redaction grep で行い、実 Slack / secret / smoke は user approval 後の Phase 11 runtime wave で実行する。
