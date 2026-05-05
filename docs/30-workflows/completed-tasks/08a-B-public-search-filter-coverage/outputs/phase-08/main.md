# Phase 8 出力 — DRY 化

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 08a-B-public-search-filter-coverage |
| phase | 8 / 13 |
| wave | 08a-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 関連 CONST | CONST_004（重複検出）/ CONST_005（過剰抽象化禁止 / YAGNI） |

## 実装区分宣言

`[実装区分: 実装仕様書]`。Phase 1〜3 と同じ判定根拠（`apps/api/src/_shared/search-query-parser.ts` 等 5 系統）。Phase 8 では既存実装の重複・抽象化候補のみを **記録**し、実コード差分は Phase 5 ランブック以降に委ねる。

## DRY 化の判断軸

| 軸 | 採用基準 |
| --- | --- |
| Rule of Three | 同一意図の重複が 3 箇所以上で抽出する。2 箇所以下は YAGNI で見送り |
| 公開境界（不変条件 #5） | apps/web ↔ apps/api 間の共通化は `packages/shared` 経由のみ。直接 import 禁止 |
| 静的型 vs 実行時検証 | enum 値は zod schema を正本にし、TS 型は `z.infer` で派生（重複定義禁止） |
| 過剰抽象化 | "今 1 箇所" のために interface / strategy / factory を作らない（CONST_005） |
| 影響範囲 | 抽象化リファクタが 5 ファイル以上に波及する場合は別 issue に切り出す |

## 重複・抽象化候補一覧

### 候補 D-1: enum 値定義が apps/api と apps/web で二重管理されている

#### 現状

- `apps/api/src/_shared/search-query-parser.ts:45-46`
  ```ts
  const VALID_ZONES = new Set(["all", "0_to_1", "1_to_10", "10_to_100"]);
  const VALID_STATUSES = new Set(["all", "member", "non_member", "academy"]);
  ```
- `apps/web/src/lib/url/members-search.ts:7-10`
  ```ts
  const ZONE_VALUES = ["all", "0_to_1", "1_to_10", "10_to_100"] as const;
  const STATUS_VALUES = ["all", "member", "non_member", "academy"] as const;
  const SORT_VALUES = ["recent", "name"] as const;
  const DENSITY_VALUES = ["comfy", "dense", "list"] as const;
  ```
- `apps/api/src/_shared/search-query-parser.ts:7-8` の `SortZ` / `DensityZ` も同列挙を別形で保持。

#### 問題

3 箇所で同じ列挙が手動同期されており、今後 zone / status の値追加時に drift する。Rule of Three 該当。

#### 抽象化方針

`packages/shared/src/zod/public-search.ts`（新設）を正本にし、両側から import:

```ts
// packages/shared/src/zod/public-search.ts
import { z } from "zod";

export const PublicMemberZoneZ   = z.enum(["all", "0_to_1", "1_to_10", "10_to_100"]);
export const PublicMemberStatusZ = z.enum(["all", "member", "non_member", "academy"]);
export const PublicMemberSortZ   = z.enum(["recent", "name"]);
export const PublicMemberDensityZ = z.enum(["comfy", "dense", "list"]);

export type PublicMemberZone = z.infer<typeof PublicMemberZoneZ>;
// ...

export const PUBLIC_MEMBER_SEARCH_LIMITS = {
  Q_LIMIT: 200,
  TAG_LIMIT: 5,
  PAGE_LIMIT_MAX: 100,
  PAGE_LIMIT_MIN: 1,
  PAGE_LIMIT_DEFAULT: 24,
} as const;
```

#### 配置先

`packages/shared/src/zod/public-search.ts` 新規。`packages/shared/src/index.ts` から re-export。

#### 影響範囲とリファクタリング手順

1. `packages/shared/src/zod/public-search.ts` 追加
2. `apps/api/src/_shared/search-query-parser.ts` の `SortZ` / `DensityZ` / `VALID_ZONES` / `VALID_STATUSES` を上記 schema に置換
3. `apps/web/src/lib/url/members-search.ts` の `ZONE_VALUES` 等 4 列挙を import に置換
4. `apps/web/src/lib/url/members-search.ts:77-80` の `MEMBERS_SEARCH_LIMITS` を `PUBLIC_MEMBER_SEARCH_LIMITS` で置換（後方互換 alias を残す）
5. 既存テストは値が変わらないため green のまま

#### YAGNI 評価

**実施する。** 3 箇所の手動同期で即 drift リスク、shared に置く以外の正解がない。差分は 1 ファイル新設 + 2 ファイル編集のみで影響軽微。

---

### 候補 D-2: `parseJsonString` / `parseJsonNullable` / `stripJsonString` の重複

#### 現状

- `apps/api/src/use-cases/public/list-public-members.ts:33-51`
  ```ts
  const parseJsonString = (raw: string | null): string => { ... };
  const parseJsonNullable = (raw: string | null): string | null => { ... };
  ```
- `apps/api/src/repository/publicMembers.ts:185-193`
  ```ts
  const stripJsonString = (raw: string | null): string | null => { ... };
  ```

3 関数が同一意図（`response_fields.value_json` の JSON.parse + 文字列抽出）で別実装。

#### 抽象化方針

`apps/api/src/_shared/value-json.ts`（新設）に集約:

```ts
export const parseValueJsonAsString = (raw: string | null): string => { ... };
export const parseValueJsonAsNullableString = (raw: string | null): string | null => { ... };
```

#### 配置先

`apps/api/src/_shared/value-json.ts`。apps/web には export しない（D1 由来 JSON は API 内部の関心事）。

#### 影響範囲

- `apps/api/src/use-cases/public/list-public-members.ts`: local helper 削除 + import
- `apps/api/src/repository/publicMembers.ts`: `stripJsonString` 削除 + import

#### YAGNI 評価

**実施する。** Rule of Three 該当（3 箇所）かつ意味が同じ。テスト 1 つで済む。

---

### 候補 D-3: `listFieldsByResponseId` の N+1 → バルク化

#### 現状

`apps/api/src/use-cases/public/list-public-members.ts:75-98`

```ts
for (const m of memberRows) {
  const fields = await listFieldsByResponseId(
    ctx,
    m.current_response_id as never,
  );
  ...
}
```

`limit` 上限 100 件のため最大 100 回 D1 round-trip（Phase 3 既出の N+1 △ 評価）。

#### 抽象化方針

`listFieldsByResponseId` のバルク版 `listSummaryFieldsByResponseIds` を repository に追加:

```ts
// apps/api/src/repository/responseFields.ts に追加
export async function listSummaryFieldsByResponseIds(
  c: DbCtx,
  responseIds: readonly string[],
  stableKeys: readonly string[],
): Promise<ResponseFieldRow[]> {
  if (responseIds.length === 0 || stableKeys.length === 0) return [];
  const ridPh = placeholders(responseIds.length);
  const keyPh = placeholders(stableKeys.length);
  const result = await c.db
    .prepare(
      `SELECT response_id, stable_key, value_json, raw_value_json
         FROM response_fields
        WHERE response_id IN (${ridPh})
          AND stable_key  IN (${keyPh})`,
    )
    .bind(...responseIds, ...stableKeys)
    .all<ResponseFieldRow>();
  return result.results ?? [];
}
```

use-case 側は `Map<response_id, Map<stable_key, value_json>>` に組み替えて 1 query で全件解決する。

#### 配置先

`apps/api/src/repository/responseFields.ts`（既存ファイル）。public 一覧専用 helper は use-case 側でラップ。

#### 影響範囲

- `apps/api/src/repository/responseFields.ts`: 関数追加（既存 `listFieldsByResponseId` は他 use-case で使用中につき残置）
- `apps/api/src/use-cases/public/list-public-members.ts`: ループ内 `await` を 1 回 + 後段の Map 参照に置換
- 既存テスト互換: 出力 JSON は同形のため無修正で通る

#### YAGNI 評価

**実施する（性能改善が AC-L1 に直結）。** 既存実装は MVP 規模で許容（Phase 3 評価）だが、200 件以上の D1 fixture で実測（Phase 9 性能ベンチ）すると `limit=24` でも tail latency が懸念される。バルク 1 query 化はテストが容易で副作用なし。

> 既存 `listFieldsByResponseId` を破壊変更しないことが重要（`get-public-member-profile.ts:48` で使用中）。

---

### 候補 D-4: LIKE escape 関数の共通化（`%` / `_` リテラル化）

#### 現状

`apps/api/src/repository/publicMembers.ts:42-45`

```ts
if (input.q) {
  fromWhere += ` AND r.search_text LIKE ?`;
  binds.push(`%${input.q}%`);
}
```

ユーザ入力の `%` / `_` がそのまま LIKE パターンに入る。Phase 3 R-2 の懸念として検出され、`q="100%"` で全件 hit の誤動作を `escapeLikePattern` で解消する。

#### 抽象化方針

`apps/api/src/_shared/sql.ts` に `escapeLikePattern` を追加:

```ts
// SQLite LIKE で `\` を escape 文字とする規約に揃える
export const escapeLikePattern = (s: string): string =>
  s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
```

bind 側は `LIKE ? ESCAPE '\\'` を使う:

```ts
fromWhere += ` AND r.search_text LIKE ? ESCAPE '\\'`;
binds.push(`%${escapeLikePattern(input.q)}%`);
```

#### 配置先

`apps/api/src/repository/_shared/sql.ts`（既存 `placeholders` と同居）。

#### 影響範囲

- `apps/api/src/repository/_shared/sql.ts`: 関数追加 + unit test
- `apps/api/src/repository/publicMembers.ts:42-45` 編集（1 箇所のみ）
- 他 LIKE 利用箇所が現時点で他に無いため Rule of Three は **未充足**

#### YAGNI 評価

**今サイクルで実施する（ただし共通化ではなく単独関数として配置）。** 理由:

- 共通化目的ではなく **正当性修正**（`q="100%"` の誤検索修正）
- 単独関数化により後続で 2 箇所目が出た時に自然に DRY 化される
- AC-Q3 に「`%` `_` を文字として扱う」を追記する判断は Phase 4/5 へ申し送り

Phase 12 review で AC-Q3 直結の正当性修正と判定し、`escapeLikePattern` 配置だけでなく `publicMembers.ts` の `LIKE ? ESCAPE '\\'` bind 切替まで今回サイクル内で実装した。

---

### 候補 D-5: URL parser / API query builder の web↔api 共通型

#### 現状

- web 側: `MembersSearch`（`apps/web/src/lib/url/members-search.ts:34`）
- api 側: `ParsedPublicMemberQuery`（`apps/api/src/_shared/search-query-parser.ts:32-41`）

両者は意味が同じだが、web 側は `tag`（単数 key）/ api 側は `tags`（複数 key）で分岐し、`page` / `limit` の有無も異なる。

#### 抽象化方針

候補 D-1 の `packages/shared/src/zod/public-search.ts` に **共通型は作らない**。理由:

- web 側は URL 同期の正本（`tag` の URL key 名は HTML form 慣習）
- api 側は受け取り側の正規化済み型（`tags` 複数形 + page/limit を含む）
- 両者を 1 型にすると key 名の意味が混ざる

**enum 値（D-1）と limit 定数（D-1）のみ共通化し、型本体は分離維持**。Adapter 層 `toApiQuery`（既存）が翻訳責務を持つ。

#### YAGNI 評価

**実施しない（過剰抽象化判定）。** CONST_005 該当: 「今 1 用例しかない」「key 名の意味が違う」。共通型を作ると adapter のテストが増えて純益マイナス。

---

### 候補 D-6: filter UI の zone/status/tag セレクタ共通コンポーネント化

#### 現状

`apps/web/app/(public)/members/_components/MembersFilterBar.client.tsx`（Phase 1 実装区分宣言で参照済み）に zone / status / sort / density の segmented control が 4 種並ぶ。

#### 抽象化方針

`SegmentedControl<T extends string>` を `apps/web/src/components/forms/SegmentedControl.tsx` として抽出。`role="radiogroup"` + `aria-label` + Arrow キー対応を内蔵し、AC-A1 を 1 箇所で担保する。

```ts
interface SegmentedControlProps<T extends string> {
  name: string;
  ariaLabel: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
}
```

#### 配置先

`apps/web/src/components/forms/SegmentedControl.tsx` 新規。

#### 影響範囲

- 新規 1 ファイル + テスト 1 ファイル
- `MembersFilterBar.client.tsx` の 4 セクションを 4 回呼び出しに置換
- a11y 改善（Arrow キー操作）が AC-A1 / AC-A2 と直結

#### YAGNI 評価

**今サイクルで実施する。** Rule of Three 充足（zone / status / sort / density の 4 用例）かつ a11y 要件の単一実装ポイント化メリットが大きい。tag は multi-select のため別コンポーネント（`TagMultiSelect`）として残す。

---

### 候補 D-7: `MEMBERS_SEARCH_LIMITS` と api 側 `LIMIT_MAX` / `Q_LIMIT` の二重管理

候補 D-1 に統合（`PUBLIC_MEMBER_SEARCH_LIMITS` に集約）。

---

## 候補ごとの YAGNI 判定サマリ

| ID | 内容 | 採否 | 理由 |
| --- | --- | --- | --- |
| D-1 | enum + limit 定数を `packages/shared/src/zod/public-search.ts` に集約 | 不採用 | 今回は API / Web 既存 parser の focused 修正で十分。shared 化は追加波及が大きい |
| D-2 | `value_json` parse helper の `_shared/value-json.ts` 集約 | 不採用 | 今回の AC 直結範囲外。既存 helper 化は別の性能/保守タスクで判断 |
| D-3 | summary fields のバルク取得 `listSummaryFieldsByResponseIds` 追加 | 不採用 | AC-L1 は runtime evidence で測る。性能問題が実測されるまで先行実装しない |
| D-4 | LIKE escape 関数 `escapeLikePattern` 配置 + bind 切替 | 採用 | q wildcard 誤一致は AC 直結の正当性修正 |
| D-5 | web↔api の `MembersSearch`/`ParsedPublicMemberQuery` 統合型 | **不採用** | 過剰抽象化（CONST_005）、key 名の意味差 |
| D-6 | `SegmentedControl<T>` 共通コンポーネント | 不採用 | UI 実コード差分なし。a11y は 08b / 09a の runtime evidence で不足が出た場合に実装 |
| D-7 | limit 定数二重管理 | 不採用 | focused parser tests で drift を固定 |

## 過剰抽象化を避ける判断基準

1. 同一意図の重複が **3 箇所以上**で発生しているか（Rule of Three）
2. 抽象化により **テスト総量が減るか / 増えるか**（増えるなら原則見送り）
3. 抽象化対象が **不変条件 #5（公開境界）** を越えないか
4. interface / strategy / factory を新設する場合、現在 1 用例のみであれば **見送り**
5. 抽象化リファクタが **6 ファイル以上**に波及する場合は別 issue に分割

## DoD（Phase 8）

| ID | 内容 | 確認方法 |
| --- | --- | --- |
| P8-DoD-1 | 重複・抽象化候補が実コードの行参照付きで列挙されている | 本ドキュメント D-1〜D-7 |
| P8-DoD-2 | 各候補に YAGNI 採否と根拠が記録されている | 採否サマリ表 |
| P8-DoD-3 | 採用候補に対し配置先 / 関数シグネチャ / 影響範囲 / リファクタ手順が示されている | D-1/D-2/D-3/D-4/D-6 |
| P8-DoD-4 | 不採用候補（D-5）に過剰抽象化と判定した根拠が示されている | D-5 セクション |
| P8-DoD-5 | 共通化先パスが apps/web ↔ apps/api 直結になっていない（不変条件 #5） | shared 経由のみ採用 |
| P8-DoD-6 | 自走禁止操作（実コード差分・PR）を行っていない | git status 確認 |

## 次 Phase への引き渡し

Phase 9 へ以下を渡す:

- 採用候補 D-4 の差分対象ファイル一覧（`apps/api/src/repository/_shared/sql.ts` / `publicMembers.ts` / focused tests）
- AC-L1 性能ベンチは Phase 11 / 08b / 09a runtime evidence で測る
- AC-A1/A2 a11y は Phase 11 / 08b / 09a runtime evidence で測り、不足が出た場合のみ UI 実装を追加する
- LIKE bind 切替は今回サイクル内で実装済み
