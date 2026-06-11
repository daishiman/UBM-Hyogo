# task-01 (Lane A): shared 公開検索プリミティブ SSOT 新規作成 + exports

> SSOT: [`../../shared-context.md`](../../shared-context.md)。本 task の §3.1 / §3.2 / §3.3 コードは SSOT の逐語転記であり、これを実装の正本とする。
> **[実装区分: 実装仕様書]** — このファイルは spec。コードは実装者が後続で作成する。

## 1. 変更対象ファイル一覧（パス・変更種別）

| パス | 変更種別 |
| --- | --- |
| `packages/shared/src/public-search/search-query-primitives.ts` | **新規** |
| `packages/shared/src/public-search/index.ts` | **新規** |
| `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` | **新規**（Phase 4 で定義済み・本 task で実装） |
| `packages/shared/package.json` | **編集**（`exports` に subpath 1 行追加のみ） |

> root barrel `packages/shared/src/index.ts` は **非接触**（FB-W0-01）。

---

## 2. 主要な関数・型・モジュールのシグネチャ（SSOT §3.1 のコードを正本として転記）

### 2.1 `packages/shared/src/public-search/search-query-primitives.ts`（新規・全コード）

```typescript
import { z } from "zod";

// --- 値集合（tuple を正本とし、Set/enum は派生させる） ---
export const PUBLIC_MEMBER_ZONE_VALUES = ["all", "0_to_1", "1_to_10", "10_to_100"] as const;
export const PUBLIC_MEMBER_STATUS_VALUES = ["all", "member", "non_member", "academy"] as const;
export const PUBLIC_MEMBER_SORT_VALUES = ["recent", "name"] as const;
export const PUBLIC_MEMBER_DENSITY_VALUES = ["comfy", "dense", "list"] as const;

export type PublicMemberZone = (typeof PUBLIC_MEMBER_ZONE_VALUES)[number];
export type PublicMemberStatus = (typeof PUBLIC_MEMBER_STATUS_VALUES)[number];
export type PublicMemberSort = (typeof PUBLIC_MEMBER_SORT_VALUES)[number];
export type PublicMemberDensity = (typeof PUBLIC_MEMBER_DENSITY_VALUES)[number];

// --- zod enum（catch 付き・両 app が派生で使う） ---
export const PublicMemberSortZ = z.enum(PUBLIC_MEMBER_SORT_VALUES);
export const PublicMemberDensityZ = z.enum(PUBLIC_MEMBER_DENSITY_VALUES);

// --- 制限値 ---
export const PUBLIC_MEMBER_SEARCH_LIMITS = {
  TAG_LIMIT: 5,
  Q_LIMIT: 200,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  LIMIT_DEFAULT: 24,
} as const;

// --- 正規化（純関数・例外を投げない＝WEEKGRD-02 デフォルト戦略） ---
export const normalizePublicMemberQ = (q: string): string =>
  q.trim().replace(/\s+/g, " ").slice(0, PUBLIC_MEMBER_SEARCH_LIMITS.Q_LIMIT);

export const normalizePublicMemberTags = (tags: string[]): string[] =>
  Array.from(new Set(tags.filter((t) => t.length > 0))).slice(
    0,
    PUBLIC_MEMBER_SEARCH_LIMITS.TAG_LIMIT,
  );

export const clampPublicMemberLimit = (n: number): number =>
  Math.min(
    Math.max(Math.trunc(n), PUBLIC_MEMBER_SEARCH_LIMITS.LIMIT_MIN),
    PUBLIC_MEMBER_SEARCH_LIMITS.LIMIT_MAX,
  );

// --- enum-like 正規化（whitelist 外は "all" に倒す） ---
export const isPublicMemberZone = (v: string): v is PublicMemberZone =>
  (PUBLIC_MEMBER_ZONE_VALUES as readonly string[]).includes(v);
export const isPublicMemberStatus = (v: string): v is PublicMemberStatus =>
  (PUBLIC_MEMBER_STATUS_VALUES as readonly string[]).includes(v);
export const normalizePublicMemberZone = (v: string): PublicMemberZone =>
  isPublicMemberZone(v) ? v : "all";
export const normalizePublicMemberStatus = (v: string): PublicMemberStatus =>
  isPublicMemberStatus(v) ? v : "all";
```

> **逐語実装の厳守**: 上記コードは一字一句 SSOT §3.1 の通りに実装する。識別子名・値・アルゴリズムを改変しない。

### 2.2 公開シグネチャ一覧（参照表）

| 識別子 | 種別 | シグネチャ |
| --- | --- | --- |
| `PUBLIC_MEMBER_ZONE_VALUES` | 値集合 | `readonly ["all","0_to_1","1_to_10","10_to_100"]` |
| `PUBLIC_MEMBER_STATUS_VALUES` | 値集合 | `readonly ["all","member","non_member","academy"]` |
| `PUBLIC_MEMBER_SORT_VALUES` | 値集合 | `readonly ["recent","name"]` |
| `PUBLIC_MEMBER_DENSITY_VALUES` | 値集合 | `readonly ["comfy","dense","list"]` |
| `PublicMemberZone` / `...Status` / `...Sort` / `...Density` | 型 | `(typeof X_VALUES)[number]` |
| `PublicMemberSortZ` / `PublicMemberDensityZ` | zod enum | `z.ZodEnum<...>` |
| `PUBLIC_MEMBER_SEARCH_LIMITS` | 定数 | `{ TAG_LIMIT:5; Q_LIMIT:200; LIMIT_MIN:1; LIMIT_MAX:100; LIMIT_DEFAULT:24 }` |
| `normalizePublicMemberQ` | 純関数 | `(q: string) => string` |
| `normalizePublicMemberTags` | 純関数 | `(tags: string[]) => string[]` |
| `clampPublicMemberLimit` | 純関数 | `(n: number) => number` |
| `isPublicMemberZone` / `isPublicMemberStatus` | type guard | `(v: string) => v is PublicMember*` |
| `normalizePublicMemberZone` / `normalizePublicMemberStatus` | 純関数 | `(v: string) => PublicMember*` |

### 2.3 `packages/shared/src/public-search/index.ts`（新規・barrel・SSOT §3.2）

```typescript
export * from "./search-query-primitives";
```

### 2.4 `packages/shared/package.json`（編集・SSOT §3.3）

`exports` マップに subpath を **1 行追加**する（既存エントリは保持）。

```jsonc
"exports": {
  ".": "./src/index.ts",
  "./browser-storage": "./src/browser-storage.ts",
  "./errors": "./src/errors.ts",
  "./logging": "./src/logging.ts",
  "./gate-metadata": "./src/gate-metadata/index.ts",
  "./public-search": "./src/public-search/index.ts"   // ← 追加
}
```

> 既存の `dependencies.zod`（`^4.3.6`）で充足。新規依存の追加は不要。

---

## 3. 入力・出力・副作用の定義

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `normalizePublicMemberQ` | `string` | `trim → \s+ を " " → slice(0,200)` した `string` | なし（純関数・throw しない） |
| `normalizePublicMemberTags` | `string[]` | 空文字除外 + dedup + 先頭 5 件の `string[]` | なし |
| `clampPublicMemberLimit` | `number` | `trunc → [1,100] にクランプ` した `number` | なし |
| `normalizePublicMemberZone` | `string` | whitelist 内ならそのまま、外なら `"all"`（`PublicMemberZone`） | なし |
| `normalizePublicMemberStatus` | `string` | 同上（`PublicMemberStatus`） | なし |
| `isPublicMemberZone` / `isPublicMemberStatus` | `string` | `boolean`（type guard） | なし |
| `PublicMemberSortZ` / `PublicMemberDensityZ` | zod parse 入力 | enum 値（呼び出し側で `.catch()` 付与し fallback） | なし |
| 値集合 tuple / 制限値定数 | — | `readonly` 定数 | なし（immutable） |

- **副作用ゼロ**: D1 非接触・I/O なし・グローバル状態なし（不変条件 #1：shared は zod primitives のみ）。
- **例外を投げない**: すべての正規化関数は throw しない（WEEKGRD-02 デフォルト戦略）。不正入力は安全側 default に倒す。

---

## 4. テスト方針（追加テストファイル・ケース）

- 追加ファイル: `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts`（新規・`*.spec.ts`）。
- ケース: **SP-01〜SP-12**（Phase 4 §4.2 の表が正本。SSOT §5.1 逐語）。1 ケース = 1 `it`。
- import は **`@ubm-hyogo/shared/public-search` subpath のみ**（Phase 4 §4.3）。
- 純関数なのでモック・キャスト不要（Phase 4 §4.4）。
- **RED→GREEN**: spec を先に書き、本体 §2.1 完成で GREEN。

---

## 5. ローカル実行・検証コマンド（SSOT §5.3）

```bash
# 新規 spec を実行（GREEN を確認）
mise exec -- pnpm exec vitest run packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts
# shared 型チェック（exports 追加と本体の型整合）
mise exec -- pnpm --filter @ubm-hyogo/shared typecheck
# boundary / depcruise lint（shared が app を import しない一方向を確認）
mise exec -- pnpm lint
```

---

## 6. 完了条件（DoD）

- [ ] `search-query-primitives.ts` が SSOT §3.1 と一字一句一致で存在する。
- [ ] `index.ts` barrel が `export * from "./search-query-primitives"` のみで存在する。
- [ ] `package.json` の `exports` に `"./public-search": "./src/public-search/index.ts"` がある（root `src/index.ts` は非接触）。
- [ ] 新規 spec SP-01〜SP-12 が GREEN（AC-4）。
- [ ] shared typecheck が緑（AC-1）。
- [ ] `pnpm lint`（boundary + depcruise）が緑で、shared→app の循環がない（AC-5 の前提）。
- [ ] zod 以外の新規依存を追加していない。
