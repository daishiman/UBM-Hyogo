---
phase: 11
name: 手動テスト
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 11: 手動テスト

## 11.1 NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | **NON_VISUAL** |
| 非視覚的理由 | 挙動不変リファクタ。dismiss 検知ロジックを inline `useEffect` ×2 から hook 1 本へ抽出するのみで、DOM 構造・CSS・トークン・表示・ユーザー可視挙動は一切変更しない。`<details>` の開閉外形・Escape 閉じ・summary focus 復帰はすべて従来通り |
| 代替証跡 | 自動テスト（hook 単体 spec `useDismissable.spec.tsx` + 既存 consumer 回帰 spec 2 本の**無改修**パス）。挙動不変は「既存 spec が hook 化後も緑」で機械的に証明する |

## 11.2 実地操作不可の明記（[Feedback BEFORE-QUIT-001]）

NON_VISUAL タスクのため、ブラウザでの実地操作・目視確認は行わない。
表示・レイアウト・色の変化がゼロであることが本タスクの定義そのものであり、
実地操作で確認すべき視覚的差分が存在しない。
代替記録として、下記 §11.4 の自動テスト結果と §11.5 の既知制限リストをもって手動テストに代える。

## 11.3 スクリーンショット不要の根拠

- 視覚的変更ゼロ（NON_VISUAL）のため、before/after スクリーンショットに差が出ない。
- `outputs/phase-11/` にスクリーンショット画像は配置しない。PR 本文にもスクリーンショット専用セクションを設けない（CLAUDE.md PR フロー準拠）。
- 挙動の証跡は自動テスト（vitest）が担う。

## 11.4 実施した検証手順（コマンドと結果）

実コード反映後、以下を実行した。focused vitest / typecheck / lint はすべて PASS。

| # | 検証 | コマンド | 期待 |
| --- | --- | --- | --- |
| 1 | focused vitest（hook + consumer 回帰） | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/hooks/__tests__/useDismissable.spec.tsx apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | **PASS: 3 ファイル / 35 tests** |
| 2 | 型チェック | `mise exec -- pnpm typecheck` | **PASS** |
| 3 | lint | `mise exec -- pnpm lint` | **PASS** |
| 4 | 既存 spec 無改修確認 | `git diff --stat -- apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | 変更 0 行 |

検証する挙動（自動テストでカバー）:
- SidebarUserMenu: open 時の外側 pointerdown / Escape で閉じる。閉じているときは何もしない。route 変更で閉じる（責務別 useEffect 残置）。
- DensityToggle: open 時の外側 pointerdown / Escape で閉じる。Escape のときのみ summary に focus 復帰。
- hook 単体: 内側 pointerdown は無視 / `enabled:false` で no-op / unmount で listener 解除。

## 11.5 既知制限リスト（実地操作の代替記録）

- jsdom 環境のため、実ブラウザでの pointer デバイス差・IME 状態・実際のフォーカスリングの見えは検証範囲外。ただし本タスクは挙動不変ゆえ、現行と同一の制限であり新規リスクは増えない。
- CSS sticky / overflow など視覚レイヤーは本タスクで未変更のため検証対象外。
- SSR / Cloudflare Workers での no-op 挙動（`browserDocument()===undefined`）は hook 単体 spec の enabled/no-op 検証で代替（実 Workers ランタイム実行はしない）。

## 11.6 実証跡の所在

本ファイルは手動テストの**方針・宣言**を定義する spec である。
実行結果は `outputs/phase-11/manual-test-result.md` に記録する。実証跡はそちらを参照すること。
