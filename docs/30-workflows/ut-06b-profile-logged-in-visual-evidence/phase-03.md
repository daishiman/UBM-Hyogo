# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-30 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 で確定した「local + staging 両方取得」の妥当性を 3 つの代替案と比較し、PASS / MINOR / MAJOR の 3 段階で正式採用する。

## 代替案比較

| # | 案 | 概要 | コスト | リスク | 判定 |
| --- | --- | --- | --- | --- | --- |
| A | local fixture only | M-08〜M-10 のみ取得、M-14〜M-16 を 09a へ委譲 | 低 | staging 観測欠落で 不変条件 #4/#5 を実環境で証跡化できない | MAJOR（不採用） |
| B | staging only | M-14〜M-16 のみ、M-08〜M-10 を skip | 中（staging 依存） | local での再現困難、M-08〜M-10 が pending のまま 06b workflow が closed-loop 化できない | MAJOR（不採用） |
| C | 両方取得（採用） | local M-08〜M-10 + staging M-14〜M-16 | 中 | 取得手順の重複 → runbook で吸収 | PASS |

## レビュー観点

- **再現性**: 案 C は local fixture と staging 双方で観測でき、後続の re-capture も runbook で再現可能。
- **secret hygiene**: 案 B/C 共に staging session token を扱うが、`*.devtools.txt` には URL の path のみ、Cookie / Authorization は記録しない（Phase 9 gate）。
- **コスト**: 案 C のコスト追加分は runbook 1 つ + DevTools snippet 1 つの差分のみ。
- **整合性**: 親タスク AC が 5 件すべて両環境を含むため、案 C のみ AC 完全充足。

## PASS / MINOR / MAJOR

| 評価項目 | 結果 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 10 evidence files + Phase 11 補助 metadata で #4/#5/#8/#11 を観測 |
| 実現性 | PASS | 05a/05b で session 機構利用可能 |
| 整合性 | PASS | 親 AC 5 件と 1:1 |
| 運用性 | MINOR | 手動取得のため runbook 完成度が必須（Phase 5 で解消） |

総合: **PASS（軽微改善あり、Phase 5 runbook に吸収）**

## 実行タスク

- [ ] 3 案比較表を `outputs/phase-03/main.md` に記録
- [ ] PASS / MINOR / MAJOR 判定の根拠記述
- [ ] MINOR 改善（runbook 完成度）を Phase 5 タスクに反映するメモ

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | 設計 |
| 必須 | outputs/phase-02/evidence-naming.md | 10 evidence files + Phase 11 補助 metadata |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | evidence チェックリストの粒度 |
| Phase 5 | MINOR の runbook 補強要望 |

## 完了条件

- [ ] 3 案比較表完成
- [ ] PASS / MINOR / MAJOR 判定済み
- [ ] MINOR 改善要望が Phase 5 へ伝達

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 3 を completed

## 次 Phase

- 次: Phase 4 (テスト戦略)
- 引き継ぎ: 案 C 採用、10 evidence files + Phase 11 補助 metadata を test 観点でリスト化
