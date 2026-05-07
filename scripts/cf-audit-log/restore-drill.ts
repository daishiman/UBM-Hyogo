import { createHash, randomUUID } from "node:crypto";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import type { D1Like, ManifestStore } from "./manifest-store.ts";
import type { R2Client } from "./r2-client.ts";
import type { ReportIssueFn } from "./export-to-r2.ts";

const gunzipAsync = promisify(gunzip);
const SEMIANNUAL_MONTHS = new Set([1, 7]);

export type RestoreDrillDeps = {
  db: D1Like;
  r2: R2Client;
  manifest: ManifestStore;
  reportIssue: ReportIssueFn;
  now?: () => Date;
  random?: () => number;
};

export type RestoreDrillOptions = {
  randomPick?: number;
  verify?: boolean;
  forceRun?: boolean;
};

export type RestoreDrillResult = {
  drilled: Array<{
    objectKey: string;
    expectedRowCount: number;
    actualRowCount: number;
    sha256Match: boolean;
  }>;
  ok: boolean;
  skipped?: "non-semiannual";
};

function pickRandom<T>(arr: T[], n: number, rand: () => number): T[] {
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length > 0) {
    const idx = Math.floor(rand() * a.length);
    out.push(a.splice(idx, 1)[0] as T);
  }
  return out;
}

export async function restoreDrill(
  deps: RestoreDrillDeps,
  opts: RestoreDrillOptions = {},
): Promise<RestoreDrillResult> {
  const now = (deps.now ?? (() => new Date()))();
  const month = now.getUTCMonth() + 1;
  const forceRun = opts.forceRun === true;
  const randomPick = opts.randomPick ?? 1;
  const verify = opts.verify !== false;
  const rand = deps.random ?? Math.random;

  if (!forceRun && !SEMIANNUAL_MONTHS.has(month)) {
    return { drilled: [], ok: true, skipped: "non-semiannual" };
  }

  const candidates = await deps.manifest.listForRandomPick(100);
  if (candidates.length === 0) {
    return { drilled: [], ok: true };
  }
  const picked = pickRandom(candidates, Math.min(randomPick, candidates.length), rand);

  const drilled: RestoreDrillResult["drilled"] = [];
  let ok = true;
  const runId = randomUUID().replace(/-/g, "_");

  for (const m of picked) {
    try {
      const obj = await deps.r2.getObject(m.objectKey);
      const decompressed = await gunzipAsync(Buffer.from(obj.body));
      const jsonl = decompressed.toString("utf8");
      const lines = jsonl.split("\n").filter((l) => l.length > 0);
      const actualRowCount = lines.length;
      const sha256 = createHash("sha256")
        .update(jsonl.endsWith("\n") ? jsonl : jsonl + (lines.length > 0 ? "\n" : ""))
        .digest("hex");
      const sha256Match = sha256 === m.sha256;

      if (verify && lines.length > 0) {
        const tmpTable = `cf_audit_log_restore_tmp_${runId}`;
        await deps.db.prepare(`DROP TABLE IF EXISTS ${tmpTable}`).run();
        await deps.db
          .prepare(`CREATE TABLE ${tmpTable} (id TEXT PRIMARY KEY, payload TEXT NOT NULL)`)
          .run();
        for (let i = 0; i < lines.length; i += 100) {
          const batch = lines.slice(i, i + 100);
          for (const line of batch) {
            const parsed = JSON.parse(line) as { id?: string };
            const idVal = parsed.id ?? `${m.objectKey}#${i}`;
            await deps.db
              .prepare(`INSERT OR REPLACE INTO ${tmpTable} (id, payload) VALUES (?, ?)`)
              .bind(idVal, line)
              .run();
          }
        }
        const cnt = await deps.db
          .prepare(`SELECT COUNT(*) AS c FROM ${tmpTable}`)
          .first<{ c: number }>();
        await deps.db.prepare(`DROP TABLE IF EXISTS ${tmpTable}`).run();
        const verified = (cnt?.c ?? 0) === actualRowCount;
        if (!verified || !sha256Match || actualRowCount !== m.rowCount) {
          ok = false;
        }
      } else if (!sha256Match || actualRowCount !== m.rowCount) {
        ok = false;
      }

      drilled.push({
        objectKey: m.objectKey,
        expectedRowCount: m.rowCount,
        actualRowCount,
        sha256Match,
      });

      // eslint-disable-next-line no-console
      console.log(
        `[restore-drill] key=${m.objectKey} expected=${m.rowCount} actual=${actualRowCount} sha256Match=${sha256Match}`,
      );
    } catch (err) {
      ok = false;
      const errMsg = err instanceof Error ? err.message : String(err);
      try {
        await deps.reportIssue({
          title: `[cf-audit-log] restore drill failed: ${m.objectKey}`,
          body: `objectKey=${m.objectKey}\nreason=${errMsg}`,
          labels: ["priority:high", "type:operations", "area:cf-audit-log"],
        });
      } catch {
        // suppress
      }
      drilled.push({
        objectKey: m.objectKey,
        expectedRowCount: m.rowCount,
        actualRowCount: -1,
        sha256Match: false,
      });
    }
  }

  if (!ok) {
    try {
      await deps.reportIssue({
        title: `[cf-audit-log] restore drill mismatch detected`,
        body: `drilled=${JSON.stringify(drilled)}`,
        labels: ["priority:high", "type:security", "area:cf-audit-log"],
      });
    } catch {
      // suppress
    }
  }

  return { drilled, ok };
}
