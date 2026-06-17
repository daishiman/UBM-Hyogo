# Phase 8: リファクタリング

## メタ情報
正本: `outputs/phase-8/phase-8.md`

## 目的
T02 分類 throw の純関数 helper 化（`toDbApiError`）の要否判断基準と rollback 手順を固定する。

## 実行タスク
1. 正本ファイル `outputs/phase-8/phase-8.md` を参照する。

## 統合テスト連携
正本ファイルの統合テスト連携を参照する。

## 参照資料
- `_shared-context.md`（SSOT）
- `outputs/phase-8/phase-8.md`

## 成果物
- `outputs/phase-8/phase-8.md`

## 完了条件
- [x] 正本が存在する。

## 次 Phase への引き継ぎ
- 既定は **inline 維持**（Phase 2 §2.2-4 の確定判断を Phase 8 で再評価し追認）。helper 抽出は明示 trigger（4 箇所目の出現・catch 本体 drift 実績等）を満たすときのみ。
- 変更は catch 4 箇所 + import + spec に局所化されており、`git revert` 1 コミットで完全に旧挙動へ戻る（migration / env / schema 変更なし）。
- Phase 9 は本 Phase の「振る舞い不変チェック」（focused vitest 再緑・#11 grep gate）を品質ゲートとして一括実行する。
