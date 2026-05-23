// Issue #55: MailNotificationChannel — 既存 createMailDispatcher を Channel I/F でラップする adapter。

import {
  createMailDispatcher,
  type CreateMailDispatcherDeps,
} from "../dispatcher";
import type { NotificationChannel } from "../channel";

export const createMailNotificationChannel = (
  deps: CreateMailDispatcherDeps,
): NotificationChannel => {
  const dispatcher = createMailDispatcher(deps);
  return {
    kind: "mail",
    dispatch: (row) => dispatcher.dispatch(row),
  };
};
