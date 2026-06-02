import type { z } from "zod";

import { PublicMemberListItemZ, STABLE_KEY } from "@ubm-hyogo/shared";

import { statusTone, zoneTone } from "../../lib/tones";
import { Avatar } from "../ui/Avatar";
import { Icon } from "../ui/Icon";

export type PublicMemberListItem = z.infer<typeof PublicMemberListItemZ>;

export type Density = "comfy" | "dense" | "list";

export interface MemberCardProps {
  member: PublicMemberListItem;
  density?: Density;
}

export function MemberCard({ member, density = "comfy" }: MemberCardProps) {
  const avatarSize = density === "comfy" ? "lg" : density === "dense" ? "md" : "sm";
  const zone = member.ubmZone;
  const status = member.ubmMembershipType;
  const isList = density === "list";

  return (
    <article data-component="member-card" data-density={density}>
      <a
        href={`/members/${member.memberId}`}
        aria-label={`${member.fullName} の詳細`}
        data-role="card-link"
      >
        {isList ? (
          <Avatar
            memberId={member.memberId}
            name={member.fullName}
            src={member.photoUrl}
            size={avatarSize}
          />
        ) : (
          <div data-role="head">
            <Avatar
              memberId={member.memberId}
              name={member.fullName}
              src={member.photoUrl}
              size={avatarSize}
            />
            <div data-role="identity">
              <p data-role="name">{member.fullName}</p>
              {member.nickname ? (
                <p data-role={STABLE_KEY.nickname}>@{member.nickname}</p>
              ) : null}
            </div>
            {zone ? (
              <span data-role="zone" data-tone={zoneTone(zone)}>
                <span data-role="chip-dot" aria-hidden="true" />
                {zone}
              </span>
            ) : null}
          </div>
        )}
        {isList ? (
          <div data-role="identity">
            <p data-role="name">{member.fullName}</p>
            {member.occupation ? (
              <p data-role={STABLE_KEY.occupation}>{member.occupation}</p>
            ) : null}
          </div>
        ) : null}
        {isList ? (
          <div data-role="chip-row">
            {zone ? (
              <span data-role="zone" data-tone={zoneTone(zone)}>
                <span data-role="chip-dot" aria-hidden="true" />
                {zone}
              </span>
            ) : null}
            {status ? (
              <span data-role="status" data-tone={statusTone(status)}>
                {status}
              </span>
            ) : null}
          </div>
        ) : (
          <ul data-role="meta">
            {member.occupation ? (
              <li data-role={STABLE_KEY.occupation}>
                <Icon name="briefcase" size="sm" />
                <span>{member.occupation}</span>
              </li>
            ) : null}
            {member.location ? (
              <li data-role={STABLE_KEY.location}>
                <Icon name="map-pin" size="sm" />
                <span>{member.location}</span>
              </li>
            ) : null}
          </ul>
        )}
        {isList ? (
          <span data-role={STABLE_KEY.location}>
            {member.location ? (
              <>
                <Icon name="map-pin" size="sm" />
                <span>{member.location}</span>
              </>
            ) : null}
          </span>
        ) : (
          <div data-role="chip-row">
            {status ? (
              <span data-role="status" data-tone={statusTone(status)}>
                {status}
              </span>
            ) : null}
          </div>
        )}
        {isList ? (
          <span data-role="row-action" aria-hidden="true">
            <Icon name="chevron-right" size="md" />
          </span>
        ) : null}
      </a>
    </article>
  );
}
