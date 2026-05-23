// Issue #55: notification 公開 API barrel
export type {
  NotificationChannel,
  NotificationChannelKind,
  DispatchResult,
} from "./channel";
export {
  createNotificationChannelRegistry,
  type NotificationChannelRegistry,
} from "./registry";
export { createMailNotificationChannel } from "./channels/mail";
export {
  createMailDispatcher,
  sanitizeProviderError,
  type NotificationDispatcher,
  type CreateMailDispatcherDeps,
} from "./dispatcher";
