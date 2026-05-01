# u-ut01-07-sync-log-naming-reconciliation - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | u-ut01-07-sync-log-naming-reconciliation |
| 作成日 | 2026-04-30 |
| ステータス | spec_created |
| taskType | docs-only-design-reconciliation |
| visualEvidence | NON_VISUAL |
| Wave | 1 |
| 親タスク | UT-01 (Sheets→D1 同期方式定義) |
| 下流タスク | UT-04 (D1 データスキーマ設計) / UT-09 (Sheets→D1 同期ジョブ実装) |
| 直交タスク | U-UT01-08 (enum 統一) / U-UT01-09 (retry / offset 統一) |
| sourceIssue | #261（CLOSED） |
| 総Phase数 | 13 |

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

## 受入条件 (AC) — 原典 Issue #261

- **AC-1（命名 canonical 決定）**: `sync_log` 概念名と物理 `sync_job_logs` / `sync_locks` のどちらを canonical とするか決定し、採択理由（破壊的変更コスト評価を含む）が明文化されている
- **AC-2（既存 → 新マッピング表）**: UT-01 Phase 2 論理 13 カラムすべてが、物理側の対応カラム / 物理未実装 / 不要 のいずれかに分類された 1:N マッピング表が存在する
- **AC-3（後方互換戦略）**: no-op / view / rename / 新テーブル+移行 の 4 案比較表と採択結果（および却下理由）が記載され、採択戦略が「データ消失を伴わない」ことが明示されている
- **AC-4（migration 計画）**: UT-04 が参照すべき migration 戦略が決定され、UT-04 引き継ぎ事項として箇条書きされている
- **AC-5（U-UT01-08 / U-UT01-09 直交性確認）**: 本タスクが enum 値 / retry / offset 値の決定を含まないことがチェックリスト形式で確認されている
- **AC-6（システム仕様 drift 解消）**: `.claude/skills/aiworkflow-requirements/references/database-schema.md` の sync 系記述の整合確認 / doc-only 更新案が成果物に含まれている

---

## 成果物

| Phase | 主要成果物 |
| ----- | ---------- |
| 1 | `outputs/phase-01/main.md` |
| 2 | `outputs/phase-02/naming-canonical.md`, `outputs/phase-02/column-mapping-matrix.md`, `outputs/phase-02/backward-compatibility-strategy.md`, `outputs/phase-02/handoff-to-ut04-ut09.md` |
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

- 原典: `docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md`
- 親タスク: `docs/30-workflows/completed-tasks/UT-01-sheets-d1-sync-design.md`
- 下流: `docs/30-workflows/ut-04-d1-schema-design/`、`docs/30-workflows/unassigned-task/U-UT01-07-FU01-ut09-canonical-sync-job-receiver.md`（UT-09 実装受け皿確定）
- 物理現状: `apps/api/migrations/0002_sync_logs_locks.sql`、`apps/api/src/jobs/sync-sheets-to-d1.ts`（Read のみ）
- システム仕様: `.claude/skills/aiworkflow-requirements/references/database-schema.md`
