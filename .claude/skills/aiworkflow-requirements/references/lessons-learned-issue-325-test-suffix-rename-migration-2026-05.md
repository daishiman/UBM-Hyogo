# Lessons Learned: Issue #325 Test Suffix Rename Migration (2026-05)

| Meta | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/` |
| Predecessor | `docs/30-workflows/unassigned-task/UT-08A-06-test-suffix-rename-migration.md` |
| Date | 2026-05-09 |
| State | implementation_completed / NON_VISUAL / Phase 13 pending_user_approval |
| Scope | `apps/api/src/**/*.test.ts` 132 files → suffix-classified `*.spec.ts` (contract=41 / authz=4 / repository=38 / unit=49) |

## L-325-001: suffix 責務分類の境界判定

- **苦戦**: `audit-correlation/contract.test.ts` → `contract.contract.spec.ts` の二重命名感、`run-route` を contract に分類した判断、`me-session-resolver` を authz に寄せた判断など、ファイル名と責務 suffix の交錯。
- **原因**: ファイル名そのものに既に責務を示す語（`contract`, `route`, `resolver`）が含まれているため、suffix を追加すると見た目に冗長感が出る。
- **解決パターン**: ADR (`outputs/phase-12/test-file-suffix-adr.md`) に責務基準を明文化し、ファイル名の偶発的な語と responsibility suffix を分離する。冗長感は許容し、suffix は "vitest プロジェクト分離キー" として機械的に付与する。
- **適用条件**: 同種の suffix-based classification rename を実施する全ワークフローで先に ADR 起票を必須とする。

## L-325-002: 件数 invariant の事前 snapshot

- **苦戦**: rename の網羅性確認に `find` 出力を都度比較すると人為ミスが入る。
- **解決パターン**: Phase 11 evidence として `test-count-before.txt` / `test-count-after.txt` / `rename-mapping.csv` を保存し、132/132 と分類別件数（41/4/38/49）を機械検証可能な形で固定する。`glob-coverage-grep.log` も同梱して `*.test.ts` 残存 0 を証跡化。
- **適用条件**: 100 件超の rename / move を伴うワークフローでは Phase 11 evidence に before/after count snapshot と mapping CSV を必須化。

## L-325-003: vitest include の two-suffix 拡張

- **苦戦**: 移行中に `*.test.ts` と `*.spec.ts` が混在する期間、CI で取りこぼしが起きないかの判断。
- **解決パターン**: `vitest.config.ts` の include を `*.{test,spec}.{ts,tsx}` に拡張し移行中の双方を採取。移行完了後に `*.test.ts` 残存が 0 であることを確認した上で、cleanup task として `*.spec` 単独へ縮退する判断は別タスクへ送る（本ワークフロー scope out）。
- **適用条件**: 段階的 rename を伴う移行で、CI 取りこぼしを防ぐため一時的に両 pattern を include する。完全縮退は移行完了確認後の独立 task。

## L-325-004: rename-only workflow の状態同期漏れリスク

- **苦戦**: `git mv` 実行直後、`workflow_state` / Phase status / inventory / quick-reference / resource-map のいずれかに「実 rename 未実行」表現が残ったまま PR に進む事故が発生しやすい。
- **解決パターン**: rename 同 cycle で次を一括更新する:
  1. root `artifacts.json` の `workflow_state` と Phase status を実績ベースへ
  2. `.claude/skills/aiworkflow-requirements/references/workflow-*-artifact-inventory.md` 新規作成または更新
  3. `task-workflow-active.md` / `quick-reference.md` / `resource-map.md` の該当行を実績ベース表現に書換
  4. ADR は目標状態ではなく current tree の実装済み状態を記録
- **適用条件**: rename-only workflow（コードロジック変更なし）でも spec / index / inventory の同期は通常タスクと同一基準で実施する。

## L-325-005: scope out の明示と未タスク棚卸し

- **苦戦**: `apps/web/**` と `packages/**` の test suffix rename が同テーマで存在するが本ワークフローは `apps/api` のみが scope。scope-creep を防ぐ仕組みが必要。
- **解決パターン**: Phase 12 `unassigned-task-detection.md` に scope-out 棚卸し（apps/web / packages 別ドメイン）を明記し、新規 unassigned-task ファイルを作成しない判断を成果物として残す（Issue 化は parent workflow 責務）。
- **適用条件**: 領域横断的な migration テーマで、対象を限定するワークフローでは Phase 12 に scope-out 一覧を明示。

## 引用関係

- 再利用パターンは `task-specification-creator/references/patterns-success-phase12.md` の "rename-only workflow の実装完了状態同期（Issue #325）" に統合済（task spec 作成時の参照経路）。
- inventory: `workflow-issue-325-test-suffix-rename-migration-artifact-inventory.md`
- legacy lifecycle: `legacy-ordinal-family-register.md` UT-08A-06 → Issue #325 行を参照。
