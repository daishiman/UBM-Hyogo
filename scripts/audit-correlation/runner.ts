#!/usr/bin/env -S node --import tsx
import { readFile, writeFile } from 'node:fs/promises';
import { argv, exit, stdout } from 'node:process';
import {
  correlate,
  redactCloudflare,
  redactGitHub,
  type RawCloudflareAuditEvent,
  type RawGitHubAuditEvent,
} from '../../apps/api/src/audit-correlation/index';

interface ParsedArgs {
  github: string;
  cloudflare: string;
  salt: string;
  previousSalt?: string;
  out?: string;
}

function usageAndExit(): never {
  process.stderr.write(
    'Usage: runner.ts --github <gh.json> --cloudflare <cf.json> --salt <salt> [--previous-salt <salt>] [--out <out.json>]\n',
  );
  exit(2);
}

function parseArgs(args: string[]): ParsedArgs {
  const out: Partial<ParsedArgs> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const v = args[i + 1];
    switch (a) {
      case '--github':
        out.github = v;
        i++;
        break;
      case '--cloudflare':
        out.cloudflare = v;
        i++;
        break;
      case '--salt':
        out.salt = v;
        i++;
        break;
      case '--previous-salt':
        out.previousSalt = v;
        i++;
        break;
      case '--out':
        out.out = v;
        i++;
        break;
      default:
        process.stderr.write(`unknown arg: ${a}\n`);
        usageAndExit();
    }
  }
  if (!out.github || !out.cloudflare || !out.salt) usageAndExit();
  return out as ParsedArgs;
}

async function readJson<T>(path: string): Promise<T> {
  const buf = await readFile(path, 'utf8');
  return JSON.parse(buf) as T;
}

async function main(): Promise<void> {
  const args = parseArgs(argv.slice(2));
  const ghRaw = await readJson<ReadonlyArray<RawGitHubAuditEvent>>(args.github);
  const cfRaw = await readJson<ReadonlyArray<RawCloudflareAuditEvent>>(args.cloudflare);

  const redactOpts = { salt: args.salt, previousSalt: args.previousSalt };
  const ghNorm = await Promise.all(ghRaw.map((e) => redactGitHub(e, redactOpts)));
  const cfNorm = await Promise.all(cfRaw.map((e) => redactCloudflare(e, redactOpts)));

  const findings = correlate(ghNorm, cfNorm);
  const json = JSON.stringify(findings, null, 2);

  if (args.out) {
    await writeFile(args.out, json);
  } else {
    stdout.write(json);
    stdout.write('\n');
  }
}

main().catch((err) => {
  process.stderr.write(`audit-correlation runner failed: ${(err as Error).message}\n`);
  exit(1);
});
