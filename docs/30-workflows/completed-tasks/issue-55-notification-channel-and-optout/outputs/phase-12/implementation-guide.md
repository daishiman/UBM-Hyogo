# Implementation Guide

## Part 1: 中学生でもわかる説明

学校の連絡網で、ある人が「連絡はいりません」と言っているのに毎回お知らせを送ると迷惑になる。
このタスクでは、会員ごとに「通知を受け取らない」という印を持たせ、その印がある人には送らず、送らなかった理由を記録する。
また、今はメールで送っているが、将来別の送り方を足しても作り直さなくてよいように、送り方を選ぶ入口を用意する。

| 専門用語 | 日常語での意味 |
| --- | --- |
| Channel | 連絡の送り方 |
| Adapter | 送り方ごとの係 |
| Registry | 係を探す名簿 |
| Outbox | これから送る予定箱 |
| Ledger | 起きたことを残すノート |

## Part 2: 技術者向け実装要点

`apps/api/src/services/notification/channel.ts` に `NotificationChannel` と `NotificationChannelKind = "mail"` を追加し、既存 `createMailDispatcher` を `MailNotificationChannel` として薄く包む。
`notification_outbox` には `channel TEXT NOT NULL DEFAULT 'mail'` を追加し、dispatcher は row の channel を registry で解決する。
未知 channel は provider 呼び出しを行わず、`unknown_channel` として DLQ 化し ledger に記録する。

## Current-Code Alignment

現行DBに `member` テーブルは存在しないため、opt-out は `member_status.notification_opt_out INTEGER NOT NULL DEFAULT 0` として追加する。
現行admin詳細は `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` であり、存在しない `apps/web/app/(admin)/admin/members/[id]/page.tsx` は作らない。
client mutation は既存 `apps/web/src/lib/admin/api.ts` と `useAdminMutation` の経路へ追加する。

## Implementation Steps

1. `apps/api/migrations/0020_notification_channel_and_opt_out.sql` を追加し、`member_status.notification_opt_out`、`notification_outbox.channel`、ledger CHECK の再構成を同一migrationにまとめる。
2. `NotificationChannel` / `MailNotificationChannel` / registry を追加し、旧 `NotificationDispatcher` import は type alias で維持する。
3. `notificationOutbox.enqueue` で `member_status.notification_opt_out=1` を読み、outbox 行を作らず `skipped_opt_out` ledger を残す。
4. `runNotificationDispatchTick` を registry 解決に寄せ、未知 channel を `unknown_channel` で DLQ にする。
5. `PATCH /admin/members/:memberId/notification-pref` と `patchMemberNotificationPref`、`MemberDrawer` toggle を追加する。

## Verification Commands

```bash
mise exec -- pnpm -F @ubm-hyogo/api typecheck
mise exec -- pnpm -F @ubm-hyogo/web typecheck
mise exec -- pnpm -F @ubm-hyogo/api test -- --run
mise exec -- pnpm -F @ubm-hyogo/web test -- --run
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

## Screenshot Evidence

Local UI evidence for the admin drawer opt-out toggle is saved at `outputs/phase-11/admin-member-drawer-opt-out-toggle.png`.
The D1 opt-out skip evidence note is saved at `outputs/phase-11/d1-ledger-skipped-opt-out.txt`.

## Known Limits

LINE / Slack adapters are intentionally out of scope because this task only needs one concrete channel to close Issue #55's abstraction gap.
D1 production migration apply, staging smoke, commit, push, and PR creation remain user-gated.
No PR text may claim staging/production runtime completion before user-gated evidence exists.
