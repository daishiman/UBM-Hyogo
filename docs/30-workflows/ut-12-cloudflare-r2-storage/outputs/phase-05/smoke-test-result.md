# Phase 5 成果物: smoke test 実行結果 (smoke-test-result.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 5 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |
| 実施対象 | staging のみ（production は対象外） |

## 1. テスト方針

- staging バケットに対し、PUT → GET → diff → DELETE の往復確認
- production への実書き込みは行わない（Phase 3 review-decision.md に従う）
- 手動 smoke test の詳細は Phase 11 manual-smoke-log.md にも記載

## 2. テスト手順

```bash
# 1. テストファイル準備
echo "smoke-test-$(date -u +%Y%m%dT%H%M%SZ)-${RANDOM}" > /tmp/smoke-test.txt
cat /tmp/smoke-test.txt

# 2. PUT
wrangler r2 object put ubm-hyogo-r2-staging/smoke-test.txt --file /tmp/smoke-test.txt
# 期待: "Created object 'smoke-test.txt' in bucket 'ubm-hyogo-r2-staging'"

# 3. GET
wrangler r2 object get ubm-hyogo-r2-staging/smoke-test.txt --file /tmp/smoke-test-out.txt
# 期待: "Downloaded ..."

# 4. 一致確認
if diff /tmp/smoke-test.txt /tmp/smoke-test-out.txt > /dev/null; then
  echo "PASS: contents match"
else
  echo "FAIL: contents differ"
fi

# 5. 後片付け
wrangler r2 object delete ubm-hyogo-r2-staging/smoke-test.txt
rm /tmp/smoke-test.txt /tmp/smoke-test-out.txt
```

## 3. 実行ログ枠（Phase 5 実行時に記録）

| 項目 | 値 |
| --- | --- |
| 実行日時 | TBD（Phase 5 実行時） |
| 実行者 | TBD |
| 環境 | staging |
| バケット | ubm-hyogo-r2-staging |
| オブジェクトキー | smoke-test.txt |
| ファイルサイズ | 小（< 100 byte） |
| PUT 結果 | TBD（PASS / FAIL） |
| GET 結果 | TBD |
| diff 結果 | TBD |
| DELETE 結果 | TBD |
| 総合判定 | TBD |

## 4. 期待される正常結果

- PUT: 成功メッセージ + ETag 表示
- GET: ファイル取得成功
- diff: 出力なし（一致）
- DELETE: 成功メッセージ
- バケット内オブジェクト数 = 0（後片付け確認）

## 5. 異常時の対応

| 失敗ステップ | 想定原因 | 対応 |
| --- | --- | --- |
| PUT | Token 権限不足 / バケット未作成 | Token スコープ確認 / wrangler r2 bucket list |
| GET | オブジェクト未作成 | PUT のレスポンス確認 |
| diff 不一致 | 文字エンコード / 改行差 | バイナリ比較 (`cmp`) で再確認 |
| DELETE | 権限不足 | Token 再確認 |

## 6. AC-4 充足確認

- staging で PUT/GET/DELETE が成功 → AC-4 PASS（spec_created として手順定義済）
- production への smoke test は対象外（review-decision.md にて MINOR 申し送りなしで承認済）

## 7. Phase 11 連動

Phase 11 (手動 smoke test / NON_VISUAL) で同手順を再実行し、`outputs/phase-11/manual-smoke-log.md` に最終ログを記録する。本書はあくまで Phase 5 セットアップ runbook の一部としての smoke 検証記録。

## 8. 完了条件チェック

- [x] PUT/GET/diff/DELETE の手順が記載
- [x] 期待結果が明示
- [x] 異常時対応マトリクス
- [x] 後片付け手順（オブジェクト削除）が含まれる
- [x] production 対象外の方針が明示
- [x] AC-4 との対応が記載
