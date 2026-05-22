# Phase 13: PR 作成

## 目的

`dev` をベースとした PR を作成し、`verify-phase12-compliance` workflow が PASS することを確認する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## PR 作成手順

`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として参照し、CLAUDE.md「PR作成の完全自律フロー」に従う:

1. `git fetch origin dev` → ローカル `dev` を fast-forward
2. 作業ブランチに戻り `git merge dev`、コンフリクト解消
3. `pnpm install --frozen-lockfile` / `pnpm typecheck` / `pnpm lint` / `pnpm test:phase12-compliance`
4. `mise exec -- pnpm verify:phase12-compliance` をローカル実行
5. `git add -A` で未コミット変更を全件取り込み、commit
6. `gh pr create --base dev` で PR 作成

## PR 本文

- Phase 12 `implementation-guide.md` の主要見出しを反映
- Issue link: `Refs #603`（`Closes/Fixes` は使わない、Issue は CLOSED 維持）
- Test plan:
  - [ ] `pnpm typecheck` PASS
  - [ ] `pnpm lint` PASS
  - [ ] focused test 10 ケース PASS
  - [ ] `pnpm verify:phase12-compliance` がローカルで PASS
  - [ ] CI workflow `verify-phase12-compliance` が PR で PASS

## 想定 PR 数

1 PR（verify script + workflow + fixture + skill/SSOT 同期 + 本 task spec root）

## 完了条件

- [ ] PR 作成
- [ ] `verify-phase12-compliance` job PASS
- [ ] `pnpm typecheck` / `pnpm lint` job PASS
- [ ] PR URL を `outputs/phase-13/main.md` に記録

## 完了後の workflow_state 遷移

- `spec_created` → `implemented_local_runtime_pending`（local PASS）→ `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（PR open）→ `completed`（PR merge 後）
