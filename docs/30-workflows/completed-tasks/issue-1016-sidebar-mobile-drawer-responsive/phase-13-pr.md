# Phase 13 — PR 作成（user-gated）

## 0. 前提

- **PR 作成は user の明示承認後のみ実施**（CONST_002）。本仕様書段階では `gh pr create` を**自動実行しない**。
- 本サイクルは **spec のみ**。実コード（`apps/web/src/components/shell/*`）の実装は**後続サイクル**で行う。
- そのため PR は **spec PR と実装 PR を分ける**想定:
  - **spec PR**（本 Phase）: `docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/` 配下の `.md` のみ。docs-only。
  - **実装 PR**（後続）: `apps/web/src/components/shell/*` の新規 2 + 編集 2 + spec 4 ファイル。本 spec を実装ガイドとして参照。

## 1. ブランチ / base

| 項目 | 値 |
|------|-----|
| PR base | `dev`（production リリースではないため `--base dev`） |
| ブランチ | `docs/issue-1016-sidebar-mobile-drawer-responsive-spec`（dev 起点） |
| Issue | [#1016](https://github.com/daishiman/UBM-Hyogo/issues/1016) **CLOSED 維持・Refs 運用**（close しない。本文に `Refs #1016`） |

## 2. PR 作成手順（user 承認後）

```bash
git fetch origin dev
git checkout docs/issue-1016-sidebar-mobile-drawer-responsive-spec
git merge origin/dev    # conflict は CLAUDE.md 既定方針で解消
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
git add -A
git status --porcelain          # 残差なし確認
git diff dev...HEAD --name-only  # PR 対象ファイル一覧
```

## 3. PR 本文ドラフト

`.claude/commands/ai/diff-to-pr.md` を Phase 13 仕様として参照する。

### title 候補（spec PR）

`docs(shell): Issue #1016 mobile drawer responsive 実装仕様書（Task E spec）`

### body 骨子（spec PR）

```
## Summary
Unified Sidebar Shell Task E（mobile drawer responsive）の実装仕様書（Phase 1-13）を追加。
本 PR は spec のみで apps/ コード変更は含まない（実装は後続 PR で分離）。

設計骨子:
- 新規 SidebarMobileTrigger（hamburger・md:hidden・aria-controls=shell-drawer）
- 新規 SidebarDrawer（role=dialog / aria-modal / Esc / backdrop / scroll lock / initial focus）
- useSidebarState 編集（usePathname で route auto-close / matchMedia md 初期 collapsed）
- SidebarShell 編集（drawer mount + mobile strip に trigger 配置）
- M-1 解消: drawer/aside 固有要素差を比較し、helper 抽出は不採用（Phase 8）

Refs #1016（CLOSED 維持・Refs 運用。本 PR では close しない）
親 workflow: docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/

## 変更ファイル一覧（spec PR）
- docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/index.md
- docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/phase-01..13-*.md
- docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/artifacts.json
- docs/30-workflows/completed-tasks/issue-1016-sidebar-mobile-drawer-responsive/outputs/phase-11/manual-test-result.md
（apps/ への変更なし）

## 受入条件（PR 前確認）
- [ ] AC-1..AC-9 の focused evidence（Phase 10 final-review 参照）
- [ ] AC-10 screenshot evidence（user-gated visual）

## Screenshot
implemented_local_runtime_pending のため screenshot は pending（PR 前 visual gate で 4 枚添付予定:
shell-drawer-mobile-closed / -open / shell-sidebar-tablet-collapsed / -desktop-expanded）。
本 spec PR にはスクリーンショット専用セクションを含めない。

## Test plan（spec PR）
- [ ] typecheck / lint pass（docs-only のため apps 影響なし）
- [ ] bash scripts/verify-pr-ready.sh pass
```

> spec PR は docs-only のため Phase 11 screenshot は存在しない。`outputs/phase-11/screenshots/` に PNG が無い限り、PR 本文にスクリーンショット参照行を作らない。

### 実装 PR（後続・参考骨子）

実装 PR は本 spec を guide として作成し、以下を含む:

```
## Summary
Issue #1016 Task E mobile drawer responsive を実装。

変更ファイル:
- apps/web/src/components/shell/SidebarMobileTrigger.tsx（新規）
- apps/web/src/components/shell/SidebarDrawer.tsx（新規）
- apps/web/src/components/shell/useSidebarState.ts（編集）
- apps/web/src/components/shell/SidebarShell.tsx（編集 + mobile trigger strip / drawer mount）
- apps/web/src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx（新規）
- apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx（新規）
- apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx（拡張）

Refs #1016

## Test plan
- [ ] targeted vitest 4 spec green
- [ ] typecheck / lint / verify-design-tokens pass
- [ ] HEX grep 0 行 / INV-3 grep 境界経由のみ
- [ ] Phase 11 screenshots 4 枚添付（375/768/1280px）
```

## 4. PR 作成コマンド（user 承認後）

```bash
gh pr create --base dev \
  --title "docs(shell): Issue #1016 mobile drawer responsive 実装仕様書（Task E spec）" \
  --body-file <(...)   # 上記 body 骨子
```

`--base main` は使わない（production リリースのみ）。

## 5. 完了条件

- [ ] PR 作成は user 明示承認後のみと明記（自動実行禁止）
- [ ] base=`dev` / branch=`docs/issue-1016-sidebar-mobile-drawer-responsive-spec` を確定
- [ ] Issue #1016 は CLOSED 維持・`Refs #1016`（close しない）
- [ ] PR 本文骨子（変更ファイル一覧 / 受入条件 / screenshot 参照 / テスト結果）を確定
- [ ] spec PR と実装 PR を分ける想定を明記（本サイクルは spec のみ）
