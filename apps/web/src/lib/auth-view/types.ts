export type AuthView =
  | { readonly kind: "guest" }
  | { readonly kind: "member"; readonly profileHref: "/profile" }
  | {
      readonly kind: "admin";
      readonly profileHref: "/profile";
      readonly adminHref: "/admin";
    };
