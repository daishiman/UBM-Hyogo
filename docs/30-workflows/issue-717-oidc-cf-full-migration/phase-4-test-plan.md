# Phase 4: テスト計画

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> implementation_mode: `verified_current_no_code_change_pending_pr`
> task classification: conditional code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL

---

## 1. テスト対象と方針

2026-05-16 時点では Cloudflare Workers GitHub Actions docs / `cloudflare/wrangler-action` README が OIDC deploy exchange を公式手順として案内していないため、本 cycle では workflow 実装テストを作成しない。テスト対象は「未対応の実装を入れない判断」と「正本同期が no-code 判定に一致していること」。

| 層 | 対象 | 種別 | 保存先 |
|---|---|---|---|
| 一次情報 | Cloudflare Workers GitHub Actions docs / `wrangler-action` README | read-only support revalidation | `outputs/phase-11/cloudflare-oidc-support-revalidation.md` |
| repo no-code guard | `.github/workflows` に本 task 由来の `id-token: write` / OIDC exchange が追加されていないこと | grep | Phase 12 compliance check |
| artifact guard | root/output `artifacts.json` parity、Phase 12 strict 7 | file existence / `cmp` | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

## 2. 現 cycle の検証コマンド

```bash
rg -n "id-token|oidc-exchange|deploy-oidc|deploy-fallback" .github/workflows
rg -n "CLOUDFLARE_API_TOKEN|wrangler-action" .github/workflows .claude/skills/aiworkflow-requirements/references/deployment-{gha,secrets-management}.md
cmp -s docs/30-workflows/issue-717-oidc-cf-full-migration/artifacts.json docs/30-workflows/issue-717-oidc-cf-full-migration/outputs/artifacts.json
test -f docs/30-workflows/issue-717-oidc-cf-full-migration/outputs/phase-11/cloudflare-oidc-support-revalidation.md
```

期待:

- 本 task による `.github/workflows` 差分なし。
- `web-cd.yml` は Issue #640 の step-scoped `CLOUDFLARE_API_TOKEN` boundary を維持。
- root/output artifacts parity が一致。
- Phase 11 代替証跡は一次情報再検証のみ。

## 3. Future Supported Path

Cloudflare が公式に OIDC deploy exchange を案内した後、後続 task `issue-717-followup-001-production-oidc-cutover` の中で staging proof から再開する。その時点で初めて以下をテスト対象にする:

- `id-token: write` 付与範囲。
- subject claim pin (`repo` / `ref` / `environment`)。
- OIDC deploy log の redaction。
- step-scoped token fallback rehearsal。

## 4. DoD

- [x] unsupported 判定時に workflow / script テストを追加しない理由が明記されている
- [x] no-code guard の検証コマンドが明記されている
- [x] future OIDC staging proof は後続 task の gate として分離されている
