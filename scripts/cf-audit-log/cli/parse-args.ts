// 共通 CLI flag parser（軽量、依存なし）

export type ParsedArgs = {
  env: "production" | "preview";
  dryRun: boolean;
  randomPick: number;
  verify: boolean;
  force: boolean;
  windowFromUtc?: string;
  windowToUtc?: string;
};

export function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {
    env: "preview",
    dryRun: false,
    randomPick: 1,
    verify: true,
    force: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--env": {
        const v = argv[++i];
        if (v !== "production" && v !== "preview") {
          throw new Error(`--env must be production|preview (got: ${v ?? "<missing>"})`);
        }
        out.env = v;
        break;
      }
      case "--dry-run":
        out.dryRun = true;
        break;
      case "--random-pick":
        out.randomPick = Number(argv[++i] ?? "1");
        if (!Number.isFinite(out.randomPick) || out.randomPick < 1) {
          throw new Error("--random-pick must be a positive integer");
        }
        break;
      case "--verify":
        out.verify = true;
        break;
      case "--no-verify":
        out.verify = false;
        break;
      case "--force":
        out.force = true;
        break;
      case "--window-from":
        out.windowFromUtc = argv[++i];
        break;
      case "--window-to":
        out.windowToUtc = argv[++i];
        break;
      default:
        if (a && a.startsWith("--")) {
          throw new Error(`unknown flag: ${a}`);
        }
    }
  }
  return out;
}
