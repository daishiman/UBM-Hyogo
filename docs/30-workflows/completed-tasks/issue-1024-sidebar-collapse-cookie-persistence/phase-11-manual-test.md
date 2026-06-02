# Phase 11: 手動テスト / Evidence

> issue-1024 — sidebar collapse 状態の cookie 永続化（SSR seed + lint 回避ハック撤廃）
> GitHub Issue #1024 は **CLOSED のまま現行コードへ再スコープ**して作成（reopen しない）。

## NON_VISUAL 宣言

- **タスク種別 = NON_VISUAL**
- **非視覚的理由**: 新規 UI surface（画面・コンポーネント見た目）を追加しない。変更は collapse 状態の **seed / 永続化 mechanism**（localStorage → cookie + SSR seed）のみで、レンダリング結果のレイアウト・配色・寸法は不変。「初回ちらつき排除」は視覚回帰ではなく state seed の同値化によって達成され、screenshot 比較ではなく SSR HTML 属性値の検査で証明する。
- **代替証跡**: focused vitest log（`apps/web/src/components/shell` スコープ）+ SSR HTML seed inspection（`view-source` の `data-shell-collapsed` 値）。スクリーンショットは作成しない。

## 11.1 実行前提（gate）

手動 browser smoke は commit/PR 前の外部操作に近い確認のため user-gated とし、本サイクルでは focused Vitest / web lint(typecheck 含む) / grep gate を実行済み。
前提条件:

- `pnpm typecheck` / `pnpm lint` が green。
- `pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/shell` が全 pass。
- dev サーバが起動可能（shell 配下 route が描画される）。

## 11.2 手動 smoke 手順（user 承認後に実走）

1. **永続化の確認**
   - shell 配下の画面（例: `/profile`）を開く。
   - sidebar collapse toggle を押して collapsed にする。
   - ブラウザをリロードする → **collapsed 状態が維持**されることを確認。
   - 再度 toggle して expanded にしリロード → **expanded が維持**されることを確認。
2. **cookie の確認**
   - DevTools コンソールで `document.cookie` を評価 → `ubm_shell_collapsed=true`（または `false`）が含まれることを確認。
   - Application タブ → Cookies で `path=/` / `SameSite=Lax` / `max-age` 付きを確認（`httpOnly` が付いていない＝client から読めることを確認）。
3. **SSR seed / ちらつき排除の確認**
   - collapsed 状態でリロードし、ページ表示の瞬間に sidebar 幅が expanded → collapsed へ切り替わる**ちらつきが起きないこと**を目視確認。
   - `view-source:<URL>`（または DevTools の "View page source"）で初回 HTML を開き、`data-shell-collapsed` の値が cookie と一致していることを確認。
   - console に React hydration mismatch warning が出ないことを確認。
4. **lint 回避ハック撤廃の確認**
   - `useSidebarState.ts` に `localStorage` / `sessionStorage` / `"local" + "Storage"` が存在しないことを確認（`grep`）。

## 11.3 実行記録

> browser / DevTools を伴う smoke は user 承認後に実走する。local automated evidence は本サイクルで取得済み。

| 項目 | 結果 | 備考 |
|------|------|------|
| 永続化（collapsed 維持） | NOT EXECUTED | |
| 永続化（expanded 維持） | NOT EXECUTED | |
| `document.cookie` に `ubm_shell_collapsed` | NOT EXECUTED | |
| cookie 属性（path=/ / SameSite=Lax / max-age / not httpOnly） | NOT EXECUTED | |
| ちらつき排除（目視） | NOT EXECUTED | |
| SSR HTML `data-shell-collapsed` 一致 | NOT EXECUTED | |
| hydration mismatch warning なし | NOT EXECUTED | |
| `useSidebarState.ts` localStorage 0 件 | PASS | grep 0 hits |
| focused vitest 全 pass | PASS | 3 files / 15 tests PASS |
| web lint / typecheck | PASS | `pnpm --filter @ubm-hyogo/web lint` exit 0 |

主証跡: focused vitest log + web lint(typecheck 含む) + grep gate。screenshot は NON_VISUAL のため作成しない。
