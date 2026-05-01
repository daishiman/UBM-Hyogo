# task-09c-incident-runbook-slack-delivery-001

## メタ情報

```yaml
issue_number: 349
```


## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-09c-incident-runbook-slack-delivery-001 |
| タスク名 | Incident response runbook の Slack 自動配信 |
| 分類 | operations |
| 対象機能 | Incident response / Slack delivery |
| 優先度 | 低 |
| 見積もり規模 | 中規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-12/unassigned-task-detection.md` |
| 発見日 | 2026-05-01 |

## 1. なぜこのタスクが必要か（Why）

09c の release runbook share evidence は手動 URL / Email placeholder 前提で、自動配信の責務が未設計である。incident response runbook は production release 後に関係者へ届いていることが重要だが、手動共有だけでは message timestamp や宛先の証跡が残りにくい。

放置すると、incident 発生時に最新 runbook の所在確認から始まり、初動が遅れる。

## 2. 何を達成するか（What）

09b/09c の incident response runbook を Slack bot で指定 channel に配信し、message timestamp と evidence path を保存する運用または workflow を作る。

## 3. どのように実行するか（How）

Slack token は 1Password 正本から GitHub/Cloudflare の派生 secret に渡し、ドキュメントには secret 値を書かない。dry-run channel と production channel を分け、production 送信は user approval 後に限定する。

## 4. 実行手順

1. 09b incident response runbook と 09c share evidence の入力ファイルを確認する。
2. Slack app/token の必要 scope と secret 配置先を決める。
3. dry-run channel で message template を検証する。
4. production channel 送信時の approval gate と evidence 保存先を定義する。
5. message timestamp を Phase 11/ops evidence に保存する。

## 5. 完了条件チェックリスト

- [ ] Slack token の配置先と secret 名が正本化されている
- [ ] dry-run と production の channel が分離されている
- [ ] message timestamp を evidence として保存できる
- [ ] runbook 本文の所有者と更新元が明示されている

## 6. 検証方法

```bash
gh secret list
rg -n "Slack|message ts|incident response" docs/30-workflows .claude/skills/aiworkflow-requirements/references
```

期待: Slack delivery に必要な secret 名だけが登録され、message timestamp の保存先が検索できる。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| secret 漏洩 | Slack token は 1Password 正本、ログには channel id と message ts のみ保存 |
| 誤配信 | dry-run channel と production channel を分離 |
| runbook 本文の stale 化 | 本タスクは配信だけに限定し、本文更新元を参照リンクで固定する |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md`
- `docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## 9. 備考

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260501-065106-wt-10/docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-11.md`
- 症状: share-evidence は手動 URL / Email placeholder 前提で、自動配信と message timestamp 保存が未設計だった
- 参照: 09c Phase 12 unassigned-task-detection

## スコープ

### 含む

- Slack delivery runbook または workflow
- share-evidence の自動 message timestamp 記録

### 含まない

- incident runbook 本文の再設計
- Slack token 値の記録
