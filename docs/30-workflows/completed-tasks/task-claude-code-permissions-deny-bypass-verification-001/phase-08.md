# Phase 8: リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング |
| 作成日 | 2026-04-28 |
| 上流 | Phase 7 |
| 下流 | Phase 9 (品質保証) |
| 状態 | pending |

## 目的

docs-only タスクのため、コードリファクタリングは行わない。代わりに以下の **ドキュメント面のリファクタ**
を実施する：

- 重複記述の削除
- runbook の冗長性削減
- 用語統一（deny / 拒否 / block）
- 章構成の整流化

## リファクタリング観点

### RF-1: 用語統一

| 揺れ語 | 統一語 |
| --- | --- |
| deny / 拒否 / block | **deny**（英語） |
| skip / dangerously-skip / 危険スキップ | **`--dangerously-skip-permissions`**（フラグ表記） |
| isolated repo / 隔離 repo / 一時 repo | **isolated repo** |
| 検証 / verification / 確認 | **検証**（日本語、固有名詞は英語維持） |

### RF-2: 重複削除

| 重複箇所 | 対応 |
| --- | --- |
| Phase 5 runbook Section 5 と TC-VERIFY-01〜04 の対応表 | runbook 側に「TC-VERIFY-01 を参照」と統合 |
| Risk R-3 と Phase 5 安全チェック | runbook 側を正、Phase 3 はサマリのみ |
| AC リストが index / phase-01 で重複 | index を正、phase-01 は draft とする |

### RF-3: 章構成

- Phase 5 runbook の Section 番号を Section 1〜7 に統一
- 全 Phase の `主成果物` セクションを `artifacts.json` の `outputs[]` と完全一致させる

### RF-4: link 整合

- 上流参照: `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/...` のパス整合
- 下流参照: `task-claude-code-permissions-apply-001` の存在確認（存在しなければ「未作成」と明記）

## リファクタリング判定

| 項目 | 判定 |
| --- | --- |
| 大規模再構成 | 不要（spec_created 範囲内で完結） |
| 章番号の振り直し | 必要（RF-3） |
| 用語統一 | 必要（RF-1） |

## 主成果物

- `outputs/phase-8/main.md`（リファクタ実施記録）

## スコープ外

- コード修正
- 仕様の本質変更（仕様変更は Phase 2 へ差戻）

## Skill準拠補遺

## 実行タスク

- 本文に記載のタスクを実行単位とする
- docs-only / spec_created の境界を維持する

## 参照資料

- Phase 1〜7 全成果物
- Phase 6: `outputs/phase-6/main.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする

## 完了条件

- [ ] RF-1〜RF-4 が実施される
- [ ] 用語の揺れが 0 件
- [ ] link 切れが 0 件

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは検証実施タスクで実行する。
ここでは手順、証跡名、リンク整合のみを固定する。
