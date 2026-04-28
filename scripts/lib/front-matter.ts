// minimal YAML front matter parser for skill ledger fragments.
// supports flat string keys only (timestamp / branch / author / type).

export interface FrontMatter {
  timestamp: string;
  branch: string;
  author: string;
  type: string;
  [key: string]: string;
}

export const REQUIRED_KEYS: ReadonlyArray<keyof FrontMatter> = [
  "timestamp",
  "branch",
  "author",
  "type",
];

export interface ParsedFragment {
  frontMatter: FrontMatter;
  body: string;
}

export class FrontMatterError extends Error {
  constructor(
    message: string,
    public readonly path: string,
  ) {
    super(`${path}: ${message}`);
    this.name = "FrontMatterError";
  }
}

const FENCE = "---";

export function parseFragment(content: string, path: string): ParsedFragment {
  const lines = content.split(/\r?\n/);
  if (lines[0] !== FENCE) {
    throw new FrontMatterError("missing front matter open fence", path);
  }
  let endIdx = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === FENCE) {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) {
    throw new FrontMatterError("missing front matter close fence", path);
  }
  const fmLines = lines.slice(1, endIdx);
  const fm: Partial<FrontMatter> = {};
  for (const raw of fmLines) {
    if (raw.trim() === "" || raw.trim().startsWith("#")) continue;
    const m = /^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*)$/.exec(raw);
    if (!m) {
      throw new FrontMatterError(`invalid front matter line: ${raw}`, path);
    }
    const key = m[1];
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    (fm as Record<string, string>)[key] = value;
  }
  for (const k of REQUIRED_KEYS) {
    if (!fm[k] || fm[k]!.length === 0) {
      throw new FrontMatterError(`missing required front matter key: ${k}`, path);
    }
  }
  const body = lines.slice(endIdx + 1).join("\n");
  return { frontMatter: fm as FrontMatter, body };
}

export function buildFragmentContent(
  fm: FrontMatter,
  body: string,
): string {
  const fmLines = [
    FENCE,
    `timestamp: ${fm.timestamp}`,
    `branch: ${fm.branch}`,
    `author: ${fm.author}`,
    `type: ${fm.type}`,
    FENCE,
    "",
  ];
  return `${fmLines.join("\n")}${body.endsWith("\n") ? body : `${body}\n`}`;
}
