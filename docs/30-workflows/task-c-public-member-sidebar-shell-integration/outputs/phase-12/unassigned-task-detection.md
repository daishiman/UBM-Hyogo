# Unassigned Task Detection — Task C

> 0 件でも出力必須。current（本タスク差分由来）と baseline（既存 repo 違反）を分離する。

## 検出サマリ

| 区分 | 件数 |
| --- | --- |
| 本タスク由来の新規未タスク（current） | 0 件 |
| baseline 違反（既存・本タスク無関係） | 別 remediation task 管轄（本タスク起票対象外） |

本タスクは Phase 1-13 仕様作成サイクルであり、スコープ（公開 6 + 会員 1 route の shell 統合）内で完結する。
新規に分離すべき未タスクは **0 件**。MINOR 指摘 M-1/M-2 は下記の通り **今サイクルで分離しない明確な理由** を持つ。

## MINOR 候補の評価（phase-3 / phase-10 由来）

| ID | 候補 | 今サイクルで分離しない理由 | CONST_007 整合 |
| --- | --- | --- | --- |
| M-1 | middleware への `x-pathname` 注入の是非 | **AC-C8（auth middleware 不変）** が本タスクの不変条件。middleware 変更は auth 境界の別 surface であり、Task C スコープに含めると不変条件に抵触する。現状は `?? "/"` fallback + client `usePathname()` で graceful degradation が成立し、active 表示は崩れない設計。実装後に fallback が不足する事象が観測された場合のみ別タスク化する条件付き候補 | 整合（先送りではなく **不変条件による境界外**。現サイクルの shell 統合は fallback で完結する） |
| M-2 | `(public)` 集約後に root 直下へ残る page（`smoke` / `visual-harness` 等）との責務整理 | dev / smoke 用途であり公開 UX（本タスクの価値領域）スコープ外。Task C の移動対象は `/` `/privacy` `/terms` `/login` の 4 route のみで、smoke / harness は別 path。整理しなくても本タスクの AC は全達成する | 整合（**用途スコープ外**。Task C の shell 統合完了を阻害しない独立関心事） |

> M-1/M-2 はいずれも「Task C の完了を阻害しない・不変条件 or 用途で境界外」のため、現サイクルで未タスク分離しない。
> これは CONST_007（先送り禁止）に矛盾しない。Task C 自体の仕様・実装は本サイクルで完結しており、
> 残るのは production-equivalent running stack 依存の visual evidence だけである。

## 関連タスク差分確認（重複起票防止 / FB-CANCEL-004-2）

| 確認対象 | 結果 |
| --- | --- |
| 親 workflow `unified-sidebar-shell-public-and-admin` の既存 task（A/B/D/E/F） | M-1（x-pathname / active state）は Task A の `activePath` 責務範囲。重複起票せず Task A 側で吸収する境界として記録 |
| 既存 unassigned-task / completed-tasks に同主題タスク | M-1/M-2 と同主題の既存未タスクは検出なし（重複起票なし） |
| 関連 OPEN Issue | shell 統合 / x-pathname 注入の OPEN Issue は検出なし |

## baseline 分離

repo 全体の既存違反（本タスク無関係）は baseline として既存 remediation 管轄に委ねる。
本タスク差分（`git diff` 対象 = docs spec 群 + apps/web 実装 + D1 migration guard）に新規未タスク化すべき違反 0。

## 結論

本タスク由来の新規未タスク **0 件**。M-1/M-2 は境界外（不変条件 / 用途）として記録のみ。重複起票なし。
