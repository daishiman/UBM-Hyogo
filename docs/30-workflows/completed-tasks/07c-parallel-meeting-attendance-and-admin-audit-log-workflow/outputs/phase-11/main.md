# Phase 11: 手動 Smoke

## 実施結果

API 実装のため、ブラウザ screenshot ではなく Vitest による D1/API smoke を evidence とする。

| Scenario | Evidence | Result |
| --- | --- | --- |
| add attendance | route test `正常系 201 + audit` | PASS |
| duplicate attendance | route test `重複は 409 + existing row` | PASS |
| deleted member exclusion | route test `candidates は削除済みと登録済みを除外する` | PASS |
| delete attendance + audit | route test `DELETE 200 + audit, missing row 404` | PASS |
| 401 | route test `authz: 401` | PASS |

Screenshot: UI 差分なしのため N/A。後続 08b Playwright E2E が `/admin/meetings` visual smoke を担当。
