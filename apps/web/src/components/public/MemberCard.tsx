import type { z } from "zod";

import { PublicMemberListItemZ, STABLE_KEY } from "@ubm-hyogo/shared";

import { Avatar } from "../ui/Avatar";

export type PublicMemberListItem = z.infer<typeof PublicMemberListItemZ>;

export type Density = "comfy" | "dense" | "list";

export interface MemberCardProps {
  member: PublicMemberListItem;
  density?: Density;
}

export function MemberCard({ member, density = "comfy" }: MemberCardProps) {
  const avatarSize = density === "comfy" ? "lg" : density === "dense" ? "md" : "sm";

  return (
    <article data-component="member-card" data-density={density}>
      <a
        href={`/members/${member.memberId}`}
        aria-label={`${member.fullName} の詳細`}
        data-role="card-link"
      >
        <div data-role="head">
          <Avatar
            memberId={member.memberId}
            name={member.fullName}
            size={avatarSize}
          />
          <div data-role="identity">
            <p data-role="name">{member.fullName}</p>
            {member.nickname ? (
              <p data-role={STABLE_KEY.nickname}>@{member.nickname}</p>
            ) : null}
          </div>
          {member.ubmZone ? (
            <span data-role="zone">{member.ubmZone}</span>
          ) : null}
        </div>
        <ul data-role="meta">
          {density !== "list" && member.occupation ? (
            <li data-role={STABLE_KEY.occupation}>{member.occupation}</li>
          ) : null}
          {member.location ? (
            <li data-role={STABLE_KEY.location}>{member.location}</li>
          ) : null}
        </ul>
        {member.ubmMembershipType ? (
          <span data-role="status">{member.ubmMembershipType}</span>
        ) : null}
      </a>
    </article>
  );
}
