# task-02 (Lane B): apps/api を shared プリミティブへ切替（動作不変）

> SSOT: [`../../shared-context.md`](../../shared-context.md)（§3.4 が本 task の正本）。
> 前提: **task-01（Lane A）完了後に着手**（import 先が存在しないと typecheck 不能）。
> **[実装区分: 実装仕様書]** — このファイルは spec。

## 1. 変更対象ファイル一覧（パス・変更種別）

| パス | 変更種別 |
| --- | --- |
| `apps/api/src/_shared/search-query-parser.ts` | **編集**（ローカル値集合・制限・正規化を shared import へ置換） |

> 既存 spec `apps/api/src/_shared/__tests__/search-query-parser.spec.ts` は **編集禁止**（回帰のみ）。
> `list-public-members.ts` / `pagination.ts` / `routes/public/members.ts` 等の consumer は **非接触**（`SortZ` / `DensityZ` / `parsePublicMemberQuery` / `DEFAULT_PUBLIC_MEMBER_QUERY` を従来通り import できるよう後方互換を維持する）。

---

## 2. 切替後のシグネチャ・構造（SSOT §3.4）

### 2.1 不変条件（絶対に変えない公開 surface）

| 識別子 | 維持方法 |
| --- | --- |
| `export const SortZ` | shared `PublicMemberSortZ` の **re-export**（`export const SortZ = PublicMemberSortZ;`） |
| `export const DensityZ` | shared `PublicMemberDensityZ` の **re-export** |
| `export const DEFAULT_PUBLIC_MEMBER_QUERY` | 値・shape 完全不変（`limit: 24` 等） |
| `export type ParsedPublicMemberQuery` | shape 不変（`tags` key 名・`expand` key 等） |
| `export const parsePublicMemberQuery` | I/O・返却 shape 完全不変 |
| `expand` whitelist（`EXPAND_WHITELIST = ["tags"]`） | **api 側に残す**（shared に出さない。api 固有責務） |

### 2.2 shared から import するもの

```typescript
import {
  PublicMemberSortZ,
  PublicMemberDensityZ,
  PUBLIC_MEMBER_SEARCH_LIMITS,
  normalizePublicMemberQ,
  normalizePublicMemberTags,
  clampPublicMemberLimit,
  normalizePublicMemberZone,
  normalizePublicMemberStatus,
} from "@ubm-hyogo/shared/public-search";
```

### 2.3 Before / After のコード断片

#### (a) enum / re-export（行 7-8 周辺）

**Before**:
```typescript
export const SortZ = z.enum(["recent", "name"]);
export const DensityZ = z.enum(["comfy", "dense", "list"]);
```

**After**（後方互換のため export 名は維持。実体は shared を re-export）:
```typescript
// 値集合・正規化規約の SSOT は @ubm-hyogo/shared/public-search。
// 既存 consumer 互換のため SortZ / DensityZ の export 名は維持する。
export const SortZ = PublicMemberSortZ;
export const DensityZ = PublicMemberDensityZ;
```

> `RawZ` 内の `SortZ.catch("recent")` / `DensityZ.catch("comfy")` はそのまま動く（re-export された同一 enum）。`type ParsedPublicMemberQuery` の `sort: z.infer<typeof SortZ>` / `density: z.infer<typeof DensityZ>` も型不変。

#### (b) 制限値・whitelist（行 50-55 周辺）

**Before**:
```typescript
const LIMIT_MAX = 100;
const LIMIT_MIN = 1;
const TAG_LIMIT = 5;
const Q_LIMIT = 200;
const VALID_ZONES = new Set(["all", "0_to_1", "1_to_10", "10_to_100"]);
const VALID_STATUSES = new Set(["all", "member", "non_member", "academy"]);
```

**After**（ローカル定義を削除。制限値は shared 定数を参照。zone/status は shared 正規化関数へ）:
```typescript
// LIMIT_MAX / LIMIT_MIN / TAG_LIMIT / Q_LIMIT / VALID_ZONES / VALID_STATUSES は
// @ubm-hyogo/shared/public-search に SSOT 化したため削除。
// expand whitelist のみ api 固有責務として下記に残す。
```

> `EXPAND_WHITELIST = ["tags"] as const` と `type ExpandKey` は **削除しない**（api 固有・行 11-12）。

#### (c) 正規化ヘルパ（行 57-66 周辺）

**Before**:
```typescript
const clampLimit = (n: number): number =>
  Math.min(Math.max(Math.trunc(n), LIMIT_MIN), LIMIT_MAX);

const normalizeQ = (q: string): string =>
  q.trim().replace(/\s+/g, " ").slice(0, Q_LIMIT);

const dedup = (arr: string[]): string[] => Array.from(new Set(arr));

const normalizeEnumLike = (value: string, valid: Set<string>): string =>
  valid.has(value) ? value : "all";
```

**After**: これらローカルヘルパを **削除**し、`parsePublicMemberQuery` の本体で shared 関数を直接使う。

#### (d) `parsePublicMemberQuery` の return（行 100-111 周辺）

**Before**:
```typescript
const data = result.success ? result.data : DEFAULT_PUBLIC_MEMBER_QUERY;
return {
  q: normalizeQ(data.q),
  zone: normalizeEnumLike(data.zone || "all", VALID_ZONES),
  status: normalizeEnumLike(data.status || "all", VALID_STATUSES),
  tags: dedup(data.tags.filter((tag) => tag.length > 0)).slice(0, TAG_LIMIT),
  sort: data.sort,
  density: data.density,
  page: Math.max(1, Math.trunc(data.page)),
  limit: clampLimit(data.limit),
  expand: Array.from(new Set(data.expand as ExpandKey[])),
};
```

**After**（shared 純関数へ置換。`page` の `Math.max(1, trunc)` は api 固有のため据え置き）:
```typescript
const data = result.success ? result.data : DEFAULT_PUBLIC_MEMBER_QUERY;
return {
  q: normalizePublicMemberQ(data.q),
  zone: normalizePublicMemberZone(data.zone || "all"),
  status: normalizePublicMemberStatus(data.status || "all"),
  tags: normalizePublicMemberTags(data.tags),
  sort: data.sort,
  density: data.density,
  page: Math.max(1, Math.trunc(data.page)),
  limit: clampPublicMemberLimit(data.limit),
  expand: Array.from(new Set(data.expand as ExpandKey[])),
};
```

> **挙動同値の根拠**:
> - `normalizePublicMemberTags(data.tags)` は「空文字除外 + dedup + slice(0,5)」を内包し、旧 `dedup(filter(len>0)).slice(0,TAG_LIMIT)` と同一結果。
> - `normalizePublicMemberZone("all" 既定込み)` は whitelist 外を `"all"` に倒す旧 `normalizeEnumLike(_, VALID_ZONES)` と同値。`data.zone || "all"` の空文字ガードは維持。
> - `clampPublicMemberLimit` は旧 `clampLimit`（`trunc → max(1) → min(100)`）と同一。
> - `page` は shared に出さず api 側の `Math.max(1, Math.trunc(data.page))` を据え置く（SSOT §2 で page/limit は api のみが持つ責務）。

### 2.4 `ParsedPublicMemberQuery` 型の `sort` / `density`

```typescript
sort: z.infer<typeof SortZ>;     // = z.infer<typeof PublicMemberSortZ>（re-export 経由で不変）
density: z.infer<typeof DensityZ>;
```

> re-export により `z.infer` の解決先が同一 enum になるため型不変。`zod` の import（`import { z } from "zod"`）は `RawZ` / `z.infer` 用に **残す**。

---

## 3. 入力・出力・副作用の定義

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `parsePublicMemberQuery` | `Record<string, string \| string[] \| undefined>`（raw query） | `ParsedPublicMemberQuery`（q/zone/status/tags/sort/density/page/limit/expand） | なし（純関数・D1 非接触） |

- I/O は切替前後で**完全不変**。これが AC-2（既存 spec 無変更 pass）の対象。

---

## 4. テスト方針（追加テストファイル・ケース）

- **追加 spec なし**。Lane B は既存 contract を壊さない切替なので、回帰で担保する。
- 回帰対象（無変更で pass）:
  - `apps/api/src/_shared/__tests__/search-query-parser.spec.ts`
  - `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`（`SortZ` 等 consumer の間接回帰）
- fail path / drift guard の追加は Phase 6 で扱う。

---

## 5. ローカル実行・検証コマンド（SSOT §5.3）

```bash
# api 回帰（無変更で pass）
mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
# api 型チェック（re-export / import 整合）
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
# 重複定義消滅確認（AC-7）
grep -rn "VALID_ZONES\|0_to_1" apps/api/src/_shared/search-query-parser.ts
mise exec -- pnpm lint
```

> `grep` は **0 ヒット**が期待（`VALID_ZONES` / `0_to_1` リテラルが api parser から消える）。`EXPAND_WHITELIST` の `"tags"` は残るが zone/status リテラルは消える。

---

## 6. 完了条件（DoD）

- [ ] `search-query-parser.ts` が shared import へ切替わり、ローカルの値集合（`VALID_ZONES` / `VALID_STATUSES`）・制限値（`LIMIT_*` / `TAG_LIMIT` / `Q_LIMIT`）・正規化ヘルパ（`normalizeQ` / `clampLimit` / `dedup` / `normalizeEnumLike`）が削除されている。
- [ ] `SortZ` / `DensityZ` は re-export で export 名維持され、consumer の import が壊れていない。
- [ ] `DEFAULT_PUBLIC_MEMBER_QUERY` / `ParsedPublicMemberQuery` / `parsePublicMemberQuery` の shape・I/O が完全不変。
- [ ] `expand` whitelist（`["tags"]`）が api 側に残っている。
- [ ] 既存 2 spec が無変更で pass（AC-2）。
- [ ] api typecheck が緑、`grep` で zone リテラル重複が 0（AC-7）。
- [ ] D1 / endpoint / Google Form 非接触。
