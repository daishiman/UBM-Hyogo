# task-21-w2-par-screen-blueprints-admin

## メタ情報

| 項目 | 値 |
| --- | --- |
| 状態 | spec_created / docs-only / NON_VISUAL |
| workflow | UI prototype alignment / MVP recovery |
| wave | W2 parallel |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Phase | 01-13 |
| Phase 13 | blocked_pending_user_approval |

## 目的

管理層 8 routes と AdminSidebar 共通の screen blueprint を `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` に固定し、task-15 / task-16 / task-17 の実装入力にする。

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

## 成果物

| 成果物 | パス |
| --- | --- |
| 09g admin blueprint | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` |
| verify harness | `scripts/verify-09g-screen-blueprints-admin.sh` |
| Phase 07 evidence | `outputs/phase-07/automated-checks.log` |
| Phase 11 evidence | `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md`, `outputs/phase-11/docs-walkthrough.md` |
| Phase 12 strict outputs | `outputs/phase-12/` |
| Phase 13 local check | `outputs/phase-13/local-check-result.md` |

## 完了条件

- [x] 09g が 700..1200 行に収まる。
- [x] §1..§9 + §99 の 10 セクションで管理 8 routes + Sidebar を固定。
- [x] stale admin API を撤回し current aiworkflow-requirements API contract へ同期。
- [x] 視覚値 literal 0 件。
- [x] Phase 12 strict 7 files が存在する。
- [x] Phase 13 は commit / push / PR 未実行で user approval gate に止める。
