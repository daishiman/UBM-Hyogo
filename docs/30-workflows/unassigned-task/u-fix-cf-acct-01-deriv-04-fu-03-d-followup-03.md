# Fallback alert Slack and mail extension

## メタ情報

| 項目 | 値 |
| --- | --- |
| ステータス | 未着手 |
| 親 | `docs/30-workflows/issue-549-cf-audit-ml-production-switch/` |

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

dry-run notification log、redaction grep、Issue body sample を確認する。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| alert fatigue | 3 hour 連続超過のみ通知 |

## 8. 参照情報

- `docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/`

## 9. 備考

external SIEM bulk export は含めない。
