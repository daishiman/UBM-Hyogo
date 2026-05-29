import { isSafeInternalRedirect } from "./safe-redirect";

const MAX_NEXT_LENGTH = 256;

export const safeNext = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  if (raw.length === 0 || raw.length > MAX_NEXT_LENGTH) return null;
  if (raw.includes(":")) return null;
  if (!isSafeInternalRedirect(raw)) return null;
  return raw;
};
