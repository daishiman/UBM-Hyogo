---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 12
作成日: 2026-06-06
task_id: issue-1102-usedismissable-hook-extraction
issue: 1102
issue_state: CLOSED
visual_category: NON_VISUAL
current_unassigned_count: 0
---

# 未タスク検出レポート — issue-1102-usedismissable-hook-extraction

> 本タスク実行中に新規発生した「未タスク（follow-up 候補）」を検出する。
> **current（本タスクで新規発生）** と **baseline（既存の関連未タスク候補）** を分離して記録する。
> GitHub Issue の新規起票は行わない（検出結果は本レポートのみ）。

---

## 1. ソース別確認テーブル

| ソース | 確認方法 | 検出 | 判定 |
| --- | --- | --- | --- |
| 元タスク仕様書のスコープ外項目 | `index.md §3 含まないもの` / 元 unassigned-task body | 0 件 | スコープ外項目（`<details>.open` の state 化禁止 / route-close hook 化 / modal 系横展開）は**意図的な scope 除外**であり未タスクではない |
| Phase 3 設計レビュー MINOR | phase-3-design-review.md | 0 件 | MINOR は本サイクル内で設計に反映済（reason 引数による consumer 挙動差吸収）。未消化 MINOR なし |
| Phase 10 最終レビュー MINOR | phase-10-final-review.md | 0 件 | 残課題なし。両 consumer 移行が本サイクルに含まれ rule of three 解消 |
| Phase 11 手動テストで発見した課題 | outputs/phase-11/manual-test-result.md | 0 件 | NON_VISUAL 代替証跡（focused vitest PASS）。新規課題の発見なし |
| コードコメント TODO / FIXME | `rg "TODO|FIXME" apps/web/src/components/shell/SidebarUserMenu.tsx apps/web/src/components/public/DensityToggle.client.tsx`（spec 想定） | 0 件 | 対象 2 consumer に未消化 TODO なし |
| `describe.skip` / `it.skip` | 既存 spec 2 本（SidebarUserMenu / DensityToggle）+ 新規 hook spec | 0 件 | skip テストなし。既存 spec は無改修で全パス（挙動不変証跡） |

---

## 2. current（本タスクで新規発生した未タスク）

**0 件。**

本タスクは hook 抽出 + 2 consumer 移行を **1 サイクル内で完結**させる設計であり、
横展開や追加抽出を後続へ先送りしない（CONST_005 先送り禁止に整合）。
issue 起票時の「rule of three 未到達（再利用先 1 箇所）」は、2 箇所目（`DensityToggle`）の出現で
トリガー成立済であり、本サイクルで両移行を完了させることで DRY 違反を根絶する。
新たな follow-up を生む構造的余地はない。

---

## 3. baseline（既存の関連未タスク候補）の扱い

| 候補 | 該当コード | 未タスク化するか | 理由 |
| --- | --- | --- | --- |
| `Modal.tsx` の外側クリック / Escape dismiss を useDismissable へ横展開 | `apps/web/src/components/.../Modal.tsx`（想定） | **しない** | modal 系は `useFocusTrap` 系統の dismiss パターン（focus 閉じ込め + restore + overlay backdrop click）であり、`<details>` popover とは責務・state owner・a11y 要件が異なる。useDismissable（open state 非所有 / `<details>` 前提）の対象外 |
| `ConfirmDialog.tsx` の dismiss | `ConfirmDialog.tsx`（想定） | **しない** | 同上。確認ダイアログは focus-trap + 明示ボタン dismiss が正本パターン。pointerdown-outside 自動閉じは UX 要件として持たない場合が多く、横展開対象外 |
| `SidebarDrawer.tsx` の dismiss | `SidebarDrawer.tsx`（想定） | **しない** | drawer は focus-trap + overlay backdrop パターン。`<details>` ベースではなく、open state を所有する別機構 |
| `TagsQueueResolveDrawer.tsx` の dismiss | `TagsQueueResolveDrawer.tsx`（想定） | **しない** | 同上（drawer / focus-trap 系統）。useDismissable の単一責務（外側 pointerdown / Escape 検知 → onClose）に収まらない |

> **横展開を未タスク化しない統一理由**: 上記 modal / drawer 系の dismiss は
> `useFocusTrap` を中核とする別パターン（focus 閉じ込め・restore・overlay backdrop click・open state 所有）であり、
> `useDismissable`（`<details>.open` を state owner とし open state を非所有・I-2）とは設計前提が根本的に異なる。
> useDismissable を無理に汎用化して modal 系へ適用すると、単一責務（検知 → 通知）を破壊し、
> early over-abstraction（rule of three を超えた過剰汎用化）に陥る。
> よって本 hook の適用範囲は `<details>` popover（SidebarUserMenu / DensityToggle）に限定し、
> modal / drawer 系は別系統として未タスク化しない。

---

## 4. [FB-CANCEL-004-2] 関連タスク差分確認

| 確認 | 結果 |
| --- | --- |
| 既存 open issue との重複 | なし。`useDismissable` 抽出を扱う open issue は本 #1102 のみ（CLOSED 維持） |
| 既存 unassigned-task との重複 | なし。親 follow-up（`...-followup-001-usedismissable-hook-extraction`）は本 root が spec 化済で、別の重複 unassigned-task は存在しない |
| 兄弟 active workflow との scope 衝突 | なし。本タスクは `apps/web/src/hooks/` への新規 hook 追加 + shell / public 2 consumer 移行で、他の進行中 WF とファイル競合しない |

---

## 5. 結論

- **current（本タスクで新規発生した未タスク）= 0 件。**
- baseline（modal / drawer 系 dismiss の横展開候補）は `useFocusTrap` 別系統のため **未タスク化しない**（明示判断）。
- GitHub Issue 起票は実施しない（検出 0 件 / 本プロンプト制約）。
- 本サイクルは hook 抽出 + 2 consumer 移行を完結させ、後続への先送りはない。
