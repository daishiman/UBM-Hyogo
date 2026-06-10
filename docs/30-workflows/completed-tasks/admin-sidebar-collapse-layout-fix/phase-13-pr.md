# Phase 13: commit / PR / release

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- workflow_state: `implemented_local_evidence_captured` → Phase 13 は `pending_user_approval`
- 本 Phase の状態: **BLOCKED（pending_user_approval）**
  - 前提: 実装・focused vitest・local screenshot は取得済み。commit / push / PR / staging visual baseline はユーザー承認後に行う。

## 目的

実装完了後に commit / push / PR を作成し、`dev` ブランチへ変更を統合する。
本 Phase は **user 明示承認後にのみ実行**する。本サイクルでは commit / push / PR / staging いずれも **未実行**。

## ブロック理由

apps/web の sidebar shell コンポーネント修正・focused vitest・local screenshot は完了済みである。
以下の user-gated 条件が揃うまで Phase 13 の外部操作を禁止する:

| 前提条件 | 状態 |
| --- | --- |
| AC-1..AC-8 実装完了（apps/web の shell コンポーネント className 修正・テスト） | present |
| focused vitest が green | present |
| `pnpm typecheck && pnpm lint && pnpm verify:tokens` が green | present |
| `git diff --name-only apps/api` が空（AC-8） | present |
| Phase 11 pixel screenshot 取得済み（staging 認証済み） | pending（user-gated） |
| Phase 12 strict 7 実体確認済み | present（本 Phase 12 で完成） |

## user-gated 操作一覧

以下の操作は **すべてユーザーの明示承認が必要**。Claude Code が自律的に実行しない。本サイクルでは未実行。

| 操作 | ゲート種別 |
| --- | --- |
| `git add` / `git commit` | user-gated（未実行） |
| `git push origin feat/admin-sidebar-collapse-layout-fix` | user-gated（未実行） |
| `gh pr create --base dev ...` | user-gated（未実行） |
| staging 視覚確認・pixel screenshot 取得 | user-gated（未実行） |

## 実行順序（承認後）

1. **ローカル品質確認**（全 green を確認してから commit）
   ```bash
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   mise exec -- pnpm verify:tokens
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/web/src/components/shell/__tests__
   git diff --name-only -- apps/api  # 空であること（AC-8）
   ```

2. **コミット粒度**

   | # | 粒度 | 含むファイル例 |
   | --- | --- | --- |
   | 1 | spec（仕様書本体） | `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/phase-*.md` / `index.md` / `_shared-context.md` |
   | 2 | outputs（Phase 12 strict 7） | `outputs/phase-12/*.md` / `outputs/phase-11/*` |
   | 3 | impl（apps/web shell 実装） | `apps/web/src/components/shell/SidebarNavItem.tsx` / `SidebarUserMenu.tsx` / `SidebarBrand.tsx` / `SidebarNavGroup.tsx` / `SidebarShell.tsx` |
   | 4 | test（shell spec 更新） | `apps/web/src/components/shell/__tests__/{SidebarNavItem,SidebarUserMenu,SidebarShell}.spec.tsx` |
   | 5 | Phase 11 visual evidence | `outputs/phase-11/screenshots/*.png` / `outputs/phase-11/manual-test-result.md` |

3. **PR 作成**（base = `dev`）

   ```bash
   gh pr create \
     --base dev \
     --title "fix(web): サイドバー collapsed 時のはみ出し・中央軸ズレを是正（shell layout）" \
     --body "$(cat <<'EOF'
   ## Summary

   - collapsed 時に各行（brand / nav-item / user-menu / admin-return）の水平パディング `px-3` を除去し `w-full justify-center px-0` で中央寄せ（AC-1）
   - icon(18px) / brand mark(32px) / avatar(36px) を共通 40px 角枠で中央配置し collapsed 幅(64px) 内に収め、はみ出しを解消（AC-2）
   - 全行のアイコン水平中心を aside 縦中心線に一致させ、footer の collapse-toggle と軸を揃える（AC-3）
   - `SidebarBrand` に collapsed 分岐を新設（従来は分岐なし）（AC-1/AC-2/AC-3）
   - collapsed のアクティブ nav-item 左ボーダー（`border-l-2` active 表現）を維持（AC-4）
   - expanded のレイアウト regression なし（AC-5）、collapsed の displayName/role の sr-only 可視性維持（AC-6）
   - 色は `var(--ubm-color-*)` 経由のみ・HEX/`bg-[#xxx]` 新規追加なし（AC-7）
   - `apps/api` / D1 migration / Google Form schema / endpoint 無変更（AC-8）

   ## 変更ファイル

   - `apps/web/src/components/shell/SidebarNavItem.tsx`
   - `apps/web/src/components/shell/SidebarUserMenu.tsx`
   - `apps/web/src/components/shell/SidebarBrand.tsx`
   - `apps/web/src/components/shell/SidebarShell.tsx`（AdminPublicReturn）
   - `apps/web/src/components/shell/SidebarNavGroup.tsx`
   - `apps/web/src/components/shell/__tests__/{SidebarNavItem,SidebarUserMenu,SidebarShell}.spec.tsx`

   ## スクリーンショット

   local Playwright screenshot 3 件は `outputs/phase-11/screenshots/` に取得済み。
   staging 認証済み baseline は **user-gated**。

   ## 参照

   - task_id: `admin-sidebar-collapse-layout-fix`
   - 実装仕様: `docs/30-workflows/completed-tasks/admin-sidebar-collapse-layout-fix/`
   - 共有設計コンテキスト: `_shared-context.md`
   EOF
   )"
   ```

## 完了条件

- `gh pr create` が成功し PR URL が取得できること。
- PR CI（typecheck / lint / verify-design-tokens / verify-test-suffix）が green であること。
- `outputs/phase-13/pr-info.md` に PR URL / CI 結果 / commit SHA を記録すること。
- `outputs/phase-13/pr-creation-result.md` に実行ログを記録すること。

## 参照資料

| 種別 | Path |
| --- | --- |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 11 手動テスト計画 | `phase-11-manual-test.md` |
| artifacts | `artifacts.json` |
