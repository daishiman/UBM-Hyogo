# task-01-w1-solo-scope-gate-all-screens

## メタ情報

| 項目 | 値 |
| --- | --- |
| 状態 | spec_created / docs-only / NON_VISUAL |
| workflow | UI prototype alignment / MVP recovery |
| wave | W1 solo |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Phase | 01-13 |

## 目的

UI prototype alignment / MVP recovery の先行 gate として、19 routes の全画面実装スコープ、既存 API のみ接続、OKLch トークン正本化を正本 docs に反映する。

## 実行タスク

| Phase | ファイル | 状態 |
| --- | --- | --- |
| 01 | `phase-01.md` | completed |
| 02 | `phase-02.md` | completed |
| 03 | `phase-03.md` | completed |
| 04 | `phase-04.md` | completed |
| 05 | `phase-05.md` | completed |
| 06 | `phase-06.md` | completed |
| 07 | `phase-07.md` | completed |
| 08 | `phase-08.md` | completed |
| 09 | `phase-09.md` | completed |
| 10 | `phase-10.md` | completed |
| 11 | `phase-11.md` | completed |
| 12 | `phase-12.md` | completed |
| 13 | `phase-13.md` | blocked_pending_user_approval |

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| 親タスク仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/01-scope/task-01-w1-solo-scope-gate-all-screens.md` | 3 docs 正本化要求 |
| Scope 正本 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 後続 task-02..22 の参照基盤 |
| 実行順 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` | W1-W7 DAG |

## 成果物

| 成果物 | パス |
| --- | --- |
| CLAUDE.md scope gate | `CLAUDE.md` |
| specs overview sync | `docs/00-getting-started-manual/specs/00-overview.md` |
| scope SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` |
| Phase 11 evidence | `outputs/phase-11/` |
| Phase 12 strict outputs | `outputs/phase-12/` |

## 完了条件

- [x] `SCOPE.md` が workflow root 直下に存在する。
- [x] `CLAUDE.md` に UI prototype alignment / MVP recovery セクションがある。
- [x] `docs/00-getting-started-manual/specs/00-overview.md` に 19 routes と API mapping 導線がある。
- [x] Phase 12 strict 7 files が存在する。
- [x] 既存 workflow の削除混入（5 dir）を `docs/30-workflows/completed-tasks/` 配下へ archive で解消し、diff scope を正本 docs + task package に限定。SCOPE.md §6 / EXECUTION-ORDER.md / task-02..22 §「diff scope 規律」に共通ルールを明文化済み（2026-05-07）。
