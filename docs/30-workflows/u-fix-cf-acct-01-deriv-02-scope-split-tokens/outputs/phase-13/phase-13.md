# Phase 13: PR 作成（multi-stage approval gate）

## G1-G4 ゲート

| Gate | 対象 | 承認条件 | 実行禁止条件 |
| --- | --- | --- | --- |
| G1 | workflow YAML / scripts / docs の commit | Phase 9 全 PASS、secret hygiene clean | ユーザー許可なし |
| G2 | GitHub Secrets 6 件投入 | 1Password 配置確認、environment-scoped `gh secret list --env staging/production` に 6 件確認 | Phase 11 Step A 未完了 |
| G3 | push / PR 作成 | G1 完了、runtime evidence pending を PR body に明記、ユーザー明示許可 | ユーザー許可なし |
| G4 | merge 後 production rollout / 旧 `CLOUDFLARE_API_TOKEN` 失効 | dev staging 7 日 green、main merge 後 production success、24h 並行保持完了 | Step D production deploy 失敗時 |

**合算承認禁止**: G1〜G4 はそれぞれ独立に承認ログを残す。1 メッセージで「全部 OK」とまとめて承認することを禁ずる。

## PR 作成手順（G3 承認後のみ実行）

```bash
# 作業ブランチ作成・push
git checkout -b feat/u-fix-cf-acct-01-deriv-02-scope-split-tokens
git add .github/workflows/backend-ci.yml \
        .github/workflows/web-cd.yml \
        scripts/cf.sh \
        scripts/__tests__/cf-token-arg.test.sh \
        .claude/skills/aiworkflow-requirements/ \
        .claude/skills/task-specification-creator/ \
        docs/30-workflows/u-fix-cf-acct-01-deriv-02-scope-split-tokens/
git commit -m "$(cat <<'EOF'
feat(deploy): split Cloudflare API Token by Workers/D1/Pages × env (Issue #406)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push -u origin feat/u-fix-cf-acct-01-deriv-02-scope-split-tokens

# PR 作成
gh pr create --title "feat(deploy): split CF API Token by scope/env (Refs #406)" \
  --body-file outputs/phase-13/pr-body.md
```

## PR 本文必須項目

`outputs/phase-13/pr-body.md` に以下を含める:
- Summary: 6 Token 構成への移行
- 変更ファイル一覧
- local static evidence へのリンク
- runtime pending evidence path（Token 発行、environment-scoped GitHub Secrets 投入、staging 7 日 green、production deploy、旧 Token 失効）
- runbook へのリンク
- 関連: `Refs #406`、上流 `U-FIX-CF-ACCT-01`、関連 DERIV-01/03/04

## 成果物

- `outputs/phase-13/pr-body.md`
- `outputs/phase-13/approval-log.md`（G1-G4 各承認の timestamp）
