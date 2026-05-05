# u-ut01-07-fu01-ut09-canonical-sync-job-receiver - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | UT-09 canonical sync job implementation receiver |
| ID | U-UT01-07-FU01 |
| 作成日 | 2026-05-02 |
| ステータス | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 親タスク | #261 (U-UT01-07 sync_log 命名整合) |
| 直交タスク | #262 (U-UT01-08 enum) / #263 (U-UT01-09 retry/offset) |
| 下流タスク | UT-04 (D1 schema) / UT-09 (Sheets→D1 同期ジョブ実装) |
| sourceIssue | #333（CLOSED） |
| 総Phase数 | 13 |
| workflow_state | spec_created |

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | completed |
| 2 | 設計 | [phase-02.md](phase-02.md) | completed |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | completed |
| 4 | テスト戦略 | [phase-04.md](phase-04.md) | completed |
| 5 | 実装ランブック | [phase-05.md](phase-05.md) | completed |
| 6 | 異常系検証 | [phase-06.md](phase-06.md) | completed |
| 7 | AC マトリクス | [phase-07.md](phase-07.md) | completed |
| 8 | DRY 化 | [phase-08.md](phase-08.md) | completed |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | completed |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | completed |
| 11 | 手動検証 (NON_VISUAL) | [phase-11.md](phase-11.md) | completed |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | completed |
| 13 | PR作成 | [phase-13.md](phase-13.md) | pending_user_approval |

---

## 実行フロー

```
Phase 1 → Phase 2 → Phase 3 (Gate) → Phase 4 → Phase 5 → Phase 6 → Phase 7
                         ↓                                      ↓
                    (MAJOR→戻り)                           (未達→戻り)
                         ↓                                      ↓
Phase 8 → Phase 9 → Phase 10 (Gate) → Phase 11 → Phase 12 → Phase 13 → 完了
                         ↓
                    (MAJOR→戻り)
```

---

## Phase完了時の必須アクション

1. **タスク100%実行**: Phase内で指定された全タスクを完全に実行
2. **成果物確認**: 全ての必須成果物が生成されていることを検証
3. **artifacts.json更新**: 該当 phase の status を更新（workflow_state は spec_created を維持）
4. **完了条件チェック**: 各タスクを完遂した旨を必ず明記

---

## 受入条件 (AC) — 原典 Issue #333

- **AC-1（UT-09 実装受け皿確定）**: UT-09 実装タスクの実パスが `docs/30-workflows/**` 配下に確定し、U-UT01-07 unassigned detection から参照可能である
- **AC-2（canonical 名引き渡し）**: canonical 名 `sync_job_logs` / `sync_locks` が UT-09 実装タスクの必須参照および受入条件に反映されており、U-UT01-07 Phase 2 正本4ファイル（`naming-canonical.md` / `column-mapping-matrix.md` / `backward-compatibility-strategy.md` / `handoff-to-ut04-ut09.md`）が UT-09 必須参照リストに含まれる
- **AC-3（`sync_log` 物理化禁止の明記）**: `sync_log` は概念名であり、UT-09 実装で物理テーブルとして CREATE / RENAME / DROP しないことが受入条件として明記されている
- **AC-4（直交性維持）**: U-UT01-08（enum） / U-UT01-09（retry/offset） / UT-04（D1 schema 物理追加判定）との責務境界が維持され、本タスクではいずれの決定にも踏み込まない

---

## 成果物

| Phase | 主要成果物 |
| ----- | ---------- |
| 1 | `outputs/phase-01/main.md` |
| 2 | `outputs/phase-02/ut09-receiver-path.md`, `outputs/phase-02/canonical-reference-table.md`, `outputs/phase-02/code-scope.md`, `outputs/phase-02/orthogonality-checklist.md` |
| 3 | `outputs/phase-03/main.md` |
| 4 | `outputs/phase-04/test-strategy.md` |
| 5 | `outputs/phase-05/main.md` |
| 6 | `outputs/phase-06/main.md` |
| 7 | `outputs/phase-07/ac-matrix.md` |
| 8 | `outputs/phase-08/main.md` |
| 9 | `outputs/phase-09/main.md` |
| 10 | `outputs/phase-10/go-no-go.md` |
| 11 | `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md` |
| 12 | `outputs/phase-12/main.md`, `outputs/phase-12/implementation-guide.md`, `outputs/phase-12/system-spec-update-summary.md`, `outputs/phase-12/documentation-changelog.md`, `outputs/phase-12/unassigned-task-detection.md`, `outputs/phase-12/skill-feedback-report.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 13 | `outputs/phase-13/main.md` |

---

## 関連ドキュメント

- 親タスク: `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/`（#261）
- 直交タスク: `docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md`（#262）
- 直交タスク: U-UT01-09 retry/offset 統一（#263）
- 下流（UT-04）: `docs/30-workflows/ut-04-d1-schema-design/`
- 下流（UT-09 canonical 引き渡し先）: `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`（legacy historical file だが、本 FU01 の追記により canonical receiver note を保持）、`docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/`
- 物理現状: `apps/api/migrations/0002_sync_logs_locks.sql`、`apps/api/src/jobs/sync-sheets-to-d1.ts`
- システム仕様: `.claude/skills/aiworkflow-requirements/references/database-schema.md`
- 親 Phase 2 正本4ファイル:
  - `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/naming-canonical.md`
  - `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/column-mapping-matrix.md`
  - `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/backward-compatibility-strategy.md`
  - `docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/outputs/phase-02/handoff-to-ut04-ut09.md`
