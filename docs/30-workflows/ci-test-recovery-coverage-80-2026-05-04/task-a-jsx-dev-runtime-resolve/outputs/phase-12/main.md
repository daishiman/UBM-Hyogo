# Task A jsx-dev-runtime 解決 — 実装ガイド (main.md)

## Part 1: 中学生向け説明

このタスクは「コンピュータプログラムの「テスト」（自動チェック）の問題を直す」作業です。

- 現在の問題: テストを動かそうとすると一部が動かなかったり、テストでチェックできている範囲（カバレッジ）が目標の 80% に届いていません
- 直す方法: jsx-dev-runtime 解決 の中で、足りない部分を補うコード（テスト）や設定を加えます
- 終わったら: テストが全部動き、カバレッジが 80% を超えれば成功です

## Part 2: 技術者向け説明

### 目的
jsx-dev-runtime 解決 を実施し、本タスクの DoD（index.md / Phase 1 AC 参照）を満たす。

### 実行手順サマリ
1. Phase 1: baseline 取得（log / json）
2. Phase 2-3: 設計書策定 + レビュー
3. Phase 4-6: テスト設計 / 実装 / ローカル検証
4. Phase 7-9: 統合テスト / 受入 / 品質ゲート
5. Phase 10-11: 最終レビュー / evidence 収集
6. Phase 12: ドキュメント整備（本ファイル含む 7 必須成果物）
7. Phase 13: PR 作成（ユーザ承認後のみ）

### 参照
- 親 wave `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/outputs/phase-{1,2,3}/`
- index.md / artifacts.json
