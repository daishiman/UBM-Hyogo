# 未タスク検出レポート — tag master reactivate + physical delete

**[実装区分: implementation / NON_VISUAL / implemented_local_evidence_captured]**

## 検出サマリー

- Issue #1070 の受入条件（AC-1..AC-6）は **本仕様書で全達成設計**（reactivate / physical delete / 参照ガード / audit / logical regression / runbook + user gate にすべて写像）。AC 内の未割当はゼロ。
- 一方、Issue #1070 の **スコープ外（AC に含まれない別関心事）** として、将来候補 **3 件** を formalize する。いずれも「先送り」ではなく独立した関心事であり、実施時期・実施場所（別 Issue）を明記する。

## current / baseline 分離

| 区分 | 内容 |
| --- | --- |
| **current（Issue #1070 AC スコープ内）** | reactivate endpoint + physical delete（参照ガード付き）+ repository lifecycle 関数 + audit 拡張 + 正本 spec 同期 + AC-6 logical regression + AC-4 runbook。本仕様書で全達成設計（未割当 0 件） |
| **baseline（Issue #1070 AC スコープ外・将来候補）** | U-1 / U-2 / U-3（下記）。Issue #1070 の AC に含まれず、別 Issue で実施 |

## baseline 未タスク候補（3 件）

### U-1: physical delete 参照あり時の強制移行 migration

| 項目 | 内容 |
| --- | --- |
| 関心事 | physical delete 対象 tag に `member_tags` 参照があるとき、参照を別 tag へ付け替え（移行）てから物理削除する強制移行経路。本サイクルは 409 `tag_has_references` 拒否に留める |
| Issue #1070 との関係 | **AC に含まれない**。AC-3 は「参照ありの扱い（拒否 or 明示移行）が仕様化」を要求し、本仕様は安全側の **拒否（孤児化禁止）** を確定。強制移行は AC の射程外 |
| なぜ先送りではないか | 強制移行は **不可逆かつ運用合意が必要**な仕様分岐（どの tag に付け替えるか・移行 audit・ロールバック方針）。合意未済のまま実装すると孤児や誤移行を生む。本サイクルは「使っているなら断る」で安全に完結する設計であり、移行は独立した別要件 |
| 実施場所 | 別 Issue（新 migration or 専用 endpoint + runbook）。`member_tags` 移行 SQL + audit 設計を含む |
| 実施時期 | 「誤った tag に大量付与した参照を別 tag へ寄せて元 tag を消す」等の具体 need + 運用合意が確定してから |
| Issue 起票 | user-gated（本サイクルでは起票しない・本レポートを参照元にする） |

### U-2: admin UI からの reactivate / physical delete 導線

| 項目 | 内容 |
| --- | --- |
| 関心事 | `apps/web` admin-ui から reactivate（棚に戻す）/ physical delete（完全削除・参照あり時の 409 表示と確認ダイアログ）を呼ぶ UX 導線 |
| Issue #1070 との関係 | **AC に含まれない**。本 issue の AC-1..AC-6 はすべて API endpoint。UI 統合は #1070 のスコープ外で、issue-1035 followup-001（#1068・admin tag inline-create UI）と同じ `apps/web` admin tag UI の関心事 |
| なぜ先送りではないか | 本タスクの責務は lifecycle write API（裏側の窓口）の提供。UI 導線は API を消費する別レイヤ（`apps/web`）の関心事で、API が無ければ UI も作れないため API が先に独立完結する設計。physical delete は不可逆ゆえ UI 側に確認ダイアログ + 409 referenceCount 表示が必要で、独立した UX 設計を要する |
| 実施場所 | 別 Issue（`apps/web` admin tag UI。#1068 と同領域で統合検討可） |
| 実施時期 | lifecycle API の local 実装完了後（本タスク後） |
| Issue 起票 | user-gated |

### U-3: `member_tags` への DB-level FOREIGN KEY 追加評価

| 項目 | 内容 |
| --- | --- |
| 関心事 | `member_tags.tag_id` に `tag_definitions.tag_id` への DB-level FOREIGN KEY を追加するか評価する |
| Issue #1070 との関係 | **AC に含まれない**。AC-3 は参照あり physical delete の扱いを仕様化する要求であり、本タスクは application-level count guard + 409 拒否で孤児化を防ぐ |
| なぜ先送りではないか | FK 追加は既存 seed / ingest / migration ordering / D1 enforcement の影響評価を伴う schema governance タスク。今回の endpoint 実装とは独立し、合意なしに入れると既存データや fixture を壊す可能性がある |
| 実施場所 | 別 Issue（D1 migration + seed/fixture audit + repository regression） |
| 実施時期 | tag lifecycle API 運用後、DB-level enforcement を強める必要性が確認された時点 |
| Issue 起票 | user-gated |

## 関連タスク差分確認（重複起票防止）

- **既存 Issue #1070（本タスク・CLOSED）**: reactivate + physical delete を実装。AC は全達成。U-1/U-2/U-3 は #1070 の AC に含まれない別関心事のため重複しない。
- **親 issue-1035（completed）**: tag master CRUD + logical delete。本タスク（reactivate / physical）はその上に積む lifecycle 拡張で機能重複なし。
- **#1068（admin tag inline-create UI・spec_created）**: U-2（UI 導線）と同領域。起票時は #1068 と統合 or 後続として整理する（重複起票回避）。
- U-1（強制移行）と U-3（DB-level FK）は本サイクルで明示的にスコープ外と確定した設計判断由来であり、重複起票にはならない。

## コードコメント / skip 由来の未タスク（本サイクルでは該当なし）

| ソース | 確認 | 結果 |
| --- | --- | --- |
| コードコメント TODO/FIXME/HACK/XXX | 本タスク由来の TODO 追加なし | 0 件 |
| `describe.skip` / `it.skip` | 本タスク由来の skip 追加なし | 0 件 |
| Phase 3 レビュー（3.4 リスク） | すべて Phase 4 テスト設計 + runbook に織り込み済み | 未タスク化不要 |

## 結論

Issue #1070 AC スコープ内の未割当は **0 件**（本実装で全達成）。スコープ外の将来候補として U-1（強制移行 migration）/ U-2（admin UI 導線）/ U-3（DB-level FK 評価）の **3 件** を別 Issue 候補として formalize した。いずれも「先送り」ではなく独立した別関心事であり、実施場所・実施時期を上記に明記した。Issue 起票は **user-gated**。
