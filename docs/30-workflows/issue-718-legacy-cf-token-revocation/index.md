# Issue #718 Legacy Cloudflare API Token Revocation - Workflow Index

## メタ情報

```yaml
workflow_id: issue-718-legacy-cf-token-revocation
title: Legacy Cloudflare API Token Revocation
github_issue: 718
source_workflow: docs/30-workflows/completed-tasks/issue-640-oidc-cf-token-cutover/
parent_task_spec: docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md
category: operations / security
target_feature: Cloudflare API Token / GitHub Secrets / 1Password rotation surface
priority: 中
scale: 小規模
status: implemented-local-runtime-pending
workflow_state: implemented-local-runtime-pending
taskType: implementation
visualEvidence: NON_VISUAL
implementationCategory: security-hardening
implementation_kind: 実装仕様書
implementation_kind_rationale: |
  対象タスクは「legacy Cloudflare API Token の物理失効」という不可逆運用作業が中心だが、
  失効安全性を担保するためには以下の実ファイル変更が必須となるため実装仕様書として扱う:
  (1) `.github/workflows/backend-ci.yml` の `secrets.CLOUDFLARE_API_TOKEN` 参照を、
      既存正本の `CF_TOKEN_D1_STAGING` / `CF_TOKEN_D1_PRODUCTION` /
      `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` へ切り替える。
      `web-cd.yml` は正本上まだ environment-scoped `CLOUDFLARE_API_TOKEN` が current runtime 名のため、
      secret 名 rename ではなく「同名 secret の値が legacy token ではない」ことを operator-only evidence で確認する。
  (2) `scripts/__tests__/workflow-env-scope.test.sh` に legacy 名再投入を検知する gate を追加し、
      regression を CI で防止する。
  (3) `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
      と requirements indexes の inventory 更新（ドキュメント変更だが正本のため必須）。
  CONST_004 に従いラベルより実態優先で実装仕様書とする。
governance_mutation_user_gate: true
read_only_evidence_allowed_pre_gate:
  - "rg -n 'CLOUDFLARE_API_TOKEN|CF_TOKEN_' .github/workflows scripts .claude/skills/aiworkflow-requirements"
  - "gh secret list --env staging"
  - "gh secret list --env production"
  - "bash scripts/cf.sh whoami"
  - "bash scripts/cf.sh d1 list"
mutation_commands:
  - "Cloudflare dashboard/API token revoke (operator only; token id/value not recorded)"
  - "gh secret set/delete for Cloudflare deploy secrets (user approval required)"
  - "1Password item status update/delete (operator only; value/URI not recorded)"
user_approval_marker: "outputs/phase-13/user-approval-issue-718-<timestamp>.md"
planned_read_only_evidence_files:
  - "outputs/phase-1/legacy-token-reference-inventory.md"
  - "outputs/phase-1/secret-inventory.md"
  - "outputs/phase-11/main.md"
  - "outputs/phase-11/manual-smoke-log.md"
  - "outputs/phase-11/link-checklist.md"
  - "outputs/phase-11/evidence-ledger.md"
  - "outputs/phase-11/health-before-whoami.log"
  - "outputs/phase-11/health-before-d1-list.log"
planned_mutation_evidence_files:
  - "outputs/phase-11/operator-approval-record.md"
  - "outputs/phase-11/revocation-evidence.md"
  - "outputs/phase-11/github-secrets-staging-after.md"
  - "outputs/phase-11/github-secrets-production-after.md"
  - "outputs/phase-11/onepassword-item-status.md"
created_date: 2026-05-16
dependencies:
  - issue-640-oidc-cf-token-cutover（staging/production runtime evidence green: 確認済み）
  - issue-640-followup-001-oidc-full-migration（任意・OIDC 完全移行後実行時のみ前提）
coverage_ac: 適用外
coverage_ac_rationale: |
  対象差分は CI/CD workflow YAML rename と shell-script gate 追加が主体で、
  unit-testable な application code 変更を伴わない。
  代替として `scripts/__tests__/workflow-env-scope.test.sh` の bash 検証が green であることを
  Phase 6 / Phase 9 / Phase 11 の必須完了条件とする。
```

## 現状調査サマリ（2026-05-16）

| 項目 | 状態 |
|------|------|
| Issue #718 GitHub state | OPEN（ユーザー認識は closed だが実態は open） |
| `secrets.CLOUDFLARE_API_TOKEN` 参照箇所 | `.github/workflows/web-cd.yml` (L44, L89) / `backend-ci.yml` (L41, L52, L96, L107) の 6 箇所 |
| 他 workflow の状態 | `CF_AUDIT_R2_TOKEN_PROD` / `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` / `CLOUDFLARE_API_TOKEN_STAGING` / `CF_AUDIT_D1_TOKEN_PROD` に置換済み |
| Cloudflare dashboard 上 legacy token | Gate C user approval 前のため未失効（revocation evidence なし） |
| Issue #640 staging/production evidence | green（`completed-tasks/issue-640-oidc-cf-token-cutover/outputs/phase-11/`） |

## 正本整合メモ（2026-05-16）

- `backend-ci.yml` は正本 `deployment-secrets-management.md` の既存 `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` へ切り替える。新規 `CLOUDFLARE_API_TOKEN_DEPLOY_*` は導入しない。
- `web-cd.yml` は現時点の正本名が environment-scoped `CLOUDFLARE_API_TOKEN` のため、Issue #718 では secret 名ではなく value provenance を operator-only に確認する。web 側の OIDC / name rename は別タスクなしに本 revocation の前提へ混ぜない。
- token id / suffix / account id / value hash / token preview は仕様書・evidence・PR 本文に記録しない。

## Phase 構成

| Phase | ファイル | 概要 |
|------|---------|------|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義・AC・inventory 範囲確定 |
| 2 | [phase-2-design.md](phase-2-design.md) | 失効手順設計・secret rename 計画 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー・NO-GO 条件確定 |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | workflow-env-scope test 拡張計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | workflow rename / gate 追加実装 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | gate test 追加・実行 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認（適用外説明） |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ・redaction 確認 |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA・health check |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動 revocation 実施 + evidence |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | inventory 正本更新 |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（ユーザー承認後） |

## 不変条件

1. revocation コマンドの具体値（token id / suffix / account id）を仕様書・evidence・コミットに焼き込まない
2. evidence は redacted（コマンド名 / exit code / item name のみ）に限定
3. revocation は Issue #640 evidence green 確認後にのみ実施
4. Phase 13 commit / PR push はユーザー明示承認後にのみ実行
5. `wrangler` 直接呼び出し禁止（`bash scripts/cf.sh` 経由のみ）

## 関連参照

- 親仕様: `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`
- artifacts: `docs/30-workflows/issue-718-legacy-cf-token-revocation/artifacts.json`
- outputs artifacts: `docs/30-workflows/issue-718-legacy-cf-token-revocation/outputs/artifacts.json`
- 上流: `docs/30-workflows/completed-tasks/issue-640-oidc-cf-token-cutover/`
- 正本: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
