# Phase 3: 設計レビュー（判定再解釈方針固定）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| 前 Phase | 2（ギャップ分析・判定） |
| 次 Phase | 4（raw evidence 収集） |
| 主成果物 | outputs/phase-03/main.md |

## 目的

Phase 2 の判定を Phase 4 以降へ進めてよいかを判定する。監査タスクの Phase 4-6 再解釈方針（Phase 4 = raw evidence、Phase 5 = 判定確定、Phase 6 = 誤判定シナリオ）を宣言し、Phase 11 が「再現コマンド実行 → 0 差分確認」に特化する旨を固定する。

## 実行タスク

1. **代替案比較**: 「新設要」「`sync_jobs` 拡張」「新設不要」の 3 案を価値/コスト/整合で比較し、Phase 2 の「新設不要」を採用根拠とともに確定する。
2. **判定再解釈方針の宣言**: Phase 4 = raw evidence（rg/grep）、Phase 5 = verdict 確定、Phase 6 = 誤判定シナリオ、Phase 8/9 = 正本突合に再解釈する旨を §1 冒頭で明示する。
3. **Phase 11 特化の宣言**: UI 変更なしのため screenshot 不要、再現コマンド実行に特化する旨を宣言する。
4. **MINOR/MAJOR 判定**: 判定の論理に穴がないかをレビューし、MINOR は Phase 12 で未タスク化する（0 件でも追跡）。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] 3 代替案比較が記録され「新設不要」採用が確定
- [ ] Phase 4-6 再解釈方針が宣言されている
- [ ] Phase 11 が再現コマンド特化である旨が宣言されている
- [ ] MINOR/MAJOR 判定が記録（0 件なら N/A 理由を残す）

## 成果物/実行手順

- `outputs/phase-03/main.md`
