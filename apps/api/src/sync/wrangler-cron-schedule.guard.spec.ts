import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const CANONICAL_CRONS = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"] as const;
const LEGACY_SHEETS_HOURLY_CRON = "0 * * * *";
const FREE_PLAN_CRON_LIMIT = 3;
const SECTION_HEADERS = ["triggers", "env.staging.triggers", "env.production.triggers"] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSectionHeader(sectionHeader: string): string {
  return sectionHeader.replace(/^\[/, "").replace(/\]$/, "");
}

export function extractCrons(tomlText: string, sectionHeader: string): string[] {
  const normalizedHeader = normalizeSectionHeader(sectionHeader);
  const headerPattern = new RegExp(`^\\[${escapeRegExp(normalizedHeader)}\\]\\s*(?:#.*)?$`, "m");
  const headerMatch = headerPattern.exec(tomlText);
  if (!headerMatch?.index) {
    if (!headerMatch) return [];
  }

  const sectionStart = (headerMatch.index ?? 0) + headerMatch[0].length;
  const afterHeader = tomlText.slice(sectionStart);
  const nextSectionIndex = afterHeader.search(/^\s*\[/m);
  const sectionBody = nextSectionIndex === -1 ? afterHeader : afterHeader.slice(0, nextSectionIndex);
  const uncommentedBody = sectionBody
    .split("\n")
    .map((line) => line.replace(/#.*$/, ""))
    .join("\n");
  const cronsMatch = /crons\s*=\s*\[([^\]]*)\]/m.exec(uncommentedBody);
  if (!cronsMatch) return [];

  return Array.from(cronsMatch[1].matchAll(/["']([^"']+)["']/g), (match) => match[1].trim()).filter(
    (cron) => cron.length > 0,
  );
}

function loadWranglerToml(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return readFileSync(resolve(here, "../../wrangler.toml"), "utf8");
}

describe("issue-264 wrangler cron free-tier guard", () => {
  const toml = loadWranglerToml();
  const cronsBySection = SECTION_HEADERS.map((section) => ({
    crons: extractCrons(toml, section),
    section,
  }));

  it.each(cronsBySection)("$section crons match the canonical free-tier schedule", ({ crons }) => {
    expect(crons).toEqual([...CANONICAL_CRONS]);
  });

  it.each(cronsBySection)("$section keeps cron entries within the free-plan limit", ({ crons }) => {
    expect(crons.length).toBeLessThanOrEqual(FREE_PLAN_CRON_LIMIT);
  });

  it.each(cronsBySection)("$section does not reintroduce the legacy Sheets hourly cron", ({ crons }) => {
    expect(crons).not.toContain(LEGACY_SHEETS_HOURLY_CRON);
  });

  it("keeps default, staging, and production cron schedules in parity", () => {
    const [defaultCrons, stagingCrons, productionCrons] = cronsBySection.map(({ crons }) => crons);

    expect(stagingCrons).toEqual(defaultCrons);
    expect(productionCrons).toEqual(defaultCrons);
  });

  describe("extractCrons", () => {
    it("extracts quoted cron entries from a section", () => {
      const source = `[triggers]\ncrons = ["0 18 * * *", "*/15 * * * *"]\n`;

      expect(extractCrons(source, "triggers")).toEqual(["0 18 * * *", "*/15 * * * *"]);
    });

    it("returns an empty array when the section is absent", () => {
      expect(extractCrons(`[vars]\nENVIRONMENT = "test"\n`, "triggers")).toEqual([]);
    });

    it("returns an empty array when a section has no crons key", () => {
      expect(extractCrons(`[triggers]\nname = "no-crons"\n`, "triggers")).toEqual([]);
    });

    it("ignores commented cron lines and accepts bracketed section input", () => {
      const source = `[triggers]\n# crons = ["0 * * * *"]\ncrons = ['0 18 * * *'] # daily\n`;

      expect(extractCrons(source, "[triggers]")).toEqual(["0 18 * * *"]);
    });

    it("does not read crons from the next section", () => {
      const source = [
        `[triggers]`,
        `crons = ["0 18 * * *"]`,
        `[env.staging.triggers]`,
        `crons = ["*/5 * * * *"]`,
      ].join("\n");

      expect(extractCrons(source, "triggers")).toEqual(["0 18 * * *"]);
    });

    it("extracts cron entries from multiline arrays", () => {
      const source = [`[triggers]`, `crons = [`, `  "0 18 * * *",`, `  "*/15 * * * *",`, `]`].join("\n");

      expect(extractCrons(source, "triggers")).toEqual(["0 18 * * *", "*/15 * * * *"]);
    });
  });
});
