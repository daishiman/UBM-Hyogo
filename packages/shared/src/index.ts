export * from "./branded";
export * from "./types/common";
export * from "./types/schema";
export * from "./types/response";
export * from "./types/identity";
export * from "./types/auth";
export * from "./types/viewmodel";
export * from "./zod";
export * from "./schemas";
export * from "./admin/search";
export * from "./utils/consent";
export * from "./auth";

export const runtimeFoundation = {
  node: "24.x",
  pnpm: "10.x",
  next: "16.x",
  react: "19.2.x",
  typescript: "6.x",
  webRuntime: "@opennextjs/cloudflare",
  apiRuntime: "hono-workers",
} as const;

export type RuntimeFoundation = typeof runtimeFoundation;

export function describeRuntimeFoundation(): string {
  return [
    `Node ${runtimeFoundation.node}`,
    `pnpm ${runtimeFoundation.pnpm}`,
    `Next.js ${runtimeFoundation.next}`,
    `React ${runtimeFoundation.react}`,
    `TypeScript ${runtimeFoundation.typescript}`,
  ].join(" / ");
}
