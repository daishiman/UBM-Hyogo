# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト拡充 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 5 |
| 下流 | Phase 7 (カバレッジ確認) |
| 状態 | pending |

## 目的

Phase 4 のテストシナリオに対し、エッジケース / 退行観点 / バージョン依存観点を補強する。
本タスクは検証実施を行わないため、追加 TC の **設計** のみが対象。

## 拡充観点

### EX-1: バージョン差テスト

| TC | 内容 | 期待結果 |
| --- | --- | --- |
| TC-VERIFY-EX-01 | 現行 Claude Code バージョンで TC-VERIFY-01 を実施 | blocked / 実行が一意に観測 |
| TC-VERIFY-EX-02 | 1 つ前のメジャーバージョンで再実施（任意） | 結果差分があれば記録（差分がなければスキップ） |

### EX-2: deny pattern 表記揺れ

| TC | 内容 | 期待結果 |
| --- | --- | --- |
| TC-VERIFY-EX-03 | `Bash(git push --force *)`（スペース版）と `Bash(git push --force:*)`（コロン版）の挙動差 | 評価器の解釈差を観測（差分はリスクとして記録） |
| TC-VERIFY-EX-04 | glob pattern `Write(/etc/**)` と `Write(/etc/*)` の差 | 同上 |

### EX-3: 起動順序差

| TC | 内容 | 期待結果 |
| --- | --- | --- |
| TC-VERIFY-EX-05 | `--dangerously-skip-permissions` 単独 | 観測 |
| TC-VERIFY-EX-06 | `--permission-mode bypassPermissions` 単独 | 観測 |
| TC-VERIFY-EX-07 | 両方併用 | 観測（メイン TC） |

### EX-4: settings 階層差

| TC | 内容 | 期待結果 |
| --- | --- | --- |
| TC-VERIFY-EX-08 | isolated repo の `.claude/settings.json` のみに deny | 観測 |
| TC-VERIFY-EX-09 | `.claude/settings.local.json` のみに deny | 観測（メイン TC） |

## カバレッジへの寄与

| 観点 | 寄与する TC |
| --- | --- |
| バージョン依存性 | EX-1 |
| 表記揺れ耐性 | EX-2 |
| フラグ組み合わせ | EX-3 |
| settings 階層 | EX-4 |

## 拡充の優先度

| 優先度 | 内容 |
| --- | --- |
| 必須 | EX-3（メイン挙動の単独 / 併用比較） |
| 推奨 | EX-2（pattern 表記揺れ）/ EX-4（階層差） |
| 任意 | EX-1（バージョン差は次回の再検証で実施可） |

## 主成果物

- `outputs/phase-6/main.md`（追加 TC 一覧 + 優先度）

## スコープ外

- 検証実施
- 自動化

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- Phase 4: `outputs/phase-4/`
- Phase 5: `outputs/phase-5/`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] EX-1〜EX-4 が main.md に揃う
- [ ] 優先度が必須 / 推奨 / 任意で明示されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは検証実施タスクで実行する。
ここでは手順、証跡名、リンク整合のみを固定する。
