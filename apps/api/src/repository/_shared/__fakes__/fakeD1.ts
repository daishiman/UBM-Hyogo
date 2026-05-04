// 軽量 in-memory fake D1。pattern matching で repository が発行する SQL を解釈する。
// 全 SQL を解釈するエンジンではなく、本タスクの repository で発行される SQL のみを支える。

type Row = Record<string, unknown>;
type Table = Row[];

export interface FakeD1Spec {
  readonly tables: Record<string, Row[]>;
  readonly primaryKeys: Record<string, readonly string[]>;
}

export interface FakeD1 {
  readonly d1: D1Database;
  readonly state: FakeD1Spec;
  readonly calls: Array<{ sql: string; params: unknown[] }>;
}

export function createFakeD1(initial: Partial<FakeD1Spec> = {}): FakeD1 {
  const state: FakeD1Spec = {
    tables: { ...(initial.tables ?? {}) },
    primaryKeys: { ...(initial.primaryKeys ?? {}) },
  };
  const calls: Array<{ sql: string; params: unknown[] }> = [];

  const stmtFor = (sql: string): D1PreparedStatement => {
    const params: unknown[] = [];
    const stmt: D1PreparedStatement = {
      bind(...values: unknown[]): D1PreparedStatement {
        params.push(...values);
        return stmt;
      },
      async first<T = unknown>(): Promise<T | null> {
        calls.push({ sql, params: [...params] });
        const rows = execute(state, sql, params);
        return (rows[0] as T) ?? null;
      },
      async all<T = unknown>(): Promise<D1Result<T>> {
        calls.push({ sql, params: [...params] });
        const rows = execute(state, sql, params);
        return {
          results: rows as T[],
          success: true,
          meta: {} as D1Meta,
        } as D1Result<T>;
      },
      async run<T = unknown>(): Promise<D1Result<T>> {
        calls.push({ sql, params: [...params] });
        execute(state, sql, params);
        return {
          results: [] as T[],
          success: true,
          meta: {} as D1Meta,
        } as D1Result<T>;
      },
      async raw<T = unknown[]>(): Promise<T[]> {
        calls.push({ sql, params: [...params] });
        return [];
      },
    } as unknown as D1PreparedStatement;
    return stmt;
  };

  const d1 = {
    prepare(sql: string): D1PreparedStatement {
      return stmtFor(sql);
    },
    async batch<T = unknown>(stmts: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      const results: D1Result<T>[] = [];
      for (const s of stmts) results.push(await s.run<T>());
      return results;
    },
    async exec(_q: string): Promise<D1ExecResult> {
      return { count: 0, duration: 0 } as D1ExecResult;
    },
    async dump(): Promise<ArrayBuffer> {
      return new ArrayBuffer(0);
    },
  } as unknown as D1Database;

  return { d1, state, calls };
}

const KEYWORDS = new Set(["WHERE", "ORDER", "LIMIT", "GROUP", "JOIN", "ON", "AS", "AND", "OR"]);

function execute(state: FakeD1Spec, sql: string, params: unknown[]): Row[] {
  const trimmed = sql.trim().replace(/\s+/g, " ");
  const upper = trimmed.toUpperCase();
  if (upper.startsWith("INSERT")) return handleInsert(state, trimmed, params);
  if (upper.startsWith("UPDATE")) return handleUpdate(state, trimmed, params);
  if (upper.startsWith("DELETE")) return handleDelete(state, trimmed, params);
  if (upper.startsWith("SELECT")) return handleSelect(state, trimmed, params);
  return [];
}

function ensureTable(state: FakeD1Spec, name: string): Table {
  if (!state.tables[name]) state.tables[name] = [];
  return state.tables[name]!;
}

function handleInsert(state: FakeD1Spec, sql: string, params: unknown[]): Row[] {
  const m = sql.match(/^INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (!m) return [];
  const orReplace = /OR\s+REPLACE/i.test(sql);
  const [, table, colsRaw] = m;
  const cols = colsRaw!.split(",").map((c) => c.trim());
  const row: Row = {};
  cols.forEach((c, i) => {
    row[c] = params[i] ?? null;
  });
  const tbl = ensureTable(state, table!);
  const pk = state.primaryKeys[table!] ?? ["id"];
  if (orReplace) {
    const idx = tbl.findIndex((r) => pk.every((k) => r[k] === row[k]));
    if (idx >= 0) tbl.splice(idx, 1);
  } else if (tbl.some((r) => pk.every((k) => r[k] === row[k]))) {
    throw new Error(`D1_ERROR: UNIQUE constraint failed: ${table}.${pk.join(",")}`);
  }
  tbl.push(row);
  return [row];
}

function handleUpdate(state: FakeD1Spec, sql: string, params: unknown[]): Row[] {
  const m = sql.match(/^UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)$/i);
  if (!m) return [];
  const [, table, setClause, whereClause] = m;
  const tbl = ensureTable(state, table!);
  let pi = 0;
  const setOps: Array<{ col: string; getValue: () => unknown }> = setClause!.split(",").map((s) => {
    const [colRaw, valRaw] = s.split("=").map((x) => x.trim());
    if (valRaw === "?") {
      const idx = pi++;
      return { col: colRaw!, getValue: () => params[idx] };
    }
    const lit = stripQuotes(valRaw!);
    return { col: colRaw!, getValue: () => lit };
  });
  const wherePreds = compileWhere(whereClause!, params, pi);
  for (const r of tbl) {
    if (wherePreds.every((p) => p(r))) {
      for (const s of setOps) r[s.col] = s.getValue();
    }
  }
  return [];
}

function handleDelete(state: FakeD1Spec, sql: string, params: unknown[]): Row[] {
  const m = sql.match(/^DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)$/i);
  if (!m) return [];
  const [, table, whereClause] = m;
  const tbl = ensureTable(state, table!);
  const preds = compileWhere(whereClause!, params, 0);
  for (let i = tbl.length - 1; i >= 0; i--) {
    if (preds.every((p) => p(tbl[i]!))) tbl.splice(i, 1);
  }
  return [];
}

function handleSelect(state: FakeD1Spec, sql: string, params: unknown[]): Row[] {
  // FROM <table> [AS <alias>]? — alias は予約語以外
  const fromMatch = sql.match(/FROM\s+(\w+)(.*)$/i);
  if (!fromMatch) return [];
  const [, table, afterFrom] = fromMatch;
  let body = afterFrom ?? "";

  // alias 抽出（予約語でなければ）
  let alias = table!;
  const aliasMatch = body.match(/^\s+(?:AS\s+)?(\w+)(.*)$/i);
  if (aliasMatch && !KEYWORDS.has(aliasMatch[1]!.toUpperCase())) {
    alias = aliasMatch[1]!;
    body = aliasMatch[2] ?? "";
  }

  let rows: Row[] = ensureTable(state, table!).map((r) => prefixRow(r, alias));

  // JOIN（１回）。ON 句のエイリアス順序は問わない
  const joinMatch = body.match(/^\s*JOIN\s+(\w+)\s+(?:AS\s+)?(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)(.*)$/i);
  if (joinMatch) {
    const [, jTable, jAlias, lA, lC, rA, rC, rest] = joinMatch;
    const jRows = ensureTable(state, jTable!).map((r) => prefixRow(r, jAlias!));
    const out: Row[] = [];
    for (const left of rows) {
      for (const right of jRows) {
        const merged = { ...left, ...right };
        const lv = merged[`${lA}.${lC}`];
        const rv = merged[`${rA}.${rC}`];
        if (lv !== undefined && rv !== undefined && lv === rv) out.push(merged);
      }
    }
    rows = out;
    body = rest ?? "";
  }

  // WHERE
  let pi = 0;
  const whereMatch = body.match(/\bWHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
  if (whereMatch) {
    const preds = compileWhereWithAlias(whereMatch[1]!, params, pi, state, alias);
    pi = preds.consumed;
    rows = rows.filter((row) => preds.fns.every((fn) => fn(row)));
  }

  // ORDER BY
  const orderMatch = body.match(/ORDER\s+BY\s+([\w.]+)\s*(ASC|DESC)?/i);
  if (orderMatch) {
    const [, key, dir] = orderMatch;
    const k = key!.includes(".") ? key! : `${alias}.${key}`;
    rows.sort((a, b) => {
      const av = a[k] as string | number;
      const bv = b[k] as string | number;
      const c = av < bv ? -1 : av > bv ? 1 : 0;
      return dir?.toUpperCase() === "DESC" ? -c : c;
    });
  }

  // LIMIT / OFFSET
  const limPlaceholder = body.match(/LIMIT\s+\?(?:\s+OFFSET\s+\?)?/i);
  if (limPlaceholder) {
    const lim = Number(params[pi++]);
    const off = /OFFSET/i.test(limPlaceholder[0]) ? Number(params[pi++]) : 0;
    rows = rows.slice(off, off + lim);
  } else {
    const litLimit = body.match(/LIMIT\s+(\d+)/i);
    if (litLimit) rows = rows.slice(0, Number(litLimit[1]));
  }

  return rows.map(unprefixRow);
}

function prefixRow(row: Row, alias: string): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) out[`${alias}.${k}`] = v;
  return out;
}

function unprefixRow(row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    const idx = k.indexOf(".");
    out[idx >= 0 ? k.slice(idx + 1) : k] = v;
  }
  return out;
}

function stripQuotes(s: string): string {
  return s.replace(/^['"]|['"]$/g, "");
}

// 簡易 WHERE (UPDATE/DELETE 用、エイリアスなし)
function compileWhere(whereClause: string, params: unknown[], startIdx: number): Array<(r: Row) => boolean> {
  let pi = startIdx;
  return whereClause.split(/\s+AND\s+/i).map((part) => {
    const [colRaw, valRaw] = part.split("=").map((x) => x.trim());
    if (valRaw === "?") {
      const v = params[pi++];
      return (r: Row) => r[colRaw!] === v;
    }
    const lit = stripQuotes(valRaw!);
    const num = Number(lit);
    const value = Number.isNaN(num) || lit === "" ? lit : num;
    return (r: Row) => r[colRaw!] === value;
  });
}

// SELECT 用 WHERE — エイリアス・サブクエリ対応
function compileWhereWithAlias(
  whereClause: string,
  params: unknown[],
  startIdx: number,
  state: FakeD1Spec,
  defaultAlias: string,
): { fns: Array<(r: Row) => boolean>; consumed: number } {
  let pi = startIdx;
  const fns: Array<(r: Row) => boolean> = [];
  for (const part of whereClause.split(/\s+AND\s+/i)) {
    const trimmed = part.trim().replace(/^\((.*)\)$/s, "$1").trim();
    const queuedOrBackfill = trimmed.match(
      /^status\s*=\s*\?\s+OR\s+backfill_status\s+IN\s*\(([^)]+)\)$/i,
    );
    if (queuedOrBackfill) {
      const status = params[pi++];
      const backfillStatuses = queuedOrBackfill[1]!
        .split(",")
        .map((x) => stripQuotes(x.trim()));
      fns.push(
        (row) =>
          row[`${defaultAlias}.status`] === status ||
          backfillStatuses.includes(String(row[`${defaultAlias}.backfill_status`])),
      );
      continue;
    }
    // NOT IN sub
    const sub = trimmed.match(
      /^([\w.]+)\s+NOT\s+IN\s*\(\s*SELECT\s+(\w+)\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*\?\s*\)$/i,
    );
    if (sub) {
      const [, colRaw, subSel, subTbl, subWhere] = sub;
      const colKey = qualify(colRaw!, defaultAlias);
      const v = params[pi++];
      const subRows = ensureTable(state, subTbl!);
      const blocked = subRows.filter((r) => r[subWhere!] === v).map((r) => r[subSel!]);
      fns.push((row) => !blocked.includes(row[colKey]));
      continue;
    }
    const [colRaw, valRaw] = trimmed.split("=").map((x) => x.trim());
    const colKey = qualify(colRaw!, defaultAlias);
    if (valRaw === "?") {
      const v = params[pi++];
      fns.push((row) => row[colKey] === v);
    } else {
      const lit = stripQuotes(valRaw!);
      const num = Number(lit);
      const value = Number.isNaN(num) || lit === "" ? lit : num;
      fns.push((row) => row[colKey] === value);
    }
  }
  return { fns, consumed: pi };
}

function qualify(col: string, defaultAlias: string): string {
  return col.includes(".") ? col : `${defaultAlias}.${col}`;
}
