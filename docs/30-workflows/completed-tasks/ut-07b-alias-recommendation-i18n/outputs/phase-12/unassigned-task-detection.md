# Phase 12 — unassigned task detection

## 判定

新規未タスク 0 件。

## スコープ外確認

| 候補 | 判定 |
| --- | --- |
| 大小文字統一 | 過剰一致防止のため意図的に対象外。運用 feedback が出るまで未タスク化しない。 |
| カタカナ/ひらがな変換 | 意味的正規化に近く、今回の mechanical preprocessor から除外。 |
| 記号除去 | `Email(任意)` のような表記で誤一致を招くため除外。 |
| embedding / 辞書 recommendation | 小規模 pure helper で要件充足済みのため過剰設計。 |

## 関連タスク境界

`UT-07B-schema-alias-hardening-001` は DB constraint / back-fill / retryable continuation を扱う。本 task は `recommendedStableKeys` の label 比較前処理だけを扱い、重複なし。
