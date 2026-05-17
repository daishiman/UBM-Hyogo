# Phase 9: 品質保証

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> implementation_mode: `verified_current_no_code_change_pending_pr`
> task classification: conditional code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL

---

## 1. QA 観点チェックリスト

| 観点 | 検証方法 | 期待結果 |
|---|---|---|
| 一次情報 | `outputs/phase-11/cloudflare-oidc-support-revalidation.md` | Cloudflare Workers docs と `wrangler-action` README は API token / account ID 認証を案内し、OIDC deploy exchange は未確認 |
| workflow no-code | `git diff -- .github/workflows` | 本 cycle による workflow 差分なし |
| unsupported mutation guard | `rg -n "id-token|oidc-exchange|deploy-oidc|deploy-fallback" .github/workflows` | Issue #717 による新規 OIDC 実装なし |
| current secret boundary | `rg -n "CLOUDFLARE_API_TOKEN|wrangler-action" .github/workflows .claude/skills/aiworkflow-requirements/references/deployment-{gha,secrets-management}.md` | Issue #640 の step-scoped `CLOUDFLARE_API_TOKEN` boundary を current contract として維持 |
| Phase 12 strict 7 | `outputs/phase-12/` file existence | 7 files present |
| artifacts parity | `cmp -s artifacts.json outputs/artifacts.json` | root/output artifacts が一致 |
| UI/UX evidence | `visualEvidence=NON_VISUAL` | screenshot 不要、代替証跡は一次情報再検証 |

## 2. セキュリティレビュー観点

| 観点 | 評価 |
|---|---|
| blast radius | 本 cycle は新しい credential path を追加しないため、未検証 endpoint による blast radius 拡大なし |
| privilege escalation | `id-token: write` を追加しないため、GitHub OIDC permission の拡散なし |
| rollback | Issue #640 の step-scoped token 経路を温存し、legacy token revocation は official support + staging proof + production cutover + observation 後へブロック |
| evidence hygiene | token 値、hash、preview、Cloudflare Account ID 実値を成果物に残さない |

## 3. DoD

- [x] no-code 判定と current secret boundary が矛盾なく記録されている
- [x] runtime deploy / rollback rehearsal / redaction log は本 cycle の PASS 根拠にしていない
- [x] future OIDC proof は後続 task に明示分離されている
