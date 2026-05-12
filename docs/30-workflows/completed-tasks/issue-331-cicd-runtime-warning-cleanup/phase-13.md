# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-331-CICD-WARNING-001 |
| Phase | 13 |
| 状態 | spec_created（実行は user 承認後） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1〜12 の成果物を PR としてまとめ、`dev` ブランチへマージする準備を整える。

## 重要: 実行ポリシー

**PR 作成は user の明示承認後のみ実行する。** 本 Phase はコマンドと手順を記載するが、自動実行はしない。

## ブランチ戦略

- ブランチ名: `feat/issue-331-cicd-warning-cleanup`
- base: `dev`
- PR 後 `dev` → `main` リリースは別途（CLAUDE.md に従う）

## 実行手順（user 承認後）

```bash
# 同期
git fetch origin dev
git checkout feat/issue-331-cicd-warning-cleanup
git rebase origin/dev   # コンフリクト時は CLAUDE.md「PR作成の完全自律フロー」既定方針

# 品質検証
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# push
git push -u origin feat/issue-331-cicd-warning-cleanup

# PR 作成
gh pr create --base dev --title "ci: clean up wrangler runtime warnings (issue-331 残存 2 項目)" --body "$(cat <<'EOF'
## Summary

issue #331 集約タスクのうち、調査の結果残存していた 2 項目を解消:

- S1: `apps/api/wrangler.toml` の top-level `[vars]` を削除（env 配下に継承されない wrangler 仕様に整合）
- S2: `.github/workflows/web-cd.yml` を `pages deploy` から `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <env>` に移行（OpenNext Workers 構成に整合、CLAUDE.md 不変条件に準拠）

## Changes

- `apps/api/wrangler.toml`: top-level `[vars]` ブロック削除
- `.github/workflows/web-cd.yml`: deploy step を `cloudflare/wrangler-action@v3` の `pages deploy` から `scripts/cf.sh deploy` に置換（staging / production 両方）
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`: web-cd 記述を Workers deploy に同期
- `.claude/skills/aiworkflow-requirements/references/environment-variables.md`: `CLOUDFLARE_PAGES_PROJECT` を廃止候補と注記

## Test plan

- [ ] `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production --dry-run` で warning ゼロ
- [ ] `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` で warning ゼロ
- [ ] `grep -rn 'pages deploy' .github/workflows/` が 0 件
- [ ] `gh workflow run web-cd.yml --ref dev` が green
- [ ] main マージ後の production deploy で wrangler warning がゼロ（user 確認）

## Supersedes

- `docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/U-FIX-CF-ACCT-02-cicd-runtime-warning-cleanup.md`
- UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION

Refs #331
EOF
)"
```

## PR 本文不変条件

- `outputs/phase-12/implementation-guide.md` の主要見出しを反映
- `outputs/phase-11/` にスクリーンショットがある場合のみ image 参照を含める（NON_VISUAL のため通常は含めない）

## 完了条件（user 承認後）

- [ ] PR が `dev` 宛に作成されている
- [ ] CI green（typecheck / lint / verify-indexes / web-cd staging）
- [ ] PR 本文が CLAUDE.md「PR作成の完全自律フロー」要件を満たしている

## 成果物

- `outputs/phase-13/main.md`
- 作成された PR URL

## 実行タスク

- 対象 Phase の判断、設計、検証、または証跡作成を実行する。
- `apps/api/wrangler.toml` / `.github/workflows/web-cd.yml` / aiworkflow 正本との整合を確認する。

## 参照資料

- `docs/30-workflows/issue-331-cicd-runtime-warning-cleanup/index.md`
- `apps/api/wrangler.toml`
- `.github/workflows/web-cd.yml`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 依存Phase参照

- Phase 2: `phase-02.md` / `outputs/phase-02/main.md`
- Phase 5: `phase-05.md` / `outputs/phase-05/main.md`
- Phase 6: `phase-06.md` / `outputs/phase-06/main.md`
- Phase 7: `phase-07.md` / `outputs/phase-07/main.md`
- Phase 8: `phase-08.md` / `outputs/phase-08/main.md`
- Phase 9: `phase-09.md` / `outputs/phase-09/main.md`
- Phase 10: `phase-10.md` / `outputs/phase-10/main.md`
