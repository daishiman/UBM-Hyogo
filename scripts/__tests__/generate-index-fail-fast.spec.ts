import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  createIndexWritePlan,
  extractHeadings,
  withIndexContext,
  writeIndexFilesAtomically,
} from "../../.claude/skills/aiworkflow-requirements/scripts/generate-index.js";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "generate-index-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("generate-index fail-fast hardening", () => {
  it("creates the index write plan without changing existing output bytes", () => {
    const plan = createIndexWritePlan("# topic\n", { keywords: { 認証: ["api.md"] } });

    expect(plan).toEqual([
      { fileName: "topic-map.md", content: "# topic\n" },
      {
        fileName: "keywords.json",
        content: JSON.stringify({ keywords: { 認証: ["api.md"] } }, null, 2),
      },
    ]);
  });

  it("commits staged tmp files to final index paths", async () => {
    await withTempDir(async (dir) => {
      await writeIndexFilesAtomically(dir, [
        { fileName: "topic-map.md", content: "topic-v2" },
        { fileName: "keywords.json", content: "keywords-v2" },
      ]);

      await expect(readFile(join(dir, "topic-map.md"), "utf-8")).resolves.toBe(
        "topic-v2",
      );
      await expect(readFile(join(dir, "keywords.json"), "utf-8")).resolves.toBe(
        "keywords-v2",
      );
      await expect(readdir(dir)).resolves.not.toContain(".topic-map.md.tmp");
      await expect(readdir(dir)).resolves.not.toContain(".keywords.json.tmp");
    });
  });

  it("leaves final files unchanged and removes tmp files when staging fails", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, "topic-map.md"), "topic-v1");
      await writeFile(join(dir, "keywords.json"), "keywords-v1");

      await expect(
        writeIndexFilesAtomically(
          dir,
          [
            { fileName: "topic-map.md", content: "topic-v2" },
            { fileName: "keywords.json", content: "keywords-v2" },
          ],
          {
            writeFile: async (path: string, content: string) => {
              if (path.endsWith(".keywords.json.tmp")) {
                throw new Error("injected write failure");
              }
              await writeFile(path, content);
            },
          },
        ),
      ).rejects.toThrow("injected write failure");

      await expect(readFile(join(dir, "topic-map.md"), "utf-8")).resolves.toBe(
        "topic-v1",
      );
      await expect(readFile(join(dir, "keywords.json"), "utf-8")).resolves.toBe(
        "keywords-v1",
      );
      expect(await readdir(dir)).toEqual(["keywords.json", "topic-map.md"]);
    });
  });

  it("restores already committed files if a later rename fails", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, "topic-map.md"), "topic-v1");
      await writeFile(join(dir, "keywords.json"), "keywords-v1");
      let renameCount = 0;

      await expect(
        writeIndexFilesAtomically(
          dir,
          [
            { fileName: "topic-map.md", content: "topic-v2" },
            { fileName: "keywords.json", content: "keywords-v2" },
          ],
          {
            rename: async (from: string, to: string) => {
              renameCount += 1;
              if (renameCount === 2) {
                throw new Error("injected rename failure");
              }
              await import("node:fs/promises").then((fs) => fs.rename(from, to));
            },
          },
        ),
      ).rejects.toThrow("injected rename failure");

      await expect(readFile(join(dir, "topic-map.md"), "utf-8")).resolves.toBe(
        "topic-v1",
      );
      await expect(readFile(join(dir, "keywords.json"), "utf-8")).resolves.toBe(
        "keywords-v1",
      );
      expect(await readdir(dir)).toEqual(["keywords.json", "topic-map.md"]);
    });
  });

  it("keeps ENOENT heading reads as empty and throws other I/O errors with context", async () => {
    await withTempDir(async (dir) => {
      await expect(extractHeadings(join(dir, "missing.md"))).resolves.toEqual([]);

      await expect(extractHeadings(dir)).rejects.toThrow(
        /^\[generate-index\] aiworkflow-requirements \/ topic-map\.md heading-read:/,
      );
    });
  });

  it("formats decisive errors with skill, index file, and step", () => {
    const error = withIndexContext("keywords.json", "atomic-write", new Error("boom"));

    expect(error.message).toBe(
      "[generate-index] aiworkflow-requirements / keywords.json atomic-write 失敗: boom",
    );
  });
});
