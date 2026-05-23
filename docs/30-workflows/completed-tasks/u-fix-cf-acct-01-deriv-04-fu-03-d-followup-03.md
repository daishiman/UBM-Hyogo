# Fallback alert Slack and mail extension

> Superseded: 2026-05-10 に `docs/30-workflows/issue-588-fallback-alert-slack-mail-extension/` として実装・正本同期済み。以後は Issue #588 workflow を canonical とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | superseded_by_issue_588 |
| 親 | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |

## 1. なぜこのタスクが必要か（Why）

GitHub Issue 起票だけでは fallback rate の継続超過に気付くまで遅れる可能性がある。

## 2. 何を達成するか（What）

fallback rate > 5% x 3h の Slack / mail 通知を追加し、secret redaction を保証する。

## 3. どのように実行するか（How）

既存 alert destination policy と 1Password 正本を使い、dry-run notification で検証する。

## 4. 実行手順

1. 通知先 secret の正本を確認する。
2. fallback alert に dry-run 通知を追加する。
3. redaction grep を実行する。

## 5. 完了条件チェックリスト

- [ ] dry-run notification が成功。
- [ ] webhook 値が evidence に残っていない。
- [ ] GitHub Issue body が redacted only。

## 6. 検証方法

### 単体検証

```bash
test -f docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/fallback-alert-dry-run.md
rg -n "fallback rate|dry-run|redacted" \
  docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/fallback-alert-dry-run.md
```

期待: fallback rate > 5% x 3h の dry-run notification と redaction 結果が存在する。

### 統合検証

```bash
rg -n "SLACK_WEBHOOK|incident|mail|fallback" \
  .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
  .claude/skills/aiworkflow-requirements/references/observability-monitoring.md
```

期待: 通知先 secret は 1Password 正本名のみで、解決値が残っていない。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| alert fatigue | 3 hour 連続超過のみ通知 |
| webhook 漏洩 | dry-run evidence には redacted destination と delivery status のみ残す |

## 8. スコープ

### 含む

- fallback rate > 5% x 3h の Slack / mail dry-run 通知。
- notification evidence の redaction grep。
- GitHub Issue body sample の redacted 確認。

### 含まない

- external SIEM bulk export。
- ML model artifact rotation（followup-02）。
- production switch merge 本体。

## 9. 苦戦箇所【記入必須】

- 対象: Slack / mail destination secret と dry-run evidence。
- 症状: 通知検証で webhook URL や mail token を evidence に保存しやすい。
- 対策: 1Password 正本名、delivery id、redacted destination だけを保存し、grep gate を完了条件にする。

## 10. 参照情報

- `docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/`

## 11. 備考

external SIEM bulk export は含めない。
