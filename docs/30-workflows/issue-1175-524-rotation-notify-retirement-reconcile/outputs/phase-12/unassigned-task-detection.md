# Phase 12: 未タスク検出（unassigned-task-detection）

## 結論

current 未タスク: **0 件**。本タスクで AC-1〜AC-5 を 1 サイクルで完了する設計のため、新規に切り出すべき未タスクは発生しない。baseline（スコープ外・将来候補）2 件は本タスクでは起票しない。

## 関連タスク差分確認

| 確認対象 | 内容 | 重複/差分 |
|----------|------|-----------|
| 親タスク `cf-token-env-contract-and-rotation-retirement` | `cf-token-rotation-reminder.yml` 削除・runbook tombstone 化（completed） | 親は rotation 撤廃そのもの。本タスクは撤廃の **下流整合**（#524 本文）であり責務が異なる。重複なし |
| followup spec `cf-token-env-contract-and-rotation-retirement-followup-001` | #524 整合の推奨（案A） | 本タスクが followup の推奨を実装仕様化したもの。本タスクで吸収済み |
| #524 本体 | post-release dashboard / analytics export の Slack 通知統合スコープ | 残り 2 件の **実装** は #524 本体スコープ。本タスクは本文整合のみ（実装に触れない・不変条件 2） |

## current 未タスク（本タスクで完結・起票不要）

| 候補 | 判定 |
|------|------|
| #524 通知統合対象テーブルからの #407 行削除 | 本タスク AC-1 で完結 |
| dangling 2 パス除去 | 本タスク AC-2 で完結 |
| 撤廃注記追加 + スコープ 2 件縮小 | 本タスク AC-3 で完結 |
| ローカルミラー整合 | 本タスク AC-4 で完結 |
| 検証 6 本 + 回帰 3 本 | 本タスク AC-5 で完結 |

→ current として切り出す未タスクは **0 件**。

## baseline（スコープ外・将来候補・本タスクでは起票しない）

| # | 候補 | 起票しない理由 |
|---|------|----------------|
| B-1 | #524 残り 2 件（post-release dashboard / analytics export）の Slack 通知実装 | #524 **本体スコープ**。本タスクは本文の current facts 整合に限定し、実装には触れない（不変条件 2）。#524 が OPEN のまま実装タスクとして残る |
| B-2 | event-based revocation 通知（漏洩時の Token revoke 通知）の新規実装 | **YAGNI**。Phase 2 案B として検討したが新規通知ソース設計を伴うため別タスク化が望ましい（不変条件 3）。現時点で需要が確定していないため起票しない |

## current / baseline 分離の根拠

- current（0 件）= 本タスク AC で 1 サイクル完了するため新規起票なし。
- baseline（2 件）= 本タスクのスコープ外であり、将来の独立タスク候補として記録のみ行い、本タスクでは Issue 起票しない。

## 完了条件（unassigned-task-detection）

- [x] 関連タスク差分確認（親 / followup / #524 本体）を実施した。
- [x] current 未タスク 0 件を判定した。
- [x] baseline 2 件をスコープ外・起票しない旨と理由つきで記録した。
- [x] current と baseline を分離して記録した。
