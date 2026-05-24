# Phase 04 — テスト作成計画

## TDD 方針
Red-Green-Refactor を遵守。実装着手前に下記 spec を先に追加し fail させてから Phase 05 で実装する。

## 追加 / 更新する spec ファイル

| ファイル | 種別 | ケース |
| --- | --- | --- |
| `apps/api/src/services/notification/channel.spec.ts` | 新規 | (1) `NotificationChannel` 型が `kind` と `dispatch` を要求すること（型レベル + ランタイム instance）, (2) MailNotificationChannel.kind === 'mail' |
| `apps/api/src/services/notification/registry.spec.ts` | 新規 | (1) `resolve('mail')` が channel を返す, (2) `resolve('unknown')` が undefined, (3) `kinds()` が `['mail']` |
| `apps/api/src/services/notification/channels/mail.spec.ts` | 新規 | 既存 `dispatcher.spec.ts` の mail 系ケースを mail channel adapter 側に複写し、I/F 経由でも同じ DispatchResult を返すこと |
| `apps/api/src/repository/__tests__/notificationOutbox.repository.spec.ts` | 編集 | (1) opt-out=1 の member への enqueue が `{ ok:false, reason:'opt_out' }` を返す, (2) outbox 行が増えない, (3) ledger に `event_type='skipped_opt_out'` が 1 件挿入される, (4) opt-out=0 では既存挙動を維持 |
| `apps/api/src/routes/admin/members.spec.ts`（既存もしくは新規） | 編集 | (1) `PATCH /admin/members/:memberId/notification-pref` で 200 + 永続化, (2) 非 admin の token は 401/403, (3) 不正 body（`notificationOptOut` 欠落）で 400 |
| `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | 編集 | toggle 操作で `/api/admin/members/:memberId/notification-pref` PATCH が呼ばれる、表示状態が反映される |

## fixture 追加

- `apps/api/src/repository/__tests__/_setup.ts`: `member_status.notification_opt_out` / `notification_outbox.channel` / expanded ledger CHECK を migration 適用で反映
- `apps/api/src/services/notification/__fixtures__/`: opt-out 経路用の minimal member row

## モック方針

- D1 はインメモリ Miniflare D1（既存 `_setup.ts` の `applyMigrations()` を再利用）
- mail provider は既存 `mailSender` mock を流用

## 実行コマンド

```bash
mise exec -- pnpm -F @ubm-hyogo/api test -- --run --reporter=verbose
mise exec -- pnpm -F @ubm-hyogo/web test -- --run --reporter=verbose
```

## DoD（Phase 04 完了条件）

- 上記 spec が新規/更新済みかつ **Phase 05 着手前は意図的に fail** する状態にあること
- D1 migration 適用後の schema が `notification_opt_out` 列を持つこと（fixture で確認）
