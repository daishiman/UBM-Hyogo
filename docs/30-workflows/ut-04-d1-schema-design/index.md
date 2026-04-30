# ut-04-d1-schema-design - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | ut-04-d1-schema-design |
| 作成日 | 2026-04-30 |
| ステータス | 実行中 |
| 総Phase数 | 13 |

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | 完了 |
| 2 | 設計 | [phase-02.md](phase-02.md) | 完了 |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | 完了 |
| 4 | テスト作成 | [phase-04.md](phase-04.md) | 完了 |
| 5 | 実装 | [phase-05.md](phase-05.md) | 完了 |
| 6 | テスト拡充 | [phase-06.md](phase-06.md) | 完了 |
| 7 | テストカバレッジ確認 | [phase-07.md](phase-07.md) | 完了 |
| 8 | リファクタリング | [phase-08.md](phase-08.md) | 完了 |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | 完了 |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | 完了 |
| 11 | 手動テスト検証 | [phase-11.md](phase-11.md) | 完了 |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | 完了 |
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
3. **artifacts.json更新**: `complete-phase.js` でPhase完了ステータスを更新
4. **完了条件チェック**: 各タスクを完遂した旨を必ず明記

```bash
# Phase完了処理
node .claude/skills/task-specification-creator/scripts/complete-phase.js \
  --workflow docs/30-workflows/ut-04-d1-schema-design --phase {{N}} \
  --artifacts "outputs/phase-{{N}}/{{FILE}}.md:{{DESCRIPTION}}"
```

---

## 成果物

| Phase | 主要成果物 |
| ----- | ---------- |
| 1 | `outputs/phase-01/main.md` |
| 2 | `outputs/phase-02/schema-design.md`, `outputs/phase-02/sheets-d1-mapping.md`, `outputs/phase-02/migration-strategy.md` |
| 3 | `outputs/phase-03/main.md` |
| 4 | `outputs/phase-04/test-strategy.md` |
| 5 | `outputs/phase-05/implementation-runbook.md` |
| 6 | `outputs/phase-06/failure-cases.md` |
| 7 | `outputs/phase-07/ac-matrix.md` |
| 8 | `outputs/phase-08/main.md` |
| 9 | `outputs/phase-09/main.md`, `outputs/phase-09/free-tier-estimation.md` |
| 10 | `outputs/phase-10/go-no-go.md` |
| 11 | `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md` |
| 12 | `outputs/phase-12/implementation-guide.md`, `outputs/phase-12/system-spec-update-summary.md`, `outputs/phase-12/documentation-changelog.md`, `outputs/phase-12/unassigned-task-detection.md`, `outputs/phase-12/skill-feedback-report.md`, `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 13 | - |

---

*このファイルは `generate-index.js` によって自動生成されました。*
