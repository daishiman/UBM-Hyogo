import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type SlackDeliveryEvidence = {
  ok: true;
  ts: string;
  channel: string;
  message: { permalink: string };
  mode: "dryrun" | "production";
  releaseVersion: string;
  deployedAt: string;
  commitSha: string;
  runbookPermalink: string;
  deliveredAt: string;
};

const FORBIDDEN_PATTERNS: RegExp[] = [
  /xoxb-[A-Za-z0-9-]+/,
  /xoxp-[A-Za-z0-9-]+/,
  /xapp-[A-Za-z0-9-]+/,
  /Bearer\s+[A-Za-z0-9._-]+/,
];

export function assertNoToken(value: unknown): void {
  const s = JSON.stringify(value);
  for (const pat of FORBIDDEN_PATTERNS) {
    if (pat.test(s)) {
      throw new Error(`evidence contains forbidden token marker: ${pat.source}`);
    }
  }
}

export function saveEvidence(path: string, ev: SlackDeliveryEvidence): void {
  assertNoToken(ev);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(ev, null, 2) + "\n", { encoding: "utf-8" });
}

export function saveTextEvidence(path: string, value: string): void {
  assertNoToken(value);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value.endsWith("\n") ? value : `${value}\n`, {
    encoding: "utf-8",
  });
}
