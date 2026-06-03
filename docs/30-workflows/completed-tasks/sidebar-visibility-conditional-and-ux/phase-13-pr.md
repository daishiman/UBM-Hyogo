# Phase 13: commit / PR / release

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| 状態 | **user-gated（未実行）** |
| ブランチ | `docs/sidebar-visibility-conditional-and-ux-spec` |

## 目的

本ワークフローは **implemented_local_evidence_captured** として実コード・direct focused tests・typecheck・lint・local screenshot 4 PNG まで完了している。
commit・push・PR 作成は **本プロンプトの責務外** であり、ユーザーの明示承認後に実施する（CONST_002 / CONST_006）。

## 前提（PR 前に満たすべきゲート）

PR 作成前に以下を満たすこと:

1. `mise exec -- pnpm install --force`
2. `mise exec -- pnpm typecheck`
3. `mise exec -- pnpm lint`
4. `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts "apps/web/app/(auth)" "apps/web/src/components/shell" "apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts" "apps/web/src/__tests__/static-invariants.runtime.spec.ts" "apps/web/__tests__/middleware.spec.ts"`
5. `bash scripts/verify-pr-ready.sh`
6. HEX 直書き 0（`git grep -nE "#[0-9a-fA-F]{3,6}" -- apps/web/src apps/web/app` で新規 0）
7. `/login` DOM に shell（`data-testid="public-shell"` / `aside`）が無いことを invariant test で確認

## PR 方針

- base ブランチ: `dev`（CLAUDE.md PR フロー既定）
- title 例: `feat(sidebar): ログイン画面を shell 外 bare 化し全ルートのサイドバー表示条件を正本化`
- 本文: `outputs/phase-12/implementation-guide.md` の Part 1/Part 2 を反映。VISUAL 証跡は staging 認証下に user-gated 取得。

## 本サイクルで実施しないこと（CONST_002）

- git commit / git push / PR 作成 / pixel screenshot 取得 / Issue 起票（すべて user-gated）。

## 参照資料

- `outputs/phase-12/implementation-guide.md`
- CLAUDE.md「PR作成の完全自律フロー」
- `.claude/commands/ai/diff-to-pr.md`

## 完了条件

- [x] commit/PR/push が user-gated であることを明記した
- [x] PR 前ゲートを列挙した
- [x] base=dev / title / 本文方針を記録した
