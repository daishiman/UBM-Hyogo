// プロトタイプ整合: PublicHeader の session 取得ラッパー。
// PublicHeader 自体は sync な props 受け取り設計を保つ。pathname 解決は client island に閉じ、
// session 解決だけをこの async Server Component に閉じ込める。

import {
  type PublicHeaderWithPathProps,
  PublicHeaderWithPath,
} from "./PublicHeaderWithPath";
import { getSession } from "../../lib/session";

export type SessionAwarePublicHeaderProps = Omit<
  PublicHeaderWithPathProps,
  "currentUser"
>;

export async function SessionAwarePublicHeader(
  props: SessionAwarePublicHeaderProps = {},
) {
  const session = await getSession();
  const currentUser = session
    ? {
        memberId: session.memberId,
        ...(session.name ? { name: session.name } : {}),
      }
    : null;
  return <PublicHeaderWithPath {...props} currentUser={currentUser} />;
}
