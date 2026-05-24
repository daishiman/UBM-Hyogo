// Issue #55: NotificationChannel 抽象
//
// 既存 mail-only dispatcher を Channel I/F で扱えるようにし、
// 将来の LINE/Slack 追加時は kind 拡張 + adapter 追加で済むようにする。

import type { NotificationOutboxRow } from "../../repository/notificationOutbox";
import type { DispatchResult } from "./dispatcher";

export type NotificationChannelKind = "mail";

export interface NotificationChannel {
  readonly kind: NotificationChannelKind;
  dispatch(row: NotificationOutboxRow): Promise<DispatchResult>;
}

export type { DispatchResult };
