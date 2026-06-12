// Lane B: SectionCard(hero) でラップ。
import { STABLE_KEY } from "@ubm-hyogo/shared";

import { Avatar } from "../ui/Avatar";
import { SectionCard } from "../ui/layout/SectionCard";

export interface ProfileHeroProps {
  memberId: string;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  hometown: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
  // issue-1029: public-safe presigned photo URL（無ければ hue placeholder へ fallback）。
  photoUrl?: string | undefined;
}

export function ProfileHero(props: ProfileHeroProps) {
  return (
    <SectionCard as="section" data-component="profile-hero" className="ui-hero">
      <header>
        <Avatar
          memberId={props.memberId}
          name={props.fullName}
          src={props.photoUrl}
          size="xl"
        />
        <div data-role="meta">
          <p className="eyebrow">MEMBER PROFILE</p>
          <h1>{props.fullName}</h1>
          {props.nickname ? <p data-role={STABLE_KEY.nickname}>@{props.nickname}</p> : null}
          <p data-role={STABLE_KEY.occupation}>{props.occupation}</p>
          <p data-role={STABLE_KEY.location}>{props.location}</p>
          <div data-role="badges">
            {props.ubmZone ? <span data-key="zone">{props.ubmZone}</span> : null}
            {props.ubmMembershipType ? (
              <span data-key="status">{props.ubmMembershipType}</span>
            ) : null}
            {props.hometown ? (
              <span data-key={STABLE_KEY.hometown} data-stable-key={STABLE_KEY.hometown}>
                {props.hometown}
              </span>
            ) : null}
          </div>
        </div>
      </header>
    </SectionCard>
  );
}
