# Phase 11: NON_VISUAL walkthrough

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 11 / 13 |
| Phase 名称 | NON_VISUAL walkthrough |
| 作成日 | 2026-05-01 |
| 前 Phase | 10 |
| 次 Phase | 12 |
| 状態 | spec_created |

## 目的

UIを伴わない governance specification reflection として、スクリーンショットなしの文書・コマンド証跡 walkthrough を実施する。

## 実行タスク

1. `outputs/phase-11/main.md` を作成する。
2. `outputs/phase-11/manual-smoke-log.md` にコマンド実行結果を記録する。
3. `outputs/phase-11/link-checklist.md` に参照リンクを記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 10 | phase-10.md | GO/NO-GO |
| skill template | .claude/skills/task-specification-creator/references/phase-template-phase11.md | NON_VISUAL必須3点 |

## 実行手順

### ステップ 1: NON_VISUAL確認

```bash
jq -r '.metadata.visualEvidence' docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/artifacts.json
```

### ステップ 2: walkthrough

Phase 9のコマンド結果、Phase 10のGO/NO-GO、Phase 12成果物へのリンクを確認する。

## 統合テスト連携

スクリーンショットは作成しない。代替証跡3点で完了判定する。

## 多角的チェック観点

- screenshotが必要なUI変更は存在しない。
- リンク切れをPhase 12へ持ち越さない。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | main作成 | pending |
| 2 | manual smoke log作成 | pending |
| 3 | link checklist作成 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | walkthrough index |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | コマンド証跡 |
| ドキュメント | outputs/phase-11/link-checklist.md | リンク確認 |

## 完了条件

- [ ] NON_VISUAL必須3点が存在する
- [ ] screenshotを作成していない
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-11/*` を作成
- [ ] `artifacts.json` の Phase 11 状態を更新

## 次Phase

Phase 12: ドキュメント更新
