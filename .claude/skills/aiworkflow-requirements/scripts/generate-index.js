#!/usr/bin/env node
/**
 * インデックス生成スクリプト
 *
 * 用途: references/配下のドキュメントからトピックマップとキーワード索引を生成
 * 実行: node scripts/generate-index.js
 *
 * 特徴:
 *   - 新規ファイルは自動的にprefix別に分類
 *   - 未分類ファイルは「その他」に追加
 *
 * 出力:
 *   - indexes/topic-map.md    トピック別マップ
 *   - indexes/keywords.json   キーワード索引
 */

import { readdir, readFile, rename, rm, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFS_DIR = join(__dirname, "..", "references");
const INDEXES_DIR = join(__dirname, "..", "indexes");
const SKILL_NAME = "aiworkflow-requirements";

// prefix → トピック名のマッピング
const PREFIX_TO_TOPIC = {
  architecture: "アーキテクチャ",
  interfaces: "インターフェース",
  api: "API設計",
  database: "データベース",
  "ui-ux": "UI/UX",
  security: "セキュリティ",
  technology: "技術スタック",
  "claude-code": "Claude Code",
  workflow: "ワークフロー",
};

// トピック別キーワード（検索用）
const TOPIC_KEYWORDS = {
  "概要・品質": ["目的", "スコープ", "設計原則", "品質", "TDD", "用語"],
  アーキテクチャ: [
    "モノレポ",
    "レイヤー",
    "Clean Architecture",
    "RAG",
    "Knowledge Graph",
  ],
  インターフェース: [
    "インターフェース",
    "型定義",
    "IConverter",
    "Repository",
    "Logger",
  ],
  API設計: ["REST", "エンドポイント", "認証", "レート制限", "IPC"],
  データベース: ["Turso", "SQLite", "スキーマ", "FTS5", "Embedded Replicas"],
  "UI/UX": [
    "Design Tokens",
    "コンポーネント",
    "Tailwind",
    "レスポンシブ",
    "Apple HIG",
  ],
  セキュリティ: ["認証", "暗号化", "CSP", "バリデーション", "インシデント"],
  技術スタック: ["Next.js", "Electron", "TypeScript", "Drizzle", "pnpm"],
  "Claude Code": [
    "Skill",
    "Agent",
    "Command",
    "Progressive Disclosure",
    "Task",
  ],
  ワークフロー: ["タスク分解", "Git Worktree", "PR", "CI/CD"],
  その他: ["デプロイ", "Cloudflare", "環境変数", "Discord", "プラグイン"],
};

// 概要・品質カテゴリのファイル（prefixなし）
const OVERVIEW_FILES = [
  "overview.md",
  "master-design.md",
  "quality-requirements.md",
  "glossary.md",
];

// その他カテゴリのファイル（prefix未マッチ）
const OTHER_FILES = [
  "deployment.md",
  "environment-variables.md",
  "error-handling.md",
  "local-agent.md",
  "discord-bot.md",
  "plugin-development.md",
  "task-workflow.md",
  "directory-structure.md",
];

function getTopicForFile(fileName) {
  // 概要・品質ファイル
  if (OVERVIEW_FILES.includes(fileName)) {
    return "概要・品質";
  }

  // その他ファイル（既知）
  if (OTHER_FILES.includes(fileName)) {
    return "その他";
  }

  // prefix-based判定
  for (const [prefix, topic] of Object.entries(PREFIX_TO_TOPIC)) {
    if (fileName.startsWith(`${prefix}-`)) {
      return topic;
    }
  }

  // 未マッチは「その他」
  return "その他";
}

async function categorizeFiles() {
  const files = await readdir(REFS_DIR);
  const mdFiles = files.filter((f) => f.endsWith(".md")).sort();

  const topics = {};

  for (const file of mdFiles) {
    const topic = getTopicForFile(file);
    if (!topics[topic]) {
      topics[topic] = [];
    }
    topics[topic].push(file);
  }

  return topics;
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function withIndexContext(indexFile, step, error) {
  const message = `[generate-index] ${SKILL_NAME} / ${indexFile} ${step} 失敗: ${getErrorMessage(error)}`;
  const wrapped = new Error(message);
  wrapped.cause = error;
  return wrapped;
}

async function extractHeadings(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");
    const headings = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // コードブロックの開始/終了を追跡
      if (line.startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      // コードブロック内の見出しはスキップ
      if (inCodeBlock) {
        continue;
      }

      if (line.startsWith("## ")) {
        headings.push({
          level: 2,
          text: line.replace(/^## /, "").trim(),
          line: i + 1,
        });
      } else if (line.startsWith("### ")) {
        headings.push({
          level: 3,
          text: line.replace(/^### /, "").trim(),
          line: i + 1,
        });
      }
    }

    return headings;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw withIndexContext("topic-map.md", `heading-read:${filePath}`, error);
  }
}

async function generateTopicMap() {
  const categorizedFiles = await categorizeFiles();

  // トピックの順序を定義
  const topicOrder = [
    "概要・品質",
    "アーキテクチャ",
    "インターフェース",
    "API設計",
    "データベース",
    "UI/UX",
    "セキュリティ",
    "技術スタック",
    "Claude Code",
    "ワークフロー",
    "その他",
  ];

  let md = `# トピックマップ

> 生成コマンド: node scripts/generate-index.js

このファイルはreferences/配下の仕様をトピック別に整理したインデックスです。
**新規ファイルはprefixに基づいて自動分類されます。**

---

## 検索方法

### コマンド検索
\`\`\`bash
node scripts/search-spec.js "<キーワード>"
node scripts/search-spec.js "認証" -C 5
\`\`\`

### トピック一覧
\`\`\`bash
node scripts/list-specs.js --topics
\`\`\`

---

`;

  for (const topic of topicOrder) {
    const files = categorizedFiles[topic];
    if (!files || files.length === 0) continue;

    const keywords = TOPIC_KEYWORDS[topic] || [];

    md += `## ${topic}\n\n`;
    if (keywords.length > 0) {
      md += `**関連キーワード**: ${keywords.join(", ")}\n\n`;
    }

    for (const file of files) {
      const filePath = join(REFS_DIR, file);

      // 削除済みファイルへの参照を除去（dead link check）
      if (!existsSync(filePath)) {
        continue;
      }

      const headings = await extractHeadings(filePath);

      md += `### references/${file}\n\n`;

      if (headings.length > 0) {
        md += "| セクション | 行 |\n";
        md += "|------------|----|\n";
        // 最大20セクションまで表示（大規模ファイル対応）
        for (const h of headings.filter((h) => h.level === 2).slice(0, 20)) {
          md += `| ${h.text} | L${h.line} |\n`;
        }
        md += "\n";
      }
    }

    md += "---\n\n";
  }

  // 分類されなかったトピックがあれば追加
  for (const [topic, files] of Object.entries(categorizedFiles)) {
    if (!topicOrder.includes(topic) && files.length > 0) {
      md += `## ${topic}\n\n`;
      for (const file of files) {
        // 削除済みファイルへの参照を除去（dead link check）
        if (!existsSync(join(REFS_DIR, file))) {
          continue;
        }
        md += `### references/${file}\n\n`;
      }
      md += "---\n\n";
    }
  }

  return md;
}

async function generateKeywordIndex() {
  const keywords = {};

  const files = await readdir(REFS_DIR);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  for (const file of mdFiles) {
    const filePath = join(REFS_DIR, file);
    const content = await readFile(filePath, "utf-8");

    // 主要キーワードを抽出（見出しから）
    const headings = content.match(/^##? .+$/gm) || [];
    for (const heading of headings) {
      const text = heading.replace(/^##? /, "").trim();
      // 日本語と英語の単語を抽出
      const words =
        text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+|[A-Za-z]+/g) ||
        [];
      for (const word of words) {
        if (word.length >= 2) {
          if (!keywords[word]) {
            keywords[word] = [];
          }
          if (!keywords[word].includes(file)) {
            keywords[word].push(file);
          }
        }
      }
    }
  }

  // totalKeywords/timestamp 等のカウンタ・時刻フィールドは
  // 並列 worktree 間で merge conflict を多発させ意味も無いため出力しない。
  return { keywords };
}

function createIndexWritePlan(topicMap, keywordIndex) {
  return [
    {
      fileName: "topic-map.md",
      content: topicMap,
    },
    {
      fileName: "keywords.json",
      content: JSON.stringify(keywordIndex, null, 2),
    },
  ];
}

async function writeIndexFilesAtomically(indexesDir, plan, fsOps = {}) {
  const write = fsOps.writeFile ?? writeFile;
  const move = fsOps.rename ?? rename;
  const remove = fsOps.rm ?? rm;
  const read = fsOps.readFile ?? readFile;
  const staged = [];
  const committed = [];

  try {
    for (const entry of plan) {
      const targetPath = join(indexesDir, entry.fileName);
      const tmpPath = join(indexesDir, `.${basename(entry.fileName)}.tmp`);
      await write(tmpPath, entry.content);
      staged.push({ ...entry, targetPath, tmpPath });
    }

    for (const entry of staged) {
      let previousContent = null;
      try {
        previousContent = await read(entry.targetPath, "utf-8");
      } catch (error) {
        if (!error || error.code !== "ENOENT") {
          throw error;
        }
      }

      await move(entry.tmpPath, entry.targetPath);
      committed.push({ targetPath: entry.targetPath, previousContent });
    }
  } catch (error) {
    for (const entry of staged) {
      await remove(entry.tmpPath, { force: true }).catch(() => {});
    }

    for (const entry of committed.reverse()) {
      if (entry.previousContent !== null) {
        await write(entry.targetPath, entry.previousContent).catch(() => {});
      } else {
        await remove(entry.targetPath, { force: true }).catch(() => {});
      }
    }

    throw error;
  }
}

async function main(argv = process.argv.slice(2)) {
  const quiet = argv.includes("--quiet");
  const log = (...args) => {
    if (!quiet) {
      console.log(...args);
    }
  };

  log("📚 インデックス生成中...\n");

  // ファイル分類を表示
  const categorized = await categorizeFiles();
  const totalFiles = Object.values(categorized).flat().length;
  log(`📂 ${totalFiles}ファイルを分類:`);
  for (const [topic, files] of Object.entries(categorized)) {
    if (files.length > 0) {
      log(`   ${topic}: ${files.length}ファイル`);
    }
  }
  log("");

  let topicMap;
  try {
    log("1. トピックマップ生成...");
    topicMap = await generateTopicMap();
    log("   ✅ indexes/topic-map.md");
  } catch (error) {
    throw withIndexContext("topic-map.md", "generate", error);
  }

  let keywordIndex;
  try {
    log("2. キーワード索引生成...");
    keywordIndex = await generateKeywordIndex();
  } catch (error) {
    throw withIndexContext("keywords.json", "generate", error);
  }

  try {
    await writeIndexFilesAtomically(
      INDEXES_DIR,
      createIndexWritePlan(topicMap, keywordIndex),
    );
  } catch (error) {
    throw withIndexContext("topic-map.md,keywords.json", "atomic-write", error);
  }

  log(
    `   ✅ indexes/keywords.json (${Object.keys(keywordIndex.keywords).length}キーワード)`,
  );

  log("\n✅ インデックス生成完了");
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] || "").href;

if (isCli) {
  main().catch((err) => {
    console.error(getErrorMessage(err));
    process.exit(1);
  });
}

export {
  createIndexWritePlan,
  extractHeadings,
  generateKeywordIndex,
  generateTopicMap,
  main,
  withIndexContext,
  writeIndexFilesAtomically,
};
