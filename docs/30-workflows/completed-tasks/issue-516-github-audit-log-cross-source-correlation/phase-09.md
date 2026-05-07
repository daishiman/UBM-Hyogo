# Phase 9: デプロイ準備 / env / 1Password 参照

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| Source | `outputs/phase-9/phase-9.md` |
| 区分 | 設定 / 文書化 |
| 想定所要 | 0.25 人日 |

## 目的

本タスクの correlation engine は **stateless module** であり、独立 Worker としてデプロイしない。Cloudflare Workers の追加は行わず、必要な env 変数 / 1Password 参照だけを定義し、将来 live wiring 時に `apps/api` から呼べる状態にする。

## 実行タスク

1. **env 変数設計**

| 変数名 | スコープ | 値の出所 | 用途 |
| --- | --- | --- | --- |
| `AUDIT_CORRELATION_SALT` | apps/api / scripts | Cloudflare Secrets / 1Password `op://CloudflareSecurity/AuditCorrelationSalt/value` | fingerprint hash の salt（per-env） |
| `GITHUB_AUDIT_PAT` | apps/api / scripts | 1Password `op://CloudflareSecurity/GitHubAuditPAT/credential` | live wiring follow-up でのみ使用 |

2. **`.env` への追記方針**
   - 実値は書かない。`op://` 参照のみ。
   - 例（`.env.example` 相当）:
     ```
     AUDIT_CORRELATION_SALT="op://CloudflareSecurity/AuditCorrelationSalt/value"
     GITHUB_AUDIT_PAT="op://CloudflareSecurity/GitHubAuditPAT/credential"
     ```
   - `scripts/with-env.sh` 経由で `op run` ラップして注入。

3. **Cloudflare Secrets 登録**（**live wiring follow-up 用の運用手順として runbook に記述するのみ。fixture verify の本タスクでは実登録しない**）
   - `bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env staging`
   - `bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT --config apps/api/wrangler.toml --env production`
   - 値は 1Password で生成（32 byte 以上の random hex）。

4. **wrangler.toml 編集**: 不要（Secrets はランタイム binding として `env.AUDIT_CORRELATION_SALT` で参照可能になる）。

5. **staging 検証手順**（fixture-only）
   - 本 phase では fixture 駆動の verify のみ。staging Worker への新規 endpoint 追加はしない。

## ローカル実行コマンド

```bash
# secrets 登録は本タスクでは実行しない。live wiring follow-up の user gate 後だけ実行する。

# 動作確認 (fixture 駆動)
mise exec -- bash scripts/audit-correlation/run.sh \
  --github scripts/audit-correlation/fixtures/github-org-update-member.json \
  --cloudflare scripts/audit-correlation/fixtures/cloudflare-login-fail.json \
  --salt test-salt-do-not-use-in-prod \
  --out /tmp/staging-verify.json
```

## 参照資料

- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」
- `scripts/cf.sh` / `scripts/with-env.sh`

## 成果物

- `docs/runbooks/audit-correlation.md` に `AUDIT_CORRELATION_SALT` / `GITHUB_AUDIT_PAT` の op 参照と、live wiring follow-up まで実 secret 登録しない境界を記録
- `outputs/phase-9/phase-9.md`

## 完了条件（DoD）

- [ ] env 変数 2 種類の op 参照経路が文書化。
- [ ] Cloudflare Secrets 登録手順が runbook に記述（実登録はユーザー gate）。
- [ ] `.env` に実値を書かない原則を再確認。
