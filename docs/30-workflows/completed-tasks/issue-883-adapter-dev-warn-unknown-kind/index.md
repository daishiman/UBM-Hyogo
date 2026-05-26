# issue-883-adapter-dev-warn-unknown-kind - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | issue-883-adapter-dev-warn-unknown-kind |
| 作成日 | 2026-05-25 |
| ステータス | implemented_local_evidence_captured |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| 総Phase数 | 13 |

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01-requirements.md](phase-01-requirements.md) | 完了 |
| 2 | 設計 | [phase-02-architecture.md](phase-02-architecture.md) | 完了 |
| 3 | 設計レビューゲート | [phase-03-task-breakdown.md](phase-03-task-breakdown.md) | 完了 |
| 4 | テスト作成 | [phase-04-contracts.md](phase-04-contracts.md) | 完了 |
| 5 | 実装 | [phase-05-implementation-guide.md](phase-05-implementation-guide.md) | 完了 |
| 6 | テスト拡充 | [phase-06-test-strategy.md](phase-06-test-strategy.md) | 完了 |
| 7 | テストカバレッジ確認 | [phase-07-quality-gates.md](phase-07-quality-gates.md) | 完了 |
| 8 | リファクタリング | [phase-08-definition-of-done.md](phase-08-definition-of-done.md) | 完了 |
| 9 | 品質保証 | [phase-09-risks-and-mitigations.md](phase-09-risks-and-mitigations.md) | 完了 |
| 10 | 最終レビューゲート | [phase-10-local-verification.md](phase-10-local-verification.md) | 完了 |
| 11 | 手動テスト検証 | [phase-11-evidence-inventory.md](phase-11-evidence-inventory.md) | 完了 |
| 12 | ドキュメント更新 | [phase-12-documentation.md](phase-12-documentation.md) | 完了 |
| 13 | PR作成 | [phase-13-commit-and-pr.md](phase-13-commit-and-pr.md) | 未実施 |

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
  --workflow docs/30-workflows/issue-883-adapter-dev-warn-unknown-kind --phase {{N}} \
  --artifacts "outputs/phase-{{N}}/{{FILE}}.md:{{DESCRIPTION}}"
```

---

## 成果物

| Phase | 主要成果物 |
| ----- | ---------- |
| 1 | - |
| 2 | - |
| 3 | - |
| 4 | - |
| 5 | - |
| 6 | - |
| 7 | - |
| 8 | - |
| 9 | - |
| 10 | - |
| 11 | - |
| 12 | - |
| 13 | - |

---

*このファイルは `generate-index.js` によって自動生成されました。*
