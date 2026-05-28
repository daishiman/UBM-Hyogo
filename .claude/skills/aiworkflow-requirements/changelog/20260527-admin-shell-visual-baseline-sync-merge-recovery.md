# 2026-05-27 admin-shell-topbar-sidebar-integration: dev sync-merge + visual baseline 更新漏れの post-merge CI fail 復旧

## 文脈

- ブランチ: `feat/admin-shell-topbar-sidebar-integration` (Task A: admin shell topbar/sidebar 統合)
- 操作: `dev` 同期 → `dev` を本ブランチへ merge → push
- skill 系 4 ファイル (`aiworkflow-requirements/indexes/quick-reference.md` / `topic-map.md` / `references/task-workflow-active.md` / `task-specification-creator/references/patterns-lessons-and-pitfalls.md`) で content conflict、`pnpm sync:resolve` (union resolver) で機械解消し commit
- typecheck / lint green、push 成功
- post-push CI: `playwright-smoke / visual (chromium, 4 screens)` のみ fail
  - 原因: `playwright/tests/visual/admin-dashboard.spec.ts` の `admin-dashboard-visual-chromium-linux.png` baseline (1374x865) と Task A shell 統合後の実描画 (1458x1031) の寸法 drift、5% pixel diff
  - これは sync-merge の責任ではなく **Task A 実装 commit 時点での baseline 同期漏れ** が遅延発火しただけ

## 対応

1. `gh run download <run_id> --name playwright-visual-artifacts --dir <tmp>` で失敗 CI artifact の `*-actual.png` を取得
2. `cp <tmp>/visual-admin-dashboard-.../admin-dashboard-actual.png apps/web/playwright/tests/visual/admin-dashboard.spec.ts-snapshots/admin-dashboard-visual-chromium-linux.png` で Linux baseline を上書き
3. 同 commit で push し CI 再走

## skill への反映

- `task-specification-creator/references/patterns-lessons-and-pitfalls.md` 末尾に **L-DEVSYNC-052 shell 変更を伴う feature 実装での visual baseline 更新漏れ** を追加（L-DEVSYNC-052-A/B/C + anti-pattern 3 件）
- L-DEVSYNC-051 (sync 時 ours 採用) と L-DEVSYNC-052 (実装時 baseline 必達) は補完関係: 前者は merge 解消ルール、後者は実装 commit 時の必達ルール
- 正規復旧コマンド列を L-DEVSYNC-052-B に一行で記録（CI artifact → repo baseline の `cp` 経路）

## 検証

- `pnpm typecheck` / `pnpm lint` green（sync-merge 後・baseline 更新後とも）
- `git status --porcelain` clean
- 全変更包含: フェーズ2開始時 `N_BEFORE=0` （ローカル変更なし、merge コミット + baseline 上書き 1 件のみ）
