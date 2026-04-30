# Phase 6: 異常系検証

## 異常ケースと挙動

| ケース | 入力 | 期待挙動 | 実装担保 |
| --- | --- | --- | --- |
| 未知 `noteId` で `markResolved` | `note_unknown` | `null` 返却、UPDATE 0 件 | `WHERE note_id=?` ヒット 0 件 |
| 既に resolved の noteId | resolve 済み | `null` 返却、UPDATE 0 件 | `WHERE request_status='pending'` |
| 既に rejected の noteId | reject 済み | `null` 返却、UPDATE 0 件 | `WHERE request_status='pending'` |
| `general` 行を `markResolved` | `note_type='general'` | `null` 返却、`request_status` は NULL のまま | INSERT 時に `request_status=NULL`、pending ガードで除外 |
| 二重申請（同 type 同 member） | 2 回目 POST | 409 DUPLICATE_PENDING_REQUEST | route 側で hasPendingRequest |
| resolved 後の再申請 | resolve 後 POST | 202 + 新規 pending 行 | hasPendingRequest が pending 限定 |
| `markRejected` の reason 空文字 | route から呼ばない | 呼出側 zod で拒否 | helper 自体は reason 文字列を受け取る |

## 同時実行（races）

- 同一 member × 同 type の同時 POST は 1 件目が pending 行を INSERT した後、2 件目は
  `hasPendingRequest=true` で 409。最悪 2 件の pending 行が race で残った場合も
  resolve / reject は行単位で動くため整合性は崩れない（運用で oldest を採用）。
- partial index は member_id × note_type の絞込みコストを軽減し、pending 検索の
  ホットパスで table scan を回避する。

## 不変条件再確認

- #4: 異常パスでも `member_responses` への書き込みなし
- #5: 異常パスでも apps/web から D1 を呼ばない
- #11: 異常パスでも `admin_member_notes` 以外のテーブルを更新しない
