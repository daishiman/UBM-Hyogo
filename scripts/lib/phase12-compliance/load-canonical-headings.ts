import { readFileSync } from "node:fs";

import type { CanonicalHeading } from "./types.js";

const REQUIRED_SECTIONS_COUNT = 9;

export class Phase12TemplateDriftError extends Error {
  readonly exitCode = 2;

  constructor(message: string) {
    super(message);
    this.name = "Phase12TemplateDriftError";
  }
}

export function normalizeHeading(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function loadCanonicalHeadings(templatePath: string): CanonicalHeading[] {
  const markdown = readFileSync(templatePath, "utf8");
  const requiredSectionsStart = markdown.search(/^## Required Sections\s*$/m);
  if (requiredSectionsStart === -1) {
    throw new Phase12TemplateDriftError(
      `Required Sections block not found in ${templatePath}`,
    );
  }

  const afterStart = markdown.slice(requiredSectionsStart).split("\n").slice(1).join("\n");
  const nextSectionStart = afterStart.search(/^##\s/m);
  const requiredSection =
    nextSectionStart === -1 ? afterStart : afterStart.slice(0, nextSectionStart);

  const headings = requiredSection
    .split("\n")
    .map((line) => line.match(/^\s*(\d+)\.\s+(.+?)\s*$/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => ({
      index: Number(match[1]),
      heading: normalizeHeading(match[2] ?? ""),
    }));

  const expectedIndexes = Array.from({ length: REQUIRED_SECTIONS_COUNT }, (_, index) => index + 1);
  const actualIndexes = headings.map((heading) => heading.index);
  if (
    headings.length !== REQUIRED_SECTIONS_COUNT ||
    expectedIndexes.some((expected, index) => actualIndexes[index] !== expected)
  ) {
    throw new Phase12TemplateDriftError(
      `Required Sections must be exactly ${REQUIRED_SECTIONS_COUNT} numbered headings (1..${REQUIRED_SECTIONS_COUNT}); got ${actualIndexes.join(", ")}`,
    );
  }

  return headings;
}
