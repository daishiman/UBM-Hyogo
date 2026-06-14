# Phase 6: テスト拡充

## メタ情報
正本: `outputs/phase-6/phase-6.md`

## 目的
fail path と回帰 guard（fail-soft 時のログ 1 回だけ・既存 200/401/410 回帰・problem+json header・leak 検査）を拡充する。

## 実行タスク
1. 正本ファイル `outputs/phase-6/phase-6.md` を参照する。

## 統合テスト連携
正本ファイルの統合テスト連携を参照する。

## 参照資料
- `_shared-context.md`（SSOT）
- `outputs/phase-6/phase-6.md`

## 成果物
- `outputs/phase-6/phase-6.md`

## 完了条件
- [x] 正本が存在する。

## 次 Phase への引き継ぎ
- 追加ケース P6-1〜P6-9（fail-soft ログ単一発火・P2 admin_users 分類・header 契約・leak・410/401 優先順位回帰・non-Error throw 分岐）を RED→GREEN 方針付きで定義済み。
- Phase 7 はこれらが変更ブロックの line/branch に到達することを確認する。
