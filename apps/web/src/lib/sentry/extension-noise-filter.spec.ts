import { describe, expect, it, vi } from "vitest";
import type { ErrorEvent } from "@sentry/core";

import {
  EXTENSION_DENY_URLS,
  EXTENSION_IGNORE_ERRORS,
  EXTENSION_PROTOCOL_PREFIXES,
  eventHasExtensionFrame,
  filterExtensionNoise,
  isExtensionUrl,
} from "./extension-noise-filter";

describe("extension-noise-filter", () => {
  it("detects supported browser extension URL schemes", () => {
    expect(isExtensionUrl("chrome-extension://abc/service-worker-loader.js")).toBe(
      true,
    );
    expect(isExtensionUrl("moz-extension://abc/content.js")).toBe(true);
    expect(isExtensionUrl("safari-web-extension://abc/content.js")).toBe(true);
    expect(isExtensionUrl("safari-extension://abc/content.js")).toBe(true);
    expect(isExtensionUrl("https://ubm-hyogo.example/app.js")).toBe(false);
    expect(isExtensionUrl(undefined)).toBe(false);
    expect(isExtensionUrl(null)).toBe(false);
  });

  it("drops events that only contain extension frames", () => {
    const event = eventWithFrames([
      "chrome-extension://dbepggeogbaibhgnhhndojpepiihcmeb/lib/utils.js",
      "moz-extension://addon/content.js",
    ]);

    expect(eventHasExtensionFrame(event)).toBe(true);
    expect(filterExtensionNoise(event)).toBeNull();
  });

  it("drops extension frames even when they are not the final frame", () => {
    const event = eventWithFrames([
      "chrome-extension://abc/service-worker-loader.js",
      "safari-web-extension://xyz/injected.js",
    ]);

    expect(filterExtensionNoise(event)).toBeNull();
  });

  it("keeps application events without extension frames", () => {
    const event = eventWithFrames([
      "https://ubm-hyogo.example/_next/static/chunks/app.js",
    ]);

    expect(eventHasExtensionFrame(event)).toBe(false);
    expect(filterExtensionNoise(event)).toBe(event);
  });

  it("keeps mixed app and extension frames to avoid hiding app errors", () => {
    const event = eventWithFrames([
      "chrome-extension://abc/content.js",
      "https://ubm-hyogo.example/_next/static/chunks/app.js",
    ]);

    expect(eventHasExtensionFrame(event)).toBe(false);
    expect(filterExtensionNoise(event)).toBe(event);
  });

  it("keeps malformed events fail-open", () => {
    const event: ErrorEvent = {
      exception: { values: [{}] },
      type: undefined,
    };

    expect(eventHasExtensionFrame(event)).toBe(false);
    expect(filterExtensionNoise(event)).toBe(event);
  });

  it("uses request, transaction, or culprit URL only when frames are absent", () => {
    const event: ErrorEvent = {
      request: { url: "chrome-extension://abc/page.js" },
      type: undefined,
    };

    expect(eventHasExtensionFrame(event)).toBe(true);
    expect(filterExtensionNoise(event)).toBeNull();
  });

  it("uses abs_path and culprit metadata when canonical frame filenames are absent", () => {
    const absPathEvent: ErrorEvent = {
      exception: {
        values: [
          {
            stacktrace: {
              frames: [{ abs_path: "moz-extension://addon/content.js" }],
            },
          },
        ],
      },
      type: undefined,
    };
    const culpritEvent = {
      culprit: "safari-extension://legacy/global.js",
      type: undefined,
    } as ErrorEvent;

    expect(eventHasExtensionFrame(absPathEvent)).toBe(true);
    expect(filterExtensionNoise(absPathEvent)).toBeNull();
    expect(eventHasExtensionFrame(culpritEvent)).toBe(true);
    expect(filterExtensionNoise(culpritEvent)).toBeNull();
  });

  it("does not match application messages or URLs with extension constants", () => {
    expect(
      EXTENSION_IGNORE_ERRORS.some((pattern) =>
        pattern instanceof RegExp
          ? pattern.test("TypeError: members.map is not a function")
          : "TypeError: members.map is not a function".includes(pattern),
      ),
    ).toBe(false);
    expect(
      EXTENSION_DENY_URLS.some((pattern) =>
        pattern.test("https://members.ubm-hyogo.example/app.js"),
      ),
    ).toBe(false);
  });

  it("keeps events fail-open when frame inspection throws", () => {
    const event = {
      exception: {
        get values(): never {
          throw new Error("broken event");
        },
      },
      type: undefined,
    } as ErrorEvent;

    expect(filterExtensionNoise(event)).toBe(event);
  });

  it("exposes Sentry init constants for known extension noise", () => {
    expect(EXTENSION_PROTOCOL_PREFIXES).toEqual([
      "chrome-extension://",
      "moz-extension://",
      "safari-web-extension://",
      "safari-extension://",
    ]);
    expect(
      EXTENSION_DENY_URLS.some((pattern) =>
        pattern.test("chrome-extension://abc/content.js"),
      ),
    ).toBe(true);
    expect(
      EXTENSION_IGNORE_ERRORS.some((pattern) =>
        pattern instanceof RegExp
          ? pattern.test(
              "Could not establish connection. Receiving end does not exist.",
            )
          : false,
      ),
    ).toBe(true);
  });

  it("does not import or initialize the Sentry SDK as a side effect", async () => {
    vi.resetModules();
    vi.doMock("@sentry/nextjs", () => ({
      init: vi.fn(() => {
        throw new Error("must not be called");
      }),
    }));

    await expect(import("./extension-noise-filter")).resolves.toBeDefined();
  });
});

function eventWithFrames(filenames: string[]): ErrorEvent {
  return {
    exception: {
      values: [
        {
          stacktrace: {
            frames: filenames.map((filename) => ({ filename })),
          },
        },
      ],
    },
    type: undefined,
  };
}
