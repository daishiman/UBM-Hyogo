# Phase 10: 参照情報・依存マトリクス

## 目的

参照元、依存タスク、外部境界を一覧化する。

## 関連ドキュメント

| パス | 役割 |
|------|------|
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/index.md` | 親 workflow index（In-scope 充足対象） |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` | template / `staging-runtime-smoke` 用既存 runbook |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/` | workflow 側参照名整合の完了済 task |
| `docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/task-02-runtime-smoke-staging-secrets-provisioning/` | runtime smoke secret provisioning 完了済 task |
| `docs/30-workflows/unassigned-task/ci-secret-alignment-followup-002-staging-production-secret-runbook.md` | 元 unassigned spec（本 workflow が formalize する） |
| `.github/workflows/web-cd.yml` | 参照 workflow（`deploy-staging` / `deploy-production` job） |

## skill / system spec 参照

| パス | 用途 |
|------|------|
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | secret 運用ポリシーの正本 |
| `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | GitHub Actions deploy 経路の正本 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | env var / secret の正本 |
| `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 9 項目 SSOT |
| `.claude/skills/task-specification-creator/references/non-visual-irreversible-task-rules.md` | governance mutation user gate |

## 外部参照

- GitHub Docs: [Environments and deployment protection rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/managing-environments-for-deployment)
- Cloudflare Docs: [API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)（scope: Workers Scripts:Edit / Pages:Edit / Account:Read）
- 1Password CLI: `op run --env-file=.env`（`scripts/cf.sh` / `scripts/with-env.sh` 内で利用）

## Issue / PR 参照

- Issue #662 `[CIPR-FU-002] staging / production Environment secret provisioning runbook`（CLOSED 2026-05-14）
- 関連 PR #648（`web-cd` 経路の deploy-staging 失敗を契機に本タスクが導出された）

## 依存マトリクス

| 依存先 | 種別 | 状態 |
|--------|------|------|
| task-01 (web-cd-secret-name-alignment) | 完了依存 | DONE |
| task-02 (runtime-smoke-staging-secrets-provisioning) | 参照依存（template 源） | DONE |
| 親 `index.md` の In-scope 定義 | 参照依存 | EXISTS |
| 1Password Vault `UBM-Hyogo` | 実行時依存（ユーザー操作） | runbook は `op://UBM-Hyogo/Cloudflare API Token (staging)/credential` / `op://UBM-Hyogo/Cloudflare API Token (production)/credential` を正本参照として記載。Item 名が異なる場合は user-only で 1Password 側 alias を整備してから投入する |

## 後続タスク候補（本タスク完了後に検討してよい範囲）

> CONST_007: これらは「先送り」ではなく「本タスク完了後の追加運用改善」として独立タスク化するべきもの。本タスクのスコープには含めない。

- token expiry monitoring 自動化（Cloudflare API での expiry 取得 + Slack 通知）
- helper script `scripts/cf/provision-deploy-secret.sh`（op パイプ経路の wrapper）の整備
- `preview` / `e2e` 等の Environment 追加時の同形式 runbook 量産

## 完了条件

## メタ情報

| 項目 | 内容 |
| --- | --- |
| Phase | 10 |
| 状態 | completed |

## 実行タスク

- 関連ドキュメントと依存マトリクスを定義する。

## 参照資料

- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## 成果物/実行手順

- 参照情報一覧。

## 統合テスト連携

- 依存整合は Phase 12 compliance で確認する。

- 関連ドキュメント・skill 参照・外部参照・依存マトリクスが網羅されている
- Issue / PR の紐付けが記述されている
- 後続タスク候補がスコープ外として明示されている
