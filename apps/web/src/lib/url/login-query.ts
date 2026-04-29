// 06b: /login の searchParams を zod で type-safe に解釈する。
// 不変条件 #8: URL query が gate state の正本（ブラウザ永続ストレージ 退避なし）。
// 不変条件 #9: `/no-access` 経由ではなく /login が 5 状態を吸収するための parser。

import { z } from "zod";
import { normalizeRedirectPath } from "./safe-redirect";

export const LOGIN_GATE_STATES = [
  "input",
  "sent",
  "unregistered",
  "rules_declined",
  "deleted",
] as const;

export type LoginGateState = (typeof LOGIN_GATE_STATES)[number];

export const loginQuerySchema = z.object({
  state: z.enum(LOGIN_GATE_STATES).default("input"),
  email: z.string().email().optional(),
  redirect: z.string().optional().transform(normalizeRedirectPath),
  error: z.string().optional(),
  gate: z.string().optional(),
});

export type LoginQuery = z.infer<typeof loginQuerySchema>;

export interface LoginQueryDefaults {
  readonly state: LoginGateState;
  readonly redirect: string;
}

const DEFAULTS: LoginQueryDefaults = {
  state: "input",
  redirect: "/profile",
};

const pickFirst = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) return value[0];
  return value;
};

/**
 * Next.js App Router の `searchParams`（Record<string, string | string[] | undefined>）を
 * loginQuerySchema で型安全にパースする。
 *
 * 不正値は `input` fallback。email が壊れていても優雅に input に落とす。
 */
export const parseLoginQuery = (
  searchParams: Record<string, string | string[] | undefined> | undefined,
): LoginQuery => {
  const raw: Record<string, string | undefined> = {};
  if (searchParams) {
    for (const key of Object.keys(searchParams)) {
      raw[key] = pickFirst(searchParams[key]);
    }
  }
  const parsed = loginQuerySchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  // partial recovery: state が壊れているなら input に落とす。redirect は安全な値に正規化。
  const redirect = normalizeRedirectPath(raw["redirect"]);
  return {
    state: DEFAULTS.state,
    redirect,
  };
};
