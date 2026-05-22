import { describe, expect, it, vi } from "vitest";
import {
  buildNotificationPayload,
  buildIssueBody,
  defaultMailDispatcher,
  defaultSlackDispatcher,
  evaluateAndAlert,
  evaluateConsecutive,
  parseArgs,
  redactForNotification,
} from "../fallback-rate-alert.ts";
import type { HourlySnapshot } from "../post-switch-monitor.ts";

function makeSnapshot(hour: string, fallbackRate: number): HourlySnapshot {
  return {
    hour,
    classifierUsed: "ml",
    classifierVersion: "ml@v1",
    totalEvents: 100,
    issuesOpenedThisHour: 0,
    fallbackRate,
    p95LatencyMs: 50,
    leakageGrepResult: "clean",
  };
}

describe("parseArgs", () => {
  it("uses default window=3 / threshold=0.05", () => {
    const args = parseArgs([]);
    expect(args.window).toBe(3);
    expect(args.threshold).toBeCloseTo(0.05);
    expect(args.dryRun).toBe(false);
  });

  it("rejects invalid threshold", () => {
    expect(() => parseArgs(["--threshold=2"])).toThrow();
    expect(() => parseArgs(["--threshold=0"])).toThrow();
  });

  it("rejects invalid window", () => {
    expect(() => parseArgs(["--window=0"])).toThrow();
  });
});

describe("evaluateConsecutive", () => {
  it("triggers when last N hours all exceed threshold", () => {
    const snaps = [
      makeSnapshot("2026-05-08T00:00:00Z", 0.01),
      makeSnapshot("2026-05-08T01:00:00Z", 0.06),
      makeSnapshot("2026-05-08T02:00:00Z", 0.07),
      makeSnapshot("2026-05-08T03:00:00Z", 0.08),
    ];
    const result = evaluateConsecutive(snaps, 0.05, 3);
    expect(result.triggered).toBe(true);
    expect(result.observed).toHaveLength(3);
  });

  it("does not trigger when most recent is within threshold", () => {
    const snaps = [
      makeSnapshot("2026-05-08T00:00:00Z", 0.07),
      makeSnapshot("2026-05-08T01:00:00Z", 0.08),
      makeSnapshot("2026-05-08T02:00:00Z", 0.04),
    ];
    expect(evaluateConsecutive(snaps, 0.05, 3).triggered).toBe(false);
  });

  it("returns false when not enough snapshots", () => {
    const snaps = [
      makeSnapshot("2026-05-08T00:00:00Z", 0.99),
      makeSnapshot("2026-05-08T01:00:00Z", 0.99),
    ];
    const r = evaluateConsecutive(snaps, 0.05, 3);
    expect(r.triggered).toBe(false);
    expect(r.reason).toMatch(/not enough/);
  });

  it("handles empty input safely", () => {
    expect(evaluateConsecutive([], 0.05, 3).triggered).toBe(false);
  });
});

describe("buildIssueBody", () => {
  it("renders observed snapshots and Refs", () => {
    const evaluation = evaluateConsecutive(
      [
        makeSnapshot("2026-05-08T00:00:00Z", 0.06),
        makeSnapshot("2026-05-08T01:00:00Z", 0.07),
        makeSnapshot("2026-05-08T02:00:00Z", 0.08),
      ],
      0.05,
      3,
    );
    const body = buildIssueBody(evaluation);
    expect(body).toContain("Refs #549");
    expect(body).toContain("2026-05-08T00:00:00Z");
    expect(body).toContain("8.00%");
  });
});

describe("redactForNotification", () => {
  it("redacts hashes, identities, bearer tokens, and Slack webhook URLs", () => {
    const output = redactForNotification(
      [
        "hash=abcdef0123456789abcdef0123456789ab",
        "userId=user-123",
        "tenantId=tenant-456",
        '"userId":"json-user"',
        '"tenant_id":"json-tenant"',
        "Bearer abc.def-ghi",
        "https://hooks.slack.com/services/T1/B2/secret",
      ].join(" "),
    );

    expect(output).toContain("hash=[REDACTED:hash]");
    expect(output).toContain("userId=[REDACTED]");
    expect(output).toContain("tenantId=[REDACTED]");
    expect(output).toContain('"userId":"[REDACTED]"');
    expect(output).toContain('"tenant_id":"[REDACTED]"');
    expect(output).toContain("Bearer [REDACTED]");
    expect(output).toContain("[REDACTED:slack-webhook]");
    expect(output).not.toContain("abcdef0123456789");
    expect(output).not.toContain("user-123");
    expect(output).not.toContain("tenant-456");
    expect(output).not.toContain("json-user");
    expect(output).not.toContain("json-tenant");
    expect(output).not.toContain("hooks.slack.com/services");
  });
});

describe("buildNotificationPayload", () => {
  it("builds a redacted notification body while keeping a stable alert title", () => {
    const evaluation = {
      triggered: true,
      windowHours: 3,
      threshold: 0.05,
      observed: [makeSnapshot("2026-05-08T02:00:00Z", 0.08)],
      reason:
        "fallbackRate > 0.05 for 3 consecutive hours userId=user-123 tenantId=tenant-456",
    };

    const payload = buildNotificationPayload(evaluation, 0.05, 3);
    expect(payload.title).toBe("[cf-audit] fallback rate > 0.05 for 3h");
    expect(payload.text).toContain("userId=[REDACTED]");
    expect(payload.text).toContain("tenantId=[REDACTED]");
    expect(payload.text).not.toContain("user-123");
    expect(payload.text).not.toContain("tenant-456");
  });
});

describe("notification dispatchers", () => {
  it("defaultSlackDispatcher posts payload.text as a simple Slack message", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await defaultSlackDispatcher({
      url: "https://hooks.slack.com/test",
      payload: { title: "title", text: "body" },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ text: "body" });
  });

  it("defaultSlackDispatcher throws on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 500 }));

    await expect(
      defaultSlackDispatcher({
        url: "https://hooks.slack.com/test",
        payload: { title: "title", text: "body" },
      }),
    ).rejects.toThrow(/Slack webhook 500/);
  });

  it("defaultMailDispatcher posts subject, body, from, and to", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await defaultMailDispatcher({
      url: "https://example.test/mail",
      payload: { title: "title", text: "body" },
      from: "alerts@example.test",
      to: "incidents@example.test",
    });

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      subject: "title",
      body: "body",
      from: "alerts@example.test",
      to: "incidents@example.test",
    });
  });
});

describe("evaluateAndAlert", () => {
  const triggerSnaps = [
    makeSnapshot("2026-05-08T00:00:00Z", 0.06),
    makeSnapshot("2026-05-08T01:00:00Z", 0.07),
    makeSnapshot("2026-05-08T02:00:00Z", 0.08),
  ];

  it("dry-run does not call createIssue even when triggered", async () => {
    const createIssue = vi.fn();
    const result = await evaluateAndAlert({
      snapshots: triggerSnaps,
      window: 3,
      threshold: 0.05,
      dryRun: true,
      createIssue,
    });
    expect(result.evaluation.triggered).toBe(true);
    expect(result.issueUrl).toBeUndefined();
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("calls createIssue when triggered and not dry-run", async () => {
    const createIssue = vi.fn().mockResolvedValue("https://example.com/issues/1");
    const result = await evaluateAndAlert({
      snapshots: triggerSnaps,
      window: 3,
      threshold: 0.05,
      dryRun: false,
      repo: "daishiman/UBM-Hyogo",
      token: "test-token",
      createIssue,
    });
    expect(result.issueUrl).toBe("https://example.com/issues/1");
    expect(createIssue).toHaveBeenCalledTimes(1);
    const arg = createIssue.mock.calls[0][0];
    expect(arg.repo).toBe("daishiman/UBM-Hyogo");
    expect(arg.labels).toContain("type:incident");
  });

  it("calls issue, Slack, and mail dispatchers when all destinations are configured", async () => {
    const createIssue = vi.fn().mockResolvedValue("https://example.com/issues/1");
    const dispatchSlack = vi.fn().mockResolvedValue(undefined);
    const dispatchMail = vi.fn().mockResolvedValue(undefined);

    const result = await evaluateAndAlert({
      snapshots: triggerSnaps,
      window: 3,
      threshold: 0.05,
      dryRun: false,
      repo: "daishiman/UBM-Hyogo",
      token: "test-token",
      createIssue,
      slackWebhookUrl: "https://hooks.slack.com/test",
      emailWebhookUrl: "https://example.test/mail",
      emailFrom: "alerts@example.test",
      emailTo: "incidents@example.test",
      dispatchSlack,
      dispatchMail,
    });

    expect(result.issueUrl).toBe("https://example.com/issues/1");
    expect(result.slackDelivered).toBe(true);
    expect(result.mailDelivered).toBe(true);
    expect(createIssue).toHaveBeenCalledTimes(1);
    expect(dispatchSlack).toHaveBeenCalledTimes(1);
    expect(dispatchMail).toHaveBeenCalledTimes(1);
  });

  it("starts Slack and mail delivery without waiting for issue creation to finish", async () => {
    let resolveIssue: (url: string) => void = () => undefined;
    const createIssue = vi.fn(
      () => new Promise<string>((resolve) => {
        resolveIssue = resolve;
      }),
    );
    const dispatchSlack = vi.fn().mockResolvedValue(undefined);
    const dispatchMail = vi.fn().mockResolvedValue(undefined);

    const resultPromise = evaluateAndAlert({
      snapshots: triggerSnaps,
      window: 3,
      threshold: 0.05,
      dryRun: false,
      repo: "daishiman/UBM-Hyogo",
      token: "test-token",
      createIssue,
      slackWebhookUrl: "https://hooks.slack.com/test",
      emailWebhookUrl: "https://example.test/mail",
      emailFrom: "alerts@example.test",
      emailTo: "incidents@example.test",
      dispatchSlack,
      dispatchMail,
    });

    await Promise.resolve();
    expect(dispatchSlack).toHaveBeenCalledTimes(1);
    expect(dispatchMail).toHaveBeenCalledTimes(1);

    resolveIssue("https://example.com/issues/1");
    await expect(resultPromise).resolves.toMatchObject({
      issueUrl: "https://example.com/issues/1",
      slackDelivered: true,
      mailDelivered: true,
    });
  });

  it("dry-run skips issue and notification dispatchers even when destinations are configured", async () => {
    const createIssue = vi.fn();
    const dispatchSlack = vi.fn();
    const dispatchMail = vi.fn();

    const result = await evaluateAndAlert({
      snapshots: triggerSnaps,
      window: 3,
      threshold: 0.05,
      dryRun: true,
      repo: "daishiman/UBM-Hyogo",
      token: "test-token",
      createIssue,
      slackWebhookUrl: "https://hooks.slack.com/test",
      emailWebhookUrl: "https://example.test/mail",
      emailFrom: "alerts@example.test",
      emailTo: "incidents@example.test",
      dispatchSlack,
      dispatchMail,
    });

    expect(result.evaluation.triggered).toBe(true);
    expect(createIssue).not.toHaveBeenCalled();
    expect(dispatchSlack).not.toHaveBeenCalled();
    expect(dispatchMail).not.toHaveBeenCalled();
  });

  it("isolates Slack failure and still delivers mail after creating the issue", async () => {
    const createIssue = vi.fn().mockResolvedValue("https://example.com/issues/1");
    const dispatchSlack = vi.fn().mockRejectedValue(new Error("slack 500"));
    const dispatchMail = vi.fn().mockResolvedValue(undefined);

    const result = await evaluateAndAlert({
      snapshots: triggerSnaps,
      window: 3,
      threshold: 0.05,
      dryRun: false,
      repo: "daishiman/UBM-Hyogo",
      token: "test-token",
      createIssue,
      slackWebhookUrl: "https://hooks.slack.com/test",
      emailWebhookUrl: "https://example.test/mail",
      emailFrom: "alerts@example.test",
      emailTo: "incidents@example.test",
      dispatchSlack,
      dispatchMail,
    });

    expect(result.issueUrl).toBe("https://example.com/issues/1");
    expect(result.slackDelivered).toBe(false);
    expect(result.slackError).toBe("slack 500");
    expect(result.mailDelivered).toBe(true);
  });

  it("does not attempt Slack or mail when destination env is missing", async () => {
    const createIssue = vi.fn().mockResolvedValue("https://example.com/issues/1");
    const dispatchSlack = vi.fn();
    const dispatchMail = vi.fn();

    const result = await evaluateAndAlert({
      snapshots: triggerSnaps,
      window: 3,
      threshold: 0.05,
      dryRun: false,
      repo: "daishiman/UBM-Hyogo",
      token: "test-token",
      createIssue,
      dispatchSlack,
      dispatchMail,
    });

    expect(result.issueUrl).toBe("https://example.com/issues/1");
    expect(result.slackDelivered).toBeUndefined();
    expect(result.mailDelivered).toBeUndefined();
    expect(dispatchSlack).not.toHaveBeenCalled();
    expect(dispatchMail).not.toHaveBeenCalled();
  });

  it("does not call createIssue when not triggered", async () => {
    const createIssue = vi.fn();
    await evaluateAndAlert({
      snapshots: [makeSnapshot("h", 0.01), makeSnapshot("h2", 0.02), makeSnapshot("h3", 0.03)],
      window: 3,
      threshold: 0.05,
      dryRun: false,
      repo: "x/y",
      token: "t",
      createIssue,
    });
    expect(createIssue).not.toHaveBeenCalled();
  });

  it("requires repo+token when triggered and not dry-run", async () => {
    await expect(
      evaluateAndAlert({
        snapshots: triggerSnaps,
        window: 3,
        threshold: 0.05,
        dryRun: false,
      }),
    ).rejects.toThrow(/token/);
  });
});
