# Phase 9: テスト実装と実行手順

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | completed |

## 1. 追加するテスト

`scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts` に Phase 4 の TC-01〜TC-12 を追加する。

### 実装スケルトン

```ts
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  redactForNotification,
  buildNotificationPayload,
  defaultSlackDispatcher,
  defaultMailDispatcher,
  evaluateAndAlert,
} from "../fallback-rate-alert";
import type { HourlySnapshot } from "../post-switch-monitor";

const triggeringSnapshots: HourlySnapshot[] = [
  { hour: "2026-05-10T00:00:00Z", fallbackRate: 0.07, /* ... */ } as any,
  { hour: "2026-05-10T01:00:00Z", fallbackRate: 0.06, /* ... */ } as any,
  { hour: "2026-05-10T02:00:00Z", fallbackRate: 0.08, /* ... */ } as any,
];

afterEach(() => vi.restoreAllMocks());

describe("redactForNotification", () => {
  it("redacts 32+ hex strings", () => {
    expect(redactForNotification("hash=abcdef0123456789abcdef0123456789ab"))
      .toBe("hash=[REDACTED:hash]");
  });
  it("redacts userId / tenantId / Bearer / slack webhook", () => {
    const out = redactForNotification(
      "userId=u_123 tenantId=t_456 Bearer abc.def-ghi https://hooks.slack.com/services/T1/B2/secret",
    );
    expect(out).toContain("userId=[REDACTED]");
    expect(out).toContain("tenantId=[REDACTED]");
    expect(out).toContain("Bearer [REDACTED]");
    expect(out).toContain("[REDACTED:slack-webhook]");
  });
});

describe("buildNotificationPayload", () => {
  it("uses redacted body", () => {
    const evaluation = {
      triggered: true,
      windowHours: 3,
      threshold: 0.05,
      observed: [
        { hour: "2026-05-10T00:00:00Z", fallbackRate: 0.07 },
      ],
      reason: "userId=u_xxx tenantId=t_yyy",
    };
    const p = buildNotificationPayload(evaluation as any, 0.05, 3);
    expect(p.text).not.toContain("u_xxx");
    expect(p.text).not.toContain("t_yyy");
    expect(p.title).toContain("fallback rate");
  });
});

describe("defaultSlackDispatcher", () => {
  it("POSTs payload.text as { text }", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    await defaultSlackDispatcher({
      url: "https://hooks.slack.com/test",
      payload: { title: "t", text: "body" },
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    const [, init] = fetchSpy.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ text: "body" });
  });
  it("throws on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    await expect(defaultSlackDispatcher({
      url: "https://hooks.slack.com/x",
      payload: { title: "t", text: "b" },
    })).rejects.toThrow(/500/);
  });
});

describe("defaultMailDispatcher", () => {
  it("POSTs subject/body/from/to", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    await defaultMailDispatcher({
      url: "https://example/mail",
      payload: { title: "t", text: "b" },
      from: "a@x", to: "b@y",
    });
    const body = JSON.parse((fetchSpy.mock.calls[0]![1] as RequestInit).body as string);
    expect(body).toEqual({ subject: "t", body: "b", from: "a@x", to: "b@y" });
  });
});

describe("evaluateAndAlert with notifications", () => {
  const baseOpts = {
    snapshots: triggeringSnapshots,
    window: 3,
    threshold: 0.05,
    dryRun: false,
    repo: "owner/repo",
    token: "ghp_test",
  };

  it("TC-06: triggers issue + slack + mail when all configured", async () => {
    const createIssue = vi.fn().mockResolvedValue("https://github.com/owner/repo/issues/1");
    const dispatchSlack = vi.fn().mockResolvedValue(undefined);
    const dispatchMail = vi.fn().mockResolvedValue(undefined);
    const result = await evaluateAndAlert({
      ...baseOpts,
      createIssue, dispatchSlack, dispatchMail,
      slackWebhookUrl: "https://hooks.slack.com/x",
      emailWebhookUrl: "https://example/m",
      emailFrom: "a@x", emailTo: "b@y",
    });
    expect(createIssue).toHaveBeenCalledOnce();
    expect(dispatchSlack).toHaveBeenCalledOnce();
    expect(dispatchMail).toHaveBeenCalledOnce();
    expect(result.slackDelivered).toBe(true);
    expect(result.mailDelivered).toBe(true);
  });

  it("TC-07: dry-run does not call any dispatcher", async () => {
    const createIssue = vi.fn();
    const dispatchSlack = vi.fn();
    const dispatchMail = vi.fn();
    await evaluateAndAlert({
      ...baseOpts, dryRun: true,
      createIssue, dispatchSlack, dispatchMail,
      slackWebhookUrl: "https://hooks.slack.com/x",
      emailWebhookUrl: "https://example/m",
      emailFrom: "a@x", emailTo: "b@y",
    });
    expect(createIssue).not.toHaveBeenCalled();
    expect(dispatchSlack).not.toHaveBeenCalled();
    expect(dispatchMail).not.toHaveBeenCalled();
  });

  it("TC-09: slack failure isolated", async () => {
    const createIssue = vi.fn().mockResolvedValue("url");
    const dispatchSlack = vi.fn().mockRejectedValue(new Error("slack 500"));
    const dispatchMail = vi.fn().mockResolvedValue(undefined);
    const result = await evaluateAndAlert({
      ...baseOpts,
      createIssue, dispatchSlack, dispatchMail,
      slackWebhookUrl: "https://hooks.slack.com/x",
      emailWebhookUrl: "https://example/m",
      emailFrom: "a@x", emailTo: "b@y",
    });
    expect(result.issueUrl).toBe("url");
    expect(result.slackDelivered).toBe(false);
    expect(result.slackError).toContain("slack 500");
    expect(result.mailDelivered).toBe(true);
  });

  it("TC-11: createIssue error propagates", async () => {
    const createIssue = vi.fn().mockRejectedValue(new Error("github 401"));
    await expect(evaluateAndAlert({ ...baseOpts, createIssue })).rejects.toThrow(/github 401/);
  });

  it("TC-12: missing slack/mail urls => no attempt", async () => {
    const createIssue = vi.fn().mockResolvedValue("url");
    const result = await evaluateAndAlert({ ...baseOpts, createIssue });
    expect(result.slackDelivered).toBeUndefined();
    expect(result.mailDelivered).toBeUndefined();
  });
});
```

> 既存 `triggeringSnapshots` の HourlySnapshot 構造は実コードに合わせて補完すること。`as any` で簡略化している箇所は実際の型定義と合わせる。

## 2. 実行コマンド

```bash
mise exec -- pnpm vitest run scripts/cf-audit-log/observation/__tests__/fallback-rate-alert.test.ts
```

## 3. 完了条件

- [x] TC-01〜TC-12 全 PASS
- [x] 既存ケース無修正で PASS
- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS

## 4. 出力

- `outputs/phase-09/main.md`
