# Postmortem: {{release}}

> `pnpm postmortem:generate` で生成した雛形。
> evidence の正本は下記の 09c Phase 11 evidence を参照する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Release | `{{release}}` |
| Commit | `{{commit}}` |
| 発生時刻 | `{{occurredAt}}` |
| 検知時刻 | `{{detectedAt}}` |
| 復旧時刻 | `{{resolvedAt}}` |
| Severity | `{{severity}}` |
| Evidence path | `{{evidencePath}}` |
| Rollback evidence | `{{rollbackEvidencePath}}` |

## Timeline

| 時刻（UTC） | 出来事 |
| --- | --- |
| {{occurredAt}} | （観測した出来事を記入） |
|  |  |
|  |  |

> 主語は出来事や対応にする。個人名を主語にしない。

## Impact

- 影響範囲: （記入）
- 影響を受けたユーザー: （記入）
- 影響を受けた機能: （記入）

## Detection

- 検知した signal: （dashboard / alert / user report）
- 初回検知時刻: `{{detectedAt}}`
- 発生から検知までの時間: （記入）

## Response

- 実施した対応: （記入）
- Rollback 種別: （worker / pages / D1 / cron / none）
- Rollback evidence: `{{rollbackEvidencePath}}`

## Root Cause

> 主語はコード、設定、データ、プロセスにする。

- 技術的原因: （記入）
- 関連要因: （記入）

## Prevention

- Monitoring: （追加する alert / dashboard）
- Test: （追加する unit / integration / E2E）
- Runbook update: （更新対象の相対パス）

## Follow-up Issues

> issue 作成手順は `docs/30-workflows/runbooks/postmortem/README.md` を参照する。
> Prevention に対応項目がある場合、postmortem ごとに 1 件以上の follow-up issue を作成する。

- [ ] `[postmortem-followup] （概要）` - tracking: （issue link）
- [ ] `[postmortem-followup] （概要）` - tracking: （issue link）
