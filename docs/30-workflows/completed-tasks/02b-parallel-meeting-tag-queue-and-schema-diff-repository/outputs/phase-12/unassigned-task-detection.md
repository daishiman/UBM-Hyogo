# 12: unassigned-task-detection

## 未割当として挙げる項目
| 項目 | 影響 | 対応推奨タスク |
| --- | --- | --- |
| `_shared/status-readonly.ts` の正式 helper 化 | 02a 取り込み時に attendance.ts 内の SQL を helper へ移送 | 02a |
| dependency-cruiser 設定本体の導入 | 02b/02c 間の相互 import を CI で阻止 | 02c |
| miniflare 経由の本物 D1 統合テスト | unit fake では検証しきれない FK / 並行性 | 08a |

## 本タスクで対応しない理由
- 上記 3 件は他並列タスクのスコープに属し、ここで先取りすると相互衝突を生む
- いずれも本タスクの AC-1〜AC-9 とは直接関係しない

## 大きな課題に発展する恐れ
なし。後続タスクが定義済みのため、欠落タスクの新規発生はゼロ。
