export interface TimelineEntry {
  sessionId: string;
  title: string;
  heldOn: string;
}

export interface TimelineProps {
  entries: TimelineEntry[];
}

export function Timeline({ entries }: TimelineProps) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <section data-component="timeline">
      <h2>最近の支部会</h2>
      <ol>
        {entries.map((e) => (
          <li key={e.sessionId}>
            <time dateTime={e.heldOn}>{e.heldOn}</time>
            <span>{e.title}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
