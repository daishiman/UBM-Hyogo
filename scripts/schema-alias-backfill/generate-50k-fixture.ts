// Issue #504: 50,000 row deterministic synthetic fixture for schema_diff_queue.
// CONTRACT: dedupe_key prefix `ubm-test-fixture-50k-` is the cleanup/count selector.
// PII / token / 実 ID は一切含めない (synthetic data only).
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import process from "node:process";

export interface Fixture50kRow {
  diffId: string;
  revisionId: string;
  type: "added" | "changed" | "removed" | "unresolved";
  questionId: string | null;
  stableKey: string | null;
  label: string;
  suggestedStableKey: string | null;
  dedupeKey: string;
}

export const FIXTURE_PREFIX = "ubm-test-fixture-50k-";
export const SQL_CHUNK_SIZE = 500;
const TYPES: Fixture50kRow["type"][] = ["added", "changed", "removed", "unresolved"];

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateRow(index: number): Fixture50kRow {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError(`generateRow: index must be non-negative integer, got ${index}`);
  }
  const padded = index.toString().padStart(7, "0");
  const hash12 = sha256Hex(String(index)).slice(0, 12);
  const dedupeKey = `${FIXTURE_PREFIX}${padded}-${hash12}`;
  return {
    diffId: `fixture-50k-diff-${padded}`,
    revisionId: `fixture-50k-rev-${padded}`,
    type: TYPES[index % TYPES.length],
    questionId: `fixture-50k-q-${padded}`,
    stableKey: null,
    label: `Fixture Field ${padded}`,
    suggestedStableKey: `fixture_50k_field_${padded}`,
    dedupeKey,
  };
}

export function generateAll(count: number): Fixture50kRow[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`generateAll: count must be non-negative integer, got ${count}`);
  }
  const out: Fixture50kRow[] = new Array(count);
  for (let i = 0; i < count; i++) out[i] = generateRow(i);
  return out;
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function rowToValues(r: Fixture50kRow): string {
  const v = (s: string | null) => (s === null ? "NULL" : `'${escapeSql(s)}'`);
  return `(${v(r.diffId)}, ${v(r.revisionId)}, ${v(r.type)}, ${v(r.questionId)}, ${v(r.stableKey)}, ${v(r.label)}, ${v(r.suggestedStableKey)}, 'queued', ${v(r.dedupeKey)})`;
}

export function toSqlInsertChunks(rows: Fixture50kRow[], chunkSize: number = SQL_CHUNK_SIZE): string[] {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new RangeError(`toSqlInsertChunks: chunkSize must be positive integer, got ${chunkSize}`);
  }
  const chunks: string[] = [];
  const head =
    "INSERT INTO schema_diff_queue (diff_id, revision_id, type, question_id, stable_key, label, suggested_stable_key, status, dedupe_key) VALUES";
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const values = slice.map(rowToValues).join(",\n  ");
    chunks.push(`${head}\n  ${values};`);
  }
  return chunks;
}

export function toJsonl(rows: Fixture50kRow[]): string {
  return rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
}

interface CliArgs {
  count: number;
  output: string | null;
  format: "sql" | "jsonl";
  chunkSize: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { count: 50000, output: null, format: "sql", chunkSize: SQL_CHUNK_SIZE };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`missing value for ${a}`);
      return v;
    };
    switch (a) {
      case "--count":
        args.count = Number.parseInt(next(), 10);
        break;
      case "--output":
        args.output = next();
        break;
      case "--format": {
        const fmt = next();
        if (fmt !== "sql" && fmt !== "jsonl") throw new Error(`invalid --format: ${fmt}`);
        args.format = fmt;
        break;
      }
      case "--chunk-size":
        args.chunkSize = Number.parseInt(next(), 10);
        break;
      case "--help":
      case "-h":
        process.stdout.write(
          "Usage: tsx generate-50k-fixture.ts --count <N> [--output <file>] [--format sql|jsonl] [--chunk-size 500]\n",
        );
        process.exit(0);
      default:
        throw new Error(`unknown argument: ${a}`);
    }
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const rows = generateAll(args.count);
  const text =
    args.format === "sql" ? toSqlInsertChunks(rows, args.chunkSize).join("\n") + "\n" : toJsonl(rows);
  if (args.output) {
    await writeFile(args.output, text, "utf8");
    process.stderr.write(`wrote ${rows.length} rows -> ${args.output}\n`);
  } else {
    process.stdout.write(text);
  }
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  /generate-50k-fixture\.(ts|mts|js|mjs)$/.test(process.argv[1]);
if (invokedDirectly) {
  main().catch((err) => {
    process.stderr.write(`generate-50k-fixture: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
