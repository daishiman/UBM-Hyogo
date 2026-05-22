# issue-533-public-profile-builder-attendance-injection - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | issue-533-public-profile-builder-attendance-injection |
| 作成日 | 2026-05-08 |
| ステータス | verified / implementation_complete_pending_pr |
| 総Phase数 | 13 |

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01.md](phase-01.md) | 完了 |
| 2 | 実装設計 | [phase-02.md](phase-02.md) | 完了 |
| 3 | ADR / Privacy Decision | [phase-03.md](phase-03.md) | 完了 |
| 4 | テスト戦略 | [phase-04.md](phase-04.md) | 完了 |
| 5 | 実装手順 | [phase-05.md](phase-05.md) | 完了 |
| 6 | コードレビュー観点 | [phase-06.md](phase-06.md) | 完了 |
| 7 | 静的解析・型チェック | [phase-07.md](phase-07.md) | 完了 |
| 8 | 単体・統合テスト実行 | [phase-08.md](phase-08.md) | 完了 |
| 9 | 契約・不変条件検証 | [phase-09.md](phase-09.md) | 完了 |
| 10 | リスク再評価 | [phase-10.md](phase-10.md) | 完了 |
| 11 | NON_VISUAL Evidence | [phase-11.md](phase-11.md) | 完了 |
| 12 | 仕様同期 | [phase-12.md](phase-12.md) | 完了 |
| 13 | Commit / PR 承認ゲート | [phase-13.md](phase-13.md) | blocked_pending_user_approval |

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
  --workflow /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260508-084931-wt-5/docs/30-workflows/completed-tasks/issue-533-public-profile-builder-attendance-injection --phase {{N}} \
  --artifacts "outputs/phase-{{N}}/{{FILE}}.md:{{DESCRIPTION}}"
```

---

## 成果物

| Phase | 主要成果物 |
| ----- | ---------- |
| 1 | `outputs/phase-01/requirements.md` |
| 2 | `outputs/phase-02/design.md` |
| 3 | `outputs/phase-03/privacy-attendance-public-contract.md` |
| 4 | `outputs/phase-04/test-strategy.md` |
| 5 | `outputs/phase-05/implementation-summary.md` |
| 6 | `outputs/phase-06/review-checklist.md` |
| 7 | `outputs/phase-07/static-analysis.md` |
| 8 | `outputs/phase-08/test-execution.md` |
| 9 | `outputs/phase-09/contract-verification.md` |
| 10 | `outputs/phase-10/risk-review.md` |
| 11 | `outputs/phase-11/main.md`, evidence logs |
| 12 | `outputs/phase-12/*` strict 7 files |
| 13 | user approval gate only |

---

*このファイルは `generate-index.js` によって自動生成されました。*
