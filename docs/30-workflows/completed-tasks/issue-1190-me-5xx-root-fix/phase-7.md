# Phase 7: カバレッジ確認

## メタ情報
正本: `outputs/phase-7/phase-7.md`

## 目的
変更ブロック（catch 4 箇所 + 条件付き stack spread）の line/branch カバレッジを確認する。

## 実行タスク
1. 正本ファイル `outputs/phase-7/phase-7.md` を参照する。

## 統合テスト連携
正本ファイルの統合テスト連携を参照する。

## 参照資料
- `_shared-context.md`（SSOT）
- `outputs/phase-7/phase-7.md`

## 成果物
- `outputs/phase-7/phase-7.md`

## 完了条件
- [x] 正本が存在する。

## 次 Phase への引き継ぎ
- カバレッジ目標は変更ブロック限定（line/branch 100% 目標・全体閾値は非引き上げ）。確認コマンドは focused vitest + `--coverage.include` の 2 ファイル限定。
- Phase 8 は分類 catch ブロックの純関数抽出要否を再評価する（Phase 2 §2.2 の「共通化しない」判断の再確認）。
