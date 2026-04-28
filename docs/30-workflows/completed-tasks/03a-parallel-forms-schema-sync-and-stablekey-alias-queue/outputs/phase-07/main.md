# Phase 7 成果物: AC × 実装トレース — forms-schema-sync-and-stablekey-alias-queue

Phase 1 の AC-1〜AC-8 と Phase 5 実装の対応関係を `ac-matrix.md` に集約する。すべて green を確認。

---

## 1. サマリ

| AC | 状態 | 主な検証 |
| --- | --- | --- |
| AC-1 31 項目 / 6 セクション | green | flatten.test / forms-schema-sync.test |
| AC-2 unresolved を queue に積む | green | diff-queue-writer.test / forms-schema-sync.test |
| AC-3 alias 解決 | green | resolve-stable-key.test |
| AC-4 同 revisionId 再実行 no-op | green | forms-schema-sync.test |
| AC-5 sync_jobs 遷移記録 | green | forms-schema-sync.test / sync-schema route test |
| AC-6 同種 job 排他（409） | green | sync-schema route test |
| AC-7 stableKey 直書き禁止 | green | sync モジュール内 grep 静的検証 |
| AC-8 31 項目欠落なし | green | forms-schema-sync.test |

---

## 2. 不変条件 × 実装

| 不変条件 | 担保箇所 |
| --- | --- |
| #1 stableKey 直書き禁止 | resolveStableKey は mapFormSchema 経由の動的 map を引く。STABLE_KEY_LIST で型限定 |
| #5 D1 は apps/api 限定 | sync 一式は apps/api/src/sync/schema/ 配下 |
| #6 GAS 排除 | Forms API クライアントは packages/integrations-google のみ参照 |
| #10 無料枠 | cron 1 日 1 回 / forms.get 1 回 / D1 write < 100 row |
| #14 schema 集約 | schema_versions / schema_questions / schema_diff_queue / sync_jobs に集約 |

---

## 3. サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC × 実装ファイル対応表 | completed（ac-matrix.md） |
| 2 | 不変条件 × 実装対応 | completed |
| 3 | テスト結果反映 | completed（194/194 PASS）|
