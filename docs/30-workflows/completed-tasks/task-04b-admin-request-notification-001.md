# task-04b-admin-request-notification-001

## Metadata

| Field | Value |
| --- | --- |
| Task ID | task-04b-admin-request-notification-001 |
| Source | 04b-followup-004 Phase 12 unassigned detection |
| Status | unassigned |
| Priority | medium |
| Type | feature |

## Goal

Notify members after admin resolves a visibility/delete request.

## Scope

- Decide notification channel: email / Magic Link page state / in-app profile status
- Define templates for approve and reject
- Ensure no PII leaks in notification payloads
- Record notification outcome in audit or a notification ledger if required

## Acceptance Criteria

- Members can know whether their request was approved or rejected.
- Notification failures do not roll back request resolution.
- Retry / dead-letter behavior is documented.

## Risk And Mitigation

| Risk | Mitigation |
| --- | --- |
| Email delivery creates operational dependency | Make request resolution independent from notification dispatch |
| Rejection reason contains PII | Sanitize or constrain admin-entered notes before sending |

## 苦戦箇所 / Lessons Learned

- **トランザクション境界の判断**: 04b-followup-004 では request resolution と member_status 更新を D1 batch に閉じ込めた（L-04B-RQ-001）。通知をこの batch に含めるとメール送信失敗で resolve が rollback されかねないため、通知は resolve 完了後の独立 outbox / queue として扱う設計判断を本タスクに踏襲する。
- **PII 取り扱い**: rejection reason を admin が自由記述する仕様のため、メール本文にそのまま載せると個人情報が外部 SMTP に漏れる。テンプレ化または length / 文字種の constraint を resolve API 入力時点でかける必要がある。
- **配信ベンダ未決**: Cloudflare Workers から Magic Link と同じ Auth.js Email Provider を再利用するか、別系統（Resend 等）にするか未確定。先に「resolve は通知から疎結合」のインタフェース契約だけ確定させてから配信実装を選ぶ。
