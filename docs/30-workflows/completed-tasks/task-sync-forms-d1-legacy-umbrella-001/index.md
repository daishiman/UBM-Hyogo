# task-sync-forms-d1-legacy-umbrella-001 - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | task-sync-forms-d1-legacy-umbrella-001 |
| 作成日 | 2026-04-30 |
| ステータス | spec_created / Phase 12 completed_with_followups |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| 総Phase数 | 13 |

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | 完了 |
| 2 | 設計 | [phase-02.md](phase-02.md) | 完了 |
| 3 | 設計レビューゲート | [phase-03.md](phase-03.md) | 完了 |
| 4 | テスト作成 | [phase-04.md](phase-04.md) | 完了 |
| 5 | 実装ランブック | [phase-05.md](phase-05.md) | 完了 |
| 6 | 異常系検証 | [phase-06.md](phase-06.md) | 完了 |
| 7 | AC マトリクス | [phase-07.md](phase-07.md) | 完了 |
| 8 | DRY 化 | [phase-08.md](phase-08.md) | 完了 |
| 9 | 品質保証 | [phase-09.md](phase-09.md) | 完了 |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | 完了 |
| 11 | 手動 smoke | [phase-11.md](phase-11.md) | 完了 |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | completed_with_followups |
| 13 | PR 作成 | [phase-13.md](phase-13.md) | pending（ユーザー承認待ち） |

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
  --workflow docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001 --phase {{N}} \
  --artifacts "outputs/phase-{{N}}/{{FILE}}.md:{{DESCRIPTION}}"
```

---

## 成果物

| Phase | 主要成果物 |
| ----- | ---------- |
| 1 | `outputs/phase-01/main.md` |
| 2 | `outputs/phase-02/main.md`, `outputs/phase-02/responsibility-mapping.md` |
| 3 | `outputs/phase-03/main.md` |
| 4 | `outputs/phase-04/main.md` |
| 5 | `outputs/phase-05/main.md` |
| 6 | `outputs/phase-06/main.md` |
| 7 | `outputs/phase-07/main.md`, `outputs/phase-07/ac-matrix.md` |
| 8 | `outputs/phase-08/main.md` |
| 9 | `outputs/phase-09/main.md` |
| 10 | `outputs/phase-10/main.md`, `outputs/phase-10/go-no-go.md` |
| 11 | `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md`, `outputs/phase-11/manual-evidence-bundle.md` |
| 12 | `outputs/phase-12/main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md` |
| 13 | `outputs/phase-13/main.md`, `outputs/phase-13/pr-body.md`（未作成 / ユーザー承認後） |

---

*このファイルは `generate-index.js` によって自動生成されました。*
