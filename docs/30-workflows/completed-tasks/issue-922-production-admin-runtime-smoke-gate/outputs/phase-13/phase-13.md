# Phase 13: PR作成

## 目的

user の明示承認後のみ PR を作成する。

## 状態

`pending_user_approval`。本プロンプトでは commit / push / PR を**実行しない**（CLAUDE.md: commit/push/PR は user 明示承認後のみ）。

## PR 作成時の手順（承認後）

1. 既定 base ブランチは `dev`（production gate のコード変更も `dev` 経由でレビュー → `dev` → `main` リリース時に production deploy + 本 gate 発火）。
2. `git fetch origin dev` → ローカル `dev` を fast-forward → 作業ブランチへ merge → conflict は CLAUDE.md 既定方針で解消。
3. `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `gh pr create --base dev` で作成。本文は `.claude/commands/ai/diff-to-pr.md` Phase 13 仕様 + `outputs/phase-12/implementation-guide.md` を反映。
5. スクリーンショットは NON_VISUAL のため項目を作らない。

## PR に含める変更（実装 wave 完了後）

- `scripts/smoke/runtime-admin-web.sh`（env-aware 一般化）
- `scripts/smoke/mint-staging-session-cookie.mts`（`resolveEnvPrefix` + CLI arg）
- `.github/workflows/web-cd.yml`（admin-runtime-smoke-production job）
- `scripts/smoke/__tests__/{runtime-admin-web.test.sh,mint-staging-session-cookie.spec.ts}`（production env path 拡張）
- 本仕様書 root（`docs/30-workflows/completed-tasks/issue-922-production-admin-runtime-smoke-gate/`）
- task-specification-creator / aiworkflow-requirements skill 同期

## user-gated post-merge 手順（PR merge 後）

1. **`production-runtime-smoke` GitHub Environment 作成**（user 明示承認後）:
   - `PRODUCTION_AUTH_SECRET`, `PRODUCTION_ADMIN_MEMBER_ID`, `PRODUCTION_ADMIN_EMAIL`, `PRODUCTION_WEB_BASE`, `CLOUDFLARE_API_TOKEN`, `SLACK_WEBHOOK_INCIDENT` を投入
   - branch policy: `main` のみ deploy 許可
2. **dev → main リリース** → `deploy-production` + `admin-runtime-smoke-production` job 実走 PASS（Gate-B Step 2）
3. **意図的 throw regression evidence 取得**（AC-5、user 明示承認後、深夜帯に 1 回限り）:
   - 一時 branch で意図的 throw を仕込み main へ promote → job FAIL evidence 取得 → 即時 revert
4. **`main` branch protection required status check 追加**（AC-9、user 明示承認後）:
   - read-only before JSON: `gh api repos/daishiman/UBM-Hyogo/branches/main/protection > /tmp/main-protection-before.json`
   - `gh api -X PUT` で `admin runtime smoke production / smoke` を追加
   - 既存 PR drain を確認してから実行

## issue #922 の扱い

issue #922 はクローズ状態を**維持**する（reopen/close しない）。PR 本文で「#922 の production admin runtime smoke gate を実装（親 #864 staging gate の followup-001）」と参照のみ行う。

## 完了判定

- [ ] user 承認まで実行しない
