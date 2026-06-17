# Phase 13: commit / PR / release

## メタ情報

- task_id: `responsive-mobile-tablet-ui-fixes`
- workflow_state: `implemented_local_visual_present_staging_pending` → Phase 13 は `pending_user_approval`
- 本 Phase の状態: **BLOCKED（pending_user_approval）**
  - 前提: `apps/web` ローカル実装・focused test・local runtime smoke は完了。commit / push / PR / authenticated staging baseline は user-gated。

## 目的

ローカル実装完了後に commit / push / PR を作成し、`dev` ブランチへ変更を統合する。
本 Phase は **user 明示承認後にのみ実行**する。PR base は `dev`（production リリース時のみ `dev → main`）。

## ブロック理由

本 workflow は `implemented_local_visual_present_staging_pending` であり、`apps/web` の CSS / breakpoint / レイアウト component の実コードと local PNG 証跡はローカル実装済みである。
以下の条件がすべて揃うまで Phase 13 の実行を禁止する:

| 前提条件 | 状態 |
| --- | --- |
| AC-1..AC-10 ローカル実装（apps/web の CSS / breakpoint / レイアウト component / テスト） | done（local evidence captured） |
| focused vitest が green（SidebarDrawer 等の構造 spec） | done（5 tests PASS） |
| `pnpm typecheck && pnpm lint && pnpm verify:tokens` が green | done（exit 0 / 9 token tests PASS） |
| `git diff --name-only apps/api` が空（AC-9） | done（空） |
| local runtime smoke | done（4 viewport checks overflow false） |
| authenticated staging visual baseline（mobile 375 / tablet 768・AC-10） | pending_user_approval |
| Phase 12 strict 7 実体確認済み | present（本 Phase 12 で完成） |

## user-gated 操作一覧

以下の操作は **すべてユーザーの明示承認が必要**。Claude Code が自律的に実行しない。

| 操作 | ゲート種別 |
| --- | --- |
| `git add` / `git commit` | user-gated |
| `git push origin feat/responsive-mobile-tablet-ui-fixes` | user-gated |
| `gh pr create --base dev ...` | user-gated |
| staging 視覚確認・pixel screenshot 取得・Playwright visual baseline 更新 | user-gated |

## 実行順序（承認後）

1. **ローカル品質確認の再実行**（全 green を確認してから commit）
   ```bash
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   mise exec -- pnpm verify:tokens
   mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
     apps/web/src/components/shell/__tests__
   mise exec -- pnpm exec playwright test \
     apps/web/playwright/tests/visual-full/full-visual.spec.ts
   git diff --name-only -- apps/api  # 空であること（AC-9）
   ```

2. **コミット粒度**（5 単位）

   | # | 粒度 | 含むファイル例 |
   | --- | --- | --- |
   | 1 | spec（仕様書本体） | `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/phase-*.md` / `index.md` / `shared-context.md` |
   | 2 | outputs（Phase 12 strict 7） | `outputs/phase-12/*.md` / `outputs/artifacts.json` |
   | 3 | impl（apps/web 表現層実装） | `apps/web/src/styles/{tokens,globals,legacy-public,auth}.css` / `apps/web/src/components/shell/SidebarDrawer.tsx` |
   | 4 | test（visual + 構造 spec） | `apps/web/playwright/tests/visual-full/full-visual.spec.ts` / `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx` |
   | 5 | Phase 11 visual evidence | `outputs/phase-11/screenshots/*.png` / `outputs/phase-11/manual-test-result.md` |

3. **PR 作成**

   ```bash
   gh pr create \
     --base dev \
     --title "fix(web): 全 19 ルートの携帯・タブレット UI/UX 是正（崩れ・はみ出し・隠れ）" \
     --body "$(cat <<'EOF'
   ## Summary

   - 共通ブレークポイント体系（base / md768 / lg1024 / xl1280）を `tokens.css` に固定し、`globals.css` の `max-width: 767/768/900/1024px` 混在境界を統一（AC-1）
   - 公開層 6 ルートを mobile(375)/tablet(768) で横スクロール・はみ出し・隠れなしへ（AC-2）
   - 会員層 2 ルート（login/profile）の崩れを是正（AC-3）
   - 管理層 8 ルートのテーブル/グリッド/サイドバー崩れ・要素の画面外隠れを是正（AC-4）
   - 共通 3 画面（error/not-found/loading）の中央表示を 375/768 で維持（AC-5）
   - `minmax(Nrem,…)` を `minmax(0,…)` + `lg` 未満単カラムへ流体化（AC-6）
   - 管理テーブルに mobile カードフォールバック / sticky min-width 横スクロールを付与（AC-7）
   - drawer/popover/tooltip をビューポート内に収納（`min(17rem,88vw)` / `max-width: min(...)`）（AC-8）
   - 色はすべて `var(--ubm-color-*)` 経由のみ・`apps/api` 無変更（AC-9）
   - Playwright visual baseline（mobile 375 / tablet 768）を 19 ルート相当でグリーン（AC-10）

   ## 変更ファイル（apps/web 表現層のみ）

   - `apps/web/src/styles/tokens.css`（`--bp-md/lg/xl` 追加・規約コメント）
   - `apps/web/src/styles/globals.css`（メディアクエリ境界統一・grid 流体化・テーブル・オーバーレイ）
   - `apps/web/src/styles/legacy-public.css`（main 幅 clamp・stat-card/hero grid 流体化）
   - `apps/web/src/styles/auth.css`（auth-card 狭幅 padding）
   - `apps/web/src/components/shell/SidebarDrawer.tsx`（drawer 幅 `min(17rem,88vw)`）
   - `apps/web/playwright/tests/visual-full/full-visual.spec.ts`（横スクロール 0 guard 追加）
   - `apps/web/src/components/shell/__tests__/SidebarDrawer.spec.tsx`（新規/編集）

   ## スクリーンショット

   pixel screenshot は local fixture（mobile/tablet）取得後、staging 認証済み環境で baseline を取得する（**user-gated**）。
   取得後に `outputs/phase-11/screenshots/` に追記し PR に参照を含める。

   ## 参照

   - task_id: `responsive-mobile-tablet-ui-fixes`
   - 実装仕様: `docs/30-workflows/completed-tasks/responsive-mobile-tablet-ui-fixes/`
   EOF
   )"
   ```

## 完了条件

- `gh pr create` が成功し PR URL が取得できること
- PR CI（typecheck / lint / verify-design-tokens / verify-test-suffix / playwright-smoke）が green であること
- `outputs/phase-13/pr-info.md` に PR URL / CI 結果 / commit SHA を記録すること
- `outputs/phase-13/pr-creation-result.md` に実行ログを記録すること

## 参照資料

| 種別 | Path |
| --- | --- |
| 実装ガイド | `outputs/phase-12/implementation-guide.md` |
| compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| Phase 11 手動テスト計画 | `phase-11-manual-test.md` |
| artifacts | `artifacts.json` |
