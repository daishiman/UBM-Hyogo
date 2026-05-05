# タスク仕様書: Issue #379 schemaDiffQueue fakeD1 compat verification

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-379-schema-diff-queue-faked1-compat-001 |
| 親 Issue | #379（CLOSED 維持） |
| 状態 | verified_current_no_code_change_pending_pr |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| implementation_mode | stale-current-verification |
| Phase 13 | blocked_pending_user_approval |

`taskType=implementation` のまま扱う理由: 元タスクは `apps/api` repository / fakeD1 の修復実装を要求していたため、Phase 1 の実測で stale と判定するまでは実装タスクである。現サイクルでは current contract が GREEN だったため、実コード変更ではなく no-code stale verification close-out として閉じる。

## 結論

旧 unassigned task は `schemaDiffQueue.test.ts` の list 系 2 件 fail を前提にしていた。
しかし、2026-05-05 の focused local evidence では `apps/api/src/repository/schemaDiffQueue.test.ts` は 7/7 PASS で、Issue #379 の failure は現 worktree では再現しない。

そのため、`fakeD1.ts` / `schemaDiffQueue.ts` / `schemaDiffQueue.test.ts` へのコード変更は行わない。
本 workflow は「修復実装」ではなく「stale failure の current verification close-out」として完了する。

## Decision Log

| 日付 | 判断 | 根拠 |
| --- | --- | --- |
| 2026-05-05 | A+B 実装案を撤回 | baseline / after ともに focused Vitest 7/7 PASS |
| 2026-05-05 | #379 は reopen しない | 親 Issue は CLOSED。現在は修復対象がないため `Refs #379` 相当の履歴参照に留める |
| 2026-05-05 | `pnpm --filter @ubm-hyogo/api test -- <file>` を証跡コマンドから除外 | package script が `apps/api` を固定しており focused run にならない |

## Evidence

| Artifact | 内容 |
| --- | --- |
| `outputs/phase-1/baseline.txt` | focused baseline: 1 file / 7 tests PASS |
| `outputs/phase-7/coverage-summary-snapshot.json` | focused coverage snapshot |
| `outputs/phase-11/after.txt` | focused after: 1 file / 7 tests PASS |
| `outputs/phase-11/test-log-diff.md` | baseline / after comparison |
| `outputs/phase-12/main.md` | strict close-out and 4-condition verdict |

## Phase Index

- [Phase 1](outputs/phase-1/phase-1.md): baseline evidence
- [Phase 2](outputs/phase-2/phase-2.md): stale/current design
- [Phase 3](outputs/phase-3/phase-3.md): design review
- [Phase 4](outputs/phase-4/phase-4.md): test strategy
- [Phase 5](outputs/phase-5/phase-5.md): no-code implementation decision
- [Phase 6](outputs/phase-6/phase-6.md): regression boundary
- [Phase 7](outputs/phase-7/phase-7.md): coverage snapshot
- [Phase 8](outputs/phase-8/phase-8.md): DRY / setup decision
- [Phase 9](outputs/phase-9/phase-9.md): quality gates
- [Phase 10](outputs/phase-10/phase-10.md): documentation sync
- [Phase 11](outputs/phase-11/phase-11.md): evidence capture
- [Phase 12](outputs/phase-12/phase-12.md): strict close-out
- [Phase 13](outputs/phase-13/phase-13.md): user-gated PR placeholder
