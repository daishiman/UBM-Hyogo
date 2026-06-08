---
phase: 11
task_id: issue-1102-usedismissable-hook-extraction
visual_category: NON_VISUAL
status: completed
---

# Phase 11: 手動テスト結果（代替証跡）

## 11.0 NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | **NON_VISUAL**（挙動不変リファクタ） |
| 非視覚的理由 | dismiss 検知ロジック（外側 pointerdown / Escape 閉じ）を inline `useEffect` ×2（`SidebarUserMenu.tsx:34-58` / `DensityToggle.client.tsx:76-101`）から汎用 hook `useDismissable` 1 本へ抽出するのみ。DOM 構造・className・OKLch トークン・表示テキスト・アニメーション・`<details>` の開閉外形は一切変更しない。ユーザーが画面で見る/操作する結果は従来と完全に同一 |
| 代替証跡 | **自動テスト**。挙動不変は「既存 consumer spec 2 本が hook 化後も**無改修で全 PASS**」という機械的事実で証明する。加えて hook 単体 spec（`useDismissable.spec.tsx`）で抽出ロジックそのものを直接検証する |

> 視覚的変更がゼロであることが本タスクの定義そのものであるため、before/after スクリーンショットを撮っても差分は出ない。よって実スクリーンショットは作成しない（代替証跡=自動テスト）。

## 11.1 証跡メタ情報（[Feedback 4]）

| メタ項目 | 値 |
| --- | --- |
| 証跡の主ソース（自動テスト） | (1) `apps/web/src/hooks/__tests__/useDismissable.spec.tsx`（hook 単体・想定 7+ ケース） / (2) `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx`（dismiss 3 ケースの**無改修**回帰） / (3) `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx`（TC-4/5/6/7/10/13 の**無改修**回帰） |
| 自動テスト件数（想定） | hook 単体 7+ ケース + consumer 回帰 計 9 ケース（SidebarUserMenu 3 + DensityToggle 6）= **16+ ケース** |
| スクリーンショットを作らない理由 | NON_VISUAL（DOM/CSS/トークン/表示/可視挙動の変更ゼロ）のため、before/after に視覚差分が存在しない。`outputs/phase-11/` に画像は配置せず、PR 本文にもスクリーンショット専用セクションを設けない（CLAUDE.md PR フロー準拠） |
| 実行状況 | **implemented_local_evidence_captured**。実コード反映後に focused vitest を実行し、3 ファイル / 35 tests PASS を確認した |

## 11.2 証跡の主ソース詳細

### (1) hook 単体 spec `useDismissable.spec.tsx`（想定 7+ ケース）

抽出した dismiss 検知ロジックを直接検証する。確定 API（`useDismissable(ref, onClose, options?)` / `DismissReason = "pointerdown-outside" | "escape"`）に一致させる。

| # | ケース | 期待 |
| --- | --- | --- |
| H-1 | 外側 pointerdown | `onClose("pointerdown-outside")` が 1 回呼ばれる |
| H-2 | 内側 pointerdown（`ref.current.contains(target)` 真） | `onClose` を呼ばない |
| H-3 | Escape keydown | `onClose("escape")` が 1 回呼ばれる |
| H-4 | Escape 以外（Tab 等）の keydown | `onClose` を呼ばない |
| H-5 | `options.enabled === false` | listener を張らず `onClose` を呼ばない（no-op） |
| H-6 | unmount | `pointerdown` / `keydown` listener を全解除（以後イベントで `onClose` が呼ばれない=リークなし） |
| H-7 | `ref.current === null` | 外側 pointerdown でも throw せず `onClose` を呼ばない（early return） |
| H-8（任意） | SSR/Workers（`browserDocument()` undefined 相当） | 副作用なし・throw しない（I-5 no-op） |

### (2) `SidebarUserMenu.spec.tsx`（dismiss 3 ケース・無改修回帰）

hook 移行後も既存 spec を 1 行も変更せず全 PASS することで「挙動不変」を証明する。open 時の外側 pointerdown / Escape で閉じ、閉じているときは何もしない（`onClose` 内の open ガードで保持）。route 変更で閉じる責務別 `useEffect` は残置のためそのまま回帰する。

### (3) `DensityToggle.client.spec.tsx`（TC-4/5/6/7/10/13・無改修回帰）

| TC | 検証内容 | hook 化後の担保 |
| --- | --- | --- |
| TC-4 | Escape で閉じ、summary に focus 復帰 | `onClose(reason)` で `reason==="escape"` 時のみ `summary?.focus()` を実行 |
| TC-5 | 外側 pointerdown で閉じる（focus 復帰なし） | `onClose("pointerdown-outside")` は open=false のみ |
| TC-6 | 内側 pointerdown では閉じない | hook の `contains` ガード |
| TC-7 | （既存挙動の回帰） | 無改修パス |
| TC-10 | unmount で listener リークなし | hook の cleanup |
| TC-13 | Tab 等 Escape 以外では閉じない | hook の `key !== "Escape"` ガード |

## 11.3 source-level PASS と環境ブロッカー（[WEEKGRD-01]）

source-level（仕様・設計）の合格と、実行環境に起因するブロッカーを別カテゴリで記録する。

### A. local evidence PASS（本 wave で確定済み）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| hook API が確定し全テスト観点を表現可能 | PASS | `useDismissable.spec.tsx` 12 tests PASS |
| consumer 移行が既存 spec を無改修で通す | PASS | `SidebarUserMenu.spec.tsx` 8 tests / `DensityToggle.client.spec.tsx` 15 tests PASS。両 consumer spec は未編集 |
| I-2（`<details>.open` 単一所有・hook 非所有）維持 | PASS | hook は open を読み書きしない。consumer 側で `<details>.open` を命令的に閉じる既存方針を維持 |
| I-5（document アクセスは `browserDocument()` 経由のみ）維持 | PASS | consumer から `browserDocument` 直接 import を除去し、hook 内の `browserDocument()` 1 経路に集約 |
| HEX 直書きなし | PASS | 本タスクは色を一切扱わない（ロジック抽出のみ） |

### B. 実行結果

| 検証 | 結果 | 証跡 |
| --- | --- | --- |
| focused vitest | **PASS: 3 files / 35 tests** | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/hooks/__tests__/useDismissable.spec.tsx apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` |
| repo-wide typecheck / lint | **PASS** | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` |
| 既存 consumer spec 無改修 | **PASS** | `SidebarUserMenu.spec.tsx` / `DensityToggle.client.spec.tsx` は差分なし |
| jsdom 環境制約 | 既知制限 | 実ブラウザの pointer デバイス差・実フォーカスリング描画は jsdom で再現不可。ただし本タスクは挙動不変ゆえ新規リスク増なし |

## 11.4 実行した検証手順と結果

実コード反映後、以下を実行した。

| # | 検証 | コマンド | 期待 |
| --- | --- | --- | --- |
| 1 | focused vitest（hook + consumer 回帰） | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/hooks/__tests__/useDismissable.spec.tsx apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | **PASS: 3 ファイル / 35 tests** |
| 2 | 型チェック | `mise exec -- pnpm typecheck` | **PASS** |
| 3 | lint | `mise exec -- pnpm lint` | **PASS** |
| 4 | 既存 consumer spec 無改修確認 | `git diff --stat -- apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | 変更 0 行（挙動不変の証跡） |
| 5 | I-5 grep ガード | `rg "document.addEventListener" apps/web/src/components/shell/SidebarUserMenu.tsx apps/web/src/components/public/DensityToggle.client.tsx` | **PASS: 0 hit** |
| 6 | I-2 grep ガード | `rg "useState" apps/web/src/hooks/useDismissable.ts` | **PASS: 0 hit** |

## 11.5 既知制限リスト（実地操作の代替記録）

- jsdom 環境のため、実ブラウザでの pointer デバイス差・IME 状態・実フォーカスリングの見えは検証範囲外。本タスクは挙動不変ゆえ現行と同一制限であり、新規リスクは増えない。
- CSS sticky / overflow など視覚レイヤーは本タスクで未変更のため検証対象外。
- SSR / Cloudflare Workers での no-op 挙動（`browserDocument() === undefined`）は hook 単体 spec の enabled/no-op 検証（H-5 / H-8）で代替し、実 Workers ランタイム実行はしない。
- `reason` は `"pointerdown-outside"` / `"escape"` の 2 値のみ（YAGNI）。blur / route 変更等の追加理由は現行 consumer に需要がなく対象外（Phase 10 §10.3 M-2）。

## 11.6 実証跡の所在

本ファイルが Phase 11 の代替証跡（自動テストによる挙動不変の証明計画）の正本である。
focused vitest / typecheck / lint / grep gate の PASS 出力を本ファイルの主証跡とする。PR 本文（phase-13-pr.md 準拠）にも反映する。
手動テストの方針・宣言は workflow root 直下の `phase-11-manual-test.md` を参照。
