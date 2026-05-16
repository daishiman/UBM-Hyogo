# Phase 7: カバレッジ確認

## 対象範囲

`scripts/ci/verify-workflow-doc-refs.sh` の変更行のみ（広域 coverage は対象外）。

## 確認項目

| ブランチ | TC | 期待 |
|---------|----|------|
| 引数 parse `--root` | TC-01〜TC-07 fixture 実行 | カバー |
| 引数 parse `--workflows` | 未追加 | 未カバー |
| 不明引数 → exit 2 | 未追加 | 未カバー |
| docs 参照 0 件 | TC-03 URL 除外後 | カバー |
| URL 除外分岐 | TC-03 | カバー |
| URL と local missing 混在行 | TC-04 | カバー |
| anchor 除去分岐 | TC-05 | カバー |
| missing 検出分岐 | TC-02 / TC-04 | カバー |
| OK 経路 | TC-01 / TC-07 | カバー |

shell script のため line coverage 計測は対象外。今回の契約に必要な主要分岐がテスト fixture で踏まれることを Phase 9 QA でレビューする。
