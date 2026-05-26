# Phase 13: PR作成

## 目的

user の明示承認後のみ PR を作成する。

## 状態

`pending_user_approval`。本プロンプトでは commit / push / PR を**実行しない**（CLAUDE.md: commit/push/PR は user 明示承認後のみ）。

## PR 作成時の手順（承認後）

1. 既定 base ブランチは `dev`。
2. `git fetch origin dev` → ローカル `dev` を fast-forward → 作業ブランチへ merge → conflict は CLAUDE.md 既定方針で解消。
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `gh pr create --base dev` で作成。本文は `.claude/commands/ai/diff-to-pr.md` Phase 13 仕様 + `outputs/phase-12/implementation-guide.md` を反映。
5. スクリーンショットは NON_VISUAL のため項目を作らない。

## PR に含める変更（実装 wave 完了後）

- `scripts/cf.sh`（tail subcommand）
- `scripts/smoke/mint-staging-session-cookie.mts`
- `scripts/smoke/runtime-admin-web.sh`
- `.github/workflows/web-cd.yml`（admin-runtime-smoke job）
- `scripts/smoke/__tests__/{runtime-admin-web.test.sh,mint-staging-session-cookie.spec.ts}`
- 本仕様書 root（`docs/30-workflows/completed-tasks/issue-864-admin-staging-runtime-smoke-ci-gate/`）

## issue #864 の扱い

issue #864 はクローズ状態を**維持**する（reopen/close しない）。PR 本文で「#864 の回帰防止 gate を実装」と参照のみ行う。

## 完了判定

- [ ] user 承認まで実行しない
