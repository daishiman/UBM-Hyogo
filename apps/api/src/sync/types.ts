export interface Env {
  readonly ENVIRONMENT: "production" | "staging" | "development";
  readonly DB: D1Database;
  readonly GOOGLE_SERVICE_ACCOUNT_JSON: string; // Cloudflare Secret
  readonly SHEET_ID: string;
  readonly FORM_ID: string;
}

export type TriggerType = "manual" | "scheduled" | "backfill";

export type ConsentStatus = "consented" | "declined" | "unknown";

export interface SheetRow {
  responseEmail: string;
  submittedAt: string;
  fullName: string | undefined;
  nickname: string | undefined;
  location: string | undefined;
  birthDate: string | undefined;
  occupation: string | undefined;
  hometown: string | undefined;
  ubmZone: string | undefined;
  ubmMembershipType: string | undefined;
  ubmJoinDate: string | undefined;
  businessOverview: string | undefined;
  skills: string | undefined;
  challenges: string | undefined;
  canProvide: string | undefined;
  hobbies: string | undefined;
  recentInterest: string | undefined;
  motto: string | undefined;
  otherActivities: string | undefined;
  urlWebsite: string | undefined;
  urlFacebook: string | undefined;
  urlInstagram: string | undefined;
  urlThreads: string | undefined;
  urlYoutube: string | undefined;
  urlTiktok: string | undefined;
  urlX: string | undefined;
  urlBlog: string | undefined;
  urlNote: string | undefined;
  urlLinkedin: string | undefined;
  urlOthers: string | undefined;
  selfIntroduction: string | undefined;
  publicConsent: ConsentStatus; // 不変条件 2
  rulesConsent: ConsentStatus;  // 不変条件 2
}

export interface SyncResult {
  runId: string;
  triggerType: TriggerType;
  rowsFetched: number;
  rowsUpserted: number;
  rowsSkipped: number;
  status: "success" | "partial_failure" | "failure";
  errorReason?: string;
}
