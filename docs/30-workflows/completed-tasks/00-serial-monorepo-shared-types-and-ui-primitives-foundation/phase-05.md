# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 5 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 4 (テスト戦略) |
| 下流 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

Phase 2 で確定した module 設計を、コード placeholder + 擬似コード + sanity check の順序付き runbook に落とす。本タスクは spec のみで実装は行わないため、commands と placeholder のみを記述する。

## 実行タスク

1. scaffold 順序を確定（root → packages → apps → 統合）
2. 各 step の command を placeholder で記述
3. 擬似コード（型定義 / primitive 雛形 / Hono health endpoint）を 30 行以内で表現
4. 各 step に sanity check（typecheck / lint / test 実行確認）を組み込む
5. outputs/phase-05/runbook.md として時系列順 runbook を確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md, monorepo-layout.md | 設計 |
| 必須 | outputs/phase-04/test-matrix.md | sanity check の commands |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | primitive 仕様 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型 4 層 |

## 実行手順

### ステップ 1: scaffold 順序確定
1. root config（`pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`, `.eslintrc.cjs`, `vitest.config.ts`）
2. `packages/shared` 雛形
3. `packages/integrations/google` 雛形
4. `apps/api` 雛形（health endpoint まで）
5. `apps/web` 雛形（route group + UI primitives + tones.ts）
6. 統合検証（typecheck → lint → test → scaffold-smoke）

### ステップ 2: 各 step の command + sanity 化

### ステップ 3: 擬似コード placeholder 化

### ステップ 4: outputs/phase-05/runbook.md 作成

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook の各 step での失敗ケース（typecheck NG 等）の入力 |
| Phase 11 | manual smoke 用に curl / wrangler コマンドを引き継ぎ |

## 多角的チェック観点（不変条件参照）

- **#1**: 型 4 層 placeholder で `stableKey` を string ではなく branded type にする
- **#5**: ESLint rule の placeholder を `.eslintrc.cjs` に組み込む step を必ず含める
- **#6**: primitive の placeholder で `localStorage` を絶対に呼ばない（コメントで明記）
- **#8**: Avatar の `hue` を `hashStringToHue(memberId)` で算出（`localStorage.getItem` 禁止）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | scaffold 順序確定 | 5 | pending | 6 step |
| 2 | command placeholder | 5 | pending | 各 step |
| 3 | 擬似コード | 5 | pending | 型 4 層 + primitive + healthz |
| 4 | sanity check 組み込み | 5 | pending | typecheck / lint / test |
| 5 | runbook.md 作成 | 5 | pending | outputs/phase-05/ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 実装ランブック総合 |
| ドキュメント | outputs/phase-05/runbook.md | 時系列 step + sanity |
| メタ | artifacts.json | Phase 5 を completed |

## 完了条件

- [ ] 6 step すべてに command と sanity check が記述
- [ ] 擬似コードが「型 4 層」「primitive 1 例」「healthz」をカバー
- [ ] 各 step が「失敗時に何をするか」を 1 行記述

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs/phase-05/main.md と runbook.md 配置済み
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 6（異常系検証）
- 引き継ぎ事項: 各 step の expected な失敗 → 異常系一覧
- ブロック条件: runbook の sanity check が未記述

## Runbook（時系列 step）

### Step 1: root config 配置

```bash
# placeholder commands
echo "packages: ['apps/*', 'packages/*', 'packages/integrations/*']" > pnpm-workspace.yaml
# package.json: typecheck/lint/test/dev script を pnpm -r で実行
# tsconfig.base.json: strict + bundler resolution + paths
# .eslintrc.cjs: import/no-restricted-paths + custom no-d1-from-web rule placeholder
# vitest.config.ts: workspace mode
```

**sanity**: `pnpm install` が exit 0、lockfile 生成

**失敗時**: pnpm version が 8.x 以上か `corepack` 確認

### Step 2: packages/shared 雛形

```ts
// packages/shared/src/types/ids.ts (placeholder)
declare const __brand: unique symbol;
export type Brand<T, B> = T & { [__brand]: B };
export type MemberId = Brand<string, "MemberId">;
export type ResponseId = Brand<string, "ResponseId">;
export type ResponseEmail = Brand<string, "ResponseEmail">;
export type StableKey = Brand<string, "StableKey">;

// packages/shared/src/index.ts (barrel)
export * from "./types/ids";
export * from "./types/schema";   // 01b で実装、ここでは空 module
export * from "./types/response";
export * from "./types/identity";
export * from "./types/viewmodel";
```

**sanity**: `pnpm --filter @ubm/shared typecheck` exit 0

**失敗時**: tsconfig path / strict 設定確認

### Step 3: packages/integrations/google 雛形

```ts
// packages/integrations/google/src/forms-client.ts (interface のみ)
export interface FormsClient {
  getForm(formId: string): Promise<unknown>;            // 01b で型確定
  listResponses(formId: string): Promise<unknown[]>;    // 01b で型確定
}
// 実装は 01b で。ここでは throw new Error("not implemented") の stub
```

**sanity**: `pnpm --filter @ubm/integrations-google typecheck` exit 0

### Step 4: apps/api 雛形

```ts
// apps/api/src/index.ts (placeholder)
import { Hono } from "hono";
const app = new Hono();
app.get("/healthz", (c) => c.json({ ok: true }));
export default app;
```

```toml
# apps/api/wrangler.toml (placeholder)
name = "ubm-hyogo-api-staging"
main = "src/index.ts"
compatibility_date = "2026-04-26"
[[d1_databases]]
binding = "DB"
database_name = "ubm-hyogo-staging"
database_id = "REPLACE_AT_01a"
```

**sanity**: `pnpm --filter @ubm/api dev` 起動後 `curl localhost:8787/healthz` で `{"ok":true}` 200

**失敗時**: wrangler version、port 競合確認

### Step 5: apps/web 雛形 + UI primitives 15 種 + tones.ts

```tsx
// apps/web/src/lib/tones.ts (placeholder)
export type ChipTone = "stone" | "warm" | "cool" | "green" | "amber" | "red";
export function zoneTone(zone: string): ChipTone {
  if (zone === "0_to_1") return "cool";
  if (zone === "1_to_10") return "warm";
  if (zone === "10_to_100") return "amber";
  return "stone";
}
export function statusTone(status: string): ChipTone {
  if (status === "member") return "green";
  if (status === "academy") return "cool";
  return "stone";
}

// apps/web/src/components/ui/Avatar.tsx (placeholder)
import type { MemberId } from "@ubm/shared";
function hashStringToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash % 360;
}
export function Avatar({ memberId, name, size = "md" }: { memberId: string; name: string; size?: "sm"|"md"|"lg" }) {
  const hue = hashStringToHue(memberId);
  // 不変条件 #6, #8: localStorage を一切使わない（保存先はサーバー側）
  return <div role="img" aria-label={name} style={{ background: `hsl(${hue} 70% 60%)` }} />;
}

// apps/web/src/components/ui/index.ts
export * from "./Chip"; export * from "./Avatar"; export * from "./Button";
export * from "./Switch"; export * from "./Segmented"; export * from "./Field";
export * from "./Input"; export * from "./Textarea"; export * from "./Select";
export * from "./Search"; export * from "./Drawer"; export * from "./Modal";
export * from "./Toast"; export * from "./KVList"; export * from "./LinkPills";
```

```ts
// apps/web/next.config.js (placeholder)
const { setupDevPlatform } = require("@opennextjs/cloudflare/next-dev");
if (process.env.NODE_ENV === "development") setupDevPlatform();
module.exports = { /* withOpenNext 設定は @opennextjs/cloudflare に従う */ };
```

**sanity**: `pnpm --filter @ubm/web dev` 起動 → `curl localhost:3000` で 200

**失敗時**: Next.js version、`@opennextjs/cloudflare` adapter 確認

### Step 6: 統合検証

```bash
pnpm -w typecheck   # AC-2
pnpm -w lint        # AC-3
pnpm -w test        # AC-4
pnpm --filter @ubm/eslint-config test  # ESLint RuleTester
```

**sanity**: 4 command すべて exit 0

**失敗時**: 各 package の独立 reproduce → 順次切り分け

## 擬似コード（型 4 層 placeholder）

```ts
// packages/shared/src/types/schema/index.ts
// 01b で FormFieldDefinition / FormManifest を実装。Wave 0 では空 module
export {};

// packages/shared/src/types/response/index.ts
// 01b で MemberResponse 型を実装
export {};

// packages/shared/src/types/identity/index.ts
// 01b で MemberIdentity / MemberStatusRecord 型を実装
export {};

// packages/shared/src/types/viewmodel/index.ts
// 01b で PublicStatsView / PublicMemberListView ... を実装
export {};
```

## sanity check 一覧

| step | sanity | 期待 |
| --- | --- | --- |
| 1 | `pnpm install` | exit 0、lockfile 生成 |
| 2 | typecheck shared | exit 0 |
| 3 | typecheck integrations-google | exit 0 |
| 4 | curl /healthz | 200 `{"ok":true}` |
| 5 | typecheck web | exit 0、UI primitives 15 種 export |
| 6 | typecheck/lint/test all | exit 0 |
