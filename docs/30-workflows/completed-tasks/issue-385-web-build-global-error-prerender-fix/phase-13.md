[実装区分: 実装仕様書]

# Phase 13: PR 作成 — issue-385-web-build-global-error-prerender-fix

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-385-web-build-global-error-prerender-fix |
| phase | 13 / 13 |
| wave | issue-385 |
| mode | serial |
| 作成日 | 2026-05-02 |
| 改訂日 | 2026-05-03 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| status | pending_user_approval |
| workflow_state | spec_revised |
| GitHub Issue | #385（CLOSED） |

## ⚠ 自走禁止宣言（最重要）

**本タスクではユーザーの明示指示があるまで PR を作成しない。** 本 Phase は実装後の PR 作成手順を文書として確定するのみで、`gh pr create` / `git push` / `git commit` / `git merge` を **実行しない**。

- Claude Code が自走して PR を作る対象外タスク
- 本 Phase の `outputs/phase-13/main.md` は「将来 PR 化する際の draft + 実行手順」であり「PR 作成済みの記録」ではない
- ユーザーが「PR を作成してよい」と明示指示した時点で、CLAUDE.md「PR 作成の完全自律フロー」を Phase 13 として実行する
- 実装（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory 化 + 4 route handler / `oauth-client.ts` 書き換え）は Phase 5 ランブックに従い別タスクで実施し、本 Phase は実装完了後の PR 作成手順仕様化に閉じる

## 目的

実装後の PR 作成手順を仕様化する。具体的には (a) branch 命名規約、(b) PR title format、(c) PR body テンプレ（Summary / Test plan / Linked issues / Screenshots NONE 宣言）、(d) Issue #385 が CLOSED 済みのため `Refs #385` を使用し `Closes` を禁止するルール、(e) follow-up issue（P11-PRD-003 / P11-PRD-004 / `apps/web/wrangler.toml` service-binding 追記）作成方針、(f) approval gate と DoD（CI gate PASS）、(g) CLAUDE.md「PR 作成の完全自律フロー」を Phase 13 として実行する手順を確定する。

## 前提条件

| # | 条件 | 確認元 |
| --- | --- | --- |
| 1 | Phase 9 全ゲート PASS（typecheck / lint / test / build / build:cloudflare） | `outputs/phase-09/main.md` |
| 2 | Phase 11 実測 9 段 evidence 取得済（build / cloudflare build / worker.js 生成 / `useContext` null 非出現 grep / lazy import 構造確認） | `outputs/phase-11/main.md` |
| 3 | Phase 12 で follow-up unassigned-task および LL-1 候補が列挙済、skill index rebuild 実行済 | `outputs/phase-12/` |
| 4 | 実装が Plan A の主要 8 ファイル（`auth.ts` / `oauth-client.ts` / `session.ts` / 4 route handler / `apps/web/package.json`）に閉じ、middleware / next.config は変更なし | Phase 2 / Phase 5 |
| 5 | `apps/api` / D1 / `packages/shared` への変更ゼロ | 不変条件 #5 |

## PR payload 仕様

### 対象ブランチ

- **作業ブランチ**: `fix/issue-385-web-build-global-error-prerender-lazy-auth`
- **PR base**: `main`（個人開発 solo 運用ポリシー、CLAUDE.md ブランチ戦略の `dev` 経由は本タスクでは省略可・user 指示あれば `dev` 経由に切替）
- **作業内容**: Plan A 実装差分（`apps/web/src/lib/auth.ts` 等 6 ファイル）と spec docs 追記（`docs/00-getting-started-manual/specs/02-auth.md` + 存在時 `apps/web/CLAUDE.md`）と本ワークフロー (`docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`) を 1 PR に同梱

### branch 命名規約

- prefix: `fix/`（pre-existing build 失敗の恒久解消であり機能追加ではない）
- 形式: `fix/issue-<番号>-<英小文字 kebab-case>`
- 採用名: `fix/issue-385-web-build-global-error-prerender-lazy-auth`
- `lazy-auth` suffix で Plan A 採択を branch 名から識別可能にする

### PR title format（70 文字以下）

```
fix(web): next-auth lazy factory 化で prerender 失敗を解消 (issue #385)
```

候補（いずれも 70 文字以下）:

- `fix(web): next-auth lazy factory 化で prerender 失敗を解消 (issue #385)`
- `fix(web): isolate next-auth via getAuth() lazy factory (#385)`
- `fix(web): /_global-error prerender useContext null 解消 lazy auth (#385)`

### PR body テンプレ（HEREDOC 形式・CLAUDE.md PR 自律フロー準拠）

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
- [ ] CI gate（typecheck / lint / build / build:cloudflare / test）all green
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

- vercel/next.js #86178 / #84994 / #85668 / #87719（Next.js 16 + React 19 prerender における Provider context 未初期化問題）
- nextauthjs/next-auth #13302（next-auth 5.x の prerender 互換性問題）

## Follow-up issues

本 PR の build 緑化により着手可能になる以下の follow-up を別 issue として登録予定（Phase 12 unassigned-task に基づく）:

- P11-PRD-003 fetchPublic service-binding 経路書き換え
- P11-PRD-004 `/privacy` `/terms` ページ実装
- `apps/web/wrangler.toml` `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` service-binding 追記タスク
- LL-1 lessons-learned: 「next-auth の top-level import を避け `getAuth()` lazy factory 化」を `.claude/skills/aiworkflow-requirements/references/` 配下に追加

各 follow-up は本 PR merge 後、user 承認のうえ別タスク・別 PR として分離する。

## Screenshots

NONE — 本 PR は NON_VISUAL（build / typecheck / lint / test の合否と lazy import 構造 grep のみが evidence であり、UI 表示変更を伴わない）。
```

### `Refs #385` 採用 / `Closes #385` 禁止のルール

- **採用**: `Refs #385`
- **禁止**: `Closes #385` / `Fixes #385` / `Resolves #385`
- 理由:
  1. Issue #385 は既に CLOSED 状態であり、`Closes` を使うと GitHub が再 close を試みて lifecycle 履歴にノイズを残す
  2. Issue lifecycle と PR lifecycle を分離し、Issue 側は user 判断で再 open / close を制御する設計
  3. `Refs` であれば PR 側から Issue への参照リンクのみが残り、Issue 状態は変動しない

## CLAUDE.md「PR 作成の完全自律フロー」を Phase 13 として実行する手順

user 明示指示後、以下を順次実行する（CLAUDE.md §PR作成の完全自律フロー準拠）:

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
gh pr create --base main --title "fix(web): next-auth lazy factory 化で prerender 失敗を解消 (issue #385)" \
  --body "$(cat outputs/phase-13/pr-body.md)"

# 6. PR URL 取得
gh pr view --json url --jq .url
```

> 上記は draft であり、実走時は CLAUDE.md「PR 作成の完全自律フロー」の手順 1〜9 を厳密に従う（コンフリクト解消既定方針 / 品質検証失敗時の自動修復 / PR 作成前チェック を含む）。

## approval gate（三役分離）

| # | 役割 | 操作 | 承認主体 | 実行タイミング |
| --- | --- | --- | --- | --- |
| 1 | implementer | `apps/web/src/lib/auth.ts` 等 Plan A 6 ファイル編集 + Phase 11 9 段実測 | user 明示指示 | 別タスク（Phase 5 ランブック）で実行 |
| 2 | spec author | 仕様書 + spec docs 追記 commit / push / PR 作成 | user 明示指示 | 本 Phase 13 で draft 確定 → user 指示後に CLAUDE.md PR 自律フローで実行 |
| 3 | deploy operator | `bash scripts/cf.sh deploy` の staging / production 実行 | user | 09a (staging) / 09c (production) で user 承認後に実行 |

> **三役分離の意義**: 実装（#1）と PR 作成（#2）と deploy（#3）を直列の別承認にすることで、誤実装・誤 deploy 時の rollback がそれぞれの段階で打てる。本 PR は #1 の成果物を含む #2 のみを完了対象とする。#3 は下流タスクに完全委譲する。

## DoD（Definition of Done）

| # | 完了条件 | 確認方法 |
| --- | --- | --- |
| 1 | PR URL が取得され記録されている | `gh pr create` の出力 / `gh pr view --json url` |
| 2 | CI gate (typecheck) PASS | GitHub Actions ログ |
| 3 | CI gate (lint) PASS | 同上 |
| 4 | CI gate (test) PASS | 同上 |
| 5 | CI gate (build) PASS | 同上 |
| 6 | CI gate (build:cloudflare) PASS | 同上 |
| 7 | CI gate (verify-indexes-up-to-date) PASS | 同上（Phase 12 で `pnpm indexes:rebuild` 済） |
| 8 | PR body に `Refs #385` / `NONE` screenshot 宣言 / follow-up 注記 / 関連 upstream issues が含まれる | PR 本文 review |
| 9 | `Closes #385` 系の close キーワードが PR body に含まれない | grep |
| 10 | secret 値・build ログの secret 文字列・provider response body が PR body / outputs に転記されていない | review |
| 11 | next / react / react-dom / next-auth / middleware / next.config / package.json の差分が PR diff に含まれない | `git diff main...HEAD` review |

## rollback 方針

本 PR は build 失敗解消が目的であり、rollback は revert PR で完結する（dependency 変更が無いため、ロールフォワード経路もシンプル）。

| 状況 | rollback 手順 |
| --- | --- |
| merge 後に新たな prerender 失敗が発覚 | `git revert <この PR の merge commit SHA>` で revert PR を出し、user 承認後 merge |
| 特定 route handler で lazy factory 解決異常 | 該当 handler のみ pinpoint で revert、または `getAuth()` 呼び出し位置の修正 PR を別出し |
| Cloudflare deploy 後の影響 | 本 PR 自体は deploy を行わないため、deploy 由来の rollback は 09a / 09c 側の責務（`bash scripts/cf.sh rollback <VERSION_ID>`） |

## 実行タスク

1. 自走禁止宣言を冒頭に明記する。完了条件: ユーザー明示指示があるまで PR 作成しない旨が記載される。
2. branch 命名規約 `fix/issue-385-web-build-global-error-prerender-lazy-auth` を確定する。完了条件: prefix `fix/` の理由 + `lazy-auth` suffix の意図が明記される。
3. PR title format（70 文字以下）を確定する。完了条件: 採用 title と候補が列挙される。
4. PR body テンプレ（Summary / Test plan AC-1〜AC-9 / 境界宣言 / Refs / Follow-up / Screenshots NONE）を HEREDOC 形式で確定する。完了条件: 全セクションが揃い、`Closes` 不使用が明示される。
5. `Refs #385` 採用 / `Closes #385` 禁止のルールを記述する。完了条件: 理由（Issue CLOSED 済 / lifecycle 分離）が明文化される。
6. CLAUDE.md「PR 作成の完全自律フロー」を Phase 13 として実行する手順を記述する。完了条件: コピペ実行可能な block が揃う。
7. approval gate の三役分離（implementer / spec author / deploy operator）を表で定義する。完了条件: 各役割の承認主体・実行タイミングが揃う。
8. follow-up issue（P11-PRD-003 / P11-PRD-004 / wrangler.toml service-binding 追記 / LL-1 lessons-learned）作成方針を注記する。完了条件: Phase 12 unassigned-task との接続が明記される。
9. DoD（PR URL 取得 + CI gate 5 種 + verify-indexes PASS + dependency 不変 review）を表で確定する。完了条件: 確認方法が各項目に紐付く。
10. `outputs/phase-13/main.md`（PR 本文 draft + 実行手順）の構成を定義する。完了条件: Summary / Test plan / Refs / Follow-up / Screenshots NONE / 自律フロー手順 がすべて含まれる。

## 参照資料

- Phase 1 真因 / 影響範囲 / AC ↔ evidence 対応表
- Phase 2 採用方針評価マトリクス（Plan A 採用 / 不採用案 5 件）
- Phase 3 4 条件評価 / 不変条件整合
- Phase 5 Plan A 実装ランブック
- Phase 9 品質保証ゲート（実装後）
- Phase 11 9 段実測 evidence（実装後）
- Phase 12 unassigned-task / LL-1 lessons-learned 候補
- CLAUDE.md §PR作成の完全自律フロー
- CLAUDE.md §ブランチ戦略
- `.claude/commands/ai/diff-to-pr.md`
- vercel/next.js #86178 / #84994 / #85668 / #87719
- nextauthjs/next-auth #13302

## 実行手順

- 対象 directory: `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/`
- 本 Phase ではアプリケーションコード変更、deploy、commit、push、`gh pr create`、dependency 更新を **実行しない**
- PR 作成は user 明示指示後に別ターンで本テンプレと CLAUDE.md PR 自律フローを使い実行する
- secret 実値・build ログの secret 文字列・provider response body を PR body / commit message / outputs に転記しない
- Issue #385 が CLOSED 済であることに留意し、PR body 中で `Closes` 系キーワードを使用しない

## 統合テスト連携

- 上流: Phase 1（要件） / Phase 2（Plan A 設計） / Phase 3（設計レビュー） / Phase 5（実装ランブック） / Phase 9（品質ゲート） / Phase 11（9 段実測 evidence） / Phase 12（docs / follow-up / LL-1）
- 下流:
  - P11-PRD-003 fetchPublic service-binding 経路書き換え
  - P11-PRD-004 `/privacy` `/terms` ページ実装
  - `apps/web/wrangler.toml` `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` service-binding 追記
  - 09a-A-staging-deploy-smoke-execution
  - 09c-A-production-deploy-execution
  - LL-1 lessons-learned 追加タスク（user 承認後）

## 多角的チェック観点

- 不変条件 #5 (D1 access boundary): PR diff が `apps/web` および docs に閉じ、`apps/api` / D1 / `packages/shared` への変更を含まないことを Test plan に含める
- 不変条件 #14 (Cloudflare free-tier): 新規 binding / KV / D1 / cron 追加なし、build 成果物の構造変化最小であることを境界宣言に含める
- 不変条件 #16 (secret values never documented): build ログの secret 文字列を PR body / outputs に転記しない旨を DoD で明示
- 未実装 / 未実測を PASS と扱わない: PR 作成前提として Phase 9 / 11 の実測 PASS を前提条件で明文化
- pre-existing バグの恒久解消が責務であり、ワークアラウンド（experimental flag / downgrade / patch）を採らない方針を Summary に反映
- Issue #385 CLOSED 状態を踏まえ `Refs` 採用 / `Closes` 禁止を明文化
- Plan A の dependency 不変を DoD #11 で構造的に担保

## サブタスク管理

- [ ] 自走禁止宣言を冒頭に明記した
- [ ] branch 命名規約 `fix/issue-385-web-build-global-error-prerender-lazy-auth` を確定した
- [ ] PR title format（70 文字以下）を確定した
- [ ] PR body テンプレ（Summary / Test plan AC-1〜AC-9 / 境界宣言 / Refs / Follow-up / Screenshots NONE）を確定した
- [ ] `Refs #385` 採用 / `Closes #385` 禁止のルールと理由を明記した
- [ ] CLAUDE.md PR 自律フロー実行手順を記述した
- [ ] approval gate 三役分離を表で定義した
- [ ] follow-up issue 作成方針（LL-1 含む）を注記した
- [ ] DoD（PR URL + CI gate 5 種 + verify-indexes + dependency 不変）を表で確定した
- [ ] outputs/phase-13/main.md の構成を定義した

## 成果物

- outputs/phase-13/main.md（自走禁止宣言 / branch 命名 / PR title / PR body draft / Refs ルール / CLAUDE.md PR 自律フロー実行手順 / approval gate / follow-up 注記 / DoD / rollback 方針）

## 完了条件

- 自走禁止宣言が冒頭に明記され、ユーザー明示指示までは PR を作成しないことが固定されている
- branch 命名規約 `fix/issue-385-web-build-global-error-prerender-lazy-auth` が確定し prefix `fix/` + `lazy-auth` suffix の理由が記載されている
- PR title が 70 文字以下の案で確定している
- PR body テンプレが Summary / Test plan AC-1〜AC-9 / 境界宣言 / Refs / Follow-up / Screenshots NONE を含む HEREDOC 形式で確定している
- `Refs #385` 採用 / `Closes #385` 禁止のルールと理由（Issue CLOSED 済 / lifecycle 分離）が明文化されている
- CLAUDE.md「PR 作成の完全自律フロー」を Phase 13 として実行する手順が記述されている
- approval gate の三役分離（implementer / spec author / deploy operator）が表で定義されている
- follow-up issue（P11-PRD-003 / P11-PRD-004 / wrangler service-binding 追記 / LL-1）作成方針が注記されている
- DoD（PR URL 取得 + CI gate 5 種 + verify-indexes PASS + dependency 不変 review）が表で確定されている
- status: pending_user_approval / workflow_state: spec_revised が宣言されている
- `outputs/phase-13/main.md` の構成が「PR 本文 draft + 実行手順」を含む形で定義されている

## タスク 100% 実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR、dependency 更新を実行していない
- [ ] secret 実値・build ログの secret 文字列を記録していない
- [ ] 自走禁止宣言が冒頭に明記されている
- [ ] Issue #385 CLOSED 状態を踏まえた `Refs` 採用 / `Closes` 禁止が明示されている
- [ ] Plan A 採択（next / react / next-auth 据置）が Summary / 境界宣言 / DoD #11 の 3 箇所で言明されている

## 次 Phase への引き渡し

Phase 完了 へ次を渡す:

- 実装（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory 化 + 4 route handler / `oauth-client.ts` 書き換え）は Phase 5 ランブックに従い `fix/issue-385-web-build-global-error-prerender-lazy-auth` ブランチで実施
- 実装完了 + Phase 9 / 11 PASS + Phase 12 docs 整備 後、user 明示指示で本テンプレと CLAUDE.md PR 自律フローを使い別ターンで PR 作成
- 三役分離の approval gate（implementer #1 / spec author #2 / deploy operator #3）
- 本 PR は #1 + #2 完了対象、#3 は下流 09a / 09c に委譲
- follow-up issue（P11-PRD-003 / P11-PRD-004 / wrangler service-binding 追記 / LL-1 lessons-learned）は本 PR merge 後に別タスク化
- Issue #385 は CLOSED のまま `Refs #385` で参照のみ、再 open / 再 close は行わない
