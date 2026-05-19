# Phase 10: Governance / Branch Protection（read-only evidence のみ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 種別 | governance |
| 入力 | Phase 7 CI workflow |
| 出力 | `outputs/phase-10/before.json`（read-only evidence）、required check 追加 PUT payload 案 |

## 方針

CLAUDE.md governance ポリシーに従い、`dev` / `main` branch protection への required status check 追加は **ユーザー明示承認後のみ** 実行する。本 Phase では evidence と PUT payload 案を作成するに留める。

## 実行コマンド（read-only）

```bash
mkdir -p docs/30-workflows/completed-tasks/issue-749-primitive-adoption-tracker/outputs/phase-10
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > outputs/phase-10/before-dev.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > outputs/phase-10/before-main.json

# 不変条件確認
grep '"required_pull_request_reviews":null' outputs/phase-10/before-dev.json
grep '"required_pull_request_reviews":null' outputs/phase-10/before-main.json
grep '"lock_branch":{"enabled":false}' outputs/phase-10/before-dev.json
grep '"enforce_admins":{"enabled":true}' outputs/phase-10/before-dev.json
```

## 追加候補 required check

| context | scope | 理由 |
| --- | --- | --- |
| `verify-primitive-adoption / verify` | dev / main | Issue #749 DoD 機械検証の正式 gate |

## PUT payload 案（実行はユーザー承認後）

`required_status_checks.contexts` 配列に `verify-primitive-adoption / verify` を追加する形で `gh api -X PUT repos/.../branches/dev/protection` を実行する。実 payload は `outputs/phase-10/put-payload.json` に保存し、本 Phase では適用しない。

## 完了条件

- [ ] `before-dev.json` / `before-main.json` が保存されている
- [ ] 不変条件（`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true`）の drift なし
- [ ] PUT payload 案が `outputs/phase-10/put-payload.json` に保存されている
- [ ] 実 PUT は本 Phase で実行しない（ユーザー承認後の別タスク）

## 次Phase

→ Phase 11（evidence 収集）
