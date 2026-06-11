# task-03 (Lane C): apps/web を shared プリミティブへ切替（動作不変）

> SSOT: [`../../shared-context.md`](../../shared-context.md)（§3.5 が本 task の正本）。
> 前提: **task-01（Lane A）完了後に着手**。Lane B とは相互独立（並列可）。
> **[実装区分: 実装仕様書]** — このファイルは spec。

## 1. 変更対象ファイル一覧（パス・変更種別）

| パス | 変更種別 |
| --- | --- |
| `apps/web/src/lib/url/members-search.ts` | **編集**（ローカル値集合・制限を shared import へ置換。`transform` を shared 関数呼び出しへ） |

> 既存 spec `apps/web/src/lib/url/__tests__/members-search.spec.ts` は **編集禁止**（U-01〜U-06 回帰）。
> `apps/web` → `apps/api` 直接 import は引き続き禁止。shared 経由のみ（不変条件 #5 / boundary lint 維持）。

---

## 2. 切替後のシグネチャ・構造（SSOT §3.5）

### 2.1 不変条件（絶対に変えない公開 surface）

| 識別子 | 維持方法 |
| --- | --- |
| `export const membersSearchSchema` | shape・catch 挙動 完全不変 |
| `export type MembersSearch` | `z.infer<typeof membersSearchSchema>` のまま不変 |
| `export function parseSearchParams` | I/O 完全不変 |
| `export function toApiQuery` | **本タスク非接触**（完全不変） |
| `export const MEMBERS_SEARCH_LIMITS` | `{ TAG_LIMIT, Q_LIMIT }` の shape・値を shared から再構築して維持 |

### 2.2 shared から import するもの

```typescript
import {
  PUBLIC_MEMBER_ZONE_VALUES,
  PUBLIC_MEMBER_STATUS_VALUES,
  PUBLIC_MEMBER_SORT_VALUES,
  PUBLIC_MEMBER_DENSITY_VALUES,
  PUBLIC_MEMBER_SEARCH_LIMITS,
  normalizePublicMemberQ,
  normalizePublicMemberTags,
} from "@ubm-hyogo/shared/public-search";
```

### 2.3 Before / After のコード断片

#### (a) ローカル値集合・制限（行 7-13）

**Before**:
```typescript
const ZONE_VALUES = ["all", "0_to_1", "1_to_10", "10_to_100"] as const;
const STATUS_VALUES = ["all", "member", "non_member", "academy"] as const;
const SORT_VALUES = ["recent", "name"] as const;
const DENSITY_VALUES = ["comfy", "dense", "list"] as const;

const TAG_LIMIT = 5;
const Q_LIMIT = 200;
```

**After**: ローカル定義を **削除**。`z.enum(...)` には shared の値集合 tuple を渡す。`TAG_LIMIT` / `Q_LIMIT` は `PUBLIC_MEMBER_SEARCH_LIMITS` から参照する。

#### (b) `QSchema` / `TagSchema`（行 15-23）

**Before**:
```typescript
const QSchema = z
  .string()
  .transform((s) => s.trim().replace(/\s+/g, " ").slice(0, Q_LIMIT))
  .catch("");

const TagSchema = z
  .array(z.string().min(1))
  .transform((arr) => Array.from(new Set(arr)).slice(0, TAG_LIMIT))
  .catch([]);
```

**After**（transform を shared 純関数呼び出しへ）:
```typescript
const QSchema = z
  .string()
  .transform((s) => normalizePublicMemberQ(s))
  .catch("");

const TagSchema = z
  .array(z.string().min(1))
  .transform((arr) => normalizePublicMemberTags(arr))
  .catch([]);
```

> **挙動同値の根拠**:
> - `normalizePublicMemberQ` は `trim → \s+ を " " → slice(0,200)` で旧 transform と一字一句同一。
> - `normalizePublicMemberTags` は「空文字除外 + dedup + slice(0,5)」。旧 `TagSchema` は `z.string().min(1)` で既に空文字を弾いているため、追加の空文字除外は無害（同一結果）。U-04（dedup）/ U-05（5 件 truncate）が維持される。

#### (c) `membersSearchSchema` の enum（行 25-32）

**Before**:
```typescript
export const membersSearchSchema = z.object({
  q: QSchema,
  zone: z.enum(ZONE_VALUES).catch("all"),
  status: z.enum(STATUS_VALUES).catch("all"),
  tag: TagSchema,
  sort: z.enum(SORT_VALUES).catch("recent"),
  density: z.enum(DENSITY_VALUES).catch("comfy"),
});
```

**After**（shared 値集合 tuple を `z.enum` に渡す。`.catch` はそのまま）:
```typescript
export const membersSearchSchema = z.object({
  q: QSchema,
  zone: z.enum(PUBLIC_MEMBER_ZONE_VALUES).catch("all"),
  status: z.enum(PUBLIC_MEMBER_STATUS_VALUES).catch("all"),
  tag: TagSchema,
  sort: z.enum(PUBLIC_MEMBER_SORT_VALUES).catch("recent"),
  density: z.enum(PUBLIC_MEMBER_DENSITY_VALUES).catch("comfy"),
});
```

> `MembersSearch = z.infer<typeof membersSearchSchema>` は値集合が同一文字列 union のため型不変。U-02 / U-03 / `zod schema 直接呼び出し` test が維持される。

#### (d) `MEMBERS_SEARCH_LIMITS`（行 78-81）

**Before**:
```typescript
export const MEMBERS_SEARCH_LIMITS = {
  TAG_LIMIT,
  Q_LIMIT,
} as const;
```

**After**（shared 定数から `{ TAG_LIMIT, Q_LIMIT }` を再構築。既存 test 互換 shape を維持）:
```typescript
export const MEMBERS_SEARCH_LIMITS = {
  TAG_LIMIT: PUBLIC_MEMBER_SEARCH_LIMITS.TAG_LIMIT,
  Q_LIMIT: PUBLIC_MEMBER_SEARCH_LIMITS.Q_LIMIT,
} as const;
```

> 既存 web spec が `MEMBERS_SEARCH_LIMITS.TAG_LIMIT`（=5）/ `MEMBERS_SEARCH_LIMITS.Q_LIMIT`（=200）を参照するため、key 名・値・shape を完全維持する。shared 由来の `LIMIT_MIN` / `LIMIT_MAX` / `LIMIT_DEFAULT` は web では公開しない（ページングは web 配線スコープ外。SSOT §2.2）。

#### (e) `parseSearchParams` / `toApiQuery`（行 40-76）

- **非接触**。`parseSearchParams` は `membersSearchSchema.parse(...)` を呼ぶだけで、schema 内部が shared 化されても I/O 不変。
- `toApiQuery` は値集合・正規化に依存しない serialize 処理のため完全不変。

---

## 3. 入力・出力・副作用の定義

| 関数 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `parseSearchParams` | `Record<string, string \| string[] \| undefined>`（Next.js searchParams） | `MembersSearch`（q/zone/status/tag/sort/density） | なし（純関数・D1 非接触） |
| `toApiQuery` | `MembersSearch` | `URLSearchParams`（API 呼び出し用・初期値省略・repeated tag） | なし |

- I/O は切替前後で**完全不変**。これが AC-6（既存 spec 無変更 pass）の対象。

---

## 4. テスト方針（追加テストファイル・ケース）

- **追加 spec なし**。Lane C は既存 contract を壊さない切替なので、回帰で担保する。
- 回帰対象（無変更で pass）: `apps/web/src/lib/url/__tests__/members-search.spec.ts`（U-01〜U-06 + `toApiQuery` 群 + `MEMBERS_SEARCH_LIMITS` 参照）。
- fail path / drift guard の追加は Phase 6 で扱う。

---

## 5. ローカル実行・検証コマンド（SSOT §5.3）

```bash
# web 回帰（無変更で pass）
mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/members-search.spec.ts
# web 型チェック（shared subpath import の解決・enum 型整合）
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
# 重複定義消滅 + boundary（web→api 直接参照ゼロ・shared 経由のみ）
grep -rn "ZONE_VALUES\|0_to_1" apps/web/src/lib/url/members-search.ts
mise exec -- pnpm lint
```

> `grep` は **0 ヒット**が期待（`ZONE_VALUES` 定義・`0_to_1` リテラルが web から消える）。`pnpm lint` の boundary 部（`scripts/lint-boundaries.mjs` + dependency-cruiser）で `apps/web` → `apps/api` 直接参照ゼロ・shared 一方向を確認。

---

## 6. 完了条件（DoD）

- [ ] `members-search.ts` が shared import へ切替わり、ローカル値集合（`ZONE_VALUES` / `STATUS_VALUES` / `SORT_VALUES` / `DENSITY_VALUES`）・制限（`TAG_LIMIT` / `Q_LIMIT`）が削除されている。
- [ ] `QSchema` / `TagSchema` の `transform` が `normalizePublicMemberQ` / `normalizePublicMemberTags` 呼び出しになっている。
- [ ] `membersSearchSchema` / `MembersSearch` / `parseSearchParams` / `toApiQuery` の名前・shape・挙動が完全不変。
- [ ] `MEMBERS_SEARCH_LIMITS` が `{ TAG_LIMIT, Q_LIMIT }` の shape・値を維持している。
- [ ] 既存 spec が無変更で pass（AC-6）。
- [ ] web typecheck が緑、`grep` で web の zone リテラル重複が 0（AC-7）、boundary lint で web→api 直接参照ゼロ（AC-5）。
- [ ] D1 / endpoint / Google Form 非接触。
