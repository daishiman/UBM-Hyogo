# Phase 13: PR 作成

## 目的
本仕様書ベースで実装が完了したコードを PR として提出する。**本タスク仕様書「作成」プロンプトでは PR を作成しない**。実装プロンプトが本 Phase を実行する。

## 前提条件（Gate）
- Phase 1〜12 すべて完了（spec completeness）
- `outputs/phase-12/phase12-task-spec-compliance-check.md` が全項目 [x]
- `pnpm typecheck` / `pnpm lint` / `pnpm test` すべて pass
- redaction-check が dummy fail / clean pass の双方で期待動作
- Phase 11 EV-1〜EV-4 は必須。EV-5〜EV-8 は `CLOUDFLARE_ANALYTICS_API_TOKEN` / `CLOUDFLARE_ACCOUNT_TAG` 配置前なら `blocked_until_user_approval` として PR 本文に明記してよい

## PR 内容（実装フェーズで作成する PR の仕様）

### タイトル
`feat(ops): cloudflare analytics monthly export automation (issue-484)`

### 本文（テンプレート）

```markdown
## Summary
- Issue #484 の Cloudflare Analytics monthly export automation を実装
- aggregate-only GraphQL fetch / atomic write / redaction CI gate / retention rotation
- GitHub Actions cron `0 2 1 * *` + workflow_dispatch

## Changes
- `scripts/fetch-cloudflare-analytics.ts` (新規)
- `scripts/redaction-check-analytics.sh` (新規)
- `.github/workflows/cloudflare-analytics-export.yml` (新規)
- `scripts/__tests__/fetch-cloudflare-analytics.test.ts` (新規)
- `package.json` (analytics:fetch / analytics:redaction-check 追加)
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` (applied 経路追記)
- `docs/30-workflows/issue-484-cloudflare-analytics-export-automation/` (本仕様書一式)

## Test plan
- [x] pnpm typecheck
- [x] pnpm lint
- [x] pnpm test scripts/__tests__/fetch-cloudflare-analytics.test.ts
- [x] redaction-check dummy で exit 1
- [x] redaction-check clean JSON で exit 0
- [ ] workflow_dispatch dry-run（token 配置後）
- [ ] workflow_dispatch 本実行（token 配置後）

## Coverage
- 対象外（独立 ops script）。`apps/web` / `apps/api` の coverage gate には影響しない

## Security
- token は GitHub Secrets `CLOUDFLARE_ANALYTICS_API_TOKEN` 経由
- account tag は GitHub Secrets `CLOUDFLARE_ACCOUNT_TAG` 経由
- `.env` に実値なし（`op://` 参照のみ）
- aggregate-only / redaction-check 二重防御
```

## 実行コマンド

```bash
# 実装プロンプトが Phase 13 で実行する想定
git push -u origin docs/issue-484-cloudflare-analytics-export-automation-task-spec
gh pr create --base main --fill-first
```

## 制約
- **本仕様書作成プロンプト（02.タスク仕様書作成.md）では PR 作成しない**
- 実装プロンプト（03.実装.md）が Phase 1〜12 を消化した後にのみ実行

## 成果物
- 本ファイル
- 実装フェーズで作成された PR URL

## 完了条件
- PR が作成され、CI が pass
- レビュー（solo 開発のため self-merge 可）

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` Long-term Analytics Evidence
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` PR branch and scheduled workflow governance
