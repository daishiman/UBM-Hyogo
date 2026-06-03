# 未タスク検出レポート — tag master (tag_definitions) write endpoints

**[実装区分: 実装仕様書]**

## 検出サマリー

- Issue #1035 の受入条件（AC-1..AC-7）は **本仕様書で全達成設計**（endpoint / repository / audit / spec / regression にすべて写像済み）。AC 内の未割当はゼロ。
- 一方、issue #1035 の **スコープ外（AC に含まれない別関心事）** として、将来候補 **3 件** を formalize する。いずれも「先送り」ではなく、issue #1035 の AC に **含まれない独立した関心事**であり、実施時期・実施場所（別 Issue）を明記する。

## current / baseline 分離

| 区分 | 内容 |
| --- | --- |
| **current（issue #1035 AC スコープ内）** | tag master CRUD endpoint 群（GET/POST/PATCH/DELETE）+ repository write 関数 + audit 型拡張 + 正本 spec 更新 + AC-7 regression。本仕様書で全達成設計（未割当 0 件） |
| **baseline（issue #1035 AC スコープ外・将来候補）** | U-1 / U-2 / U-3（下記）。issue #1035 の AC に含まれず、別 Issue で実施 |

## baseline 未タスク候補（3 件）

### U-1: UI drawer inline-create 導線

| 項目 | 内容 |
| --- | --- |
| 関心事 | `apps/web` admin-ui の drawer から tag を inline で新規作成し、その場で member に付与する UX 導線 |
| issue #1035 との関係 | **AC に含まれない**。issue 本文「苦戦箇所」に導線設計が割れる旨の記載のみで、AC-1..AC-7 はすべて API endpoint。UI 統合は issue #1035 のスコープ外 |
| なぜ先送りではないか | 本タスクは tag master の **write API（裏側の窓口）** を提供することが責務。UI 導線は API を消費する別レイヤ（`apps/web`）の関心事であり、本サイクルの責務境界外。API が無ければ UI も作れないため、API（本タスク）が先に独立完結する設計 |
| 実施場所 | 別 Issue（`apps/web` admin-ui drawer）。本タスク（tag master CRUD API）完了後に着手可能 |
| 実施時期 | API 実装サイクル完了後 |

### U-2: tag code rename 要件

| 項目 | 内容 |
| --- | --- |
| 関心事 | tag の `code`（UNIQUE 識別子）を後から付け替える（rename）機能 |
| issue #1035 との関係 | **AC に含まれない**。本仕様は PATCH を label/category のみに限定し `code` を **immutable** と確定した（Phase 3 C-3）。rename は AC-2 の範囲外 |
| なぜ先送りではないか | code immutable は本タスクの設計判断（409 衝突回避 + member_tags 参照整合維持 + MVP スコープ最小化）であり、rename を「やり残した」のではなく「意図的にスコープから外した」別関心事。rename には member_tags 参照の移行・409 churn 対策・seed/UI 整合という追加設計が必要 |
| 実施場所 | 別 Issue（rename 要件が確定したら起票） |
| 実施時期 | 誤った code で大量作成された等の具体 need が出てから |

### U-3: 物理削除 / reactivate endpoint

| 項目 | 内容 |
| --- | --- |
| 関心事 | tag master の物理削除（行削除）、および論理削除した tag を `active=1` に戻す reactivate endpoint |
| issue #1035 との関係 | **AC に含まれない**。AC-3 は論理削除（`active=0`）のみ。followup-002 でもスコープ外明記済み |
| なぜ先送りではないか | 論理削除（本タスク）と物理削除/reactivate は別の運用要件。物理削除は member_tags 参照整合（孤児 row）の追加設計を要し、reactivate は code 再衝突の検討を要する。本タスクの「片づける（論理削除）」とは独立した関心事 |
| 実施場所 | 別 Issue（誤作成 tag 整理 / 復活運用が確定したら起票） |
| 実施時期 | 物理削除 / reactivate の運用 need が確定してから |

## 関連タスク差分確認（FB-CANCEL-004-2: 重複起票防止）

- **既存 Issue #1035（本タスク, CLOSED）**: 本 workflow で tag master CRUD の実装仕様書を作成。AC は全達成設計。U-1/U-2/U-3 は #1035 の AC に含まれない別関心事のため、#1035 とは重複しない。
- **親 issue-982（completed）**: member_tags write + tag master read。本タスク（tag master write）は親の上に積む第3経路で、機能重複なし。
- U-1（UI drawer）は `apps/web` admin-ui、本タスクは `apps/api`。レイヤが異なり重複なし。
- U-2 / U-3 は本タスクで明示的にスコープ外と確定した設計判断由来であり、重複起票にはならない（起票時は本レポートを参照元にする）。

## コードコメント / skip 由来の未タスク（本サイクルでは該当なし）

| ソース | 確認 | 結果 |
| --- | --- | --- |
| コードコメント TODO/FIXME/HACK/XXX | 本サイクルで追加・変更した `apps/api` 実装と focused tests を確認 | 0 件 |
| `describe.skip` / `it.skip` | 新規 focused tests（`tags.contract.spec.ts` / `tagDefinitions.write.repository.spec.ts`）と関連 regression tests を確認 | 0 件 |
| Phase 3 レビュー（C-1..C-5） | すべて Phase 4 のテストケースに織り込み済み（同サイクル設計内で消化） | 未タスク化不要 |

## 結論

issue #1035 AC スコープ内の未割当は **0 件**（本仕様書で全達成設計）。issue スコープ外の将来候補として U-1 / U-2 / U-3 の **3 件** を別 Issue 候補として formalize する。いずれも「先送り」ではなく独立した別関心事であり、実施場所・実施時期を上記に明記した。Issue 起票は user-gated。
