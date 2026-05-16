# Phase 9: QA

## メタ情報

- phase: 9 / qa
- prev: phase-8-refactor
- next: phase-10-final-review

## 目的

実装差分・test・運用シーケンスを統合的に検証し、PR マージ可能な品質に達していることを確認する。

## QA チェックリスト

### CI gate

| gate | 実行 | 期待 |
|------|------|------|
| `pnpm typecheck` | `mise exec -- pnpm typecheck` | exit 0 |
| `pnpm lint` | `mise exec -- pnpm lint` | exit 0 |
| `workflow-env-scope.test.sh` | `bash scripts/__tests__/workflow-env-scope.test.sh` | exit 0 |
| `cf-token-arg.test.sh` | `bash scripts/__tests__/cf-token-arg.test.sh` | exit 0 |
| `redaction-check.test.sh` | `bash scripts/__tests__/redaction-check.test.sh` | exit 0 |

### Pre-merge 運用 gate

| gate | 確認内容 |
|------|---------|
| backend secret 投入確認 | `gh secret list --env staging` / `gh secret list --env production` で `CF_TOKEN_D1_*` / `CF_TOKEN_WORKERS_*` が listed |
| web secret value provenance | `CLOUDFLARE_API_TOKEN` 名は web-cd current runtime として維持し、legacy value ではないことを operator-only に確認（値・URI・hash は記録禁止） |
| Issue #640 evidence | `docs/30-workflows/completed-tasks/issue-640-oidc-cf-token-cutover/outputs/phase-11/` の green evidence 再確認 |

### Post-merge 検証（rename PR マージ後・revocation 前）

| 検証 | 実行 |
|------|------|
| staging deploy が新 secret で green | GitHub Actions web-cd staging run |
| production deploy が新 secret で green | GitHub Actions web-cd production run（手動 trigger or 次回 release） |
| backend deploy（staging / production） | backend-ci の deploy job |

## 異常時の rollback

revocation 前である限り、rename を revert する PR で旧 secret 名へ即時戻せる。revocation 実施後（Phase 11 完了後）は新 token のみが有効なため rollback には新 token rotation が必要。

## 成果物

- `outputs/phase-9/qa-checklist.md`
- `outputs/phase-9/ci-gate-results.md`
- `outputs/phase-9/post-merge-deploy-evidence.md`（backend rename PR マージ後に追記）

## 完了条件

- [ ] CI gate 全 green
- [ ] Pre-merge 運用 gate 確認済み
- [ ] Post-merge deploy 2 環境で新 secret 経路が green

## タスク100%実行確認【必須】

- [ ] 成果物 3 ファイル作成

## 次Phase

phase-10-final-review.md
