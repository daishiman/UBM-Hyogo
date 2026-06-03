---
name: lessons-learned-issue-1042-dismiss-optimistic-2026-06
description: issue-1042 identity-conflicts dismiss を component-local optimistic update + rollback 化した実装の苦戦箇所と再利用知見（#988 merge optimistic の dismiss 側 mirror）
metadata:
  type: reference
---

# lessons-learned — issue-1042 identity-conflicts dismiss optimistic update (2026-06)

| 項目 | 値 |
| --- | --- |
| workflow | `issue-1042-dismiss-confirm-optimistic-update` |
| source_issue | #1042（FU-AIDC-006・調査時点 OPEN） |
| status | implemented_local_evidence_captured / VISUAL_ON_EXECUTION |
| recorded_at | 2026-06-01 |
| mirror_of | #988 / PR #1046（merge optimistic） |

## 範囲

`/admin/identity-conflicts` の dismiss（別人マーク）二段階 confirm 後、server round-trip を待たず該当 row を optimistic に非表示化し、server error 時のみ rollback（row 復元 + inline error + dismiss 理由保持）する実装で得た知見。#988（merge optimistic）の dismiss 側 mirror であり、L-I988-001..006（独立 boolean / API error body surface / reject-only rollback / 3 ケース focused test / `getByText` exact / env-gated screenshot）はそのまま継承する。本ファイルは **#988 が扱っていない #1042 固有の知見** のみを記録する（重複は [[lessons-learned-issue-988-optimistic-merged-2026-05]] を参照）。

## L-I1042-001 — 同一 component 上の複数 optimistic boolean は独立保持し、render guard だけ `||` で合流させる

- **Rule**: merge の `optimisticMerged` と dismiss の `optimisticDismissed` を **1 つの boolean に統合しない**。それぞれ独立した `useState(false)` を持ち、可視性は render guard で `if (optimisticMerged || optimisticDismissed) return null;` と OR 合流させる。`stage` union（`"idle" | "merge-confirm" | "merge-final" | "dismiss"`）にも混ぜない。
- **Why**: 同一 row component が merge と dismiss の 2 経路を持つため、可視性を 1 boolean に畳むと「どちらの操作で消えたか」が失われ、rollback 時に巻き戻す対象を取り違える（merge の失敗で dismiss state を戻す等）。boolean を経路ごとに分けておけば `setOptimisticDismissed(false)` が dismiss の rollback だけに作用し、merge 側に副作用が出ない（AC-1）。dual-mirror の合流点は render guard の 1 行に限定するのが破綻しない最小設計。
- **How to apply**: 同一 component に複数の「即時 hide → server 確定 → 失敗時 rollback」経路がある場合、可視性 boolean を経路数だけ持ち、guard だけ OR で束ねる。state を統合する誘惑（DRY）は rollback 責務の取り違えを生むので退ける。

## L-I1042-002 — rollback 時は可視性のみ巻き戻し、入力（dismiss reason）は success path でのみ clear する非対称 reset

- **Rule**: `onDismiss` は `setOptimisticDismissed(true)` → `trigger(...).catch(() => setOptimisticDismissed(false))`。catch 内で **`setDismissReason("")` を呼ばない**。reason の clear は success 経路（`onSuccess` / idle 復帰）でのみ行う。失敗時は modal を閉じず reason を保持する。
- **Why**: 409 等で row が戻ったとき、管理者が入力済みの「別人と判断した理由」が消えると再入力が必要になり UX を損なう（AC-3 reason retention）。success と failure で reset 対象が非対称（success = 可視性維持 + reason clear、failure = 可視性 rollback + reason 保持）であることを明示しないと、素朴な「finally で全 state reset」実装に流れて reason が落ちる。
- **How to apply**: optimistic mutation の state reset は success/error で対象を分けて設計する。「可視性」と「入力値」は別ライフサイクル。catch では巻き戻すべき最小（可視性 boolean）だけ触る。

## L-I1042-003 — dismiss rollback が merge 経路に干渉しないことを focused test で固定する

- **Rule**: dismiss optimistic の focused test は #988 の 3 ケース（pending 中 hide / success 後 hide 維持 / reject で rollback + reason 保持）に加え、(4) **rollback 後に再度確定でき 2 回目の trigger が呼ばれる**、(5) **dismiss rollback 後に merge 経路へ切り替えても merge optimistic hide が正常動作する（cross-mirror 非干渉）** の 2 ケースを足す。row 特定は DOM の `conflict: <id>` 有無で行い内部 state を覗かない。
- **Why**: dual-mirror（L-I1042-001）の独立性は「片方の rollback がもう片方を壊さない」ことで初めて担保される。cross-mirror 非干渉ケースが無いと、将来 state を統合する regression を検知できない。再実行ケースは reason 保持（L-I1042-002）が「再操作可能」まで効いていることの証明。
- **How to apply**: 複数 optimistic 経路を持つ component の test には必ず「経路 A 失敗 → 経路 B 成功」の cross ケースを 1 本入れる。mock は `mockRejectedValueOnce` → `mockResolvedValueOnce` で再実行を、merge/dismiss それぞれ別 endpoint の `setMutationState` で経路分離を表現する。

## L-I1042-004 — 同一 component の screenshot は操作経路を prefix で名前空間分離する

- **Rule**: VISUAL_ON_EXECUTION の canonical screenshot 名は、merge 側 #988 の `-optimistic-removed` / `-rollback-error` と衝突しないよう dismiss 側に `-dismiss-` を入れて `identity-conflict-row-dismiss-optimistic-removed.png` / `identity-conflict-row-dismiss-rollback-error.png` とする。env gate も `PLAYWRIGHT_ISSUE1042_SCREENSHOT_DIR` と issue 番号で分離する。
- **Why**: 同一 component（`IdentityConflictRow`）に対し merge / dismiss 双方が screenshot を撮るため、prefix を分けないと canonical 名が衝突し evidence が上書き・取り違えられる。
- **How to apply**: 1 component に複数 VISUAL 経路があるとき、screenshot 名と env gate を操作経路で名前空間化する。Phase 1 spec で canonical 名を先に固定し implementation-guide でも同名参照して drift を防ぐ（L-I988-006 を継承）。

## 関連

- [[workflow-issue-1042-dismiss-confirm-optimistic-update-artifact-inventory]]
- [[lessons-learned-issue-988-optimistic-merged-2026-05]]（merge 側・継承元の L-I988-001..006）
- 発見元 spec: `docs/30-workflows/completed-tasks/admin-identity-conflicts-followup-004-dismiss-optimistic-update.md`
- スコープ外分離: `docs/30-workflows/unassigned-task/admin-identity-conflicts-followup-005-row-fade-animation.md`（row 消失時 fade animation）
