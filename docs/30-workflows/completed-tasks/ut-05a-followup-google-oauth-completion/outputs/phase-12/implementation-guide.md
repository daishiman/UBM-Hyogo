# Implementation Guide — UT-05A-FOLLOWUP-OAUTH

> Phase 13（PR 作成）で PR 本文として使用される正本。
> Phase 11 が完了するまで一部セクションは TBD 状態で残す。

## 目的

GitHub Issue #251（staging OAuth smoke evidence）/ #252（Google OAuth verification）を統合した運用タスクの完了。
05a Phase 11 で取得できなかった OAuth 可視 evidence を staging で取得し、本番公開前に必須の Google OAuth verification 申請を行う。

## 変更概要

- **コード変更**: なし（OAuth client / Cloudflare Secrets / Google Cloud Console 設定運用変更のみ）
- **ドキュメント変更**:
  - `docs/00-getting-started-manual/specs/02-auth.md` — secrets 配置表へのリンク追加
  - `docs/00-getting-started-manual/specs/13-mvp-auth.md` — B-03 制約状態の更新（verified / submitted / testing-user-only）
  - `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/outputs/phase-11/main.md` — placeholder を本タスク evidence link で上書き
- **新規追加**:
  - `docs/30-workflows/ut-05a-followup-google-oauth-completion/` 一式（Phase 1〜13 仕様書 + outputs）

## 設計成果物（Phase 2）

- [oauth-redirect-uri-matrix.md](../phase-02/oauth-redirect-uri-matrix.md) — 単一 OAuth client / 3 environment redirect URI 一覧
- [secrets-placement-matrix.md](../phase-02/secrets-placement-matrix.md) — 1Password / Cloudflare / GitHub Secrets 配置表
- [consent-screen-spec.md](../phase-02/consent-screen-spec.md) — consent screen 設定値仕様（最小権限 scope）
- [staging-vs-production-runbook.md](../phase-02/staging-vs-production-runbook.md) — Stage A/B/C 段階適用設計

## 実行成果物（Phase 11）

### Stage A — staging smoke

- [manual-smoke-log.md](../phase-11/manual-smoke-log.md) — test ID 別 PASS/FAIL
- screenshot 9 枚以上 (`outputs/phase-11/staging/0X-*.png`)
- session JSON (`session-member.json` / `session-admin.json`)
- `wrangler-dev.log`
- `secrets-list-*.txt`（`cf.sh secret list` 出力 / 値マスク済）
- `wrangler-login-absence.txt`（AC-9 検証）
- `redirect-uri-actual.md`（Console 登録一覧と diff 0 を確認した版）

### Stage B — production verification 申請

- `outputs/phase-11/production/consent-screen.png`
- `outputs/phase-11/production/verification-submission.md`
- `outputs/phase-11/production/url-200-check.txt`

### Stage C — production smoke

- `outputs/phase-11/production/login-smoke.png`
- `outputs/phase-11/production/login-smoke-log.md`
- `outputs/phase-11/production/secrets-list-*.txt`

## AC 達成状況

| AC | evidence | 状態 |
| --- | --- | --- |
| AC-1 | redirect URI matrix + actual 表 + Console screenshot | TBD（Phase 11 後） |
| AC-2 | secrets-list-*.txt（staging + production） | TBD |
| AC-3 | secrets-placement-matrix.md + 02-auth.md / 13-mvp-auth.md 参照 | 完了（Phase 12 反映後） |
| AC-4 | screenshot 9 + curl + session JSON + wrangler-dev.log | TBD |
| AC-5 | admin-gate-redirect.txt + screenshot M-04 / M-08 | TBD |
| AC-6 | consent-screen.png + verification-submission.md | TBD |
| AC-7 | login-smoke.png + login-smoke-log.md | TBD |
| AC-8 | url-200-check.txt | TBD |
| AC-9 | wrangler-login-absence.txt | TBD |
| AC-10 | 13-mvp-auth.md（更新後） | TBD |
| AC-11 | free-tier-estimation.md | 完了 |
| AC-12 | 05a Phase 11 main.md（更新後） + 本ドキュメント | 完了（Phase 12 反映後） |

## B-03 制約解除状態

採用条件: **a (verified) / b (submitted 暫定) / c (testing user 拡大)** のいずれか
（Phase 11 完了後に確定）

## セキュリティ確認

- ✅ 仕様書 / outputs に client_secret / API token / session token の実値を **転記していない**
- ✅ `.env` は `op://` 参照のみ
- ✅ `wrangler login` 不使用 / `~/Library/Preferences/.wrangler/config/default.toml` 不在
- ✅ `bash scripts/cf.sh` 経由のみで Cloudflare 操作

## screenshots（Phase 11 完了後にここへ link）

```markdown
## staging
![login page](staging/01-login-page.png)
![google consent](staging/02-google-consent.png)
![callback redirect](staging/03-callback-redirect.png)
...

## production
![consent screen](production/consent-screen.png)
![login smoke](production/login-smoke.png)
```

## Test plan

- [ ] Stage A: M-01〜M-11 / F-15 / F-16 / B-01 すべて PASS
- [ ] Stage B: consent screen "In production" + privacy/terms/home 200
- [ ] Stage C: 外部 Gmail で `/login` → `/admin` PASS
- [ ] sanity: `git grep "wrangler login"` 0 件 / `~/.../wrangler/config/default.toml` 不在
- [ ] AC-1〜AC-12 すべて evidence 配置

## 参考

- [Phase 1 要件](../phase-01/main.md)
- [Phase 5 runbook](../phase-05/implementation-runbook.md)
- [Phase 6 failure cases](../phase-06/failure-cases.md)
- [Phase 7 AC マトリクス](../phase-07/ac-matrix.md)
- [Phase 11 手動 runbook](../phase-11/manual-runbook.md)
