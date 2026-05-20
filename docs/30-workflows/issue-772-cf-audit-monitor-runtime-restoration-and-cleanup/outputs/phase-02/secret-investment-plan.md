# Secret investment plan (repo-level)

Status: `LOCAL_SPEC_READY / EXECUTION_PENDING_USER_GATE`

## Boundary

本書は `.github/workflows/cf-audit-log-monitor.yml` が参照する monitor 系 secrets を repository-level に投入する計画を documents する。`gh secret set` の実行は user 明示承認後のみ。Claude / Codex 自律禁止。実値は 1Password に保管、`op read op://...` で動的注入する。

## 投入対象

| Name | workflow yaml 参照位置 | 現状 | source-of-truth |
| --- | --- | --- | --- |
| `CF_AUDIT_D1_TOKEN_PROD` | L68 (Fetch audit logs into D1), L78 (Analyze and alert) | 不在（repo-level / production env 両方） | 1Password production item |
| `CF_AUDIT_TOKEN_PROD` | L69 (Fetch audit logs into D1) | 不在 | 1Password production item |
| `CF_AUDIT_WORKERS_AI_TOKEN` | L81 (Analyze and alert) | 不在 | 1Password production item |
| `EMAIL_WEBHOOK_URL` | L113 (Evaluate fallback rate notification) | 不在 | 1Password production item |
| `SLACK_WEBHOOK_INCIDENT` | L112 (Evaluate fallback rate notification) | **既存** | 投入不要、inventory 確認のみ |

## 投入コマンド（user-gated）

```bash
# 1Password から動的注入。実値はシェル履歴 / log に残らないように `set +o history` 推奨
gh secret set CF_AUDIT_D1_TOKEN_PROD     --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_D1_TOKEN_PROD/credential')"
gh secret set CF_AUDIT_TOKEN_PROD        --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_TOKEN_PROD/credential')"
gh secret set CF_AUDIT_WORKERS_AI_TOKEN  --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/CF_AUDIT_WORKERS_AI_TOKEN/credential')"
gh secret set EMAIL_WEBHOOK_URL          --repo daishiman/UBM-Hyogo --body "$(op read 'op://Vault/EMAIL_WEBHOOK_URL/credential')"

# 投入確認
gh secret list --repo daishiman/UBM-Hyogo | grep -E "CF_AUDIT_D1_TOKEN_PROD|CF_AUDIT_TOKEN_PROD|CF_AUDIT_WORKERS_AI_TOKEN|EMAIL_WEBHOOK_URL"
```

## 不変条件

1. **実値・トークン断片を一切記録しない**。本ファイル・log・commit message に value を残さない
2. 既存 production env 側に同名 secret が存在しない（不在 evidence: inventory-before.md）ため、命名衝突なし
3. 投入後に value rotation する場合は本タスクスコープ外
4. SLACK_WEBHOOK_INCIDENT は既存のため再投入しない（updated_at 不要に動かさない）

## 失敗時 rollback

投入直後の dry_run が 401/403 で fail した場合:

1. `gh secret list --repo daishiman/UBM-Hyogo` で投入 timestamp 確認
2. 投入値の vault 参照を再確認（typo / wrong vault item）
3. 必要なら、別途 user が明示承認した削除 approval marker を記録してから `gh secret delete <name> --repo daishiman/UBM-Hyogo` で削除し、value を確認して再投入
4. workflow yaml の参照名と secret name の完全一致を再確認
