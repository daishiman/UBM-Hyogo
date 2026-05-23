# Phase 02 — 設計

## アーキテクチャ概要

```
enqueueNotification(input)
  └─ (NEW) optOutGate: member_status.notification_opt_out=1 なら skip + ledger 'skipped_opt_out'
       └─ insert notification_outbox (status='pending', channel='mail' 既定)
notificationDispatchTick(env)
  └─ for row in pending:
       └─ NotificationChannelRegistry.resolve(row.channel ?? 'mail')
            └─ MailNotificationChannel.send(row) → DispatchResult
                 └─ outbox status 更新 + ledger 記録
```

## モジュール構成

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/api/src/services/notification/channel.ts` | 新規 | `NotificationChannel` interface, `NotificationChannelKind` 型, 共通 DispatchResult 再エクスポート |
| `apps/api/src/services/notification/channels/mail.ts` | 新規 | `MailNotificationChannel`（既存 `createMailDispatcher` を I/F 適合） |
| `apps/api/src/services/notification/registry.ts` | 新規 | `createNotificationChannelRegistry({ mail })` + `resolve(kind)` |
| `apps/api/src/services/notification/dispatcher.ts` | 編集 | `NotificationDispatcher` を `NotificationChannel` のエイリアスに統一（後方互換維持） |
| `apps/api/src/repository/notificationOutbox.ts` | 編集 | `enqueueNotification` に opt-out gate（`member_status` lookup → skip 分岐）追加 |
| `apps/api/src/repository/memberNotificationPreference.ts` | 新規 | `loadNotificationOptOut` / `updateNotificationOptOut` を `member_status` 専用 repository として提供 |
| `apps/api/migrations/0020_notification_channel_and_opt_out.sql` | 新規 | `member_status.notification_opt_out`、`notification_outbox.channel`、`notification_ledger.event_type` CHECK 拡張 |
| `apps/api/src/routes/admin/member-notification-pref.ts` | 新規 | `PATCH /admin/members/:memberId/notification-pref` 追加 |
| `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | 編集 | opt-out checkbox UI + mutation 配線（`useAdminMutation` 経由） |
| `apps/web/src/lib/admin/api.ts` | 編集 | `patchMemberNotificationPref` client helper |

## 型・インターフェース

```ts
// apps/api/src/services/notification/channel.ts
export type NotificationChannelKind = 'mail';

export interface NotificationChannel {
  readonly kind: NotificationChannelKind;
  dispatch(row: NotificationOutboxRow): Promise<DispatchResult>;
}

// registry.ts
export interface NotificationChannelRegistry {
  resolve(kind: string): NotificationChannel | undefined;
  kinds(): readonly NotificationChannelKind[];
}

export const createNotificationChannelRegistry = (
  channels: Record<NotificationChannelKind, NotificationChannel>,
): NotificationChannelRegistry => ({ /* ... */ });
```

```ts
// apps/api/src/repository/notificationOutbox.ts (差分の要点)
export type EnqueueResult =
  | { ok: true; notificationId: string }
  | { ok: false; reason: 'duplicate' | 'db_error' | 'opt_out' };

export const enqueueNotification = async (
  ctx: DbCtx,
  input: EnqueueInput,
): Promise<EnqueueResult> => {
  const optedOut = await loadNotificationOptOut(ctx, input.memberId);
  if (optedOut) {
    await insertLedger(ctx, { notificationId, eventType: 'skipped_opt_out', attempt: 0, detailJson: JSON.stringify({ memberId: input.memberId, noteId: input.noteId }) });
    return { ok: false, reason: 'opt_out' };
  }
  // 既存 insert ロジック
};
```

```ts
// PATCH /admin/members/:memberId/notification-pref
// body: { notificationOptOut: boolean }
// response 200: { memberId, notificationOptOut }
// guard: requireAdmin
```

## DB 設計

| 列 | 型 | 既定 | 備考 |
| --- | --- | --- | --- |
| `member_status.notification_opt_out` | INTEGER | 0 | 0=受信許可 / 1=オプトアウト |
| `notification_outbox.channel` | TEXT | `'mail'` | `NotificationChannelKind`。既存行は mail として扱う |

forward-only migration:
```sql
-- 0020_notification_channel_and_opt_out.sql
ALTER TABLE member_status ADD COLUMN notification_opt_out INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notification_outbox ADD COLUMN channel TEXT NOT NULL DEFAULT 'mail';

-- notification_ledger は event_type CHECK を拡張するため rebuild する。
-- allowed: enqueued / dispatching / sent / failed / dlq / skipped_opt_out / unknown_channel
```

## エラーハンドリング

| ケース | 振る舞い |
| --- | --- |
| registry に kind が未登録 | provider を呼ばず `unknown_channel` を ledger に記録し、outbox 状態は `dlq` に遷移 |
| opt-out gate で skip | enqueue 戻り値 `{ ok:false, reason:'opt_out' }`、ledger に `skipped_opt_out` を記録、outbox には書き込まない |
| migration 重複適用 | wrangler d1 migrations が forward-only かつ idempotent でない場合は本番適用前に dry-run（`scripts/cf.sh d1 migrations list ...`） |

## 受入観点（Phase 02 完了条件）

- 上記モジュール表・型定義・migration が Phase 03 review で破綻なく合意されること
- 既存 `dispatcher.ts` 仕様（`NotificationDispatcher` interface）と互換が取れていること（=alias 化で吸収）
