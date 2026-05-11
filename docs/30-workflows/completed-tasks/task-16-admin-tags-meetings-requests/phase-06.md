# Phase 6: テスト拡充

> 改訂日: 2026-05-10
> 状態: `completed`

## 1. Fail paths

| ID | 対象 | 期待 |
| --- | --- | --- |
| FP-01 | tag confirm 403 | toast 表示、refresh しない |
| FP-02 | tag reject empty reason | API 未呼出、status 表示 |
| FP-03 | meeting create 403 | 入力を消さず toast |
| FP-04 | meeting attendance 409/422 | 既出席 / 削除済み会員の明示メッセージ |
| FP-05 | request resolve 409 | 他 admin 処理済み toast、refresh |
| FP-06 | request raw PII payload | DOM に raw email を出さない |

## 2. 禁止

`it.skip` で未実装予定を残さない。今回サイクルで実装しない sync button 等は task-16 の DoD から外す。
