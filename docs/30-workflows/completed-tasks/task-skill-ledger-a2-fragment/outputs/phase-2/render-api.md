# Render API

## TypeScript 型

```ts
export interface RenderSkillLogsOptions {
  skill: string;
  since?: string;          // ISO8601。指定時刻以降の fragment のみ
  out?: string;            // 出力先 path（既定 stdout）
  includeLegacy?: boolean; // 既定 false。30 日 window 内の _legacy.md を末尾連結
  rootDir?: string;        // テスト用 DI（既定 process.cwd()）
  now?: Date;              // テスト用 DI（legacy window 計算）
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

実装: `scripts/skill-logs-render.ts`

## CLI

```
pnpm skill:logs:render --skill <name> [--since <ISO>] [--out <path>] [--include-legacy]
```

## 終了コード

| code | 意味 |
| ---- | ---- |
| `0` | 正常出力 |
| `1` | front matter 欠損 / parse 不能 fragment を 1 件以上検出（対象 path を stderr） |
| `2` | `--out` が tracked canonical ledger（`LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md`）を指す |

## legacy include window

- 30 日（`Date.now() - 30 * 24 * 60 * 60 * 1000` より新しい `_legacy*.md` のみ）
- legacy 擬似 timestamp 抽出: 本文末尾 ISO 8601 → 本文 `YYYY-MM-DD` → file mtime の優先順

## 出力レイアウト

```
# Skill Logs: <skill>

## Fragments (timestamp 降順)

### <ISO timestamp> — <type> — branch:<branch> — author:<author>
<!-- <relative path> -->

<fragment 本文>

## Legacy（--include-legacy 指定時のみ・30 日 window 内）

### legacy — <type> — <basename>

<_legacy.md 本文>
```

## 設定可能パラメータ一覧

| パラメータ | 値域 | 既定 |
| ---------- | ---- | ---- |
| `skill` | string（必須） | — |
| `since` | ISO8601 | undefined（all） |
| `out` | path | undefined（stdout） |
| `includeLegacy` | boolean | false |
| legacy include window | 固定 30 日 | — |
| nonce length | 固定 8 hex | — |
| path byte limit | 固定 240 byte | — |
