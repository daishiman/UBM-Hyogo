// ut-web-cov-03 Phase 4/5: me-types.ts の type round-trip 検証（type-only file の代替 coverage）。
// vitest include は *.test.{ts,tsx} のみのため、本ファイルは tsc 経由 typecheck で評価される。
// ランタイム実行されないが、import がコンパイルされる時点で型互換性が保証される。

import type {
  MeAuthGateState,
  MeProfileResponse,
  MeProfileStatusSummary,
  MeSessionResponse,
  MeSessionUser,
  PendingRequests,
} from "./me-types";

// TYPE-001: MeAuthGateState は active / rules_declined / deleted の 3 値
type ExpectAuthGateState =
  Exclude<MeAuthGateState, "active" | "rules_declined" | "deleted"> extends never
    ? true
    : false;
const _t1: ExpectAuthGateState = true;
void _t1;

// TYPE-002: MeSessionResponse.user は MeSessionUser と同型
type ExpectSessionUser =
  MeSessionResponse["user"] extends MeSessionUser
    ? MeSessionUser extends MeSessionResponse["user"]
      ? true
      : false
    : false;
const _t2: ExpectSessionUser = true;
void _t2;

// TYPE-003: MeProfileResponse.statusSummary は MeProfileStatusSummary と同型
type ExpectStatusSummary =
  MeProfileResponse["statusSummary"] extends MeProfileStatusSummary
    ? MeProfileStatusSummary extends MeProfileResponse["statusSummary"]
      ? true
      : false
    : false;
const _t3: ExpectStatusSummary = true;
void _t3;

// 構造リテラルが代入可能であること（drift 早期検出）
const _u: MeSessionUser = {
  memberId: "m_1",
  responseId: "r_1",
  email: "u@example.com",
  isAdmin: false,
  authGateState: "active",
};
void _u;

// TYPE-004 (06b-fu-001): PendingRequests は visibility / delete を optional に持つ
const _pendingEmpty: PendingRequests = {};
const _pendingFull: PendingRequests = {
  visibility: {
    queueId: "q1",
    status: "pending",
    createdAt: "2026-05-04T00:00:00Z",
    desiredState: "hidden",
  },
  delete: {
    queueId: "q2",
    status: "pending",
    createdAt: "2026-05-04T00:00:00Z",
  },
};
void _pendingEmpty;
void _pendingFull;

type ExpectPendingRequests = MeProfileResponse["pendingRequests"] extends PendingRequests
  ? PendingRequests extends MeProfileResponse["pendingRequests"]
    ? true
    : false
  : false;
const _t4: ExpectPendingRequests = true;
void _t4;
