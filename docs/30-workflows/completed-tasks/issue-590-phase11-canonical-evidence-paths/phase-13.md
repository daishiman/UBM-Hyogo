# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 13 |
| 状態 | blocked_pending_user_approval |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1〜12 の成果物を PR としてまとめ、`dev` ブランチへマージする準備を整える。

## 重要: 実行ポリシー

**PR 作成は user の明示承認後のみ実行する。** 本 Phase はコマンドと手順を記載するが、自動実行はしない。

## ブランチ戦略

- 仕様書のみのブランチ（本サイクル）: `docs/issue-590-phase11-canonical-evidence-paths-spec`
- 実装ブランチ（後続実装サイクル）: `feat/issue-590-phase11-canonical-evidence-paths`
- base: 両方とも `dev`
- PR 後 `dev` → `main` リリースは別途（CLAUDE.md に従う）

## 実行手順（user 承認後）

```bash
# 同期
git fetch origin dev
git checkout feat/issue-590-phase11-canonical-evidence-paths   # または docs/...-spec
git rebase origin/dev   # コンフリクト時は CLAUDE.md「PR作成の完全自律フロー」既定方針

# 品質検証
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- node --test .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs

# push
git push -u origin feat/issue-590-phase11-canonical-evidence-paths

# PR 作成
gh pr create --base dev --title "feat(spec-skill): introduce phase11 canonical evidence path schema + validator (Refs #590)" --body "$(cat <<'EOF'
## Summary

Issue #590 / `u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05` 派生タスクとして、Phase 11 で取得する runtime evidence の保存先 path を機械可読 schema で正本化する。

- 新規 JSON Schema 2020-12: `phase11-evidence-canonical-paths.schema.json`
- 新規軽量 ESM CLI validator + テスト一式
- 親 issue-549 の Phase 11 canonical path 表を JSON instance 化（`docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json`）
- 親 phase-11.md に schema 参照行を追記
- `package.json` に `validate:phase11-paths` script を追加

## Changes

- `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json`: 新規
- `.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js`: 新規 CLI validator
- `.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs`: 新規テスト
- validator fixtures are generated inside the node:test temp directory
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json`: 新規 instance
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-11.md`: schema 参照追記
- `package.json`: `validate:phase11-paths` script 追加
- `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md`: supersede 記述

## Test plan

- [x] `mise exec -- node --test .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs` で全件 pass
- [x] `mise exec -- pnpm validate:phase11-paths docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json` で exit 0
- [x] `mise exec -- pnpm typecheck` / `pnpm lint` 差分起因エラーなし
- [x] schema 違反 fixture で exit 1、path 不存在 fixture + `--check-existence` で exit 2 を確認
- [x] 親 phase-11.md に schema 参照行が grep で hit

## Supersedes

- `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md`

Refs #590 / Refs #549

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## PR 本文不変条件

- `outputs/phase-12/implementation-guide.md` の主要見出しを反映
- スクリーンショットは生成しない（NON_VISUAL）
- Refs #590 / Refs #549 の併記

## PR 作成前チェック

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` でファイル一覧確認
- [ ] schema / validator / tests / fixture / instance / phase-11.md 追記 / supersede / package.json が PR に含まれる
- [ ] スクリーンショット参照が PR 本文にない

## 完了条件

- [ ] ブランチ戦略が記載されている
- [ ] 実行手順が記載されている
- [ ] PR 本文テンプレートが用意されている
- [ ] PR 作成前チェックリストが整備されている

## 成果物

- `outputs/phase-13/main.md`（PR URL を含む実行ログ）

## 参照資料

- `phase-05.md`（実装） / `phase-12.md`（ドキュメント）
- CLAUDE.md「PR作成の完全自律フロー」
