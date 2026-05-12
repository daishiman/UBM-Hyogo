# Phase 5: コア実装 / Schema / Validator / Barrel Export / package.json Script

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| Source | `outputs/phase-5/phase-5.md` |
| 区分 | 実装 |
| 想定所要 | 0.75 人日 |

## 目的

Phase 4 で確定した TC-1..TC-20 を GREEN にする最小実装を、(a) `packages/shared/src/gate-metadata/schema.ts`、(b) `scripts/gate-metadata/validate.ts`、(c) barrel export、(d) `package.json` script の 4 ファイルで完結させる。

## 前提条件（Phase 1 / Phase 2 から再掲）

- zod が `packages/shared` の依存にあること。なければ `mise exec -- pnpm --filter @ubm-hyogo/shared add zod` で追加してから着手する（Phase 2 §8 / Phase 3 NO-GO 条件）。

## 実行タスク

### 5.1 `packages/shared/src/gate-metadata/schema.ts`（新規）

**目的**: gate ledger の zod schema と TypeScript 型を export する。

**型シグネチャ / 関数シグネチャ**:

```ts
import { z } from 'zod';

export const GateStatusEnum = z.enum(['pending', 'passed', 'failed', 'waived']);
export type GateStatus = z.infer<typeof GateStatusEnum>;

export const GateIdSchema = z.string().regex(/^Gate-[A-Z](-[A-Z0-9]+)*$/);

export const GateEntrySchema = z
  .object({
    gate_id: GateIdSchema,
    status: GateStatusEnum,
    passed_at: z.string().datetime({ offset: true }).nullable(),
    evidence_path: z.string().min(1),
    approver: z.string().min(1),
    notes: z.string().optional(),
  })
  .refine(
    (g) => g.status !== 'passed' || g.passed_at !== null,
    { message: 'passed_at must be set when status === "passed"', path: ['passed_at'] }
  );

export type GateEntry = z.infer<typeof GateEntrySchema>;

export const GatesArraySchema = z.array(GateEntrySchema);
export type GatesArray = z.infer<typeof GatesArraySchema>;
```

**入出力**:
- 入力: なし（schema 定義の export のみ）。
- 出力: 上記 5 シンボルを named export。
- 副作用: なし（純関数 schema）。

**DoD**:
- [ ] TC-1..TC-12 が GREEN。
- [ ] `pnpm --filter @ubm-hyogo/shared typecheck` が exit 0。
- [ ] coverage Statements/Branches/Functions/Lines >= 80%。

### 5.2 `packages/shared/src/gate-metadata/index.ts`（新規）

**目的**: barrel export。

```ts
export * from './schema';
```

### 5.3 `packages/shared/src/index.ts`（編集）

**目的**: workspace ルート export に gate-metadata を加える。

```ts
// 既存 export ... に追加
export * from './gate-metadata';
```

### 5.4 `scripts/gate-metadata/validate.ts`（新規）

**目的**: CLI validator。`docs/30-workflows/**/artifacts.json` を再帰走査し schema parse + evidence 確認 + 集計 + exit code を返す。

**関数シグネチャ / 構造**:

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { GatesArraySchema } from '@ubm-hyogo/shared/gate-metadata';

interface Counts { ok: number; warn: number; error: number; }
interface Finding { file: string; level: 'OK' | 'WARN' | 'ERROR'; message: string; }

const REPO_ROOT = path.resolve(process.cwd());
const DEFAULT_SEARCH_ROOT = 'docs/30-workflows';

export async function findArtifacts(): Promise<string[]> { /* fs.readdir recursion */ }
export async function readJson(file: string): Promise<unknown> { /* fs.readFile + JSON.parse */ }
export function pickGates(json: unknown): unknown { /* json?.metadata?.gates */ }

function isPathSafe(rel: string): boolean {
  // absolute path / path traversal 防止: 正規化後のパスが repo root 配下に収まること
  const abs = path.resolve(REPO_ROOT, rel);
  return abs.startsWith(REPO_ROOT + path.sep) || abs === REPO_ROOT;
}

export async function validateFile(file: string): Promise<Finding[]> { /* ... */ }

export async function main(): Promise<number> {
  const files = await findArtifacts();
  const findings: Finding[] = [];
  for (const f of files) findings.push(...await validateFile(f));
  const counts: Counts = { ok: 0, warn: 0, error: 0 };
  for (const f of findings) counts[f.level.toLowerCase() as keyof Counts]++;
  for (const f of findings) console.log(`[${f.level}] ${f.file}: ${f.message}`);
  console.log(`\nOK: ${counts.ok} WARN: ${counts.warn} ERROR: ${counts.error}`);
  return counts.error > 0 ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code));
}
```

**振る舞い詳細**:
- `metadata.gates` 不在: historical scan は `WARN` で skip。PR changed artifacts mode では `ERROR`。
- `metadata.gates` が配列でない: `ERROR`。
- 各 entry を `GatesArraySchema.parse()` → 失敗時 `ERROR` 集約。
- 全 status の `evidence_path` を schema / `isPathSafe()` で検証 → false なら `ERROR`。
- `status === 'passed'` の `evidence_path` は追加で `fs.access()` 実体確認 → 失敗なら `ERROR`、成功なら `OK`。

**入出力**:
- 入力: cwd 配下の `docs/30-workflows/**/artifacts.json`。
- 出力: stdout に finding 一覧 + 集計、exit 0 / 1。
- 副作用: filesystem read のみ（書き込みなし）。

**ローカル実行コマンド**:
```bash
mise exec -- pnpm gate-metadata:validate
```

**DoD**:
- [ ] TC-13..TC-20 が GREEN。
- [ ] path traversal 検知（TC-18）が ERROR を返す。
- [ ] stdout フォーマットが MINOR DOC-M-02 仕様（`OK: N WARN: N ERROR: N`）に整合。

### 5.5 `scripts/gate-metadata/__tests__/walk.test.ts`（新規）

Phase 4 §3 fixture を temp dir に書き出して `validateFile()` / `main()` を呼ぶテスト。`tmp/gate-metadata-walk-<random>/` を `beforeEach` で作成し `afterEach` で削除。

### 5.6 `package.json`（root, 編集）

```json
{
  "scripts": {
    "gate-metadata:validate": "node --import tsx scripts/gate-metadata/validate.ts"
  }
}
```

`tsx` が dev dependency に無い場合は `mise exec -- pnpm add -D tsx -w` で追加。

### 5.7 依存追加

```bash
# 追加依存なし。既存 zod / tsx を利用し、validator の artifact walk は Node fs.readdir recursion で実装する。
```

## 変更対象ファイル一覧

| パス | 種別 | 役割 |
| --- | --- | --- |
| `packages/shared/src/gate-metadata/schema.ts` | 新規 | zod schema + 型 |
| `packages/shared/src/gate-metadata/index.ts` | 新規 | barrel |
| `packages/shared/src/index.ts` | 編集 | gate-metadata export 追加 |
| `packages/shared/package.json` | 編集 | `exports["./gate-metadata"] = "./src/gate-metadata/index.ts"` を追加 |
| `scripts/gate-metadata/validate.ts` | 新規 | CLI validator |
| `scripts/gate-metadata/__tests__/walk.test.ts` | 新規 | walk テスト（実装は Phase 4 設計のまま） |
| `package.json`（root） | 編集 | `gate-metadata:validate` script |

## 入出力・副作用

- 入力: artifacts.json（CLI 実行時のみ）。
- 出力: schema export / stdout finding / exit code。
- 副作用: filesystem read のみ。書き込みなし。

## テスト方針

Phase 4 §6 テストファースト順序の Step 2 / Step 4 を本 Phase で実施。RED → GREEN → refactor。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/shared test gate-metadata
mise exec -- pnpm vitest run scripts/gate-metadata
mise exec -- pnpm gate-metadata:validate
```

## 統合テスト連携

- Phase 6 は本 Phase 実装に対し coverage-guard / lint / Issue #549 backfill を実行。
- Phase 8 は本 Phase 実装を CI workflow から呼び出す。
- Phase 9 は workspace-wide で品質再確認。

## 多角的チェック観点（AIが判断）

- **`isPathSafe()` 実装漏れ**: 必ず `path.resolve()` 後に repo root prefix 確認。文字列 `..` 検査だけでは不十分。
- **glob pattern**: `docs/30-workflows/**/artifacts.json` は root と `outputs/` mirror の両方を hit する。重複 OK（mirror も検証対象）。
- **import.meta.url ガード**: テストで main() を import する際に再起動しないように `if (import.meta.url === ...)` で entry guard。

## サブタスク管理

- ST-1: schema.ts 実装 + TC-1..TC-12 GREEN
- ST-2: barrel export + 親 index.ts 編集
- ST-3: validate.ts 実装 + TC-13..TC-20 GREEN
- ST-4: walk.test.ts 実装
- ST-5: package.json script
- ST-6: refactor + coverage 確認

## 成果物

- 上記 6 ファイル + `outputs/phase-5/phase-5.md`（実装サマリ + 設計判断）。

## 完了条件（DoD）

- [ ] TC-1..TC-20 全 GREEN。
- [ ] `mise exec -- pnpm typecheck` が exit 0。
- [ ] `mise exec -- pnpm lint` が exit 0。
- [ ] `mise exec -- pnpm gate-metadata:validate` が exit 0（gates[] 不在ファイルは WARN/skip）。
- [ ] coverage AC（Statements/Branches/Functions/Lines >= 80%）達成。
- [ ] path traversal 防止（`isPathSafe`）実装済み。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-6 すべて完了
- [ ] 6 ファイルすべて作成 / 編集済み
- [ ] Phase 6 着手 GO 判定済み

## 次Phase

[Phase 6: ローカル検証 / Issue #549 Backfill](phase-06.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
