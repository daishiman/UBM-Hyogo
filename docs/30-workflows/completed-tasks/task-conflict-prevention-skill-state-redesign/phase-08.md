# Phase 8: リファクタ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-conflict-prevention-skill-state-redesign |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタ（仕様書の DRY 化 / 整合確認） |
| 視覚証跡区分 | NON_VISUAL |
| 作成日 | 2026-04-28 |
| 上流 | Phase 7 (A-3 / B-1 実装ランブック) |
| 下流 | Phase 9 (品質ゲート) |
| 状態 | pending |

## 目的

Phase 1〜7 で生成した仕様書群について、**重複記述の削減**と**用語の統一**を行う。
仕様書間の参照リンクが正しく張られていることを確認し、Phase 5–7 のランブックと
Phase 2 の設計成果物の間で齟齬がないかを点検する。

## リファクタ観点

### 観点 1: DRY

- 同じ正規表現 / glob が複数ファイルに重複していないか
- fragment 命名規約が phase-02 / phase-06 / phase-07 で一貫しているか
- AC 文言がコピペで揃っているか

### 観点 2: 用語統一

- 「ledger」「ファイル」「成果物」の使い分け
- 「fragment」「entry」「shard」等の揺れ
- A-1 / A-2 / A-3 / B-1 の表記揺れ（A1 / A_1 / A.1 等混在を排除）

### 観点 3: 参照整合

- 各 phase の「参照資料」が実在するパスを指しているか
- artifacts.json の `outputs` 配列と phase-NN.md の「成果物」表が一致するか
- index.md の Phase 一覧と phase-NN.md のメタ情報が一致するか

## 実行タスク

### タスク 1: before/after 比較表作成

**実行手順**:
1. リファクタ前後の差分（重複削除 / 用語統一）を表化
2. `outputs/phase-8/before-after.md` に記録

### タスク 2: 整合チェック

**実行手順**:
1. artifacts.json と index.md の Phase 表を突合
2. 各 phase ファイルのメタ情報と整合させる
3. 不整合を `outputs/phase-8/main.md` に列挙し、修正コミットを別途行う

### タスク 3: AC トレース最終確認

**実行手順**:
1. AC-1 〜 AC-9 が phase-07 の AC マトリクスで解消されているか確認
2. 未解消があれば Phase 7 へ戻す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | Phase 一覧の正本 |
| 必須 | artifacts.json | 機械可読サマリー |
| 必須 | phase-01.md 〜 phase-07.md | リファクタ対象 |
| 必須 | outputs/phase-6/main.md | A-2 ランブックのサマリー |
| 必須 | outputs/phase-6/fragment-runbook.md | fragment 命名と render API の整合確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-8/main.md | リファクタ結果サマリー |
| ドキュメント | outputs/phase-8/before-after.md | 重複削減 / 用語統一の差分表 |

## TDD 検証

- 仕様書のため自動テストなし
- 代替: artifacts.json と各 phase ファイルの一致を目視 + diff で確認

## 完了条件

- [ ] before-after.md / main.md 作成
- [ ] 全 phase ファイルの参照リンクが healthy
- [ ] artifacts.json と index.md / phase-NN.md の Phase 表が一致
- [ ] artifacts.json の Phase 8 を completed に更新

## 次 Phase

- 次: Phase 9 (品質ゲート)
- 引き継ぎ事項: 整合確認結果

## Skill準拠補遺

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。
