# Phase 6: 異常系検証 — outputs

resolve workflow が想定する異常系すべてに対して error code とテストケースを対応させた。

| 異常 | 検出箇所 | error code | http | test |
| --- | --- | --- | --- | --- |
| body 形式不正（zod 違反） | route handler | (zod) | 400 | route.test |
| queueId path 欠落 | route handler | - | 400 | route.test |
| queueId 不在 | workflow | queue_not_found | 404 | workflow.test "queue 不在" |
| 既終端からの遷移 | workflow | state_conflict | 409 | workflow.test T6/T7 + route.test AC-4 |
| idempotent 同じ payload | workflow | (success path) | 200 | workflow.test T4/T5 + route.test AC-3 |
| idempotent 別 payload | workflow | idempotent_payload_mismatch | 409 | workflow.test T4-2 |
| race lost (UPDATE changes=0) | workflow | race_lost | 409 | （理論上の path、明示テストは Phase 9 に handoff） |
| member 削除済み | workflow | member_deleted | 422 | workflow.test T10 + route.test AC-7 |
| 未知 tagCode | workflow | unknown_tag_code | 422 | workflow.test T9 + route.test AC-6 |
| confirmed に tagCodes 欠落 | zod / workflow defensive | missing_tag_codes | 400 | schema.test |
| rejected に reason 欠落 / 空 | zod / workflow defensive | missing_reason | 400 | schema.test + route.test AC-2 空 |
| session 無し | requireAdmin | - | 401 | route.test |
| 非 admin session | requireAdmin | - | 403 | （既存 admin gate test がカバー） |

## 完了条件

- [x] 全異常パスに対応する error code とテスト
- [x] http status の整合（4xx 系を一意に決定）
- [x] race_lost は workflow 内で changes=0 検知（実機 D1 依存。本 in-memory test ではスキップ。Phase 9 で言及）
