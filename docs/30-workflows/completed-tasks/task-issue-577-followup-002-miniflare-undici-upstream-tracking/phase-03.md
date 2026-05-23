# Phase 3: 設計レビュー

## 代替案比較

| 案 | 概要 | 利点 | 欠点 | 判定 |
| --- | --- | --- | --- | --- |
| A: 手動月次 triage | qa-tests が `gh api` で月次手動チェック | キーワード semantic 判定が確実 / 追加インフラ不要 / コスト 0 | 担当者の作業漏れリスク | **採用** |
| B: GitHub Actions cron | scheduled workflow で triage 表を自動生成 | 漏れない | grep hit はあっても改善判定までは自動化困難 / 軸B 問題が低頻度のため運用コスト過剰 | 不採用（次サイクル以降検討） |
| C: Renovate 拡張 | minor/major bump 通知に頼る | 既存仕組み流用 | changelog 中の socket 改善検知は対象外 | 不採用（補助のみ） |
| D: Dependabot | 同上 | 既存仕組み流用 | 同上 | 不採用（補助のみ） |

## 採用根拠

- 軸B 起因の問題は **低頻度・高影響** のため、月次手動 triage（A）が ROI 最良
- 自動化（B）は triage キーワード semantic 判定までは現状困難で、誤検知時のノイズコストが大きい
- C/D は version bump 通知としては併用可能だが、本タスクの一次チャネルにはしない

## A/B 評価判定の妥当性

- 連続 3 回 PASS / 0 EADDRNOTAVAIL 基準は Issue #577 軸B 採用時の判定基準と一致（symmetry 担保）
- `--maxWorkers=auto` を最終候補に含めることで「上限まで戻せるか」を明示判定
- `--maxWorkers=2` から段階的に上げる順序を運用ルール化（いきなり `auto` から始めない）

## リスク再評価

| リスク | 軽減策 |
| --- | --- |
| triage キーワード false negative | キーワード追加可能 / 削減不可ルール |
| A/B で flaky 採用 | 連続 3 回 PASS 必須 / 1 度でも EADDRNOTAVAIL で不採用 |
| macOS local と Linux CI で挙動差 | Phase 6 で差分検知時の rollback 手順を明記 |
| 改善 release 後の regression | 採用後は次サイクルで再 triage 必須 |

## PASS-MINOR-MAJOR 判定

- **PASS**: 案 A 採用 + triage 表 + A/B 判定基準が確定
- MINOR 課題: cron 化は将来検討（次サイクル）
- MAJOR 課題: なし

## 次フェーズへの引き継ぎ事項

Phase 4 で A/B 採用判定基準（連続 3 回 / 0 EADDRNOTAVAIL）と evidence 命名規則を明文化する。
