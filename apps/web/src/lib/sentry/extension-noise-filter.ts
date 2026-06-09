import type { ErrorEvent, EventHint, StackFrame } from "@sentry/core";

export const EXTENSION_PROTOCOL_PREFIXES = [
  "chrome-extension://",
  "moz-extension://",
  "safari-web-extension://",
  "safari-extension://",
] as const;

export const EXTENSION_DENY_URLS: RegExp[] =
  EXTENSION_PROTOCOL_PREFIXES.map(
    (protocol) => new RegExp(`^${escapeRegExp(protocol)}`, "i"),
  );

export const EXTENSION_IGNORE_ERRORS: (string | RegExp)[] = [
  /Could not establish connection\. Receiving end does not exist\./i,
  /Unchecked runtime\.lastError/i,
  /No tab with id/i,
  /Access to storage is not allowed from this context/i,
  /Cannot read properties of undefined \(reading '(mapKeyRegistry|useVimLikeEscape)'\)/i,
  /You cannot use Sentry\.init\(\) in a browser extension/i,
];

const APP_FRAME_PROTOCOLS = /^(https?:|\/)/i;

export function isExtensionUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return EXTENSION_PROTOCOL_PREFIXES.some((protocol) =>
    url.toLowerCase().startsWith(protocol),
  );
}

export function eventHasExtensionFrame(event: ErrorEvent): boolean {
  try {
    const frameUrls = collectFrameUrls(event);
    if (frameUrls.length === 0) {
      return hasExtensionEventUrl(event);
    }

    const hasExtensionFrame = frameUrls.some(isExtensionUrl);
    if (!hasExtensionFrame) {
      return false;
    }

    return !frameUrls.some(isApplicationFrameUrl);
  } catch {
    return false;
  }
}

export function filterExtensionNoise(
  event: ErrorEvent,
  _hint?: EventHint,
): ErrorEvent | null {
  try {
    return eventHasExtensionFrame(event) ? null : event;
  } catch {
    return event;
  }
}

function collectFrameUrls(event: ErrorEvent): string[] {
  const urls: string[] = [];

  for (const value of event.exception?.values ?? []) {
    for (const frame of value.stacktrace?.frames ?? []) {
      appendFrameUrl(urls, frame);
    }
  }

  for (const frame of readTopLevelFrames(event)) {
    appendFrameUrl(urls, frame);
  }

  return urls;
}

function appendFrameUrl(urls: string[], frame: StackFrame): void {
  for (const value of [frame.filename, frame.abs_path]) {
    if (typeof value === "string" && value.length > 0) {
      urls.push(value);
    }
  }
}

function hasExtensionEventUrl(event: ErrorEvent): boolean {
  return (
    isExtensionUrl(event.request?.url) ||
    isExtensionUrl(event.transaction) ||
    isExtensionUrl(readMetadataString(event, "culprit"))
  );
}

function isApplicationFrameUrl(url: string): boolean {
  if (isExtensionUrl(url)) return false;
  return APP_FRAME_PROTOCOLS.test(url);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readMetadataString(
  event: ErrorEvent,
  key: string,
): string | undefined {
  const value = (event as unknown as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function readTopLevelFrames(event: ErrorEvent): StackFrame[] {
  const stacktrace = (event as unknown as { stacktrace?: { frames?: StackFrame[] } })
    .stacktrace;
  return stacktrace?.frames ?? [];
}
