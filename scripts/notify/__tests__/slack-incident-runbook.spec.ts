import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync, rmSync, existsSync } from "node:fs";

const postMessageMock = vi.fn();
const getPermalinkMock = vi.fn();
vi.mock("@slack/web-api", () => ({
  WebClient: vi.fn().mockImplementation(() => ({
    chat: { postMessage: postMessageMock, getPermalink: getPermalinkMock },
  })),
  ErrorCode: { PlatformError: "slack_webapi_platform_error" },
}));

import {
  renderTemplate,
  resolveChannelId,
  loadRunbookPermalink,
  loadEnv,
  postIncidentRunbook,
  type RuntimeEnv,
  type CliArgs,
} from "../slack-incident-runbook";
import { saveEvidence, assertNoToken } from "../save-slack-evidence";

const TPL = "scripts/notify/slack-incident-runbook.template.json";

beforeEach(() => {
  postMessageMock.mockReset();
  getPermalinkMock.mockReset();
});

describe("renderTemplate", () => {
  it("T1: 全プレースホルダを値で置換した JSON を返す", () => {
    const r = renderTemplate(TPL, {
      mode: "dryrun",
      releaseVersion: "v1.0.0",
      deployedAt: "2026-05-06T10:00:00Z",
      oncallHandle: "@manju",
      runbookPermalink: "https://github.com/x/y/blob/abc/runbook.md",
      commitSha: "abc",
      runbookOwnerPath: "docs/runbook.md",
    });
    const s = JSON.stringify(r);
    expect(s).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
    expect(s).toContain("v1.0.0");
  });

  it("T2: プレースホルダ未解決時に throw する", () => {
    expect(() =>
      renderTemplate(TPL, { mode: "dryrun" } as never),
    ).toThrow(/unresolved placeholder/);
  });
});

describe("resolveChannelId", () => {
  const baseEnv: RuntimeEnv = {
    SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: "test-token-value",
    SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "C_PROD",
    SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID: "C_DRY",
  };

  it("T3: dryrun は dryrun channel id を返す", () => {
    expect(resolveChannelId("dryrun", baseEnv)).toBe("C_DRY");
  });

  it("T4: production の channel id 欠落で throw", () => {
    expect(() =>
      resolveChannelId("production", {
        ...baseEnv,
        SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "",
      }),
    ).toThrow(/channel id missing/);
  });

  it("T5: production と dryrun の channel id が同一なら throw（誤配信ガード）", () => {
    expect(() =>
      resolveChannelId("production", {
        ...baseEnv,
        SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "C_DRY",
      }),
    ).toThrow(/must differ/);
  });
});

describe("loadRunbookPermalink", () => {
  it("T6: 戻り値の url に commit SHA を含む", () => {
    const r = loadRunbookPermalink("package.json");
    expect(r.commitSha).toMatch(/^[0-9a-f]{7,40}$/);
    expect(r.url).toContain(r.commitSha);
    expect(r.url).toContain("package.json");
  });

  it("T6b: commit に存在しない runbook path は throw", () => {
    expect(() =>
      loadRunbookPermalink("docs/30-workflows/x/incident-runbook.md"),
    ).toThrow(/runbook path does not exist/);
  });
});

describe("loadEnv / production gate", () => {
  it("T7: SLACK_BOT_TOKEN_INCIDENT_RUNBOOK 欠落で throw", () => {
    expect(() => loadEnv({} as NodeJS.ProcessEnv)).toThrow(
      /SLACK_BOT_TOKEN_INCIDENT_RUNBOOK/,
    );
  });

  it("T8: production mode で PRODUCTION_APPROVAL_TOKEN 欠落 → fail-fast", async () => {
    const env: RuntimeEnv = {
      SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: "test-token-value",
      SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "C_PROD",
      SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID: "C_DRY",
    };
    const args: CliArgs = {
      mode: "production",
      releaseVersion: "v1",
      deployedAt: "2026-05-06T10:00:00Z",
      runbookPath: "docs/x.md",
      oncallHandle: "@m",
      evidenceOut: "/tmp/ev.json",
    };
    await expect(
      postIncidentRunbook({} as never, args, env),
    ).rejects.toThrow(/PRODUCTION_APPROVAL_TOKEN/);
  });
});

describe("saveEvidence / assertNoToken", () => {
  const tmp = "/tmp/slack-ev-test.json";
  afterEach(() => {
    if (existsSync(tmp)) rmSync(tmp);
  });

  it("T9: schema を満たす JSON が書き出される", () => {
    saveEvidence(tmp, {
      ok: true,
      ts: "1700000000.000100",
      channel: "C_DRY",
      message: { permalink: "https://slack.com/x" },
      mode: "dryrun",
      releaseVersion: "v1",
      deployedAt: "2026-05-06T10:00:00Z",
      commitSha: "abc1234",
      runbookPermalink: "https://github.com/x",
      deliveredAt: "2026-05-06T10:00:01Z",
    });
    const j = JSON.parse(readFileSync(tmp, "utf-8"));
    expect(j).toMatchObject({
      ok: true,
      ts: expect.any(String),
      channel: expect.any(String),
      message: { permalink: expect.any(String) },
    });
  });

  it("T10: token 文字列を含む値で throw", () => {
    expect(() => assertNoToken({ leak: "xoxb-AAAA-BBBB-CCCC" })).toThrow(
      /forbidden token/,
    );
    expect(() => assertNoToken({ auth: "Bearer abc.def-ghi" })).toThrow(
      /forbidden token/,
    );
  });
});

describe("postIncidentRunbook (E2E with mocked WebClient)", () => {
  const env: RuntimeEnv = {
    SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: "test-token-value",
    SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "C_PROD",
    SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID: "C_DRY",
    PRODUCTION_APPROVAL_TOKEN: "approved",
  };
  const baseArgs: CliArgs = {
    mode: "dryrun",
    releaseVersion: "v0.0.0-test",
    deployedAt: "2026-05-06T10:00:00Z",
    runbookPath: "package.json",
    oncallHandle: "@manju",
    evidenceOut: "/tmp/ev-dry.json",
  };

  afterEach(() => {
    if (existsSync(baseArgs.evidenceOut)) rmSync(baseArgs.evidenceOut);
  });

  it("T11: dryrun mode で dryrun channel id に postMessage する", async () => {
    postMessageMock.mockResolvedValue({
      ok: true,
      ts: "1700.000",
      channel: "C_DRY",
    });
    getPermalinkMock.mockResolvedValue({
      ok: true,
      permalink: "https://slack.com/x",
    });
    const { WebClient } = await import("@slack/web-api");
    await postIncidentRunbook(
      new WebClient(env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK),
      baseArgs,
      env,
    );
    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ channel: "C_DRY" }),
    );
  });

  it("T12: evidence JSON が schema 準拠 + permalink/ts/channel を含む", async () => {
    postMessageMock.mockResolvedValue({
      ok: true,
      ts: "1700.000",
      channel: "C_DRY",
    });
    getPermalinkMock.mockResolvedValue({
      ok: true,
      permalink: "https://slack.com/x",
    });
    const { WebClient } = await import("@slack/web-api");
    await postIncidentRunbook(
      new WebClient(env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK),
      baseArgs,
      env,
    );
    const j = JSON.parse(readFileSync(baseArgs.evidenceOut, "utf-8"));
    expect(j.ts).toBe("1700.000");
    expect(j.channel).toBe("C_DRY");
    expect(j.message.permalink).toBe("https://slack.com/x");
  });

  it("T13: Slack invalid_auth で throw", async () => {
    postMessageMock.mockResolvedValue({ ok: false, error: "invalid_auth" });
    const { WebClient } = await import("@slack/web-api");
    await expect(
      postIncidentRunbook(
        new WebClient(env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK),
        baseArgs,
        env,
      ),
    ).rejects.toThrow(/invalid_auth/);
    expect(postMessageMock).toHaveBeenCalledTimes(1);
  });

  it("T14: postMessage が reject されたら throw、token 値を Error message に含めない", async () => {
    postMessageMock.mockRejectedValueOnce(
      new Error("server_error token=xoxb-leaky-AAA"),
    );
    const { WebClient } = await import("@slack/web-api");
    await expect(
      postIncidentRunbook(
        new WebClient(env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK),
        baseArgs,
        env,
      ),
    ).rejects.toThrow(/chat\.postMessage failed/);
    expect(postMessageMock).toHaveBeenCalledTimes(1);
  });
});

describe("token leak assertion (cross-cutting)", () => {
  it("T15: throw された Error message に xoxb- が含まれない", async () => {
    postMessageMock.mockRejectedValue(
      new Error("auth failed token=xoxb-leaky-AAA"),
    );
    const { WebClient } = await import("@slack/web-api");
    try {
      await postIncidentRunbook(
        new WebClient("xoxb-leaky-AAA"),
        {
          mode: "dryrun",
          releaseVersion: "v1",
          deployedAt: "2026-05-06T10:00:00Z",
          runbookPath: "package.json",
          oncallHandle: "@m",
          evidenceOut: "/tmp/ev-leak.json",
        },
        {
          SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: "xoxb-leaky-AAA",
          SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID: "C_DRY",
          SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: "C_PROD",
        },
      );
      expect.fail("should have thrown");
    } catch (e: unknown) {
      expect(String((e as Error).message)).not.toContain("xoxb-leaky");
    }
  });
});
