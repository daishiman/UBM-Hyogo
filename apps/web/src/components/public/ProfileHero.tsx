import { STABLE_KEY } from "@ubm-hyogo/shared";

import { Avatar } from "../ui/Avatar";

export interface ProfileHeroProps {
  memberId: string;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
}

export function ProfileHero(props: ProfileHeroProps) {
  return (
    <header data-component="profile-hero">
      <Avatar memberId={props.memberId} name={props.fullName} size="lg" />
      <div data-role="meta">
        <h1>{props.fullName}</h1>
        {props.nickname ? <p data-role={STABLE_KEY.nickname}>@{props.nickname}</p> : null}
        <p data-role={STABLE_KEY.occupation}>{props.occupation}</p>
        <p data-role={STABLE_KEY.location}>{props.location}</p>
        <div data-role="badges">
          {props.ubmZone ? <span data-key="zone">{props.ubmZone}</span> : null}
          {props.ubmMembershipType ? (
            <span data-key="status">{props.ubmMembershipType}</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
