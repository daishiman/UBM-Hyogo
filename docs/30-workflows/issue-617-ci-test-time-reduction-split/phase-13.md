# Phase 13: PR 化準備

## 目的

実装完了後の PR 作成手順を確定する。`.claude/commands/ai/diff-to-pr.md` の自律フローに従う。

## 事前確認

- [ ] Phase 4 の classification.md が outputs に commit 済
- [ ] Phase 5〜8 の実装が完了
- [ ] Phase 9 の CI 変更が反映
- [ ] Phase 10 のローカル検証が PASS
- [ ] Phase 11 の before/after evidence が `outputs/phase-11/before-after.md` に記録
- [ ] Phase 12 の `outputs/phase-12/implementation-guide.md` 作成済
- [ ] ユーザー承認後の commit 直前に、意図しない未追跡・未コミット差分がないことを `git status --porcelain` で確認する

## PR 作成手順（ユーザー明示承認後のみ）

以下は準備手順であり、AI はユーザーから明示的に「commit / push / PR 作成してよい」と指示されるまで実行しない。

1. `git fetch origin dev` → ローカル `dev` を fast-forward
2. 作業ブランチに戻り `git merge dev`
3. コンフリクトは CLAUDE.md の方針で解消
4. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` を実行
5. 残課題があれば最大 3 回まで自動修復
6. ユーザー承認後にのみ `gh pr create --base dev` でPR作成
7. PR本文は `outputs/phase-12/implementation-guide.md` の主要見出しを反映

## PR 本文テンプレ

```markdown
## Summary
- root vitest.config.ts を unit / d1 に論理分割し apps/api の D1 依存テストを分離
- apps/api / apps/web / packages を CI で 4 並列 matrix 実行に変更
- coverage-gate ジョブで per-group artifact を merge し 80% gate を維持

## What changed
- 新規: `vitest.d1.config.ts` / `scripts/coverage-merge.mjs` / `scripts/__tests__/coverage-merge.test.mjs`
- 編集: `vitest.config.ts` / `apps/api/package.json` / `apps/web/package.json` / `scripts/coverage-guard.sh` / `.github/workflows/ci.yml`

## Test plan
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:unit`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage:d1`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage`
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage:web`
- [ ] `bash scripts/coverage-guard.sh --no-run`
- [ ] CI coverage-gate-shard matrix 4 並列 success
- [ ] CI coverage-gate aggregate success
- [ ] before/after evidence で短縮を確認

Refs #617
```

## branch protection 更新

本設計では最終 required context 名 `coverage-gate` を維持するため、branch protection 更新は不要。

将来 context 名を変更する場合だけ、PR merge 後・ユーザー承認必須で以下を実施する。

```bash
# before snapshot (read-only, evidence)
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection > /tmp/dev-before.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection > /tmp/main-before.json

# ユーザー承認後にのみ実行:
# required_status_checks.contexts から "coverage-gate" を削除し
# 新 context を追加する PATCH を構築して実行
```

## 完了条件

- PR が作成され `Refs #617` を含む
- CI が PASS（matrix + aggregate）
- branch protection 変更はユーザー承認後にのみ実行（本仕様書では自動実行しない）
