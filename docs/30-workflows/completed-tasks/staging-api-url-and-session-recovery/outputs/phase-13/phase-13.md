# Phase 13: PR 作成（user-gated）

> **status: blocked（user-gated）**。本フェーズの**全操作**は user 明示承認後にのみ実行する（CONST_002 / CONST_007）。
> commit / push / `gh pr create` / `cf.sh secret put`（AUTH_SECRET 投入）/ staging deploy / `smoke-staging-me.sh` 実走 /
> branch protection 変更（`gh api -X PUT`）は承認前に絶対実行しない。

## 前提（PR 作成の絶対原則）

- **base ブランチ = `dev`**（CLAUDE.md PR 作成フロー既定）。`main` への PR は production リリース時のみ。
- 現ブランチの差分（staged / unstaged / untracked / commit 済）を**すべて**含める。種別・サイズ・自動生成を理由に除外しない。
- PR 本文は `.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として扱い、`outputs/phase-12/implementation-guide.md`（存在時）を漏れなく反映する。
- `outputs/phase-11/` に screenshot 画像があれば PR 本文に参照を含める。無ければ screenshot セクションを作らない。

## 実行順序（承認後）

1. 現ブランチ確認。`dev` 直上 / 未作成なら差分主題から `fix/staging-api-url-and-session-recovery` 等で作業ブランチを自律作成。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
3. 作業ブランチで `git merge dev`。conflict は CLAUDE.md §コンフリクト解消の既定方針で自律解消し `git add` + `git commit`。
4. 品質検証（4 コマンド）:
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
5. 失敗時は最大 3 回まで自動修復し修復差分をコミット。
6. `git status --porcelain` で未コミット 0 を確認（残れば `git add -A` で全件）。
7. `git diff dev...HEAD --name-only` で PR 対象ファイル一覧を取得（漏れなし確認）。
8. `gh pr create --base dev` で作成。

## staging 反映（PR とは独立・各々 user-gated）

PR とは別に、staging で実際に症状を解消するには以下を承認後に実施する:

```bash
# 1. AUTH_SECRET parity 診断（read-only・承認不要）
bash scripts/diagnose-auth-secret-parity.sh --json

# 2. AUTH_SECRET 投入（mutation・user-gated）— 欠落 or 不一致疑い時のみ
bash scripts/cf-secret-put-auth-secret.sh --from-op 'op://Employee/ubm-hyogo-env/AUTH_SECRET_STAGING'

# 3. web/api staging deploy（user-gated）
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging

# 4. runtime smoke（user-gated 実走・/me 200 + /profile 認証描画の VISUAL_ON_EXECUTION 証跡）
STAGING_API_BASE=https://ubm-hyogo-api-staging.daishimanju.workers.dev \
STAGING_WEB_BASE=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
STAGING_ME_BEARER=... \
bash scripts/smoke-staging-me.sh staging --ci-summary
```

> cf 系は必ず `scripts/cf.sh` 経由。secret 値・bearer・cookie は出力 / evidence に残さない（L-AUTHSECRET-001）。

## PR 本文骨子

```
## 概要
staging で観測された「localhost アドレス」「セッション取得失敗」の 2 症状を根本解消。
web→api の server-side fetch を service-binding（API_SERVICE）優先へ統一し loopback 404 を解消、
client bundle の localhost 焼き込みを根絶、AUTH_SECRET parity 診断 + grep gate + /me smoke を新設。

## 変更内容（3 lane / 1 サイクル / 1 PR・CONST_007）
- Lane A: fetchAuthed + me/admin/auth proxy + verify-magic-link を resolveApiFetch 経由へ（binding 優先・fail-closed）
- Lane B: getBaseUrl を NEXT_PUBLIC_API_BASE_URL 優先 + local 限定 fallback + 非 local throw
- Lane C: diagnose-auth-secret-parity.sh / cf-secret-put-auth-secret.sh / verify-no-localhost-bake.sh(+CI) / smoke-staging-me.sh

## 受入条件
AC-1〜AC-8（outputs/phase-10/phase-10.md 参照）。runtime 実証（AC-1/AC-7）は staging smoke で確認。

## テスト
transport.spec / authed.spec / me route.route.spec / public.spec / env.spec / verify-no-localhost-bake.spec（self-test）。
typecheck / lint / 対象 vitest / verify-pr-ready.sh / verify-no-localhost-bake.sh 全緑。

## user-gated（承認後実施）
AUTH_SECRET 投入 / staging deploy / smoke 実走 / required status check 登録。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> commit message 末尾には `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` を付す。

## PR 作成前チェック

- `git status --porcelain` が空。
- `git diff dev...HEAD --name-only` が取得できている。
- `outputs/phase-12/implementation-guide.md` の主要見出しが PR 本文に反映（存在時）。
- `outputs/phase-11/` の画像数と PR 本文の画像参照が整合。無ければ screenshot セクションを作らない。

## 最終レポート（PR 作成完了後・1 回）

PR URL / 採用ブランチ / 実行した自動修復 / 解消した conflict / 残課題（未タスク M-1・M-2）/
user-gated 残項目（secret 投入・deploy・smoke 実走・branch protection）を報告する。
