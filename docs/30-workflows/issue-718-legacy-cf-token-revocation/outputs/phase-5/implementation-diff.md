# Phase 5 Implementation Diff Summary

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `.github/workflows/backend-ci.yml` | 4 箇所の `secrets.CLOUDFLARE_API_TOKEN` を scoped name へ rename |
| `scripts/__tests__/workflow-env-scope.test.sh` | legacy 名 regression gate + scoped name exact-match assertion を追加 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Issue #718 skeleton 追記済み（事前コミット済差分） |

## backend-ci.yml rename 詳細

| Job / Step | 旧 secret | 新 secret |
|-----------|----------|----------|
| `deploy-staging` / Apply D1 migrations | `CLOUDFLARE_API_TOKEN` | `CF_TOKEN_D1_STAGING` |
| `deploy-staging` / Deploy Workers app | `CLOUDFLARE_API_TOKEN` | `CF_TOKEN_WORKERS_STAGING` |
| `deploy-production` / Apply D1 migrations | `CLOUDFLARE_API_TOKEN` | `CF_TOKEN_D1_PRODUCTION` |
| `deploy-production` / Deploy Workers app | `CLOUDFLARE_API_TOKEN` | `CF_TOKEN_WORKERS_PRODUCTION` |

## web-cd.yml 確認

- `secrets.CLOUDFLARE_API_TOKEN` 参照は L44 / L89 の deploy step env 内のみで維持（仕様通り）。
- 値 provenance は Phase 11 で operator-only に確認する。

## 検証コマンド結果

```
$ rg -n 'secrets\.CLOUDFLARE_API_TOKEN' .github/workflows/backend-ci.yml
(no match)

$ rg -n 'secrets\.CLOUDFLARE_API_TOKEN' .github/workflows/web-cd.yml
.github/workflows/web-cd.yml:44:          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
.github/workflows/web-cd.yml:89:          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

$ bash scripts/__tests__/workflow-env-scope.test.sh
workflow-env-scope.test.sh: all assertions passed
exit=0
```

## DoD

- [x] `web-cd.yml` / `backend-ci.yml` で legacy 名（無修飾）参照 — backend-ci 0 件、web-cd は仕様通り deploy step env のみ
- [x] `workflow-env-scope.test.sh` が exit 0
- [x] `deployment-secrets-management.md` skeleton 追記済み（事前コミット差分にて）
