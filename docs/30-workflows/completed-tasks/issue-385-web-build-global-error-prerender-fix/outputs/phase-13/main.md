[実装区分: 実装仕様書]

# Phase 13 main.md — issue-385-web-build-global-error-prerender-fix

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 13 / 13 |
| 改訂日 | 2026-05-03 |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| status | blocked_pending_user_approval |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #385（CLOSED） |

## ⚠ 自走禁止宣言（最重要）

**本タスクではユーザーの明示指示があるまで PR を作成しない。** 本 Phase は実装後の PR 作成手順を文書として確定するのみで、`gh pr create` / `git push` / `git commit` / `git merge` を **実行しない**。

## 対象ブランチ

- 作業ブランチ: `fix/issue-385-web-build-global-error-prerender-lazy-auth`
- PR base: `main`（solo 運用ポリシー、CLAUDE.md ブランチ戦略の `dev` 経由は省略可）
- 同梱対象: Plan A 実装差分（6 ファイル）+ spec docs 追記（02-auth.md / 存在時 apps/web/CLAUDE.md）+ 本ワークフロー仕様

## branch 命名規約

- prefix: `fix/`（pre-existing build 失敗の恒久解消）
- 形式: `fix/issue-<番号>-<英小文字 kebab-case>`
- 採用名: `fix/issue-385-web-build-global-error-prerender-lazy-auth`
- `lazy-auth` suffix で Plan A 採択を branch 名から識別可能にする

## PR title（70 文字以下）

```
fix(web): next-auth lazy factory 化で prerender 失敗を解消 (issue #385)
```

候補:

- `fix(web): next-auth lazy factory 化で prerender 失敗を解消 (issue #385)`
- `fix(web): isolate next-auth via getAuth() lazy factory (#385)`
- `fix(web): /_global-error prerender useContext null 解消 lazy auth (#385)`

## PR body draft（CLAUDE.md PR 自律フロー準拠）

```markdown
## Summary

- Next.js 16.2.4 + React 19.2.5 + next-auth 5.x 環境で `apps/web` の `pnpm build` / `pnpm build:cloudflare` が `/_global-error` および `/_not-found` の prerender で `TypeError: Cannot read properties of null (reading 'useContext')` で失敗していた問題を恒久解消する。
- 真因: `apps/web/src/lib/auth.ts` の top-level `import NextAuth from "next-auth"` 等が prerender worker で `@auth/core` / `next-auth/react` を module-init 時にロードし、`React.createContext(undefined)` が React 19 Dispatcher の解決順を破壊して `useContext` null を引いていた。
- 採用方針: **Plan A — lazy factory パターン + build script 環境明示**。`auth.ts` を `export async function getAuth()` 化し、4 route handler (`/api/auth/[...nextauth]` / `/api/auth/callback/email` / `/api/admin/[...path]` / `/api/me/[...path]`) と `apps/web/src/lib/auth/oauth-client.ts` / `session.ts` を `await getAuth()` / `await import("next-auth/react")` 経由に書き換え。next / react / react-dom / next-auth の version、middleware、next.config は **変更なし**。`apps/web/package.json` は `NODE_ENV=production` build script 明示のみ変更。
- AC-1〜AC-9 はローカル実測（Phase 11 9 段）で全 PASS。詳細 evidence: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/outputs/phase-11/`
- 本 PR で staging / production deploy のブロックが解消され、下流タスク（P11-PRD-003 / P11-PRD-004 / wrangler service-binding 追記 / 09a / 09c）の着手が可能になる。

## Test plan

- [ ] AC-1: `mise exec -- pnpm --filter @ubm-hyogo/web build` exit 0
- [ ] AC-2: `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` exit 0 + `apps/web/.open-next/worker.js` 生成確認
- [ ] AC-3: build ログ全文に `Cannot read properties of null (reading 'useContext')` が grep で見つからない
- [ ] AC-4: `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` exit 0
- [ ] AC-5: `mise exec -- pnpm --filter @ubm-hyogo/web lint` exit 0
- [ ] AC-6: `rg -n '^import.*from "next-auth' apps/web/src/lib/auth.ts` が value import 0 件（type-only のみ可）
- [ ] AC-7: 4 route handler が `await getAuth()` 経由で handlers / auth / signIn を取得（typecheck PASS で担保）
- [ ] AC-8: `apps/web/package.json` の next / react / react-dom / next-auth が本 PR で変更されていない
- [ ] AC-9: `mise exec -- pnpm --filter @ubm-hyogo/web test` exit 0（既存テストの mock 整合含む）
- [ ] CI gate（typecheck / lint / build / build:cloudflare / test / verify-indexes-up-to-date）all green
- [ ] `apps/api` / D1 / `packages/shared` への変更が含まれない（不変条件 #5）

## 境界宣言

- 本 PR は build 失敗の恒久解消が範囲。staging / production の実 deploy 実行は本 PR 範囲外（下流 09a / 09c の責務）
- error / not-found UI の機能拡張（reset ボタン / 多言語化 / 意匠改善）は対象外
- next-auth / next / react のバージョン変更は対象外
- middleware / next.config / package.json の変更は対象外

## Linked issues / Refs

Refs #385

> Issue #385 は既に CLOSED 状態のため `Closes #385` ではなく `Refs #385` を使用する。本 PR merge 時に Issue を再 open / 再 close する操作は行わない。

関連 upstream issues:
- vercel/next.js #86178 / #84994 / #85668 / #87719
- nextauthjs/next-auth #13302

## Follow-up issues

本 PR の build 緑化により着手可能になる以下の follow-up を別 issue として登録予定:

- P11-PRD-003 fetchPublic service-binding 経路書き換え
- P11-PRD-004 `/privacy` `/terms` ページ実装
- `apps/web/wrangler.toml` `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` service-binding 追記タスク
- LL-1 lessons-learned: `getAuth()` lazy factory パターンを `.claude/skills/aiworkflow-requirements/references/` 配下に追加

## Screenshots

NONE — 本 PR は NON_VISUAL（build / typecheck / lint / test の合否と lazy import 構造 grep のみが evidence であり、UI 表示変更を伴わない）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## `Refs #385` 採用 / `Closes #385` 禁止のルール

- 採用: `Refs #385`
- 禁止: `Closes #385` / `Fixes #385` / `Resolves #385`
- 理由:
  1. Issue #385 は既に CLOSED 状態であり、`Closes` を使うと GitHub が再 close を試みて lifecycle 履歴にノイズを残す
  2. Issue lifecycle と PR lifecycle を分離し、Issue 側は user 判断で再 open / close を制御する
  3. `Refs` であれば PR 側から Issue への参照リンクのみが残り、Issue 状態は変動しない

## CLAUDE.md「PR 作成の完全自律フロー」を Phase 13 として実行する手順

user 明示指示後、以下を順次実行する:

```bash
# 1. ブランチ確認・main 同期
git fetch origin main
git checkout main && git pull --ff-only origin main
git checkout fix/issue-385-web-build-global-error-prerender-lazy-auth || \
  git checkout -b fix/issue-385-web-build-global-error-prerender-lazy-auth
git merge main   # コンフリクト時は CLAUDE.md 既定方針で解消

# 2. 品質検証（3 コマンドのみ）
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. 残変更を全件 commit
git status --porcelain
git add -A
git commit -m "$(cat <<'EOF'
fix(web): next-auth lazy factory 化で prerender 失敗を解消 (issue #385)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 4. PR に含まれるファイル一覧確認
git diff main...HEAD --name-only

# 5. push & PR 作成
git push -u origin fix/issue-385-web-build-global-error-prerender-lazy-auth
gh pr create --base main \
  --title "fix(web): next-auth lazy factory 化で prerender 失敗を解消 (issue #385)" \
  --body "$(cat outputs/phase-13/pr-body.md)"

# 6. PR URL 取得
gh pr view --json url --jq .url
```

## approval gate（三役分離）

| # | 役割 | 操作 | 承認主体 | 実行タイミング |
| - | --- | --- | --- | --- |
| 1 | implementer | Plan A 6 ファイル編集 + Phase 11 9 段実測 | user 明示指示 | 別タスク（Phase 5 ランブック） |
| 2 | spec author | 仕様書 + spec docs 追記 commit / push / PR 作成 | user 明示指示 | 本 Phase 13 で draft 確定 → user 指示後実行 |
| 3 | deploy operator | `bash scripts/cf.sh deploy` の staging / production 実行 | user | 09a (staging) / 09c (production) |

## DoD

| # | 完了条件 | 確認方法 |
| --- | --- | --- |
| 1 | PR URL が取得され記録されている | `gh pr create` 出力 / `gh pr view --json url` |
| 2 | CI gate (typecheck) PASS | GitHub Actions ログ |
| 3 | CI gate (lint) PASS | 同上 |
| 4 | CI gate (test) PASS | 同上 |
| 5 | CI gate (build) PASS | 同上 |
| 6 | CI gate (build:cloudflare) PASS | 同上 |
| 7 | CI gate (verify-indexes-up-to-date) PASS | 同上 |
| 8 | PR body に `Refs #385` / `NONE` screenshot 宣言 / follow-up 注記 / 関連 upstream issues が含まれる | PR 本文 review |
| 9 | `Closes #385` 系 close キーワードが PR body に含まれない | grep |
| 10 | secret 値・build ログの secret 文字列・provider response body が PR body / outputs に転記されていない | review |
| 11 | next / react / react-dom / next-auth / middleware / next.config / package.json の差分が PR diff に含まれない | `git diff main...HEAD` review |

## rollback 方針

| 状況 | rollback 手順 |
| --- | --- |
| merge 後に新たな prerender 失敗が発覚 | `git revert <merge commit SHA>` で revert PR を出し user 承認後 merge |
| 特定 route handler で lazy factory 解決異常 | 該当 handler のみ pinpoint で revert、または `getAuth()` 呼び出し位置の修正 PR を別出し |
| Cloudflare deploy 後の影響 | 本 PR は deploy しないため deploy 由来 rollback は 09a / 09c 側の責務（`bash scripts/cf.sh rollback <VERSION_ID>`） |

## スコープ外

- 本 Phase ではアプリケーションコード変更、deploy、commit、push、`gh pr create`、dependency 更新を **実行しない**
- secret 実値・build ログの secret 文字列・provider response body を PR body / commit message / outputs に転記しない
- Issue #385 が CLOSED 済であることに留意し、PR body 中で `Closes` 系キーワードを使用しない
