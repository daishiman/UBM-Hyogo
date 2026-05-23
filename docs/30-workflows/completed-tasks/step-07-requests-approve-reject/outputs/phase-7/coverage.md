# Phase 7 coverage

3 spec ファイル合計 23 test case が green。AC-1〜AC-10 のうち UI 振る舞いに該当する AC は全て test で網羅。

| AC | カバー先 |
|----|---------|
| AC-1 list + detail 表示 | TC-21, TC-D-02 |
| AC-2 approve/reject button | TC-D-03/04 |
| AC-3 dialog 開閉 | TC-22, TC-C-01/03 |
| AC-4 reject note 必須 | TC-C-04 |
| AC-5 approve note 任意 | TC-C-06 |
| AC-6 destructive 警告 | TC-23, TC-C-07/10 |
| AC-7 409 toast + refresh | TC-25 |
| AC-8 PII 非露出 | 既存 PII test |
| AC-9 pagination | TC-26 |
| AC-10 busy disabled | TC-D-05, TC-C-08 |
