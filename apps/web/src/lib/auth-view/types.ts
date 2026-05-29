export type AuthView =
  | { readonly kind: "guest" }
  | { readonly kind: "member"; readonly profileHref: string }
  | {
      readonly kind: "admin";
      readonly profileHref: string;
      readonly adminHref: string;
    };

export interface SessionLike {
  readonly user?: {
    readonly memberId?: string | null;
    readonly isAdmin?: boolean | null;
  } | null;
}
