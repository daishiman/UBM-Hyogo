# Phase 4: テスト設計 — outputs main

日付: 2026-04-28

## サマリ

docs-only / NON_VISUAL タスクに沿い、ADR-0001 の検証観点をテストマトリクスとして設計した。検証は (1) 必須セクション充足 (2) リンク整合性 (3) 単独可読性 (4) 一次資料追跡 (5) backlink 有効性 (6) 既存 hook 構成との非矛盾の 6 軸。Phase 7 カバレッジ確認 / Phase 11 docs walkthrough の入力 ID を採番した。

## 実行結果

- AC × 検証観点のマトリクス作成: 完了
- 自己完結性チェック項目列挙: 完了
- 一次資料追跡手順: 完了
- backlink 有効性確認手順: 完了
- 検証項目 ID 採番（T-01〜T-12）: 完了

## 成果物

- `outputs/phase-4/main.md`
- `outputs/phase-4/test-matrix.md`

## 完了条件チェック

- [x] artifacts.json と outputs 一致
- [x] AC × 観点のマトリクスが Phase 7 / Phase 11 で実行可能な粒度
- [x] commit / push / PR を行っていない

## 次 Phase への引き継ぎ

- Phase 5 実装ランブックは T-01〜T-12 を満たすファイル生成手順を定義
- Phase 11 docs walkthrough は test-matrix の T-01〜T-12 を直接実行
