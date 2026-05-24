import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import type { z } from "zod";

import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import { fetchPublicOrNotFound } from "../../../../../src/lib/fetch/public";

type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;

const size = { width: 1200, height: 630 } as const;
const OG_BACKGROUND =
  "linear-gradient(135deg, oklch(0.36 0.12 240) 0%, oklch(0.52 0.11 240) 100%)";
const OG_TEXT = "oklch(1 0 0)";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await Promise.resolve(params);
  let profile: PublicMemberProfile;
  try {
    profile = await fetchPublicOrNotFound<PublicMemberProfile>(
      `/public/members/${encodeURIComponent(id)}`,
      { revalidate: 0 },
    );
  } catch (e) {
    if (e instanceof Error && e.name === "FetchPublicNotFoundError") {
      notFound();
    }
    throw e;
  }

  const fullName = profile.summary.fullName;
  const occupation = profile.summary.occupation;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: OG_BACKGROUND,
          color: OG_TEXT,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 96px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            opacity: 0.85,
            letterSpacing: 2,
          }}
        >
          UBM 兵庫支部会 / Member
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: 0,
            lineHeight: 1.05,
          }}
        >
          {fullName}
        </div>
        {occupation ? (
          <div
            style={{
              marginTop: 32,
              fontSize: 40,
              opacity: 0.9,
            }}
          >
            {occupation}
          </div>
        ) : null}
        <div
          style={{
            marginTop: "auto",
            fontSize: 24,
            opacity: 0.75,
          }}
        >
          Hyogo Branch Members
        </div>
      </div>
    ),
    { ...size },
  );
}
