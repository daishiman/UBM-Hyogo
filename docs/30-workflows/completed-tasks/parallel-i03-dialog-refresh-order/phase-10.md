# Phase 10: リファクタ

## リファクタ候補

| 候補 | 採否 | 理由 |
|------|------|------|
| `useRouter` を 2 dialog で重複 import している点を共通 hook 化 | 不採用 | dialog ごとに 1 行追加のみ。共通化のオーバーヘッドが上回る |
| dialog 内に submit 成功 path の helper (`afterSubmitSuccess`) を抽出 | 不採用 | 順序 3 行のみで helper 化のメリットなし |
| `RequestActionPanel.tsx` の `onSubmitted` を inline 化 | 不採用 | 既存命名で意図が明確。変更スコープ拡大を避ける |
| 型定義 (`QueueAccepted`) の export 整理 | 不採用 | 本タスクのスコープ外 |

## 採用したリファクタ

なし。本タスクは race condition の単点修正であり、追加リファクタは Phase 11 以降の evidence quality を損なうリスクがある。リファクタは別タスク (canonical workflow root への昇格判断を含む) で扱う。

## 残存技術債

- `RequestActionPanel.tsx` から `useRouter` を撤去した場合、他箇所で似た「parent 側で refresh」パターンがないか profile 配下を再確認する（Phase 12 unassigned-task-detection で記録）
- catch / else 分岐で refresh が必要なユースケースが将来生じた場合、本順序契約の例外条項を親仕様 §4.2 に追記する必要あり

## DoD

- [x] `outputs/phase-10/refactor-summary.md` に採否表と残存技術債を記載
