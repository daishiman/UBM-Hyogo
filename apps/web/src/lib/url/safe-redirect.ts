const FALLBACK_REDIRECT = "/profile";

export const isSafeInternalRedirect = (value: string): boolean => {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  return true;
};

export const normalizeRedirectPath = (
  value: string | undefined,
): string => {
  if (value && isSafeInternalRedirect(value)) return value;
  return FALLBACK_REDIRECT;
};
