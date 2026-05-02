# task-04b-admin-request-retention-physical-delete-001

## Metadata

| Field | Value |
| --- | --- |
| Task ID | task-04b-admin-request-retention-physical-delete-001 |
| Source | 04b-followup-004 Phase 12 unassigned detection |
| Status | unassigned |
| Priority | medium |
| Type | data retention / compliance |

## Goal

Define whether delete-request approval should eventually trigger physical deletion or anonymization after a retention period.

## Scope

- Retention policy for `member_responses`, `member_identities`, `member_status`, `deleted_members`, and audit rows
- Legal / operational retention rationale
- Worker job or manual runbook design
- Recovery and rollback boundary

## Acceptance Criteria

- Logical deletion remains immediate and reversible only where policy allows.
- Any physical deletion is explicit, auditable, and separated from the request resolve transaction.
- The policy states which data must remain for audit/accountability.

## Risk And Mitigation

| Risk | Mitigation |
| --- | --- |
| Physical deletion removes required audit evidence | Define non-deletable audit minimums first |
| Job accidentally runs in production | Require dry-run, staging smoke, and explicit production approval |

## 苦戦箇所 / Lessons Learned

- **論理削除と物理削除の境界**: 04b-followup-004 は delete request approve で `deleted_members` を追加し、`member_responses` などは保持する論理削除に留めた。物理削除を後段に積むと、approve 時点では reversible だが job 実行後は不可逆になり、recovery 期待を持っているメンバーとの認識ずれが発生する。retention period と「不可逆になる時刻」をユーザー通知に含める必要がある。
- **audit minimum の先決**: L-04B-RQ-005 で audit target taxonomy を first-class 化する見通しがあるため、retention policy 検討前に「audit に残し続けるべき最小情報」を決めないと、物理削除で audit 追跡が分断される。
- **dry-run 必須**: D1 の DELETE は cross-table cascade を持たないため、削除対象テーブル一覧と外部参照を job 実装前に列挙する。staging smoke で seed → job → 復元の round-trip を必ず通す。
