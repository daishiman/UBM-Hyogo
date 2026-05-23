// task-12: publicSections から url kind の field のみ抽出してリンク pill 群として描画する
// 不変条件 #1: data-stable-key を li に焼く
import type { z } from "zod";

import type { PublicMemberProfileZ } from "@ubm-hyogo/shared";

type Section = z.infer<typeof PublicMemberProfileZ>["publicSections"][number];

export interface MemberLinksProps {
  sections: ReadonlyArray<Section>;
}

export function MemberLinks({ sections }: MemberLinksProps) {
  const links = sections.flatMap((s) =>
    s.fields
      .filter((f) => f.kind === "url" && typeof f.value === "string" && f.value)
      .map((f) => ({
        stableKey: f.stableKey,
        label: f.label,
        value: String(f.value),
      })),
  );
  if (links.length === 0) return null;
  return (
    <section data-component="member-links" className="links-root">
      <h2 className="links-title">リンク</h2>
      <ul className="links-list" role="list">
        {links.map((l) => (
          <li key={l.stableKey} data-stable-key={l.stableKey}>
            <a
              href={l.value}
              target="_blank"
              rel="noopener noreferrer"
              className="link-pill"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
