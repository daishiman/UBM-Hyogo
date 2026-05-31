# Phase 13: PR

## ⚠️ user-gated（最重要）

> **commit / push / PR 作成は、ユーザーの明示承認後にのみ実行する。**
> 本仕様書は PR の title / body 案を確定させるところまで。Claude Code は本 Phase で
> 自動的に commit / push / `gh pr create` を実行しない。
>
> issue #1008 は **CLOSED のまま維持** する。PR で close せず、参照のみ（`Refs #1008`）。
> 本 PR は docs-only（status reconciliation）であり、issue の再 open / 状態変更は行わない。

## Base / Branch

- base: `dev`
- branch（案）: `refactor/issue-1008-members-list-ux-clarity-artifact-status-reconciliation`

## PR Title（案）

`refactor(workflow): members-list-ux-clarity の artifacts status を実態に整合補正 (refs #1008)`

## PR Body（案）

```markdown
## Summary
- `members-list-ux-clarity` workflow は実装コード・Phase 11 evidence（24 PNG + focused vitest / playwright ログ）・Phase 12 strict 7 がすべて commit `37fe488e8`「feat(members): メンバー一覧のUX明確化 (#1009)」でマージ済みだが、`artifacts.json` が `spec_created` のまま登録され status drift が残っていた。
- 人間向け Phase 12 close-out（PASS 判定）と機械可読 `artifacts.json` status の乖離を解消し、完了タスク台帳 / dashboard / close-out audit が矛盾なく扱える状態へ整合補正する。
- 補正区分は **docs-only**（`apps/` / `packages/` 変更ゼロ）。tracking メタデータ status フィールドと markdown checkbox のみを current facts に同期。

Refs #1008

> issue #1008 は CLOSED のまま維持（本 PR で close しない・参照のみ）。

## 補正したファイル一覧（6 件）
| # | パス | 補正内容 |
|---|------|----------|
| 1 | `docs/30-workflows/completed-tasks/members-list-ux-clarity/artifacts.json` | `status` / `workflow_state` / `implementation_status` を `implemented_local_runtime_pending` へ。Phase 1-12 = `completed` / 13 = `pending`。Gate-A/B = `passed` / Gate-C = `pending` |
| 2 | `docs/30-workflows/completed-tasks/members-list-ux-clarity/outputs/artifacts.json` | root と byte parity |
| 3 | `.../tasks/task-a-density-toggle-ux-clarity/artifacts.json` | state 整合 + phase status 正規化 |
| 4 | `.../tasks/task-b-member-filters-live-affordance/artifacts.json` | Phase 11/12 を `completed` へ |
| 5 | `.../tasks/task-b-member-filters-live-affordance/phase-10-final-review.md` | AC checkbox 10 件を ☑ |
| 6 | `.../tasks/task-c-page-integration-and-visual-baseline/artifacts.json` | state 整合 + phase status 正規化 |

> aiworkflow register / inventory は既に `implemented_local_runtime_pending` 記載のため原則 no-op（確認のみ）。

## 検証結果サマリ
| AC | 検証手段 | 結果 |
|----|----------|------|
| AC-1 | `jq` root 3 値 = `implemented_local_runtime_pending` | （補正後に記入）|
| AC-2 | `jq` Phase 1-12 = `completed` / 13 = `pending` | （補正後に記入）|
| AC-3 | `diff -u root outputs` parity 0 | （補正後に記入）|
| AC-4 | sub-task A/B/C state 整合 | （補正後に記入）|
| AC-5 | Task B phase-10 checkbox 未チェック 0 | （補正後に記入）|
| AC-6 | `jq .metadata.gates` Gate-A/B passed / Gate-C pending | （補正後に記入）|
| AC-7 | `rg` register / inventory 一致 | （補正後に記入）|
| AC-8 | `pnpm gate-metadata:validate` ERROR 0 | （補正後に記入）|

## Test plan
- [ ] `git status --porcelain apps/ packages/` が空（docs-only 保証）
- [ ] `mise exec -- pnpm gate-metadata:validate`（members-list-ux-clarity artifacts ERROR 0）
- [ ] `bash scripts/verify-pr-ready.sh`（docs-only gate / verify:phase12-compliance / indexes drift）
- [ ] `diff -u` で root ↔ outputs parity 0

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 注意

- commit / push / PR 作成 / staging visual baseline 取得は user-gated。
- issue #1008 の状態は CLOSED のまま変更しない。
- 本 PR は `apps/` / `packages/` に一切変更を含まない（含まれていたら docs-only 区分が崩れるため
  PR 作成前に `git status --porcelain apps/ packages/` が空であることを必ず確認する）。
- staging visual baseline（Gate-C 相当）は本 PR スコープ外。`pending` のまま user-gated で別途取得。
