# Phase 8: DRY化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY化 |
| 作成日 | 2026-05-01 |
| 前 Phase | 7 |
| 次 Phase | 9 |
| 状態 | spec_created |

## 目的

Phase 5で更新した aiworkflow-requirements の記述重複、staleなpending表現、expected/appliedの混在を整理する。

## 実行タスク

1. current applied / pending / expected の表現を分離する。
2. 同じbranch protection値が複数箇所で矛盾していないか確認する。
3. `Refs #303` と evidence path の表記を統一する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 5 | phase-05.md | 更新対象 |
| Phase 7 | phase-07.md | AC対応 |

## 実行手順

```bash
rg -n "blocked_until_user_approval|contexts=\\[\\]|verify-indexes-up-to-date|Refs #303|Closes #303" .claude/skills/aiworkflow-requirements docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001
```

`blocked_until_user_approval` は上流placeholder説明としてのみ残し、current applied節には残さない。`Closes #303` が見つかった場合は `Refs #303` に修正する。

## 統合テスト連携

Phase 9でDRY後のgrep結果を再確認する。

## 多角的チェック観点

- 表記統一が実値改変になっていないか。
- stale表現を削除する時、履歴として必要な記述まで消していないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 重複検出 | pending |
| 2 | 表記統一 | pending |
| 3 | stale表現整理 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/refactor-notes.md | DRY化記録 |

## 完了条件

- [ ] current / expected / pending の記述境界が明確
- [ ] `Closes #303` が存在しない
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-08/refactor-notes.md` を作成
- [ ] `artifacts.json` の Phase 8 状態を更新

## 次Phase

Phase 9: 品質保証
