# Phase 13: PR作成（user-gated）

> **[実装区分: 実装仕様書]**（CONST_004 デフォルト）。本 Phase は PR 作成手順を確定する。**commit / push / PR 作成はユーザーの明示承認後のみ実行する。本サイクルでは PR を作成しない。**

## メタ情報

- workflow_state: `implemented_local_runtime_pending` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`
- GitHub Issue: #1029（**CLOSED** のまま / reopen しない / mutation 無し）
- base ブランチ: `dev`（既定）/ 作業ブランチ: `docs/issue-1029-public-member-photo-display-spec`
- Gate-C: pending（PR / staging deploy / screenshot capture は全て user-gated）

## 目的

issue #1029 のタスク仕様書（Phase 1-13）と実装サイクル成果物を、ユーザー承認後に `dev` 向け PR として提出する手順を確定する。本 Phase 単独では PR を作成しない。

## 実行タスク

> 以下はすべてユーザーの明示承認後のみ実行する。本サイクルでは実行しない。

- `git status --porcelain` で未コミット変更を確認する。
- `git fetch origin dev` を実行し、ローカル `dev` を `origin/dev` に fast-forward 同期する。
- 作業ブランチに `dev` をマージする。コンフリクトは CLAUDE.md「コンフリクト解消の既定方針」に従って解消する。
- 品質検証 4 コマンドを実行する: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
- `git diff dev...HEAD --name-only` で PR に含まれるファイル一覧を取得する。
- `outputs/phase-12/implementation-guide.md` の内容を PR 本文に反映する。
- `outputs/phase-11/screenshots/` に画像がある場合のみ PR 本文にスクリーンショット参照を含める（VISUAL_ON_EXECUTION のため、screenshot は実装済みブランチの staging deploy 後に取得後に参照する）。
- `gh pr create --base dev` で PR を作成する。
- Issue #1029 は CLOSED のまま維持し、reopen / comment の mutation を行わない。

## 参照資料

- `.claude/commands/ai/diff-to-pr.md`（PR 本文 Phase 13 仕様）
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/main.md`
- `index.md` §5（user-gated 操作一覧）

## 成果物

- Phase 13 PR 作成手順（本ファイル）
- PR（ユーザー承認後・本サイクルでは未作成）

## 完了条件

- [ ] PR base が `dev` であることが明記されている
- [ ] commit / push / PR 作成が user-gated であり、本サイクルでは実行しない旨が明記されている
- [ ] Issue #1029 を CLOSED のまま維持し mutation を行わない旨が明記されている
- [ ] PR 本文に implementation-guide.md を反映する手順が記載されている
- [ ] VISUAL_ON_EXECUTION の screenshot は実装サイクル取得後に参照する旨が記載されている
