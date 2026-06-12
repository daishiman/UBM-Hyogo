# 実装ガイド — 公開検索 query parser primitives の packages/shared 集約（issue #222）

> SSOT: [`../../shared-context.md`](../../shared-context.md) を正本とする。
> 以下のシグネチャ・識別子・パスは SSOT §3.1 を逐語で引用する（スペル・大文字小文字・引数名まで一致させること）。
> 実装・focused tests・typecheck・lint は完了。commit / push / PR は user-gated。

## Part 1

> 中学生にもわかる説明。なぜ必要か → 何をするか。

### たとえ話: 同じ計算ルールを2冊のノートに書き写すとズレる

たとえば、クラスで「テストの点数を集計するルール」を決めたとします。「空白は前後を削る」「タグは5個まで」「検索文字は200文字まで」といったルールです。いま、このルールが **2人の係（= `apps/api` と `apps/web`）** によって、**別々のノートに書き写されている**状態です。

2冊とも今は同じ内容なので、表向きは問題なく動いています。ところが、ある日 1人だけが「タグは5個まで → 8個まで」とルールを直したらどうなるでしょう。もう1人のノートは古いまま。すると、**同じ「メンバー検索」なのに、入口（web）と中身（api）でルールが食い違う**という、気づきにくいバグが起きます。これが「drift（ずれ）」です。

### このタスクでやること: 共有ノートを1冊にまとめる

そこで、ルールを書く場所を **1冊の共有ノート（= `packages/shared`）** にまとめます。

- 「値の候補（zone / status / sort / density）」「上限（タグ5個・検索文字200字・1ページ件数）」「空白やタグの整え方」を、**この共有ノートだけに書く**。
- web と api は、自分のノートにルールを書き写すのをやめて、**共有ノートを見に行く（import する）** だけにする。
- こうすれば、ルールを直すときは共有ノート1か所を直すだけ。**2人のノートが食い違うことが原理的になくなります**。

### 大事なルール: 見た目と動きは1ミリも変えない

このタスクは「整理整頓」であって「機能追加」ではありません。**ユーザーから見た検索画面の見た目・動き・結果は、変更前と完全に同じ**にします。だから画面のスクリーンショットも撮りません（撮っても同じものが写るだけ）。正しさは「ルールを整理しても今までのテストが全部通る」ことで確かめます。

### 正直な補足: 「不正な値は400エラー」という昔のメモは古い

issue #222 を起票したときのメモには「`limit=999` のような変な値が来たら 400 エラーにする」と書いてありました。でも**今のコードを読むと、変な値は安全な初期値にそっと戻す（= silent fallback。`limit=999` なら 100 に、`sort=invalid` なら `recent` に）**設計になっています。公開検索は「変な値でも止まらず安全に表示する」のが正しいので、**今のコードに合わせて読み替えます**（昔のメモを直す、という判断）。

---

## Part 2

> 開発者レベル。型 / シグネチャ / import 例 / エラーハンドリング / エッジケース / 設定可能定数。

### 設計方針（現コード最適化）

issue 原案の「parser 全体を `packages/shared` へ移設し薄ラッパ化」は採らない。web/api の 2 parser は責務が異なる（api: raw query → `ParsedPublicMemberQuery`（page/limit/expand 含む D1 用）/ web: Next.js `searchParams` → `MembersSearch`（page/limit 非保持・`toApiQuery` serialize 責務））。よって**真に重複しているプリミティブだけ**を shared に SSOT 化し、各 app が import して app 固有の parser/serializer を構築する。

### 新規 pure module: `packages/shared/src/public-search/search-query-primitives.ts`

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

> 上記識別子は実装の正本（SSOT §3.1）。命名規則は既存準拠（定数 = UPPER_SNAKE / zod = PascalCase + `Z` / 純関数 = camelCase 動詞始まり / ファイル = kebab-case）。

### barrel: `packages/shared/src/public-search/index.ts`

```typescript
export * from "./search-query-primitives";
```

### 公開経路（subpath export・root barrel を汚さない / FB-W0-01）

`packages/shared/package.json` の `exports` に subpath を追加する:

```json
"./public-search": "./src/public-search/index.ts"
```

- **root `packages/shared/src/index.ts` には追加しない**。`SortZ` 等が `admin/search` / `zod` の export と衝突する risk を避けるため、subpath export に閉じる。

### API シグネチャ（公開する純関数・例外を投げない）

| シグネチャ | 振る舞い |
| --- | --- |
| `normalizePublicMemberQ(q: string): string` | trim + `\s+`→`" "` + `slice(0, 200)`。throw しない |
| `normalizePublicMemberTags(tags: string[]): string[]` | 空文字除去 + dedup + `slice(0, 5)`。throw しない |
| `clampPublicMemberLimit(n: number): number` | `trunc` 後 `[1, 100]` に clamp。throw しない |
| `isPublicMemberZone(v: string): v is PublicMemberZone` | whitelist 判定（type guard） |
| `isPublicMemberStatus(v: string): v is PublicMemberStatus` | whitelist 判定（type guard） |
| `normalizePublicMemberZone(v: string): PublicMemberZone` | whitelist 外は `"all"` |
| `normalizePublicMemberStatus(v: string): PublicMemberStatus` | whitelist 外は `"all"` |
| `PublicMemberSortZ` / `PublicMemberDensityZ` | `z.enum(...)`。app 側で `.catch(default)` を付けて silent fallback に使う |

### 使用例（api / web での import）

#### apps/api 側（`apps/api/src/_shared/search-query-parser.ts`）

```typescript
import {
  PublicMemberSortZ,
  PublicMemberDensityZ,
  PUBLIC_MEMBER_ZONE_VALUES,
  PUBLIC_MEMBER_STATUS_VALUES,
  PUBLIC_MEMBER_SEARCH_LIMITS,
  normalizePublicMemberQ,
  normalizePublicMemberTags,
  clampPublicMemberLimit,
  normalizePublicMemberZone,
  normalizePublicMemberStatus,
} from "@ubm-hyogo/shared/public-search";

// 後方互換: 既存 import を壊さないため export 名を維持（re-export）
export const SortZ = PublicMemberSortZ;
export const DensityZ = PublicMemberDensityZ;
// VALID_ZONES / VALID_STATUSES / TAG_LIMIT / Q_LIMIT / LIMIT_MIN / LIMIT_MAX /
// clampLimit / normalizeQ / dedup / normalizeEnumLike は shared 由来へ置換。
// parsePublicMemberQuery の返却 shape（tags key 名 / expand whitelist=["tags"] / DEFAULT_PUBLIC_MEMBER_QUERY の limit:24 等）は完全不変。
// expand whitelist は apps/api 固有のため shared に出さず api 側に残す。
```

#### apps/web 側（`apps/web/src/lib/url/members-search.ts`）

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

// QSchema / TagSchema の transform は shared の normalize 関数を呼ぶ形へ置換。
// 公開 API 不変: membersSearchSchema / MembersSearch 型 / parseSearchParams / toApiQuery は名前・shape・挙動とも不変。
// MEMBERS_SEARCH_LIMITS は shared から { TAG_LIMIT, Q_LIMIT } を組み立てて維持（既存テスト互換）。
export const MEMBERS_SEARCH_LIMITS = {
  TAG_LIMIT: PUBLIC_MEMBER_SEARCH_LIMITS.TAG_LIMIT,
  Q_LIMIT: PUBLIC_MEMBER_SEARCH_LIMITS.Q_LIMIT,
} as const;
```

### エラーハンドリング（例外を投げず fallback）

- 全 helper は **throw しない**。不正入力は「安全側 default に倒す」片側安全設計（WEEKGRD-02）。
- enum 系は app 側で `PublicMemberSortZ.catch("recent")` のように `.catch()` を付け、parse 失敗時に default へ silent fallback（issue AC-3 の「400」は現コードに合わせ silent fallback へ是正）。
- `normalizePublicMemberZone` / `normalizePublicMemberStatus` は whitelist 外を `"all"` に倒し、`/members` 公開検索が「不正パラメータでも 200 を返す」現行仕様を維持。

### エッジケース一覧

| 入力 | 結果 | 根拠 |
| --- | --- | --- |
| `limit=999` | `100`（LIMIT_MAX clamp） | `clampPublicMemberLimit` |
| `page=0` | `1`（LIMIT_MIN 相当 / api 側 page clamp） | api parser が下限 1 に clamp |
| `sort=invalid`（不正 enum） | `"recent"`（default fallback） | `PublicMemberSortZ.catch("recent")` |
| `density=invalid` | default（`"comfy"` 等 app 既定） | `PublicMemberDensityZ.catch(default)` |
| tag が 6 個以上（`tag>5`） | 先頭 5 件で truncate | `normalizePublicMemberTags`（TAG_LIMIT=5） |
| `q` が 201 文字以上（`q>200`） | 200 文字に切詰 | `normalizePublicMemberQ`（Q_LIMIT=200） |
| `zone=invalid` / `status=invalid` | `"all"` | `normalizePublicMemberZone` / `normalizePublicMemberStatus` |
| 空文字タグ・重複タグ | 除去・dedup | `normalizePublicMemberTags` |

### 設定可能な定数一覧（`PUBLIC_MEMBER_SEARCH_LIMITS`）

| キー | 値 | 用途 |
| --- | --- | --- |
| `TAG_LIMIT` | `5` | タグ件数上限（api/web 共有） |
| `Q_LIMIT` | `200` | 検索文字数上限（api/web 共有） |
| `LIMIT_MIN` | `1` | 1ページ件数の下限（api 使用・web は将来用 SSOT） |
| `LIMIT_MAX` | `100` | 1ページ件数の上限（api 使用） |
| `LIMIT_DEFAULT` | `24` | 1ページ件数の既定（`DEFAULT_PUBLIC_MEMBER_QUERY` の `limit:24` と整合） |

> `LIMIT_MIN` / `LIMIT_MAX` / `LIMIT_DEFAULT` / `clampPublicMemberLimit` は現状 api のみが使用。web は未使用でよい（将来 web がページングする際の SSOT として shared に置く）。

## 視覚証跡

本タスクは **UI / UX 変更なし**（query 正規化規約の SSOT 化のみ・画面の見た目と挙動は変更前と完全一致）のため、**Phase 11 スクリーンショットは不要**。

代替証跡として以下を参照する:

- `outputs/phase-11/manual-test-result.md`（NON_VISUAL 宣言 + 自動テスト SP-01〜SP-12 + api/web 回帰 + typecheck / lint の実行済み証跡）
