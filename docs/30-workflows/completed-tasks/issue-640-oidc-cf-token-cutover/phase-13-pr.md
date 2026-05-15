# Phase 13: PR 作成

> [実装区分: 実装仕様書] / **ユーザー明示承認待ち（blocked）**

## 1. 前提

- Phase 1-12 すべて完了
- staging deploy が新方式で green
- redaction-check で token leak ゼロ
- **ユーザーから明示的な PR 作成許可が出ている**

## 2. ブランチ戦略

- 既定 base: `dev`（CLAUDE.md 規約）
- branch 名: `feat/issue-640-oidc-cf-token-cutover` または `security/issue-640-step-scoped-cf-token`
- 作業ブランチに dev を merge してコンフリクト解消後に push

## 3. PR タイトル

```
security(ci): step-scope CLOUDFLARE_API_TOKEN in deploy workflows (#640)
```

## 4. PR 本文テンプレート

```markdown
## Summary
- `web-cd.yml` の job-level `env: CLOUDFLARE_API_TOKEN` を deploy step-scoped へ降格
- `scripts/redaction-check.sh` を追加し、CI log への token leak を grep gate
- `deployment-secrets-management.md` に step-scoped pattern を canonical 反映

Refs #640, #331

## 変更ファイル
- `.github/workflows/web-cd.yml`
- `.github/workflows/post-release-dashboard.yml`
- `scripts/redaction-check.sh`（新規）
- `scripts/__tests__/redaction-check.test.sh`（新規）
- `scripts/__tests__/workflow-env-scope.test.sh`（新規）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## Test plan
- [ ] `bash scripts/__tests__/redaction-check.test.sh` GREEN
- [ ] `bash scripts/__tests__/workflow-env-scope.test.sh` GREEN
- [ ] `actionlint .github/workflows/*.yml` エラー 0
- [ ] staging deploy が新方式で green
- [ ] `redaction-check.sh` が staging log に対し exit 0
- [ ] `grep -n "CLOUDFLARE_API_TOKEN" .github/workflows/web-cd.yml` で job-level env 0 件
- [ ] `scripts/cf.sh` 経由のローカル deploy が引き続き動作

## 未タスク化（CONST_007 例外）
- OIDC 完全移行: `docs/30-workflows/unassigned-task/issue-640-followup-001-oidc-full-migration.md`
- 旧 token 失効: `docs/30-workflows/unassigned-task/issue-640-followup-002-legacy-token-revocation.md`
```

## 5. 自動実行禁止事項

- `git push` および `gh pr create` は**ユーザーが明示承認した時のみ実行**
- 本仕様書は PR 内容を予約しているだけで、ユーザーが「PR 出して」と指示するまでは Phase 13 は blocked

## 6. DoD

- [ ] ユーザー明示承認取得
- [ ] dev に対する PR 作成
- [ ] CI required status check 全 green
