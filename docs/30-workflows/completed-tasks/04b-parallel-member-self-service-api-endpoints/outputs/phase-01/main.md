# Phase 1 — 要件定義 主成果物

## 4 endpoint contract（確定）

| method | path | 認可 | request | response (200/202) | 触れる D1 | 触れる不変条件 |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /me | session 必須 | なし | `{ user: SessionUser, authGateState }` | members / member_identities / member_status / admin_users | #7, #9, #11 |
| GET | /me/profile | session 必須 + 自身のみ | なし | `{ profile: MemberProfile, statusSummary, editResponseUrl, fallbackResponderUrl }` | members / member_responses / response_sections / response_fields / member_field_visibility / member_status | #1, #4, #11, #12 |
| POST | /me/visibility-request | session + active | `{ desiredState, reason? }` | `{ queueId, type:'visibility_request', status:'pending', createdAt }` (202) | admin_member_notes (insert), audit_log (insert) | #4, #11, #12 |
| POST | /me/delete-request | session + active | `{ reason? }` | `{ queueId, type:'delete_request', status:'pending', createdAt }` (202) | admin_member_notes (insert), audit_log (insert) | #4, #11, #12 |

## 上流タスクへの引き渡し要求

| 上流 | 必要 helper / signature |
| --- | --- |
| 02a | `findIdentityByMemberId(memberId)`, `getStatus(memberId)`, `findCurrentResponse(memberId)`, `buildMemberProfile(ctx, memberId)` |
| 02c | `adminNotes.create({ memberId, body, createdBy, noteType })` / `adminNotes.hasPendingRequest(memberId, type)` / `auditLog.append(...)` |
| 03b | `member_responses.edit_response_url` を current_response 取得時に返す |
| 01b | `MemberProfileZ`, `SessionUserZ`, `AuthGateStateValueZ` |

## AC × 不変条件 mapping

| AC | 不変条件 | endpoint |
| --- | --- | --- |
| AC-1 | #11 | 全 endpoint |
| AC-2 | #11 | path に :memberId 不在 |
| AC-3 | #1, #4 | GET /me/profile |
| AC-4 | #4, #12 | POST visibility/delete-request |
| AC-5 | #7 | GET /me, GET /me/profile |
| AC-6 | #11 | POST visibility/delete-request (rate limit + duplicate) |
| AC-7 | #9 | GET /me |
| AC-8 | #12 | GET 系 strict zod |

## editResponseUrl fall-back 戦略

1. 03b sync 済の `member_responses.edit_response_url` を返す
2. null の場合 response に `editResponseUrl: null` を入れる
3. 同時に `fallbackResponderUrl` を `RESPONDER_URL` env (または `GOOGLE_FORM_RESPONDER_URL`) で必ず返す
4. UI 側 (06b) が null を検出したら fallbackResponderUrl + responseEmail で再回答誘導

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 endpoint で会員 self-service の核（確認 + 編集導線 + 申請）を完結 |
| 実現性 | PASS | 02a / 02c / 03b 既存 repository を組み合わせるのみ |
| 整合性 | PASS | 不変条件 #4 / #11 / #12 に矛盾なし |
| 運用性 | PASS | 二重申請防止を notes の type 列で実現、別テーブル不要 |

## 完了条件チェック

- [x] 4 endpoint の input / output と認可境界が確定
- [x] 上流 02a / 02c / 03b への要求が記述
- [x] AC-1〜AC-8 と不変条件 #4 / #11 の対応が下書き
- [x] 4 条件が全 PASS
- [x] editResponseUrl 取得不能ケースの fall-back を記録
