"use client";

export const STABLE_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export const normalizeStableKey = (value: string) => value.trim();

export const isStableKeyValid = (value: string) =>
  STABLE_KEY_PATTERN.test(normalizeStableKey(value));

export const STABLE_KEY_VALIDATION_MESSAGE =
  "stableKey は英字で始まり、英数字と _ のみ使用できます（例: fullName）。";
