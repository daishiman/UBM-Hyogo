# Phase 12: ドキュメント更新履歴

## Step 1-A: 完了タスク記録（workflow-local）

| 項目 | 内容 |
|------|------|
| workflow_id | `runtime-smoke-env-provisioning` |
| status | `spec_created`（仕様書のみ。実コード変更は別タスク） |
| 関連ドキュメント | `index.md` / `artifacts.json` / `outputs/phase-{01..13}/` / `runbooks/*.md` |

### LOGS.md 更新

| ファイル | 更新内容 |
|---------|---------|
| 本タスク root LOGS.md | 本タスクは workflow-local 完結のため、`aiworkflow-requirements/LOGS.md` / `task-specification-creator/LOGS.md` への追記は **本タスクではスコープ外**（別タスクで実装完了時に追記） |

### topic-map.md

- 本タスクは aiworkflow-requirements 配下の正本仕様には未影響（実装完了時に `api-runtime-smoke.md` 系トピック追加を検討）

## Step 1-B: 実装状況テーブル

| 領域 | 状態 |
|------|------|
| service-token endpoint | `spec_created`（実装は別タスク） |
| runtime-smoke-production workflow | `spec_created` |
| allowlist 拡張 | `spec_created` |
| smoke runner production 対応 | `spec_created` |
| provision script rename | `spec_created` |
| runbook 4 件 | `spec_created` |

## Step 1-C: 関連タスクテーブル

| 関連 task | ステータス | 関連性 |
|----------|-----------|--------|
| `runtime-smoke-staging-secrets-restore` | implemented_local_evidence_captured | staging incident 対応の前提タスク。本タスクで production 拡張 |
| `completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery` | completed | secret provisioning runbook の canonical 元 |
| `completed-tasks/ci-env-secret-inventory-and-preflight-gate` | completed | allowlist contract の元 |

## Step 2: システム仕様更新

- **判定**: 新規 IPC surface / 新規共有型 / 新規定数の **API 追加あり**（service-token endpoint）
- **対象**:
  - `apps/api` の API surface に `/internal/service-token/{admin,member}` を追加
  - Cloudflare Secret に `SERVICE_TOKEN_SHARED_SECRET` / `JWT_SIGNING_KEY` / `SERVICE_TOKEN_REGISTERED_KIDS` / `SMOKE_ADMIN_USER_ID` / `SMOKE_MEMBER_USER_ID` を追加
  - KV binding `SERVICE_TOKEN_NONCE_KV` を追加
- **正本ファイル更新**: 実装完了時に `docs/00-getting-started-manual/specs/02-auth.md`（または新 spec `service-token.md`）への追記が必要。本タスクでは scope out（仕様書生成のみ）

## global skill sync 区分

| 区分 | 内容 |
|------|------|
| workflow-local | 本タスク root の `outputs/phase-*` / `runbooks/*` |
| global skill sync | 本タスクは aiworkflow-requirements / task-specification-creator skill 自体の改善を含まないため N/A |

## 完了条件

- Step 1-A / 1-B / 1-C / Step 2 のすべてが記録されている
- workflow-local / global skill sync の区分が明示されている

## 成果物

- `outputs/phase-12/documentation-changelog.md`（本ファイル）
