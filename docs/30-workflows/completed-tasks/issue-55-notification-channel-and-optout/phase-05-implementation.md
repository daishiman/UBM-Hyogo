# Phase 05 — 実装計画

## CONST_005 必須項目

### 変更対象ファイル

| 種別 | パス |
| --- | --- |
| 新規 | `apps/api/src/services/notification/channel.ts` |
| 新規 | `apps/api/src/services/notification/channels/mail.ts` |
| 新規 | `apps/api/src/services/notification/registry.ts` |
| 新規 | `apps/api/migrations/0020_notification_channel_and_opt_out.sql` |
| 編集 | `apps/api/src/services/notification/dispatcher.ts`（`NotificationDispatcher` を `NotificationChannel` の type alias へ統一） |
| 編集 | `apps/api/src/repository/notificationOutbox.ts`（opt-out gate 追加・戻り値 union 拡張） |
| 新規 | `apps/api/src/repository/memberNotificationPreference.ts`（`loadNotificationOptOut` / `updateNotificationOptOut`） |
| 新規 | `apps/api/src/routes/admin/member-notification-pref.ts`（`PATCH .../notification-pref` 追加） |
| 編集 | `apps/api/src/workflows/notificationDispatchTick.ts`（dispatcher → registry.resolve 経由に切替） |
| 編集 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`（toggle UI 追加） |
| 編集 | `apps/web/src/lib/admin/api.ts`（`patchMemberNotificationPref` 追加） |

### 主要シグネチャ

```ts
// channel.ts
export type NotificationChannelKind = 'mail';
export interface NotificationChannel {
  readonly kind: NotificationChannelKind;
  dispatch(row: NotificationOutboxRow): Promise<DispatchResult>;
}

// channels/mail.ts
export const createMailNotificationChannel = (deps: CreateMailDispatcherDeps): NotificationChannel => ({
  kind: 'mail',
  dispatch: createMailDispatcher(deps).dispatch,
});

// registry.ts
export interface NotificationChannelRegistry {
  resolve(kind: string): NotificationChannel | undefined;
  kinds(): readonly NotificationChannelKind[];
}
export const createNotificationChannelRegistry = (
  channels: Partial<Record<NotificationChannelKind, NotificationChannel>>,
): NotificationChannelRegistry;

// notificationOutbox.ts
export type EnqueueResult =
  | { ok: true; notificationId: string }
  | { ok: false; reason: 'duplicate' | 'db_error' | 'opt_out' };

// memberNotificationPreference.ts
export const loadNotificationOptOut = (ctx: DbCtx, memberId: string): Promise<boolean>;
export const updateNotificationOptOut = (ctx: DbCtx, input: { memberId: string; notificationOptOut: boolean; updatedBy: string; updatedAt: string }): Promise<boolean>;

// routes/admin/members.ts
// PATCH /admin/members/:memberId/notification-pref
//   body: { notificationOptOut: boolean }
//   200: { memberId: string; notificationOptOut: boolean }
//   401/403/400 既存パターン準拠
```

### 入出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `enqueueNotification` | `EnqueueInput`（memberId 等） | `EnqueueResult` | opt-out=true なら ledger に `skipped_opt_out` のみ。false なら従来通り outbox + ledger |
| `loadNotificationOptOut` | `(ctx, memberId)` | `Promise<boolean>` | `member_status` SELECT のみ |
| `updateNotificationOptOut` | `(ctx, memberId, notificationOptOut, updatedBy, updatedAt)` | `Promise<boolean>` | `member_status` UPDATE / UPSERT |
| `MailNotificationChannel.dispatch` | `NotificationOutboxRow` | `DispatchResult` | mail provider 送信（既存挙動） |
| `PATCH .../notification-pref` | admin auth + body | `{memberId, notificationOptOut}` | `UPDATE member SET notification_opt_out=?` |

### 実装順序

1. `0020_notification_channel_and_opt_out.sql` 追加 → `_setup.ts` で schema 反映確認 → fixture 更新
2. `channel.ts` / `channels/mail.ts` / `registry.ts` 追加 → channel.spec.ts / registry.spec.ts / mail.spec.ts green
3. `notificationOutbox.ts` の opt-out gate 追加（`member_status` lookup + `skipped_opt_out` ledger）→ repository spec green
4. `notificationDispatchTick.ts` を registry.resolve 経由に切替 → 既存 workflow spec green
5. `routes/admin/members.ts` に PATCH endpoint 追加 → routes spec green
6. `MemberDrawer` toggle UI + `apps/web/src/lib/admin/api.ts` client helper → component spec green
7. `dispatcher.ts` の type alias 化 / 旧 import 経路の維持

### 検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm -F @ubm-hyogo/api typecheck
mise exec -- pnpm -F @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F @ubm-hyogo/api test -- --run
mise exec -- pnpm -F @ubm-hyogo/web test -- --run

# D1 migration dry-run
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging
```

### DoD（Definition of Done）

- 上記全ファイルの変更がコミット済み
- typecheck / lint / api test / web test がすべて green
- staging migration list に `0020_notification_channel_and_opt_out.sql` が pending として表示される（apply は Phase 13 PR マージ後の CD で）
- 既存 `notification_outbox` / `notification_ledger` / `notificationDispatchTick` の挙動に regression がないことを spec で確認
- admin 画面で opt-out=true を設定後、その member 宛の enqueue が ledger に `skipped_opt_out` を残し outbox に行を作らないことを手動確認（Phase 11 で evidence 化）
