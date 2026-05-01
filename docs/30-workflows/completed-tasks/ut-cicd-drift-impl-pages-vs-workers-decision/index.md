# ut-cicd-drift-impl-pages-vs-workers-decision - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | ut-cicd-drift-impl-pages-vs-workers-decision |
| 作成日 | 2026-05-01 |
| ステータス | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| docsOnly | true |
| 総Phase数 | 13 |

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | spec_created |
| 2 | 設計 | [phase-02.md](phase-02.md) | spec_created |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | spec_created |
| 4 | テスト作成 | [phase-04.md](phase-04.md) | spec_created |
| 5 | 実装 | [phase-05.md](phase-05.md) | spec_created |
| 6 | テスト拡充 | [phase-06.md](phase-06.md) | spec_created |
| 7 | テストカバレッジ確認 | [phase-07.md](phase-07.md) | spec_created |
| 8 | リファクタリング | [phase-08.md](phase-08.md) | spec_created |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | spec_created |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | spec_created |
| 11 | 手動テスト検証 | [phase-11.md](phase-11.md) | spec_created |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | spec_created |
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
  --workflow docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision --phase {{N}} \
  --artifacts "outputs/phase-{{N}}/{{FILE}}.md:{{DESCRIPTION}}"
```

---

## 成果物

| Phase | 主要成果物 |
| ----- | ---------- |
| 1 | `outputs/phase-01/main.md` |
| 2 | `outputs/phase-02/adr-draft.md`, `decision-criteria.md`, `cutover-vs-hold-comparison.md` |
| 3 | `outputs/phase-03/main.md` |
| 4 | `outputs/phase-04/test-strategy.md`, `doc-consistency-checks.md` |
| 5 | `outputs/phase-05/adr-runbook.md`, `doc-update-procedure.md` |
| 6 | `outputs/phase-06/failure-cases.md` |
| 7 | `outputs/phase-07/ac-matrix.md` |
| 8 | `outputs/phase-08/main.md`, `dry-consolidation-map.md` |
| 9 | `outputs/phase-09/main.md`, `quality-gate-checklist.md` |
| 10 | `outputs/phase-10/go-no-go.md`, `review-findings.md` |
| 11 | `outputs/phase-11/main.md`, `manual-smoke-log.md`, `link-checklist.md` |
| 12 | `outputs/phase-12/main.md`, canonical 7 files |
| 13 | `phase-13.md`（pending_user_approval） |

---

*このファイルは Phase 12 close-out で current canonical root に合わせて補正しました。*
