# Phase 8: ドキュメント差分

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## 編集対象

| ファイル | 編集内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | fallback alert セクションに「Slack / mail 通知の有効化手順」を 1 サブセクション追加（env 名・1Password 参照・dry-run 検証コマンド） |
| `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-03.md` | 冒頭に `> superseded by docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/` の追記 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 必要に応じて fallback alert 通知系のエントリ更新（Phase 12 で `pnpm indexes:rebuild` 実行時に再生成されれば不要） |

## 追記内容（15-infrastructure-runbook.md）

```markdown
### Fallback alert 通知の有効化（Issue #588）

fallback rate > 5% × 3h を満たした場合、GitHub Issue 起票に加えて Slack / mail 通知を発火させる。

**env 設定:**

| env | source | 必須 |
| --- | --- | --- |
| `SLACK_WEBHOOK_INCIDENT` | `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` | 推奨 |
| `EMAIL_WEBHOOK_URL` | `op://Cloudflare/UBM-Hyogo Shared/email-webhook-incident` | 任意（provider 契約後） |
| `EMAIL_FROM` / `EMAIL_TO` | GitHub Variables | mail 利用時必須 |

**dry-run 検証:**

```bash
SLACK_WEBHOOK_INCIDENT=https://hooks.slack.com/test \
  mise exec -- tsx scripts/cf-audit-log/observation/fallback-rate-alert.ts \
    --window=3 --threshold=0.05 \
    --input=path/to/fixture --dry-run
```

**failure isolation:** Slack / mail 通知失敗時も GitHub Issue 起票は実行される。
```

## SSOT 同期

- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` のみが対象（runbook 系正本）
- 他の specs (`00-overview.md` 等) は通知 channel 拡張に影響を受けないため編集不要

## 出力

- `outputs/phase-08/main.md`
