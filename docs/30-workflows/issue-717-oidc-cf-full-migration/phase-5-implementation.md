# Phase 5: 実装

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> implementation_mode: `verified_current_no_code_change_pending_pr`
> task classification: conditional code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL

---

## 1. 実装判定

Cloudflare Workers GitHub Actions / `cloudflare/wrangler-action` の公式 OIDC deploy support が確認できないため、本 phase の workflow 実装は `skipped_by_unsupported_oidc`。

## 2. 変更対象ファイル

| パス | 判定 | 理由 |
|---|---|---|
| `.github/workflows/web-cd.yml` | 変更なし | unsupported OIDC path を推測実装しない |
| `scripts/cf.sh` | 変更なし | current `CLOUDFLARE_API_TOKEN` env contract を維持 |
| `scripts/__tests__/` | 変更なし | workflow mutation がないため追加 grep tests 不要 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 更新 | no-code decision と current boundary を同期 |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | 更新 | GitHub Actions deploy current fact を同期 |

## 3. No-Code Guard

```bash
git diff -- .github/workflows
rg -n "id-token|oidc-exchange|deploy-oidc|deploy-fallback" .github/workflows
grep -n "CLOUDFLARE_API_TOKEN" scripts/cf.sh
```

## 4. DoD

- [x] workflow 実装を skipped として扱う
- [x] unsupported OIDC endpoint / action input を追加していない
- [x] current secret boundary を正本仕様へ同期している
