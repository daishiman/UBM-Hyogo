---
phase: 1
name: 要件定義
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 1: 要件定義

## 1.1 タスク分類（[Feedback 1] / [Feedback 3]）

| 項目 | 値 |
| --- | --- |
| タスク種別 | **UI task（コンポーネント実装を含む refactor）** |
| 視覚分類 | **NON_VISUAL**（挙動不変・DOM 構造/CSS 不変・画面の見た目は一切変わらない） |
| implementation_mode | **new**（新規 hook ファイルを RED/GREEN で追加するため。既存 consumer は置換） |
| spec_classification | implementation_spec |
| issue | #1102（CLOSED 維持） |

> **NON_VISUAL 判定根拠**: 本タスクは inline dismiss ロジックを hook へ移植する behavior-preserving refactor。レンダリング結果（DOM / className / 表示テキスト / アニメーション）は一切変更しない。Phase 11 は実スクリーンショット不要で、自動テスト（hook 単体 + 2 consumer 回帰）を主証跡とする。

## 1.2 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | **No**（`rg useDismissable apps/web` 0 件） | 通常の実装 Phase（RED/GREEN）とする |
| upstream（dev/main）にマージ済み | **No**（hook 自体が未作成） | 未マージとして扱う |
| 前提タスク（依存タスク）が完了済み | **Yes**（親 `sidebar-footer-pinning-and-account-popover-ux` は completed-tasks 済・SidebarUserMenu の dismiss ロジック landed 済） | 依存解消は不要 |

`implementation_mode: "new"`。Phase 4 = RED テスト設計、Phase 5 = GREEN 実装 + 2 consumer 移行。

## 1.3 調査結果（issue が古いかの検証 + 別タスク解決有無）

2026-06-06 時点の現行コード（`docs/issue-1102-...-spec` ブランチ・origin/dev 取り込み済）で以下を確認した。

| 検証 | コマンド/対象 | 結果 |
| --- | --- | --- |
| hook 既存有無（調査時点） | `rg "useDismissable" apps/web/src apps/web/app` | **0 件**（開始時点では未実装＝別タスクで未解決。本サイクルで実装済） |
| consumer 1 | `apps/web/src/components/shell/SidebarUserMenu.tsx` | L34-58 に inline dismiss `useEffect`（pointerdown 外側 + keydown Escape）が現存 |
| consumer 2 | `apps/web/src/components/public/DensityToggle.client.tsx` | L76-101 に inline dismiss `useEffect`（pointerdown 外側 + keydown Escape + summary focus 復帰）が現存 |
| 配置先候補 | `apps/web/src/hooks/` | 既存 `useImeSafeInput.ts` あり（cross-feature hook の正規配置先） |

**結論**: issue は陳腐化していない（記述された inline dismiss ロジックは現存）。むしろ起票時の前提「rule of three 未到達（1 箇所のみ）」が**現時点で変化**し、2 箇所目（DensityToggle）が出現してトリガーが成立した。よって issue は「不要」ではなく「着手可能になった」。

## 1.4 issue 最適化（現行コードへの再スコープ）

| issue/unassigned-task の記述 | 現行コードの実態 | 再スコープ |
| --- | --- | --- |
| 「着手トリガー = 2 つ目の dismissable popover が必要になった時点」 | DensityToggle が既に同種ロジックを重複保持 → トリガー成立済 | 着手する |
| 「本タスクは抽出 + 既存 1 箇所（SidebarUserMenu）の置換まで。2 箇所目の適用は適用先タスクの責務（スコープ外）」 | 2 箇所目（DensityToggle）が既に重複コードとして存在。SidebarUserMenu 単独移行では DensityToggle の重複が残り根本問題（DRY 違反）が未解決のまま | **両 consumer を移行**して 1 サイクルで DRY を根絶（CONST_005: 先送り禁止） |
| hook 配置 = `components/shell/` または `hooks/` | consumer が `shell/`（SidebarUserMenu）と `public/`（DensityToggle）に跨る | cross-feature 配置 `apps/web/src/hooks/useDismissable.ts` に確定 |
| `useDismissable(ref, onClose, options?)` | DensityToggle は Escape のみ summary focus 復帰・pointerdown 外側は focus 復帰なし（挙動差あり） | `onClose(reason)` に dismiss 理由を渡し、呼び出し側で分岐できる API に最適化 |

> **CONST_005 適合の明示**: 両 consumer 移行を 1 サイクルに含めるのは「分量が多い」からではなく、根本問題（重複コードの DRY 違反）を完全解消するため。SidebarUserMenu のみ移行して DensityToggle を「別タスク」に切り出すと、それは「先送り」であり CONST_005 に反する。両移行とも小規模（各 inline `useEffect` 約 25 行 → hook 呼び出し数行）で 1 PR・1 サイクルに収まる。

## 1.5 既存コードの命名規則分析（[FB-01] / [FB-SDK-07-4]）

| 種別 | 既存規則 | 本タスクの採用 |
| --- | --- | --- |
| hook ファイル名 | `useImeSafeInput.ts` / `useFocusTrap.ts` / `useSidebarState.ts`（camelCase + `use` prefix・拡張子 `.ts`） | `useDismissable.ts` |
| hook spec | `__tests__/useFocusTrap.spec.tsx`（`*.spec.tsx`・CLAUDE.md invariant #8） | `__tests__/useDismissable.spec.tsx` |
| browser API getter | `browserDocument()` / `browserWindow()`（`lib/is-browser.ts`） | `browserDocument()` を hook 内部で使用 |
| 型 export | named export（`UseDismissableOptions` 等） | named export |

新規 hook は既存 `apps/web/src/hooks/` 配下の命名・export 規則に一致させる。新規 primitive は生やさない（既存 `browserDocument` を再利用）。

## 1.6 受入条件（AC）

| ID | 受入条件 |
| --- | --- |
| AC-1 | `useDismissable` が外側 pointerdown で `onClose("pointerdown-outside")` を呼ぶ |
| AC-2 | 内側 pointerdown（`ref.current.contains(target)` 真）では `onClose` を呼ばない |
| AC-3 | Escape キーで `onClose("escape")` を呼ぶ / Escape 以外（Tab 等）では呼ばない |
| AC-4 | `options.enabled === false` で listener を張らない / unmount で listener を全解除（リークなし） |
| AC-5 | SSR/Workers（`browserDocument()` が undefined）で no-op・throw しない |
| AC-6 | `SidebarUserMenu` を hook 呼び出しへ置換し、既存 `SidebarUserMenu.spec.tsx` を無改修で全パス |
| AC-7 | `DensityToggle` を hook 呼び出しへ置換し、既存 `DensityToggle.client.spec.tsx`（TC-4 Escape focus 復帰 / TC-5 外側 / TC-6 内側 / TC-10 unmount / TC-13 Tab）を無改修で全パス |
| AC-8 | hook の JSDoc に I-2 / I-5 を明記・`<details>.open` を React state 化しない・HEX 直書きなし・`pnpm typecheck` / `pnpm lint` 緑 |

## 1.7 inventory（変更対象ファイル）

| パス | 種別 | 概要 |
| --- | --- | --- |
| `apps/web/src/hooks/useDismissable.ts` | 新規 | dismiss hook 本体 |
| `apps/web/src/hooks/__tests__/useDismissable.spec.tsx` | 新規 | hook 単体 spec |
| `apps/web/src/components/shell/SidebarUserMenu.tsx` | 編集 | inline `useEffect`(L34-58) → `useDismissable` 呼び出し |
| `apps/web/src/components/public/DensityToggle.client.tsx` | 編集 | inline `useEffect`(L76-101) → `useDismissable` 呼び出し |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | 無改修（回帰確認のみ） | 既存 dismiss テスト 3 件がパス |
| `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | 無改修（回帰確認のみ） | TC-4/5/6/7/10/13 がパス |

## 1.8 carry-over 確認

`git log --oneline -5` 上に本タスクの先行成果物なし（hook は未作成）。origin/dev 取り込み済（merge commit `5530dcf91`）。本タスクは clean な新規 spec として開始する。
