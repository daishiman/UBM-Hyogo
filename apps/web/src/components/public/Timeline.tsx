// public-dashboard-prototype-alignment: Timeline (chip + tl-row + graceful fallback)
// プロトタイプ pages-public.jsx LandingPage Recent Meetings 整合。
// note / attendees は API response に無い場合あり → optional + 要素ごと omit。
// Lane B: SectionCard でラップ。

import { EmptyState } from "../feedback/EmptyState";

import { SectionCard } from "../ui/layout/SectionCard";

export interface TimelineEntry {
  sessionId: string;
  title: string;
  heldOn: string;
  /** プロトタイプの note。API response に無い場合は undefined */
  note?: string;
  /** プロトタイプの attendees。API response に無い場合は undefined */
  attendees?: number;
}

export interface TimelineProps {
  entries: TimelineEntry[];
  /** 開催頻度チップ (default: "毎月第2木曜開催") */
  cadenceLabel?: string;
}

export function yyyyMm(heldOn: string): string {
  const d = new Date(heldOn);
  if (Number.isNaN(d.getTime())) {
    const fallback = heldOn.slice(0, 7);
    return fallback || heldOn;
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}.${m}`;
}

export function dd(heldOn: string): string {
  const d = new Date(heldOn);
  if (Number.isNaN(d.getTime())) {
    const fallback = heldOn.slice(8, 10);
    return fallback || heldOn;
  }
  return String(d.getUTCDate()).padStart(2, "0");
}

export function Timeline({
  entries,
  cadenceLabel = "毎月第2木曜開催",
}: TimelineProps) {
  return (
    <SectionCard as="section" data-component="timeline">
      <header data-role="header">
        <div>
          <h2 data-role="section-heading">最近の支部会</h2>
        </div>
        <span data-role="chip-cadence">
          <span data-role="dot" aria-hidden="true" />
          {cadenceLabel}
        </span>
      </header>
      {entries.length === 0 ? (
        <EmptyState
          title="まだ支部会の記録がありません"
          description="開催後に最新の支部会情報を掲載します。"
        />
      ) : (
        <ol data-role="tl-rows">
          {entries.map((e) => (
            <li key={e.sessionId} data-role="tl-row">
              <div data-role="tl-date">
                <span data-role="tl-y">{yyyyMm(e.heldOn)}</span>
                <span data-role="tl-d">{dd(e.heldOn)}</span>
              </div>
              <div data-role="tl-body">
                <p data-role="tl-label">
                  <time dateTime={e.heldOn}>{e.title}</time>
                </p>
                {e.note ? <p data-role="tl-note">{e.note}</p> : null}
              </div>
              {typeof e.attendees === "number" ? (
                <p data-role="tl-attendees">{e.attendees}名参加</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
