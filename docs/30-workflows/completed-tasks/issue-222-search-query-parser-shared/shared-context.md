# SSOT: issue-222 公開検索 query parser primitives の packages/shared 集約

> このファイルは全 Phase / 全 SubAgent が参照する単一情報源（Single Source of Truth）。
> 仕様の数値・パス・識別子・判断根拠はここを正本とし、各 phase-N.md はここから逸脱しないこと。

---

## 0. メタ情報（正本）

| 項目 | 値 |
| --- | --- |
| タスクID | `ISSUE-222-SEARCH-QUERY-PARSER-SHARED` |
| workflow slug | `issue-222-search-query-parser-shared` |
| canonical_root | `docs/30-workflows/completed-tasks/issue-222-search-query-parser-shared` |
| 関連 issue | #222（CLOSED のまま。再オープンしない） |
| 実装区分 | **実装済み refactoring**（CONST_004 準拠。コード変更・検証完了） |
| taskType | `refactoring` |
| visualEvidence | `NON_VISUAL`（UI/UX 変更なし・純粋な内部リファクタ） |
| implementation_mode | `new`（既存コードを shared import へ切替える実コード変更が必要） |
| 優先度 | medium（issue label priority:medium 準拠） |
| 見積規模 | small |
| git ブランチ | `refactor/issue-222-search-query-parser-shared` |

---

## 1. 真の論点（why now / why this way）

### 1.1 現象ではなく主問題

公開メンバー検索（`/members`）の query 正規化ロジックが、**`apps/api` と `apps/web` の 2 箇所で独立に再定義**されており、enum 値集合・制限値・正規化アルゴリズムが drift しうる状態にある。現時点では値が一致しているが、一方だけ変更すると `/members?status=...` の挙動が web/api で食い違う silent bug が発生する。

### 1.2 issue #222 が「古い」点と現コードへの最適化

issue #222（2026-04-29 起票）の原案は次を前提にしていた:

- 「`apps/api/src/_shared/search-query-parser.ts` を `packages/shared` に**移設**し、`apps/api` を**薄ラッパ化** or 削除する」
- AC-3: 「不正値（`limit=999` / `page=0` / `sort=invalid`）が zod parse で **400** になる」

しかし**現在のコードを確認した結果、この前提は実態と乖離している**:

1. **web/api のパーサは責務が異なり、丸ごと共有できない**:
   - `apps/api` の `parsePublicMemberQuery()` は「受信 raw query → `ParsedPublicMemberQuery`」で、`page` / `limit` / `expand` の正規化を含む（D1 クエリ用）。
   - `apps/web` の `parseSearchParams()` は「Next.js `searchParams` → `MembersSearch`」で `page` / `limit` を**持たない**。加えて `toApiQuery()` で API 呼び出し用 `URLSearchParams` を組み立てる serialize 責務を持つ。
   - 片方を薄ラッパにすると、もう片方の責務が壊れる。
2. **AC-3 の「400」は古い**。現コードは不正値を **silent fallback**（`z.catch()` / `clamp`）する設計で、400 を返さない（`apps/api` の parser コメントに「不正値は黙って default に fallback (AC-6)」と明記）。`/members` 公開検索は「不正パラメータでも安全側 default で 200 を返す」ことが現行の正しい仕様。

→ **現コードに最適化した根本解決**: パーサ全体の物理移動ではなく、**両者が真に重複している共通プリミティブだけを `packages/shared` に SSOT 化**し、各 app がそれを import して app 固有のパーサ/シリアライザを構築する。これにより drift を根絶しつつ、各 app の責務境界を保つ。

### 1.3 真に重複している核（共有対象）

| # | 重複している概念 | apps/api（`search-query-parser.ts`） | apps/web（`members-search.ts`） |
| --- | --- | --- | --- |
| 1 | zone 値集合 | `VALID_ZONES = Set(["all","0_to_1","1_to_10","10_to_100"])` | `ZONE_VALUES = ["all","0_to_1","1_to_10","10_to_100"]` |
| 2 | status 値集合 | `VALID_STATUSES = Set(["all","member","non_member","academy"])` | `STATUS_VALUES = ["all","member","non_member","academy"]` |
| 3 | sort 値集合 | `SortZ = enum(["recent","name"])` | `SORT_VALUES = ["recent","name"]` |
| 4 | density 値集合 | `DensityZ = enum(["comfy","dense","list"])` | `DENSITY_VALUES = ["comfy","dense","list"]` |
| 5 | tag 上限 | `TAG_LIMIT = 5` | `TAG_LIMIT = 5` |
| 6 | q 上限 | `Q_LIMIT = 200` | `Q_LIMIT = 200` |
| 7 | q 正規化 | `normalizeQ`: trim + `\s+`→`" "` + `slice(0,200)` | `QSchema.transform`: 同一ロジック |
| 8 | tag 正規化 | `dedup + filter(len>0) + slice(0,5)` | `TagSchema.transform`: dedup + slice(5) |

> `limit`（MIN=1 / MAX=100）は `apps/api` のみが持つ。shared に定数として置くが web は未使用でよい（将来 web がページングする際の SSOT になる）。

---

## 2. スコープ（CONST_007: 今回1サイクルで完了）

### 2.1 含むもの（今回サイクルで実装完了）

**Lane A — shared SSOT 新規作成（完了）**
- 新規 `packages/shared/src/public-search/search-query-primitives.ts`
- 新規 `packages/shared/src/public-search/index.ts`（barrel）
- 新規 `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts`
- 編集 `packages/shared/package.json`（`exports` に `"./public-search": "./src/public-search/index.ts"` を追加）

**Lane B — apps/api 切替（動作不変・完了）**
- 編集 `apps/api/src/_shared/search-query-parser.ts`（enum 値・制限値・正規化を shared import へ置換。`parsePublicMemberQuery` の I/O と返却 shape は完全不変）

**Lane C — apps/web 切替（動作不変・完了）**
- 編集 `apps/web/src/lib/url/members-search.ts`（enum 値・制限値・正規化を shared import へ置換。`parseSearchParams` / `toApiQuery` / `MembersSearch` 型・`MEMBERS_SEARCH_LIMITS` は完全不変）

**回帰（既存テストが pass 継続）**
- `apps/api/src/_shared/__tests__/search-query-parser.spec.ts`（無変更で pass: 12 tests）
- `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts`（無変更で pass: 18 tests）
- `apps/web/src/lib/url/__tests__/members-search.spec.ts`（無変更で pass: 11 tests）

### 2.2 含まないもの（スコープ外・先送りではなく本質的対象外）

- 検索 spec の機能拡張（タグ OR 検索・検索演算子など）— 別タスク領域。
- `apps/web` のページング実装（`page`/`limit` を web で使う）— 06系の別タスク。shared に定数は置くが web 配線はしない。
- `packages/shared/src/admin/search.ts`（admin 検索）— 別ドメイン、本タスク非接触。
- D1 schema 変更・新 API endpoint・Google Form 仕様変更（CLAUDE.md 不変条件・UI workflow 不変条件 #1 を厳守）。

### 2.3 先送り判定（CONST_007 例外チェック）

**先送りタスクは 0 件。** 上記 2.1 は技術的に独立しておらず相互依存（B/C が A に依存）するが、いずれも 1 PR / 1 実装サイクルで完了可能な小規模変更。「分量」「複雑さ」を理由とした切り出しは行わない。

---

## 3. 設計（最適解の具体形）

### 3.1 新規ファイル `packages/shared/src/public-search/search-query-primitives.ts`

公開する識別子（**この名前を正本とする**）:

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

### 3.2 barrel `packages/shared/src/public-search/index.ts`

```typescript
export * from "./search-query-primitives";
```

### 3.3 公開経路（FB-W0-01 厳守：root barrel を汚さない）

- `packages/shared/package.json` の `exports` に **subpath** を追加する:
  ```json
  "./public-search": "./src/public-search/index.ts"
  ```
- import 側は `import { PUBLIC_MEMBER_ZONE_VALUES, ... } from "@ubm-hyogo/shared/public-search";`
- **root `packages/shared/src/index.ts` には追加しない**（`SortZ` 等が `admin/search` や `zod` の export と衝突する risk を避ける）。

### 3.4 apps/api 切替後の `search-query-parser.ts`（動作不変の要点）

- ローカル定義の `SortZ` / `DensityZ` / `VALID_ZONES` / `VALID_STATUSES` / `TAG_LIMIT` / `Q_LIMIT` / `LIMIT_MAX` / `LIMIT_MIN` / `clampLimit` / `normalizeQ` / `dedup` / `normalizeEnumLike` を shared import に置換。
- **export 名は維持**（後方互換）: 既存の `export const SortZ` / `export const DensityZ` は `export const SortZ = PublicMemberSortZ;`（re-export）として残し、`list-public-members.ts` / `pagination.ts` / `routes/public/members.ts` の既存 import を壊さない。
- `parsePublicMemberQuery` の返却 shape（`tags` key 名・`expand` whitelist 等）は完全不変。`expand` whitelist（`["tags"]`）は apps/api 固有のため shared に出さず api 側に残す。
- `DEFAULT_PUBLIC_MEMBER_QUERY` の値は不変（`limit: 24` 等）。

### 3.5 apps/web 切替後の `members-search.ts`（動作不変の要点）

- ローカル定義の `ZONE_VALUES` / `STATUS_VALUES` / `SORT_VALUES` / `DENSITY_VALUES` / `TAG_LIMIT` / `Q_LIMIT` を shared import に置換。
- `QSchema` / `TagSchema` の `transform` は shared の `normalizePublicMemberQ` / `normalizePublicMemberTags` を呼ぶ形に置換。
- **公開 API 不変**: `membersSearchSchema` / `MembersSearch` 型 / `parseSearchParams` / `toApiQuery` / `MEMBERS_SEARCH_LIMITS` の名前・shape・挙動は不変。`MEMBERS_SEARCH_LIMITS` は shared の `PUBLIC_MEMBER_SEARCH_LIMITS` から `{ TAG_LIMIT, Q_LIMIT }` を組み立てて維持（既存テスト互換）。

### 3.6 因果ループ / 責務境界

- バランスループ: 「shared SSOT に単一定義 → web/api が import → 値が常に一致 → drift 起因の silent bug が発生しない」。
- 状態所有権: query 正規化の**規約（値集合・制限・アルゴリズム）の所有権は `packages/shared`**。各 app は「受信形式→app 固有 DTO への適用」のみを所有。D1 アクセスは引き続き apps/api に閉じる（不変条件 #5 不変）。

---

## 4. 受入条件（issue AC を現コードに最適化して読み替え）

| AC | 内容（最適化後） | 検証 |
| --- | --- | --- |
| AC-1 | `@ubm-hyogo/shared/public-search` が query 値集合 / 制限値 / 正規化 helper を export | import + typecheck |
| AC-2 | `apps/api` の既存 contract が不変（`search-query-parser.spec.ts` が無変更で pass） | 既存 spec 緑 |
| AC-3 | 不正値（`limit=999`→100 clamp / `page=0`→1 / `sort=invalid`→`recent` fallback）が**安全側 default に倒れる**（現コード仕様。400 ではない＝issue の古い記述を是正） | shared spec + 既存 spec |
| AC-4 | shared 側 unit test が pass（境界値: `limit>100` / `page<1` 相当の clamp / 不正 enum fallback / tag>5 truncate / q>200 切詰） | `search-query-primitives.spec.ts` 緑 |
| AC-5 | `apps/web` から `@ubm-hyogo/shared/public-search` が import 可能（boundary lint OK・web→api 直接参照ゼロ維持） | web typecheck + lint |
| AC-6 | `apps/web` の既存 contract が不変（`members-search.spec.ts` が無変更で pass） | 既存 spec 緑 |
| AC-7 | 値集合・制限値の重複定義が web/api から消え、SSOT 一本化されている | grep で重複定義ゼロ確認 |

---

## 5. テスト方針（正本）

### 5.1 新規 shared テスト `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts`

| ID | ケース | 期待 |
| --- | --- | --- |
| SP-01 | `normalizePublicMemberQ("  a   b  ")` | `"a b"` |
| SP-02 | `normalizePublicMemberQ("x".repeat(250))` | length 200 |
| SP-03 | `normalizePublicMemberTags(["a","a","b",""])` | `["a","b"]` |
| SP-04 | `normalizePublicMemberTags(7件)` | 5 件で truncate |
| SP-05 | `clampPublicMemberLimit(999)` | `100` |
| SP-06 | `clampPublicMemberLimit(0)` | `1` |
| SP-07 | `clampPublicMemberLimit(30.9)` | `30`（trunc） |
| SP-08 | `normalizePublicMemberZone("invalid")` | `"all"` |
| SP-09 | `normalizePublicMemberZone("0_to_1")` | `"0_to_1"` |
| SP-10 | `normalizePublicMemberStatus("non_member")` | `"non_member"` |
| SP-11 | `PublicMemberSortZ.catch("recent").parse("bad")` | `"recent"` |
| SP-12 | 各値集合 tuple の要素が期待通り（drift guard） | 完全一致 assert |

### 5.2 回帰

既存 2 spec を**変更せず**実行して緑を維持（contract 不変の証明）。

### 5.3 ローカル検証コマンド（正本）

```bash
# shared 新規テスト
mise exec -- pnpm exec vitest run packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts
# apps/api 回帰
mise exec -- pnpm exec vitest run apps/api/src/_shared/__tests__/search-query-parser.spec.ts apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts
# apps/web 回帰
mise exec -- pnpm exec vitest run apps/web/src/lib/url/__tests__/members-search.spec.ts
# 型・lint
mise exec -- pnpm --filter @ubm-hyogo/shared typecheck
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
# 重複定義消滅確認（AC-7）
grep -rn "ZONE_VALUES\|VALID_ZONES\|0_to_1" apps/api/src/_shared/search-query-parser.ts apps/web/src/lib/url/members-search.ts
```

---

## 6. DoD（Definition of Done）

1. 新規 3 ファイル（primitives / barrel / spec）が存在し shared typecheck が通る。
2. `packages/shared/package.json` の `exports` に `./public-search` がある。
3. `apps/api` / `apps/web` 両方が shared import に切替わり、ローカル重複定義が消えている（AC-7）。
4. 既存 2 spec が無変更で pass（AC-2 / AC-6）。
5. shared 新規 spec（SP-01〜SP-12）が pass（AC-4）。
6. api / web / shared の typecheck と root lint が緑。
7. `parsePublicMemberQuery` / `parseSearchParams` / `toApiQuery` の挙動が変更前と完全一致（contract 不変）。
8. D1 schema / API endpoint / Google Form に変更がない。

## 7. 実装・検証結果（2026-06-10）

| 項目 | 結果 |
| --- | --- |
| shared 新規 spec | `packages/shared/src/public-search/__tests__/search-query-primitives.spec.ts` 12 tests PASS |
| apps/api 回帰 | `search-query-parser.spec.ts` 12 tests PASS + `list-public-members.spec.ts` 18 tests PASS |
| apps/web 回帰 | `members-search.spec.ts` 11 tests PASS |
| typecheck | `@ubm-hyogo/shared` / `@ubm-hyogo/api` / `@ubm-hyogo/web` すべて PASS |
| lint | `pnpm lint` PASS（dependency-cruiser / stableKey / no-inline-style / workspace lint） |
| 変更なし境界 | D1 schema / API endpoint surface / Google Form / UI pixels は不変 |

---

## 7. 不変条件（CLAUDE.md & UI workflow 由来）

1. D1 直接アクセスは `apps/api` に閉じる（#5）— shared は zod primitives のみ、D1 非接触。
2. `apps/web` → `apps/api` 直接 import 禁止 — shared 経由のみ。boundary lint 維持。
3. 既存 API endpoint surface 不変・新 endpoint 追加禁止・D1 schema 変更禁止（UI workflow 不変条件 #1）。
4. OKLch トークン無関係（コード変更は .ts のみ・CSS/HEX 非接触）。
5. 新規 test は `*.spec.ts` のみ（不変条件 #8）。

---

## 8. close-out / Phase 12 注意

- `visualEvidence: NON_VISUAL` → Phase 11 は screenshot 不要。`outputs/phase-11/` は `manual-test-result.md`（NON_VISUAL 宣言 + 自動テスト件数を主証跡）。`screenshots/.gitkeep` は作らない。
- Phase 11 `manual-test-result.md` には「証跡の主ソース（自動テスト名/件数）」と「screenshot を作らない理由」を明記（Feedback 4 / WEEKGRD-03）。
- Step 2（system spec 更新）: 新規共有 helper を追加するため、shared 型追加の 4 点同期（definition / barrel / package exports / consumer wiring）を documentation-changelog に記録。
- shared 型追加タスクの教訓 [UT-W3]: `definition + barrel index + package exports + consumer wiring` を同 wave で揃える。
- 本タスクで生成する仕様書はすべて `spec_created` ステータス。実装・commit・PR・push は**すべて user-gated**。
