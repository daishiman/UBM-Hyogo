# サイドバー折りたたみレイアウト是正タスク仕様書

- task_id: `admin-sidebar-collapse-layout-fix`
- 実装区分: **[実装区分: 実装仕様書]**（CONST_004 デフォルト。判定根拠は Phase 1 参照）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `edit`
- workflow_state: `implemented_local_evidence_captured`（実コード反映・focused Vitest・local Playwright screenshot 取得済み。commit / push / PR / staging visual は user-gated）
- スコープ: `apps/web` の sidebar shell コンポーネント群のみ。API/D1/Form/endpoint 非変更（不変条件 #1 #5）

## 目的

公開 / 会員 / 管理で共有する左サイドバー（`SidebarShell`）の **折りたたみ（collapsed）状態**で発生している
**ナビアイコンのはみ出し・ユーザーアカウント行の不揃い・各要素の中心軸不一致** を是正し、
折りたたみ時の見た目を「全要素が幅 64px 内で中央に整列する」状態にする。**展開（expanded）時**の regression も防ぐ。

## 根本原因（コード実 Read で確定 / API・D1・Form 無罪）

すべて `apps/web` 表現層（コンポーネントの Tailwind className）に起因する。

1. **はみ出し・中心不一致**: collapsed 幅 64px − aside `p-3`(24px) = 内側 40px。そこに各行（nav-item / user-menu / brand / admin-return）が
   collapsed 時も `px-3`(24px) を剥がさないため実効幅 16px に圧縮され、icon 18px / avatar 36px / brand mark 32px がはみ出し、`justify-center` も無効化される。
   該当: `SidebarNavItem.tsx:30` / `SidebarUserMenu.tsx:54` / `SidebarBrand.tsx:16`（collapsed 分岐なし）/ `SidebarShell.tsx:32`（AdminPublicReturn）。
2. **クリップ**: `[data-shell="sidebar"]{overflow:hidden}`（`globals.css:1986`）がはみ出しを切る。`SidebarNav.tsx:18` の collapsed 時 `overflow-visible` は親下で無効。
3. **棄却した誤説**: 「avatar が CSS 40px とコンポーネント 36px で不整合」は **誤り**。`.ui-sidebar-*`（`globals.css:270-504`）は現行 shell 未使用の legacy CSS で、現行 avatar は `h-9 w-9`=36px のみ（修正対象外）。

## 修正方針

collapsed 時、各行の水平パディングを `px-0` 化し、`w-full justify-center` + 共通 40px 角アイコン枠で中央寄せして全行の縦中心線を一致させる。expanded は regression を出さない（必要なら軽微なアイコン左端整列のみ）。色は `var(--ubm-color-*)` のみ（HEX 禁止）。

## スコープ（本サイクル完結 = AC-1..AC-9）

| 柱 | 内容 | 主な変更ファイル |
| --- | --- | --- |
| collapsed パディング除去 | 各行 collapsed 時 `px-0 w-full justify-center` へ分岐移動（brand は分岐新設） | `SidebarNavItem.tsx` / `SidebarUserMenu.tsx` / `SidebarBrand.tsx` / `SidebarShell.tsx` |
| アイコン枠統一 | collapsed 時 icon/avatar/mark を 40px 角枠で中央配置し縦中心線を一致 | 同上 |
| overflow 整合 | はみ出し解消後の `SidebarNav` overflow 挙動確認（挙動不変なら無変更） | `SidebarNav.tsx`（任意） |
| expanded regression 防止 | 既存 visual baseline 維持 + アイコン左端基準の軽微整列 | 上記 components |
| テスト | collapsed レイアウト contract の spec 追加 / 更新 | `__tests__/Sidebar*.spec.tsx` |

## スコープ外（baseline・今サイクル起票なし）

- **OOS-1**: collapsed 時 hover tooltip が aside の `overflow:hidden` でクリップされうる問題。overflow 戦略変更が `height:100dvh` sticky と全 viewport の縦スクロール挙動に影響するため別関心。Phase 11 で実機確認し、改善判断時のみ別タスク化を検討（詳細は Phase 1 §スコープ境界 / Phase 12 unassigned-task-detection）。

## Acceptance Criteria

Phase 1 の AC-1..AC-9 を正本とする。

## Phase 構成

| Phase | 内容 | 出力 |
| --- | --- | --- |
| 1 | 要件定義 | [phase-1-requirements.md](phase-1-requirements.md) |
| 2 | 設計（className 分岐・アイコン枠） | [phase-2-design.md](phase-2-design.md) |
| 3 | 設計レビュー | [phase-3-design-review.md](phase-3-design-review.md) |
| 4 | テスト計画 | [phase-4-test-plan.md](phase-4-test-plan.md) |
| 5 | 実装手順 | [phase-5-implementation.md](phase-5-implementation.md) |
| 6 | テスト追加 | [phase-6-test-additions.md](phase-6-test-additions.md) |
| 7 | カバレッジ | [phase-7-coverage.md](phase-7-coverage.md) |
| 8 | リファクタ | [phase-8-refactor.md](phase-8-refactor.md) |
| 9 | QA | [phase-9-qa.md](phase-9-qa.md) |
| 10 | 最終レビュー | [phase-10-final-review.md](phase-10-final-review.md) |
| 11 | 手動テスト / スクリーンショット | [phase-11-manual-test.md](phase-11-manual-test.md) |
| 12 | ドキュメント同期 | [phase-12-documentation.md](phase-12-documentation.md) |
| 13 | commit / PR / release | [phase-13-pr.md](phase-13-pr.md) |

## 完了条件

AC-1..AC-9 が全 Phase に trace され、`artifacts.json` に `taskType` / `visualEvidence` / gates が記録され、
本タスクが `apps/web` の sidebar shell に閉じ（apps/api git diff 空）、1 サイクルで完結する実装手順が Phase 5 に明記されていること。
