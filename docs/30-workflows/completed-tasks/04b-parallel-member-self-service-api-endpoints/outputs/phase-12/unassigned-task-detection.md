# Phase 12 — Unassigned Task Detection

## 本タスクで未消化 / 下流タスクへ委譲した項目

| 項目 | 委譲先タスク | 内容 |
| --- | --- | --- |
| Auth.js cookie session resolver | 05a / 05b | 現状 dev Bearer token のみ。本番 cookie ベースに置換 |
| KV / D1 ベース cross-isolate rate limit | 将来 | MVP は in-memory 簡易実装 |
| `/me/profile` UI 消費 | 06b | SSR/CSR で profile を表示 |
| admin queue resolve workflow (visibility_request / delete_request の処理) | 07a / 07c | admin_member_notes の note_type='visibility_request' を pickup して publish_state 変更 + audit |
| admin queue request status / resolved metadata | 07a / 07c | 現 MVP は「同 type の最新行が存在すれば pending」。処理済み後の再申請許可には status/resolved_at 追加か削除運用の正式化が必要 |

## 本タスクで対応不要と確定した項目

- PATCH /me/profile: 不変条件 #4 違反のため永続的に作らない
- `/no-access` 専用画面: 不変条件 #9 により authGateState で出し分ける

## 上流タスクで未実装だったが本タスクで補強した項目

- `admin_member_notes` への `note_type` 列追加 (migration 0006) — 02c 範囲だが本タスクで実施
- `adminNotes.hasPendingRequest` / `findLatestByMemberAndType` — 02c の adminNotes API に追加
