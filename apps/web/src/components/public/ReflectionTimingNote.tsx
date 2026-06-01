import type { JSX } from "react";

import { formatJstDateTime } from "../../lib/format/datetime";

export type ReflectionTimingSurface = "members" | "profile";

export interface ReflectionTimingNoteProps {
  readonly surface: ReflectionTimingSurface;
  readonly lastSyncAt: string | null;
  readonly maxDelayMinutes?: number;
  readonly statsUnavailable?: boolean;
}

const RESPONSE_SYNC_MAX_DELAY_MINUTES = 15;
const MEMBERS_ISR_MAX_SECONDS = 30;
const WORST_CASE_MAX_MINUTES = 45;

function lastSyncLabel(lastSyncAt: string | null, statsUnavailable?: boolean): string {
  if (statsUnavailable) return "最終同期時刻を取得できませんでした";
  if (lastSyncAt === null) return "最終同期: まだ同期されていません";
  return `最終同期: ${formatJstDateTime(lastSyncAt)}（JST）`;
}

export function ReflectionTimingNote({
  surface,
  lastSyncAt,
  maxDelayMinutes = RESPONSE_SYNC_MAX_DELAY_MINUTES,
  statsUnavailable = false,
}: ReflectionTimingNoteProps): JSX.Element {
  const isMembers = surface === "members";
  return (
    <aside
      className="rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-3 text-sm text-[var(--ubm-color-text-secondary)]"
      data-testid={`reflection-timing-${surface}`}
      aria-label="Google Form 反映タイミング"
    >
      <p className="font-semibold text-[var(--ubm-color-text-primary)]">
        {lastSyncLabel(lastSyncAt, statsUnavailable)}
      </p>
      <p className="mt-1">
        {isMembers
          ? `Google Form 送信後、最大約 ${maxDelayMinutes} 分で同期され、一覧反映まで最大 ${MEMBERS_ISR_MAX_SECONDS} 秒のキャッシュ待ちがあります（最大約 ${WORST_CASE_MAX_MINUTES} 分）。`
          : `Google Form 送信後、最大約 ${maxDelayMinutes} 分で同期されます。マイページはキャッシュを使わないため、同期完了後ただちに反映されます。`}
      </p>
      <p className="mt-1">
        {isMembers
          ? "この一覧には、公開許可（公開同意 + 公開設定 + 未削除）を満たすメンバーのみ表示されます。"
          : "マイページには公開状態に関係なく、あなたの最新の回答内容がすべて反映されます。"}
      </p>
    </aside>
  );
}
