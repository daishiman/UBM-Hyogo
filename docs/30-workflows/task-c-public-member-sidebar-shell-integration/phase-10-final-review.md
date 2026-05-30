# Phase 10: 最終レビュー

## レビュー前提（unassigned-task ルール確認）

Phase 10 レビューに着手する前に、**MINOR 指摘 → 未タスク化（unassigned-task）ルール**を確認した。
Phase 3 で挙げた MINOR（M-1 / M-2）は、本タスクのスコープ・AC を満たすために必須ではない改善余地であり、
コード実装の blocker ではない。これらは Phase 12 `unassigned-task-detection.md` で current/baseline を分離して再評価し、
必要に応じて未タスク（follow-up）として formalize する候補とする（CONST_007: 本サイクルのスコープを先送りする分割ではない）。

## Acceptance Criteria 判定表（AC-C1..C10 → 証跡マッピング）

| AC | 条件要旨 | 証跡 Phase | 判定 | 備考 |
| --- | --- | --- | --- | --- |
| AC-C1 | 7 route が同一 shell DOM 契約（`data-shell-mode="sidebar"`） | Phase 4 設計 / Phase 9 layout.spec / Phase 11 visual | **PASS（source-level）/ VISUAL PENDING** | focused layout/page specs green。pixel screenshot は Gate-C |
| AC-C2 | `PublicHeader`/`MemberHeader` 参照 grep 0 | Phase 8 grep gate / Phase 9 | **PASS** | `git grep -n ... -- apps/web` ヒット 0 |
| AC-C3 | 旧 component 本体 + spec が git delete | Phase 2 削除設計 / Phase 9 `git status` | **PASS** | 削除対象 4 ファイルは git delete 済み |
| AC-C4 | `PublicFooter` が shell 配下で描画継続 | Phase 2 保持設計 / Phase 9 / Phase 11 | **PASS（source-level）/ VISUAL PENDING** | layout.spec で描画維持を確認。pixel screenshot は Gate-C |
| AC-C5 | layout が async + `SidebarShellServer` mount、role 再判定なし | Phase 2 layout スケッチ / Phase 9 layout.spec | **PASS** | layout が `SidebarShellServer` を mount し、role 分岐は shell 内部に閉じる |
| AC-C6 | profile の MemberHeader 直 mount 2 箇所除去 | Phase 2 編集設計 / Phase 9 page.spec | **PASS** | page.spec + grep で旧 header 不在を確認 |
| AC-C7 | 移動後 URL 不変・200 | Phase 9 build manifest / Phase 11 curl | **SOURCE PASS / RUNTIME PENDING** | route group `()` URL 非寄与と typecheck green は確認。実 200 curl は Gate-C |
| AC-C8 | API/D1/Form schema/middleware 無変更 | Phase 9 `git diff --stat` | **PASS（Task C surface）** | auth middleware / Google Form schema は不変。D1 migration guard 追加は別 surface の品質改善として記録 |
| AC-C9 | typecheck + lint + test green | Phase 9 / Phase 10 検証コマンド | **PASS** | focused vitest / apps-web suite / typecheck / lint green |
| AC-C10 | 移動 page の import/colocated test/smoke 参照健全 | Phase 2 影響表 / Phase 5 移動チェックリスト / Phase 9 typecheck | **PASS** | typecheck green + moved login/page specs green |

> VISUAL/RUNTIME PENDING = production-equivalent running stack 依存の Gate-C。local source-level evidence は取得済み。

## blocker 判定

| 項目 | blocker か | 根拠 |
| --- | --- | --- |
| Task A/B/E（`apps/web/src/components/shell/`） | **blocker ではない** | 本サイクルで先行実装済み。Task C は shell primitive を mount するのみ |
| `x-pathname` middleware 未配線 | **blocker ではない** | layout の `?? "/"` fallback + client `usePathname()` で graceful degradation。AC-C8 維持のため意図的に未配線 |
| route 物理移動の相対 import リスク | **blocker ではない** | Phase 5 移動チェックリスト + typecheck gate で抑制（HIGH リスクだが緩和策確定済み） |

## MINOR 指摘の洗い出し（→ Phase 12 unassigned-task 検出候補）

| ID | 指摘 | 現状の扱い | Phase 12 候補理由 |
| --- | --- | --- | --- |
| M-1 | middleware への `x-pathname` 注入の是非 | 本タスクでは AC-C8 維持のため未実施。fallback + client `usePathname()` で代替 | Task A の active 表示が fallback だけで不足する場合、auth 境界を持つ別 surface での対応として未タスク化を検討 |
| M-2 | `(public)` group 集約後、root 直下に残る dev/smoke 系 page（`smoke` / `visual-harness` / `(dev)` / `__smoke__`）の責務整理 | 本タスクスコープ外（dev/smoke 用途で公開 route ではない） | 集約後の root 直下 page 整理は別タスクの責務。未タスク化候補 |

> M-1 / M-2 はいずれも本タスクの AC-C1..C10 を満たすために必須ではない（blocker でない MINOR）。
> Phase 12 で current（本タスク完了状態）/ baseline（理想状態）を分離し、follow-up として formalize するか判定する。

## 最終判定

- **local implementation は PASS**。AC-C1..C10 は source-level evidence で満たし、pixel screenshot / staging visual baseline のみ Gate-C に残る。
- **visual baseline / commit / push / PR は Gate-C（user-gated runtime/release wave）**。
- 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）は Phase 12 compliance check で最終 PASS を確認する。

## 完了条件

AC 判定表・blocker 判定・MINOR 洗い出し（M-1/M-2）が Phase 12 へ trace され、
unassigned-task ルール確認の旨が本ファイルに明記されている。
