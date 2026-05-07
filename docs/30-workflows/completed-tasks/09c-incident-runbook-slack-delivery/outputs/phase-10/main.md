# Phase 10 サマリ — 09c-incident-runbook-slack-delivery

[実装区分: 実装仕様書]

## 状態

- workflow_state: `spec_created`
- phase status: `spec_created`（実行 wave で実 readiness checklist を埋める）

## Phase 10 で扱う内容（spec close-out 時点では placeholder）

### approver assignment（実行 wave で記録）

- production environment 名: `production-slack-delivery`
- approver（default）: `@daishiman`（個人開発期）
- 必須 reviewer 数: 1 / wait timer: 0 分
- deployment branches: `main` のみ
- 確認コマンド: `gh api repos/daishiman/UBM-Hyogo/environments/production-slack-delivery`

### secret/variable 確認結果（S1〜S5、実行 wave で記録）

| # | 名前 | 種別 | 状態 |
| --- | --- | --- | --- |
| S1 | `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` | GitHub Secret | pending |
| S2 | `SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` | GitHub Variable | pending |
| S3 | `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID` | GitHub Variable | pending |
| S4 | `op://UBM-Hyogo/Slack Bot - Incident Runbook/credential` | 1Password 正本 | pending |
| S5 | 1P 値 ↔ GitHub Secret 値 同期 | rotation 整合 | pending |

### Slack workspace readiness（W1〜W6、実行 wave で記録）

| # | 確認項目 | 状態 |
| --- | --- | --- |
| W1 | bot が `#ubm-hyogo-incident-runbook` member | pending |
| W2 | bot が `#ubm-hyogo-incident-runbook-dryrun` member | pending |
| W3 | scope `chat:write` / `chat:write.public` / `channels:read` | pending |
| W4 | channel id が GitHub Variables 値と一致 | pending |
| W5 | `team_id = w1618436027-ek2505248` | pending |
| W6 | bot membership が 2 channel のみ | pending |

### dry-run final smoke

- 実行コマンド: `bash scripts/notify/slack-incident-runbook.sh --mode dryrun ...`（Phase 10 §dry-run final smoke 参照）
- 結果記録 path: `docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence/slack-delivery-dryrun.json`
- 状態: pending

### rollback plan（R1〜R4）

| # | 手順 | コマンド |
| --- | --- | --- |
| R1 | workflow 即時無効化 | `gh workflow disable incident-runbook-slack-delivery.yml` |
| R2 | Slack message 削除 | Slack admin UI |
| R3 | token rotation | 1P → `gh secret set` → Slack revoke |
| R4 | re-enable | `gh workflow enable incident-runbook-slack-delivery.yml` |

### CHANGELOG / release notes 草案

phase-10.md §release notes / CHANGELOG 草案 を Phase 12 で `outputs/phase-12/documentation-changelog.md` に転記する。

### monitoring 経路（M1〜M4）

| # | 失敗種別 | 通知 |
| --- | --- | --- |
| M1 | GitHub Actions job failure | default email → release oncall |
| M2 | Slack API non-200 / `ok=false` | M1 連動 |
| M3 | secret 解決失敗 | workflow fail-fast |
| M4 | dryrun/production channel id 同値 | unit test fail（CI gate） |

別 Slack channel への失敗通知拡張は scope 外（Phase 12 unassigned-task に分離）。

## 完了条件

- [ ] approver / S1〜S5 / W1〜W6 / dry-run smoke / rollback / CHANGELOG / monitoring の 7 ブロックが実 wave で全て埋まる
- [ ] CONST-RUN-01（token 値の非記載）を遵守

## 参照

- `phase-10.md`（実体仕様）
- `index.md`
- `artifacts.json`
