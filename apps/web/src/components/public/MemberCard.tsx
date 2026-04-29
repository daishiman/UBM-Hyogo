import type { z } from "zod";

import { PublicMemberListItemZ } from "@ubm-hyogo/shared";

import { Avatar } from "../ui/Avatar";

export type PublicMemberListItem = z.infer<typeof PublicMemberListItemZ>;

export type Density = "comfy" | "dense" | "list";

export interface MemberCardProps {
  member: PublicMemberListItem;
  density?: Density;
}

export function MemberCard({ member, density = "comfy" }: MemberCardProps) {
  return (
    <article data-component="member-card" data-density={density}>
      <a href={`/members/${member.memberId}`} aria-label={`${member.fullName} の詳細`}>
        <Avatar
          memberId={member.memberId}
          name={member.fullName}
          size={density === "list" ? "sm" : density === "dense" ? "sm" : "md"}
        />
        <div data-role="meta">
          <p data-role="name">{member.fullName}</p>
          {member.nickname ? <p data-role="nickname">@{member.nickname}</p> : null}
          {density !== "list" ? (
            <p data-role="occupation">{member.occupation}</p>
          ) : null}
          <p data-role="location">{member.location}</p>
          {member.ubmZone ? (
            <span data-role="zone">{member.ubmZone}</span>
          ) : null}
          {member.ubmMembershipType ? (
            <span data-role="status">{member.ubmMembershipType}</span>
          ) : null}
        </div>
      </a>
    </article>
  );
}
