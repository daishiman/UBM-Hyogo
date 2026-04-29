# Phase 6 — 異常系検証 主成果物

`failure-cases.md` を参照。

## consent 撤回時の動線

- `rulesConsent=declined` で次回 `/me` リクエスト時に `authGateState="rules_declined"` を 200 で返す。
- POST `/me/visibility-request`, `/me/delete-request` は 403 RULES_NOT_ACCEPTED（`requireRulesConsent` middleware）。
- session は revoke せず、UI (06b) で再回答 CTA を提示。`/login` 強制リダイレクトはしない。

## 削除済みアクセス時

- `member_status.is_deleted=1` で次回リクエスト時に 410 + `authGateState="deleted"`。
- session を即時 revoke する責務は 05a/b の Auth.js 側に委譲（ここでは 410 を返すのみ）。
- 06b 側で deleted 表示パターンに切り替え。

## rate limit & duplicate の多層防御

- 即時 burst → `rateLimitSelfRequest` で 429。
- 数分以上の二重申請 → `adminNotes.hasPendingRequest` で 409。
- 両層が独立に動くため、片方が破られても申請が複数 queue に積まれない。
