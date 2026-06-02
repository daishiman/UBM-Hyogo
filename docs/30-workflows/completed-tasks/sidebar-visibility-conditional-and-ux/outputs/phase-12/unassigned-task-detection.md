# Unassigned Task Detection — サイドバー表示条件の正本化

> 0 件でも出力必須。current（本タスク差分由来）と baseline（既存 repo 違反）を分離する。

## 検出サマリ

| 区分 | 件数 |
| --- | --- |
| 本タスク由来の新規未タスク（current） | 0 件 |
| baseline 違反（既存・本タスク無関係） | 別 remediation task 管轄（本タスク起票対象外） |

本タスクは `implemented_local_evidence_captured` であり、スコープ（T1 route topology + T2 SSR active + T3 shell UX）は
同一サイクル内で実コード・direct focused tests・typecheck・lint まで完了済み（CONST_007）。新規に分離すべき未タスクは **0 件**。
Phase 3 の MINOR-1〜3 は下記の通り、いずれも本サイクル設計 / 実装で吸収済みで **今サイクルで分離しない明確な理由**を持つ。

## MINOR 候補の評価（phase-3 / phase-10 由来）

| ID | 候補 | 今サイクルで分離しない理由 | CONST_007 整合 |
| --- | --- | --- | --- |
| MINOR-1 | route group 移動後の相対 import 破壊リスク | `(public)/login` と `(auth)/login` は同一階層深度（`app/<group>/login/`）で import 不変。移動後の direct focused tests / grep gate で検証済み。本タスク内で完結 | 整合（**同サイクル内で完結**。先送りではない） |
| MINOR-2 | `x-pathname` を全 request に付ける static 化抑止懸念 | 該当 route は既に dynamic（session 依存 layout）であり実害なし。redirect レスポンスには付与しない設計を Phase 2 §2.2 で確定済み | 整合（**設計で境界確定済み**。実害なし） |
| MINOR-3 | viewer CTA の collapsed 表示 a11y | collapsed 時は icon + sr-only ラベルで a11y 担保（Phase 2 §3.1）。`data-shell-block="login-cta"` で識別 | 整合（**設計で a11y 担保済み**） |

> MINOR-1〜3 はいずれも「本タスクの AC-1〜9 達成を阻害しない・設計または実装で完結」のため、現サイクルで未タスク分離しない。
> これは CONST_007（先送り禁止）に矛盾しない。残るのは production-equivalent running stack 依存の pixel screenshot（user-gated）だけである。

## 関連タスク差分確認（重複起票防止 / FB-CANCEL-004-2）

| 確認対象 | 結果 |
| --- | --- |
| 親系譜 `task-c-public-member-sidebar-shell-integration`（公開/会員 shell 統合） | 本件の route topology 修正は Task C の shell mount を前提とする差分修正。Task C は shell mount 自体が責務であり、`(auth)` 分離・middleware x-pathname 注入は Task C スコープ外（M-1 として記録済み）。本件が正規にそれを引き受ける = 重複起票なし |
| 親系譜 `unified-sidebar-shell-task-e-mobile-drawer-responsive`（mobile drawer） | drawer 内 viewer identity / active は Task E primitive（`SidebarMobileTrigger` / `SidebarDrawer`）を再利用。本件は分岐強化のみで Task E と重複しない |
| `issue-1024`（collapse cookie 永続化） | collapse 状態は `useSidebarState` 所有（既存・不変）。本件は collapse ロジックに非接触。重複なし |
| 既存 unassigned-task / completed-tasks に同主題タスク | `(auth)` route group 分離 / middleware x-pathname / viewer identity と同主題の既存未タスクは検出なし（重複起票なし） |
| 関連 OPEN Issue | サイドバー表示条件 / x-pathname 注入 / login bare 化の OPEN Issue は検出なし |

## baseline 分離

repo 全体の既存違反（本タスク無関係）は baseline として既存 remediation 管轄に委ねる。
本タスク差分（`git diff` 対象 = docs spec 群 + `apps/web` 実装）に新規未タスク化すべき違反 0。
本サイクルは実コード差分を含むが、AC-1〜9 の local deterministic evidence と仕様同期で baseline 違反の新規導入 0。

## 結論

本タスク由来の新規未タスク **0 件**。MINOR-1/2/3 は境界内（設計 / 実装で完結）として記録のみ。
既存 sidebar 系タスク（Task C/E・issue-1024）との重複なし。重複起票なし。
