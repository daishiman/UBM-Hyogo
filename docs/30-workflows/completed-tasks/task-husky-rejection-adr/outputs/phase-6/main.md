# Phase 6: テスト拡充 — outputs main

日付: 2026-04-28

## サマリ

docs-only タスクの想定失敗ケースを列挙し、検出方法と対応を `failure-cases.md` に整理した。リンク切れ・必須セクション欠落・backlink 重複・既存記述書き換え事故・ADR ファイル名規約違反などを網羅。

## 実行結果

- 失敗ケース 8 件を列挙
- 検出方法と対応をペアで記録

## 成果物

- `outputs/phase-6/main.md`
- `outputs/phase-6/failure-cases.md`

## 完了条件チェック

- [x] artifacts.json と outputs 一致
- [x] 失敗ケースが Phase 11 docs walkthrough で検証可能
- [x] commit / push / PR を行っていない

## 次 Phase への引き継ぎ

- Phase 7 カバレッジ確認で test-matrix と failure-cases の二重カバレッジを確認
