# Implementation Guide — A-2 Skill Ledger Fragment 化

## Part 1: 中学生レベル（日常の例え話のみ）

### 何を変えたの？

これまで、各「スキル」（チームみたいなもの）は **1 冊の日記帳**（`LOGS.md`）と **1 冊の更新履歴ノート**（`SKILL-changelog.md`）を共有していました。

複数の人（worktree）が **同時に同じページの最後の行**に書き込もうとすると、ぶつかってしまい、誰の書き込みが正しいのか、コンピュータには判断できなくなります（merge conflict）。

そこでこのタスクでは、日記帳をやめて「**1 件 1 枚のふせん（fragment）を別々に貼る**」方式に変えました。

### ふせん（fragment）の決まり

- 各ふせんは **時刻 + 名前 + 通し番号（nonce = さいころ）** で必ず別の場所に貼られる。
- ふせんの上には「いつ書いた」「誰が書いた」「どんな種類か」を書く欄（front matter）がある。
- ふせんは捨てない。後から読みたいときは、`pnpm skill:logs:render` という「ふせんを時間順に並べて 1 枚の紙に印刷する道具」を使う。

### 古い日記はどうなったの？

- 古い日記帳（`LOGS.md`）は捨てずに「`_legacy.md`（れがしー＝過去の記録）」という名前で同じフォルダに残しました。
- 「ふせんを印刷する道具」に `--include-legacy`（れがしーも一緒に）と頼むと、過去 30 日以内の古い記録もくっつけて印刷してくれます。
- 30 日より前の記録が見たいときは、`git log --follow LOGS/_legacy.md` という方法で過去をさかのぼれます。

### 専門用語セルフチェック表

| 専門用語 | 日常語の言い換え |
| -------- | ---------------- |
| fragment | 小さなふせん |
| Changesets パターン | ふせん方式 |
| append-only | 新しい行を後ろに足し続けるルール |
| nonce | ぶつからないようにする乱数の通し番号 |
| front matter | ふせんの上に書くタイトル欄 |
| render | ふせんを時間順に並べて印刷する作業 |
| legacy include window | 古い日記帳をいつまで一緒に印刷するかの期間（30 日） |
| writer / reader | 書き込み係 / 読み取り係 |
| `_legacy.md` | 過去の日記帳をしまっておく場所 |

---

## Part 2: 開発者レベル

### TypeScript 型定義

```ts
// scripts/skill-logs-render.ts
export interface RenderSkillLogsOptions {
  skill: string;
  since?: string;          // ISO8601
  out?: string;
  includeLegacy?: boolean; // default false
  rootDir?: string;        // DI for tests
  now?: Date;              // DI for legacy window
}

export interface RenderSkillLogsResult {
  output: string;
  fragmentCount: number;
  legacyIncluded: number;
  errors: string[];
}

export async function renderSkillLogs(
  options: RenderSkillLogsOptions,
): Promise<RenderSkillLogsResult>;
```

```ts
// scripts/skill-logs-append.ts
export interface AppendFragmentOptions {
  skill: string;
  type: "log" | "changelog" | "lessons-learned";
  message?: string;
  body?: string;
  branch?: string;
  author?: string;
  now?: Date;
  rootDir?: string;
  generateNonce?: () => string;
}

export interface AppendFragmentResult {
  absPath: string;
  relPathFromSkillRoot: string;
  attempts: number;
}

export async function appendFragment(
  options: AppendFragmentOptions,
): Promise<AppendFragmentResult>;
```

### CLI

```
pnpm skill:logs:append --skill <name> --type <log|changelog|lessons-learned>
                       [--message <text>] [--body-file <path>]

pnpm skill:logs:render --skill <name>
                       [--since <ISO8601>] [--out <path>] [--include-legacy]
```

### 終了コード

| code | 意味 |
| ---- | ---- |
| `0` | 正常 |
| `1` | front matter 不正（timestamp/branch/author/type 欠損 or YAML parse 失敗） / `--since` 不正 / nonce 衝突 retry 上限超過 / path 240 byte 超 |
| `2` | `--out` が tracked canonical ledger（`LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md`）を指す |

### Fragment 命名 regex

```
^(LOGS|changelog|lessons-learned)/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$
```

実装定数: `scripts/lib/fragment-path.ts:FRAGMENT_NAME_REGEX`

### nonce

- 4 byte / 8 hex（`crypto.randomBytes(4).toString("hex")`）
- 衝突期待値（秒間 1000 件想定）≈ `1000² / 2^33 ≈ 1.16×10⁻⁴`
- 同 path 事前存在チェック → 衝突時 nonce 再生成最大 3 回（4 回目で `CollisionError` throw）

### Front matter 必須キー

```yaml
---
timestamp: 2026-04-28T17:00:00Z   # ISO8601 UTC
branch: feat/issue-130-skill-ledger-a2-fragment-task-spec
author: daishimanju@gmail.com
type: log
---
```

欠損時は対象 path を stderr 出力 + `process.exit(1)`。

### Legacy include window

- 30 日（`Date.now() - 30 * 24 * 60 * 60 * 1000`）
- 擬似 timestamp: 本文末尾 ISO 8601 → `YYYY-MM-DD` → file mtime の 3 段 fallback
- window 外の `_legacy*.md` は出力されない

### Branch escape

- 大文字 → 小文字、`/` → `-`、許可文字 `[a-z0-9_-]` 以外を `-` 化、連続 `-` を 1 つに、64 文字超は trailing trim
- 実装: `scripts/lib/branch-escape.ts:escapeBranch`

### Path 上限

- 240 byte（NTFS 互換マージン）
- 実装: `scripts/lib/fragment-path.ts:isWithinPathByteLimit`

### エラーハンドリング

| 状況 | 動作 |
| ---- | ---- |
| front matter 欠損 / parse 失敗 | 対象 path を stderr 出力 + exit 1 |
| `--out` tracked canonical | exit 2（誤上書き防止） |
| `--since` 不正 ISO | throw `invalid --since value` + exit 1 |
| nonce 4 回連続衝突 | throw `CollisionError` + exit 1 |
| path 240 byte 超 | append helper が事前 throw + exit 1 |

### 設定可能パラメータ一覧

| パラメータ | 値域 | 既定 | 場所 |
| ---------- | ---- | ---- | ---- |
| `skill` | string（必須） | — | CLI / API |
| `type` | log / changelog / lessons-learned | — | CLI / API |
| `since` | ISO8601 | undefined | CLI / API |
| `out` | path | undefined（stdout） | CLI / API |
| `includeLegacy` | boolean | false | CLI / API |
| nonce length | 8 hex | 固定 | `defaultGenerateNonce` |
| collision retry max | 3 | 固定 | `MAX_COLLISION_RETRIES` |
| legacy window | 30 日 | 固定 | `LEGACY_INCLUDE_WINDOW_MS` |
| path byte limit | 240 byte | 固定 | `PATH_BYTE_LIMIT` |
| branch escape max | 64 文字 | 固定 | `MAX_LEN` in `branch-escape.ts` |

### 実装ファイル

```
scripts/
├── skill-logs-render.ts          # 集約 view 出力
├── skill-logs-render.test.ts     # 9 tests
├── skill-logs-append.ts          # fragment 生成
├── skill-logs-append.test.ts     # 7 tests
└── lib/
    ├── branch-escape.ts          # branch → escaped-branch
    ├── fragment-path.ts          # 命名 regex / path 上限 / dir 解決
    ├── front-matter.ts           # YAML parse / build / FrontMatterError
    ├── retry-on-collision.ts     # 高階関数 / CollisionError
    └── timestamp.ts              # nowUtcCompact / nowUtcIso
```

### 受入確認コマンド

```bash
# 単体テスト
mise exec -- pnpm vitest run \
  scripts/skill-logs-render.test.ts \
  scripts/skill-logs-append.test.ts

# 型チェック
mise exec -- pnpm typecheck

# writer 残存確認
git grep -n 'SKILL-changelog\.md' .claude/skills/ | grep -v _legacy | grep -v .backups
rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills --glob "scripts/**"

# レンダリング動作確認
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements | head -40
```

### 4 worktree smoke（後続タスク）

```bash
for n in 1 2 3 4; do bash scripts/new-worktree.sh verify/a2-$n; done
# 各 worktree で append 後 main へ順次 merge → conflict 0 件期待
```

詳細は [`../phase-11/4worktree-smoke-evidence.md`](../phase-11/4worktree-smoke-evidence.md)。
