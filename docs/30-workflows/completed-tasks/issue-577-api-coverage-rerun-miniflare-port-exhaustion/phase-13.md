# Phase 13 — commit / push / PR 作成（user gate）

## 目的

Phase 11/12 で固定した evidence と仕様書を、`dev` を base とする 1 PR に纏めて作成する。本 Phase は user approval gate（G4）後にのみ実行する。

## 入力 / 前提

- Phase 12 strict 7 outputs 完了
- branch: `docs/issue-577-api-coverage-rerun-task-spec`（既存）
- PR base: `dev`

## 手順

1. CLAUDE.md「PR 作成の完全自律フロー」に従い以下を順次実行:
   1. `git fetch origin dev`
   2. ローカル `dev` を `origin/dev` に fast-forward 同期
   3. 作業ブランチへ `dev` を merge し、コンフリクトは CLAUDE.md の既定方針で解消
   4. `mise exec -- pnpm install --force`
   5. `mise exec -- pnpm typecheck`
   6. `mise exec -- pnpm lint`
   7. 失敗時は最大 3 回まで自動修復
2. `git status --porcelain` が空、`git diff dev...HEAD --name-only` で PR ファイル一覧を取得。
3. PR 作成:
   ```bash
   gh pr create \
     --base dev \
     --title "fix(api): stabilize issue-577 full coverage rerun under miniflare" \
     --label priority:medium \
     --label type:improvement \
     --label scale:small \
     --label area:testing \
     --body "$(cat <<'EOF'
   ## Summary
   - `@ubm-hyogo/api` の full coverage rerun で Miniflare/undici `EADDRNOTAVAIL` を再現し、worker cap を採用
   - `apps/api/package.json#scripts.test:coverage` に `--maxWorkers=1 --minWorkers=1` を追加
   - rerun / triage / post-patch evidence を `outputs/phase-11/evidence/` に固定し、Issue #532 Phase 11 / 12 へ follow-up entry を same-wave sync

   ## Test plan
   - [x] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck`
   - [x] `mise exec -- pnpm --filter @ubm-hyogo/api lint`
   - [x] `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` (133/133, 0 EADDRNOTAVAIL)

   Refs: #577
   Refs: #532
   EOF
   )"
   ```
4. PR URL を最終レポートに記録。

## 完了条件（DoD）

- [ ] PR が `dev` を base に作成され、4 labels が付与されている。
- [ ] 本文に `Refs: #577` と `Refs: #532` を含む。
- [ ] typecheck / lint が green。
- [ ] PR URL が最終レポートに記録されている。

## ガードレール

- user approval gate（G4）前に commit / push / PR 作成は行わない。
- `--no-verify` は使わない（CLAUDE.md ポリシー）。
- Issue #577 / #532 の state は変更しない。
- production deploy（`scripts/cf.sh deploy`）は本タスクで実行しない。
