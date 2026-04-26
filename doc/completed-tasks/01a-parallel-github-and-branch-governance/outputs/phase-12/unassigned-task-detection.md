# Unassigned Task Detection

## 実施日

2026-04-23

## このタスクのスコープ外で検出した未割り当てタスク

| 検出内容 | 推奨割り当て先 | 優先度 | 検出 Phase |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` の実値投入手順 | `04-serial-cicd-secrets-and-environment-sync` Phase 5 | high | 2 |
| Cloudflare Pages デプロイ設定（web-cd.yml ワークフロー作成） | `01b-parallel-cloudflare-base-bootstrap` | medium | 2 |
| Google Workspace SSO 連携 / Google OAuth 設定 | `01c-parallel-google-workspace-bootstrap` | medium | 3 |
| GitHub Actions ワークフローファイル（ci.yml / web-cd.yml）の作成 | `02-serial-monorepo-runtime-foundation` または `04-serial-cicd-secrets-and-environment-sync` | high | 9（CI チェック未確認） |

## このタスクのスコープ内だが手動対応が必要な項目

| 検出内容 | 取り扱い | 理由 | 検出 Phase |
| --- | --- | --- | --- |
| production environment の required reviewers 設定 | Phase 5 の runbook による手動適用 | GitHub REST API では reviewer の最終設定を完結できない | 5 |
| branch protection の GitHub UI 適用 | Phase 5 の runbook による手動適用 | GitHub UI での最終確定が必要 | 5 |

## 注記

- `deployment-core.md` / `deployment-cloudflare.md` の `develop` → `dev` 修正は本タスクで実施済み（Phase 3 / 12）
- CI workflow の job 名（`ci` / `Validate Build`）の存在確認は `04-serial-cicd-secrets-and-environment-sync` に委ねる
