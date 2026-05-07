# Phase 9 出力: env / 1Password 参照

## env 変数

| 変数名 | スコープ | 値の出所 | 用途 |
| --- | --- | --- | --- |
| `AUDIT_CORRELATION_SALT` | apps/api / scripts | 1Password `op://CloudflareSecurity/AuditCorrelationSalt/value` → Cloudflare Secrets | fingerprint hash の salt（per-env） |
| `GITHUB_AUDIT_PAT` | apps/api / scripts | 1Password `op://CloudflareSecurity/GitHubAuditPAT/credential` | live wiring follow-up でのみ使用 |

## `.env` 運用方針
- 実値を書かない（CLAUDE.md「シークレット管理」遵守）
- `op://` 参照のみ
- `scripts/with-env.sh` 経由で `op run` ラップ

例（`.env.example` 相当・本タスクで `.env` ファイル変更は実施しない）:
```
AUDIT_CORRELATION_SALT="op://CloudflareSecurity/AuditCorrelationSalt/value"
GITHUB_AUDIT_PAT="op://CloudflareSecurity/GitHubAuditPAT/credential"
```

## Cloudflare Secrets 登録（live wiring follow-up 用 — 本タスクで実登録しない）

```bash
bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env production
```

`docs/runbooks/audit-correlation.md` に同手順を記録済。

## wrangler.toml 編集
不要。Cloudflare Secrets はランタイム env binding (`env.AUDIT_CORRELATION_SALT`) で参照可能。

## staging 検証
fixture-only。staging Worker への新規 endpoint 追加は本タスクスコープ外（unassigned-task として Phase 12 で起票候補）。
