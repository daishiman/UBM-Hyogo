// 06b: API パッケージ `/me` `/me/profile` の view-model 型を web から参照する用の薄い再 export。
// API パッケージ 直 import は tsconfig path 範囲外のため、shared 由来の型 + 04b 拡張を inline で揃える。
// 04b/me/schemas.ts と構造を一致させること（drift 検出は phase-09 typecheck）。

import type {
  ConsentStatus,
  PublishState,
  MemberProfile,
} from "@ubm-hyogo/shared";

/** /me の authGateState は active|rules_declined|deleted の 3 値（input/sent は除外）。 */
export type MeAuthGateState = "active" | "rules_declined" | "deleted";

export interface MeSessionUser {
  readonly memberId: string;
  readonly responseId: string;
  readonly email: string;
  readonly isAdmin: boolean;
  readonly authGateState: MeAuthGateState;
}

export interface MeSessionResponse {
  readonly user: MeSessionUser;
  readonly authGateState: MeAuthGateState;
}

export interface MeProfileStatusSummary {
  readonly publicConsent: ConsentStatus;
  readonly rulesConsent: ConsentStatus;
  readonly publishState: PublishState;
  readonly isDeleted: false;
}

// 06b-followup-001 (#428): server-side pending request の mirror 型。
//   API パッケージ /me/schemas.ts と構造一致（drift は typecheck で検出）。
export interface PendingVisibilityRequest {
  readonly queueId: string;
  readonly status: "pending";
  readonly createdAt: string;
  readonly desiredState: "hidden" | "public";
}

export interface PendingDeleteRequest {
  readonly queueId: string;
  readonly status: "pending";
  readonly createdAt: string;
}

export interface PendingRequests {
  readonly visibility?: PendingVisibilityRequest;
  readonly delete?: PendingDeleteRequest;
}

export interface MeProfileResponse {
  readonly profile: MemberProfile;
  readonly statusSummary: MeProfileStatusSummary;
  readonly editResponseUrl: string | null;
  readonly fallbackResponderUrl: string;
  readonly pendingRequests: PendingRequests;
}
