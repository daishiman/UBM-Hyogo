# Phase 6: 異常系検証

| Case | 実装結果 |
| --- | --- |
| 401 unauthenticated | `requireAdmin` で 401 |
| 403 non-admin | middleware 責務、既存 suite で検証 |
| invalid JSON/body | 400 |
| member not found | 404 |
| session not found | 404 |
| duplicate attendance | 409 + existing |
| deleted member | 422 |
| delete missing attendance | 404 |
| D1 unexpected failure | throw して既存 error handler へ |
| race duplicate | DB PK が 1 件のみ許可 |

2xx 以外の attendance 操作では audit を残さない。成功した add/remove のみ audit row を残す。
