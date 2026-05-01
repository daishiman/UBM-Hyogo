# Phase 13: PR 作成（承認ゲート）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-112-02c-followup-api-env-type-helper |
| Phase 番号 | 13 / 13 |
| Phase 名称 | PR 作成 |
| 作成日 | 2026-05-01 |
| 前 Phase | 12 (close-out) |
| 次 Phase | なし（最終） |
| 状態 | pending |
| user_approval_required | **true** |

## 目的

local check → commit → push → PR 作成の最終ゲートを通す。**ユーザーの明示的な承認なく PR を作成してはならない。** Issue #112 は既に CLOSED のため、PR 本文では `Refs #112` を採用し `Closes #112` は禁止する。

## 三役ゲート

| # | ゲート | 内容 | 承認者 |
| --- | --- | --- | --- |
| 1 | user 承認 | 「PR 作成して」の明示指示 | ユーザー |
| 2 | commit 5 単位粒度 | 後述の commit 分割を遵守 | 本 Phase |
| 3 | push & PR | feature ブランチ push + `gh pr create` | 本 Phase |

## branch

- branch 名: `docs/issue-112-02c-followup-api-env-type-helper-task-spec`
- 既に作成済を再確認（`git branch --show-current` で照合）
- worktree: `.worktrees/task-20260501-174942-wt-3`（本ワークツリー）

## commit 5 単位粒度

| # | commit | 含まれるファイル |
| --- | --- | --- |
| 1 | spec 群（root） | `index.md`, `artifacts.json` |
| 2 | phase 1-3（要件・設計・レビュー） | `phase-01.md` 〜 `phase-03.md` + `outputs/phase-01〜03/` |
| 3 | phase 4-7（分解・計画・テスト・受入） | `phase-04.md` 〜 `phase-07.md` + `outputs/phase-04〜07/` |
| 4 | phase 8-10（CI・セキュリティ・ロールアウト） | `phase-08.md` 〜 `phase-10.md` + `outputs/phase-08〜10/` |
| 5 | phase 11-13 + close-out | `phase-11.md` 〜 `phase-13.md` + `outputs/phase-11〜13/` |

注: 既に複数 commit が積まれている場合は、上記分割を **論理的指針** として尊重しつつ、追加分のみを 5 単位の枠で commit する。

## local check

```bash
test -f docs/30-workflows/issue-112-02c-followup-api-env-type-helper/artifacts.json
test -f docs/30-workflows/issue-112-02c-followup-api-env-type-helper/outputs/phase-12/documentation-changelog.md
jq -e '.metadata.workflow_state == "implemented-local" and .phases[12].outputs[] == "outputs/phase-12/documentation-changelog.md"' \
  docs/30-workflows/issue-112-02c-followup-api-env-type-helper/artifacts.json
```

Current close-out check uses `implemented-local`:

```bash
jq -e '.metadata.workflow_state == "implemented-local" and .phases[12].status == "completed" and .phases[13].status == "pending_user_approval"' \
  docs/30-workflows/issue-112-02c-followup-api-env-type-helper/artifacts.json
```

`outputs/phase-13/main.md` に PASS / FAIL を記録。`pnpm typecheck` / `pnpm lint` / `pnpm test --filter @ubm/api` / boundary lint は、コード実装フェーズの Phase 11 evidence として取得する。

## PR 本文 template

```
title: docs(issue-112): 02c followup — apps/api Env type & ctx helper task spec

body:
## Summary
- Issue #112（02c-followup-001）のタスク仕様書を `docs/30-workflows/issue-112-02c-followup-api-env-type-helper/` 配下に作成
- index.md / artifacts.json / phase-01〜13.md + outputs/phase-01〜13
- `apps/api/src/env.ts` を Worker env 型の正本として配置し、02c `_shared/db.ts` の `ctx()` を `Pick<Env, "DB">` に refactor する仕様
- 不変条件 #5（apps/web → D1 直接アクセス禁止）を boundary lint で機械化
- implemented-local / NON_VISUAL / docs_only=false（Phase 13 の commit / push / PR は承認待ち）

## Test plan
- [ ] Phase 1〜10 の仕様レビュー
- [x] Phase 11 で typecheck / lint / test / boundary lint の evidence 取得
- [ ] Phase 12 close-out 7 ファイル parity 確認
- [ ] Phase 13 で本 PR 承認

Refs #112

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

注:
- `Closes #112` は **使わない**（issue は既に CLOSED）
- `Refs #112` を採用

## hook 通過必須

- `--no-verify` は **禁止**（lefthook の pre-commit / pre-push を通過させる）
- hook が誤検知する場合は CLAUDE.md の sync-merge ポリシーに従い hook 自体を改善し、回避フラグは使用しない

## rollback 手順

| 状況 | 手順 |
| --- | --- |
| PR 作成後に取り消したい | `gh pr close <PR番号>` → branch 削除（`git push origin --delete <branch>`） |
| ローカルのみ取り消したい | ユーザー承認後に対象 commit を非破壊的に revert する |
| 実装差分を取り消したい | `apps/api/src/env.ts` / `ctx()` / boundary lint / docs sync をまとめて revert 対象にする |

## production deploy への影響

- runtime deploy は未実行。`apps/api/src/env.ts` / `ctx()` / boundary lint のコード差分は含むが、Cloudflare Workers deploy には触れない。
- `apps/api` / `apps/web` の Cloudflare Workers deploy には触れない（09b production-deploy 責務）。

## 実行タスク

- [ ] user 承認待ち
- [ ] local check 実行 → `outputs/phase-13/main.md` に記録
- [ ] commit 5 単位で stage / commit
- [ ] **user 承認後** push + `gh pr create`
- [ ] PR URL を `outputs/phase-13/main.md` に記録

## 完了条件

- [ ] 三役ゲートすべて PASS
- [ ] PR URL 取得済み
- [ ] artifacts.json の phase 13 status を `completed`
- [ ] root `metadata.workflow_state` は `implemented-local`、Phase 13 完了時に `completed` へ更新

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 13 を completed
- [ ] PR URL を `outputs/phase-13/main.md` に記録
- [ ] hook 通過（`--no-verify` 不使用）

## 終了

本タスク PR の merge をもって、Issue #112（02c-followup-001）の **実装・仕様同期** が closed-loop 化される。
