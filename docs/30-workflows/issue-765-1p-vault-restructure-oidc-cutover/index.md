# Issue #765 1Password Vault Restructure for OIDC Cutover - Workflow Index

## メタ情報

```yaml
workflow_id: issue-765-1p-vault-restructure-oidc-cutover
title: 1Password Vault Restructure for OIDC Cutover
github_issue: 765
source_workflow: docs/30-workflows/unassigned-task/issue-717-followup-003-1password-restructure.md
parent_task_spec: docs/30-workflows/unassigned-task/issue-717-followup-003-1password-restructure.md
category: operations / security
target_feature: 1Password vault `op://` reference consolidation for Cloudflare API token surface
priority: 中
scale: 小規模
status: spec_created
workflow_state: spec_created_blocked_by_oidc_support
taskType: implementation
visualEvidence: NON_VISUAL
implementationCategory: security-hardening
implementation_kind: 実装仕様書
implementation_kind_rationale: |
  本タスクは「OIDC supported deploy path が一次情報で確認され、production cutover evidence が揃った後に
  1Password vault 上の Cloudflare API Token 参照 path を canonical 化する」条件付き実装仕様書である。
  現時点の aiworkflow 正本では web-cd の `CLOUDFLARE_API_TOKEN` 直接 token contract は維持されているため、
  Phase 11 mutation / commit / push / PR は blocker 解消後の user gate まで実行しない。
  以下の実ファイル変更を伴うため実装仕様書として扱う:
  (1) `.env.example` 上の deploy token `op://` 参照 path を canonical 2 系へ統一
  (2) `apps/web/.dev.vars.example` / `scripts/cf.sh` は Cloudflare deploy token の direct op:// 参照が無いことを baseline 確認
  (3) `docs/runbooks/cloudflare-waf-operations.md` の `op://Cloudflare/API Token/credential` を WAF 専用正本へ整理
  (4) `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の op:// inventory を更新
  CONST_004 に従いラベルより実態優先で実装仕様書とする。
governance_mutation_user_gate: true
read_only_evidence_allowed_pre_gate:
  - "rg -n 'op://' .env.example apps/web/.dev.vars.example scripts docs .claude"
  - "rg -n 'CLOUDFLARE_API_TOKEN' .env.example apps/web/.dev.vars.example scripts docs .claude"
  - "op vault list"
  - "op item list --vault UBM-Hyogo"
mutation_commands:
  - "op item create/edit/archive/delete (operator only; values/URIs/secrets are never recorded)"
  - "edit .env / .env.example / apps/web/.dev.vars.example (user approval required for commit)"
  - "edit scripts/cf.sh / docs/runbooks/cloudflare-waf-operations.md / deployment-secrets-management.md (user approval required)"
user_approval_marker: "outputs/phase-13/user-approval-issue-765-<timestamp>.md"
created_date: 2026-05-18
dependencies:
  - issue-717-followup-001（closed: 解消済）
  - issue-717-followup-002（closed: 解消済）
  - issue-640-followup-002（closed: 解消済 / Issue #718）
coverage_ac: 適用外
coverage_ac_rationale: |
  対象差分は `.env.example` / `.dev.vars.example` / runbook / skill reference の op:// 参照 rename と、
  必要なら `scripts/cf.sh` 内の path 文字列調整のみ。unit-testable な application code 変更を伴わない。
  代替として `scripts/__tests__/op-uri-grep.test.sh`（Phase 6 で追加）の bash 検証で legacy op:// 残存を gate する。
```

| 項目 | 値 |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created_blocked_by_oidc_support |

## 現状調査サマリ（2026-05-18）

| 項目 | 状態 |
|------|------|
| Issue #765 GitHub state | OPEN |
| 前提 Issue (#762/#763/#718) | Issue state は closed。ただし aiworkflow 正本上の OIDC supported deploy path / production cutover evidence は未成立のため Phase 11 mutation は blocked |
| 検出された op:// path 乖離 | 6 種（下表参照） |
| canonical 候補 | `op://UBM-Hyogo/Cloudflare/api_token_staging` / `op://UBM-Hyogo/Cloudflare/api_token_production`（ut-27 整合） |

### 既存 op:// path 乖離 inventory

| op:// path | 出現箇所 | 区分 |
|------------|---------|------|
| `op://Cloudflare/API Token/credential` | `docs/runbooks/cloudflare-waf-operations.md` | runbook |
| `op://Employee/ubm-hyogo-env/CLOUDFLARE_API_TOKEN` | 03-serial 系 historical doc | historical |
| `op://UBM-Hyogo/cf-waf-token/credential` | ut-15 phase-09 | task-spec |
| `op://Vault/Cloudflare/api_token` | ut-15 phase-03 template | template |
| `op://UBM-Hyogo/cloudflare-api/CLOUDFLARE_API_TOKEN` | ut-06 health | task-spec |
| `op://UBM-Hyogo/Cloudflare/api_token_staging` / `api_token_production` | ut-27 canonical 候補 | canonical 候補 |

## 正本整合メモ（2026-05-18）

- deploy token canonical path は ut-27 と整合する `op://UBM-Hyogo/Cloudflare/api_token_staging` / `api_token_production` の 2 系統を Phase 2 で確定する
- local-dev / WAF 用 item は deploy token canonical 2 path と別分類で扱い、grep gate では legacy deploy-token path と混同しない
- legacy op:// path は immediate delete せず deprecation window（N 日）を経て archive → delete とし、その間 rollback 可能とする
- 1Password item の値・URI・secret 値・suffix は仕様書・evidence・PR 本文に焼き込まない

## Phase 構成

| Phase | ファイル | 概要 |
|------|---------|------|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義・AC・op:// inventory 確定 |
| 2 | [phase-2-design.md](phase-2-design.md) | vault 構成設計・migration table・file diff plan・rollback design |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー・Gate-A Go/No-Go |
| 4 | phase-4-test-plan.md | op:// grep gate / local-dev smoke 計画 |
| 5 | phase-5-implementation.md | `.env.example` / `.dev.vars.example` / runbook / skill reference 変更 |
| 6 | phase-6-test-additions.md | op:// grep gate bash test 追加 |
| 7 | phase-7-coverage.md | カバレッジ AC 適用外説明 |
| 8 | phase-8-refactor.md | redaction check / 重複参照整理 |
| 9 | phase-9-qa.md | QA・CI gate 確認 |
| 10 | phase-10-final-review.md | 最終レビュー |
| 11 | phase-11-manual-test.md | 手動 1Password vault mutation + local-dev smoke |
| 12 | phase-12-documentation.md | inventory 正本更新 |
| 13 | phase-13-pr.md | PR 作成（user 承認後） |

## 不変条件

1. 1Password item の値・URI・token 値・suffix を仕様書・evidence・コミットに焼き込まない
2. 1Password vault mutation・GitHub Secrets mutation・`.env` 編集の commit は user-gated
3. legacy op:// path 参照は immediate 削除せず deprecation 期間を設けて rollback path を維持する
4. `wrangler` 直接呼び出し禁止（`bash scripts/cf.sh` 経由のみ）
5. `.env` の実値は読み取らない・grep しない（op 参照 path のみ操作対象）

## 関連参照

- 親仕様: `docs/30-workflows/unassigned-task/issue-717-followup-003-1password-restructure.md`
- artifacts: `docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/artifacts.json`
- 上流: `docs/30-workflows/completed-tasks/issue-718-legacy-cf-token-revocation/`
- 正本: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
