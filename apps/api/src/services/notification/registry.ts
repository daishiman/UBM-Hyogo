// Issue #55: NotificationChannelRegistry
//
// outbox.channel 文字列から実体 NotificationChannel を引き当てる。
// 未登録 kind は undefined を返す。呼び出し側 (dispatchTick) で
// outbox を dlq へ遷移 + ledger に unknown_channel を記録する。

import type {
  NotificationChannel,
  NotificationChannelKind,
} from "./channel";

export interface NotificationChannelRegistry {
  resolve(kind: string): NotificationChannel | undefined;
  kinds(): readonly NotificationChannelKind[];
}

export const createNotificationChannelRegistry = (
  channels: Partial<Record<NotificationChannelKind, NotificationChannel>>,
): NotificationChannelRegistry => {
  const map = new Map<string, NotificationChannel>();
  for (const [kind, channel] of Object.entries(channels)) {
    if (channel) map.set(kind, channel);
  }
  return {
    resolve(kind) {
      return map.get(kind);
    },
    kinds() {
      return Array.from(map.keys()) as NotificationChannelKind[];
    },
  };
};
