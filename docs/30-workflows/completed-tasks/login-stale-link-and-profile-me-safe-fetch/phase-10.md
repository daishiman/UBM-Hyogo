# Phase 10: 最終レビュー

## 受入条件チェック

| AC | 内容 | 判定基準 |
|----|------|---------|
| AC-1 | `/[object Object]` 404 消滅 | Task A 完了＋S-3 grep gate green＋staging Network ログで再現なし（user-gated） |
| AC-2 | `/profile` Server Components render error 解消 | Task B 完了＋S-1 全 TC green＋staging で `/profile` 通常ロード（user-gated） |
| AC-3 | 回帰テスト | S-1/S-2/S-3 + 拡張 TC が `pnpm --filter @ubm-hyogo/web test` で green |
| AC-4 | PR ready | typecheck / lint / verify-pr-ready.sh green |

## blocker チェック

- 新規 D1 schema 変更: なし
- 新規 endpoint 追加: なし
- 新規 secret 投入: なし
- 既存 invariant 違反: なし（#5/#8/#11 維持）
- 既存 API 変更: なし（`apps/api` no-op）

## ゲート判定

- Gate-A: PASS（Phase 5 完了確認後に claude 自動判定）
- Gate-B: pending（user staging deploy 後の runtime 検証）
- Gate-C: pending（user PR レビュー後）

## 残課題

なし（CONST_007 遵守）。Phase 12 detection で 0 件確定後に同期。
