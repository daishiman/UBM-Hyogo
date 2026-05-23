# Phase 1 — 要件定義 実行結果

## 判定

completed。

## 確定要件

- `GET /admin/schema/diff` の `recommendedStableKeys` 候補順を、多言語 label の表記揺れに強くする。
- 比較前処理は `NFKC + trim + whitespace 圧縮` に限定する。
- response shape、DB schema、UI 表示、alias apply workflow は変更しない。

## 受入条件

- `normalizeLabelForCompare` を pure helper として追加する。
- 日本語、全角半角、空白揺れ、過剰一致 negative case を focused tests で固定する。
- UT-07B schema alias hardening とは大規模 back-fill / retryable contract の責務を分離する。
