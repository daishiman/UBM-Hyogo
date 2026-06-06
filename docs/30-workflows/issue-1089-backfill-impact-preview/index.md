# issue-1089-backfill-impact-preview - タスク実行仕様書

## メタ情報

| 項目 | 内容 |
| ---- | ---- |
| 機能名 | issue-1089-backfill-impact-preview |
| 作成日 | 2026-06-05 |
| ステータス | implemented_local_runtime_pending |
| 総Phase数 | 13 |

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-1.md](phase-1.md) | 完了 |
| 2 | 設計 | [phase-2.md](phase-2.md) | 完了 |
| 3 | 設計レビューゲート | [phase-3.md](phase-3.md) | 完了 |
| 4 | テスト作成 | [phase-4.md](phase-4.md) | 完了 |
| 5 | 実装 | [phase-5.md](phase-5.md) | 完了 |
| 6 | テスト拡充 | [phase-6.md](phase-6.md) | 完了 |
| 7 | テストカバレッジ確認 | [phase-7.md](phase-7.md) | 完了 |
| 8 | リファクタリング | [phase-8.md](phase-8.md) | 完了 |
| 9 | 品質保証 | [phase-9.md](phase-9.md) | 完了 |
| 10 | 最終レビューゲート | [phase-10.md](phase-10.md) | 完了 |
| 11 | 手動テスト検証 | [phase-11.md](phase-11.md) | runtime screenshot pending |
| 12 | ドキュメント更新 | [phase-12.md](phase-12.md) | 完了 |
| 13 | PR作成 | [phase-13.md](phase-13.md) | user-gated pending |

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
  --workflow docs/30-workflows/issue-1089-backfill-impact-preview --phase {{N}} \
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

## Current Implementation Summary

- `POST /admin/sync/responses?dryRun=true&fullSync=true` の read-only preview 経路を実装済み。
- `ManualFormResyncPanel` は preview 成功後のみ全件 backfill を有効化し、confirm 文言に実数を埋め込む。
- Phase 12 strict 7 は `outputs/phase-12/` に present。
- runtime screenshot、staging deploy、`SYNC_ADMIN_TOKEN` 投入、commit、push、PR は user-gated。

---

*このファイルは `generate-index.js` によって自動生成されました。*
