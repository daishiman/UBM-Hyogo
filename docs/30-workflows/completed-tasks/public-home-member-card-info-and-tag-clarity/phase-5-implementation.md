# Phase 5: 実装手順（CONST_005 必須6項目を網羅）

- Phase 目的: Phase 4 の RED テストを GREEN にする実装を、後続実行者がそのままコードを書ける粒度で確定する。
- 入力: Phase 2 設計（util / MemberCard / projection / zod シグネチャ）、Phase 4 テスト計画、`_shared-context.md` の実コード line。
- 出力: 本ファイル（変更ファイル一覧 / シグネチャ / 入出力・副作用 / 実装順序 / 検証コマンド / DoD）。

## 5.0 実装前チェック（MINOR 解消・実測済み）

| # | チェック | 実測結果（spec 作成時に grep 済み・実装時に再確認） |
| --- | --- | --- |
| M-1 | home `/` が `listMembers` / `listMembersRaw` どちらか | **`listMembersRaw`**。`apps/web/app/(public)/page.tsx` L63 `listMembersRaw("limit=6&sort=recent", {...})`。→ **raw query 文字列側に `expand=tags` を含める**（`"limit=6&sort=recent&expand=tags"`）。`/members` は `listMembers(search, ...)`（`members/page.tsx` L54）→ `toApiQuery` 経由で付与。 |
| M-2 | `businessOverview` の visibility=public か | **public**。`docs/00-getting-started-manual/specs/01-api-schema.md` L75 `businessOverview … public`。`packages/shared/src/zod/field.ts` L25/L80 に stable_key 定義あり。→ projection 可。非 public でないため分岐不要（ただし実装時に再確認し、万一非 public なら projection しない分岐を入れる）。 |

## 5.1 変更対象ファイル一覧（パス + 新規/編集/削除）

[Feedback RT-03] 「新規作成」「修正」を明示。`_shared-context.md` Lane 表が正本。

### 新規作成

| パス | Lane | 内容 |
| --- | --- | --- |
| `apps/web/src/lib/tags/tag-display.ts` | A1 | 純関数 util（`normalizeTagLabel` / `selectCardTags` / `phaseTone` / `CardTag` 型） |
| `apps/web/src/lib/tags/__tests__/tag-display.spec.ts` | test | T-1（Phase 4） |
| `apps/web/src/components/public/__tests__/MemberCard.spec.tsx` | test | T-2（Phase 4） |
| `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | test | T-3（Phase 4。既存あれば追記） |

### 修正

| パス | Lane | 内容 |
| --- | --- | --- |
| `apps/web/src/components/public/MemberCard.tsx` | A2 | curated tag chip 行 + business summary 行 + occupation 視認性（CSS 連携） |
| `apps/web/src/components/public/TagPicker.client.tsx` | A3 | topTags chip label を `normalizeTagLabel` で表示 |
| `apps/web/src/lib/url/members-search.ts` | A4 | `toApiQuery` に `expand=tags` 常時付与 |
| `apps/web/app/(public)/page.tsx` | A4 | `listMembersRaw` query 文字列に `&expand=tags` 追加 |
| `apps/web/app/(public)/members/page.tsx` | A4 | （`toApiQuery` 経由のため通常は変更不要。実装時に確認） |
| `apps/web/src/styles/legacy-public.css` | A5 | tag-row / tag-chip / biz-summary / occupation 強調 CSS |
| `apps/api/src/use-cases/public/list-public-members.ts` | B1 | `SUMMARY_KEYS` に `businessOverview` 追加 + `toBusinessSummary` + item へ付与 |
| `apps/api/src/view-models/public/public-member-list-view.ts` | B2 | `PublicMemberListItemSource` 型に `businessSummary?: string` |
| `packages/shared/src/zod/viewmodel.ts` | B3 | `PublicMemberListItemZ` に `businessSummary: z.string().optional()` |

### 削除

なし。

## 5.2 主要関数・型・モジュールのシグネチャ

### A1: `apps/web/src/lib/tags/tag-display.ts`（新規）

Phase 2 §2.1 の設計を正本とする。手書き drift を避け、設計コードをそのまま実装する。

```ts
import type { PublicMemberTag } from "@ubm-hyogo/shared"; // { code; label; category }

/** interest タグ等の表示 label を矢印表記へ正規化。code 駆動・未知は label そのまま。AC-1 */
const TAG_LABEL_OVERRIDES: Record<string, string> = {
  int_0to1: "0→1",
  int_1to10: "1→10",
  int_10to100: "10→100",
};
export function normalizeTagLabel(tag: Pick<PublicMemberTag, "code" | "label">): string {
  return TAG_LABEL_OVERRIDES[tag.code] ?? tag.label;
}

/** カード表示タグの category 優先度（小さいほど先頭）。除外カテゴリは未掲載。AC-2 */
const CARD_CATEGORY_ORDER: Record<string, number> = {
  interest: 0, // 事業フェーズ（最優先・強調）
  business: 1, // 業種
  skill: 2,    // スキル
};
const HIDDEN_CATEGORIES = new Set(["region", "role", "status"]); // カード非表示 AC-2/AC-6

export interface CardTag {
  code: string;
  label: string;
  category: string;
  isPhase: boolean;
}

/** density に応じて curated タグを選抜・整列して返す。AC-2/AC-4 */
export function selectCardTags(
  tags: readonly PublicMemberTag[] | undefined,
  density: "comfy" | "dense" | "list",
): CardTag[] {
  if (!tags || tags.length === 0) return [];
  const visible = tags
    .filter((t) => !HIDDEN_CATEGORIES.has(t.category) && t.category in CARD_CATEGORY_ORDER)
    .map((t) => ({
      code: t.code,
      label: normalizeTagLabel(t),
      category: t.category,
      isPhase: t.category === "interest",
    }))
    .sort((a, b) =>
      (CARD_CATEGORY_ORDER[a.category] - CARD_CATEGORY_ORDER[b.category]) ||
      a.code.localeCompare(b.code),
    );
  const phase = visible.filter((t) => t.isPhase);
  const rest = visible.filter((t) => !t.isPhase);
  if (density === "list") return phase.slice(0, 1);
  const restLimit = density === "dense" ? 2 : 3;
  return [...phase.slice(0, 1), ...rest.slice(0, restLimit)];
}

/** phase chip の tone。既存 ChipTone を流用（新 tone 禁止）。AC-4/AC-8 */
export function phaseTone(code: string): "cool" | "warm" | "amber" | "stone" {
  if (code === "int_0to1") return "cool";     // info 系（0→1）
  if (code === "int_1to10") return "warm";    // accent 系（1→10）
  if (code === "int_10to100") return "amber"; // ok 系（10→100）
  return "stone";
}
```

- 入出力: 入力 = `PublicMemberTag[]`(+density) / 出力 = `CardTag[]` or `string`。**副作用なし（純関数）**。
- エラーハンドリング: `tags` の `undefined`/空配列ガードを `selectCardTags` 冒頭で実施。`normalizeTagLabel` は未知 code を label fallback（throw しない）。

### A2: `MemberCard.tsx` JSX 差分（修正・現状 L18-124）

import 追加:
```ts
import { selectCardTags, phaseTone } from "../../lib/tags/tag-display";
```

関数冒頭（L19-22 付近、`isList` 算出後）で curated タグを算出:
```ts
const cardTags = selectCardTags(member.tags, density);
```

非 list（comfy/dense）ブロックへの挿入（現状 L82-115 の `else` 分岐内）:

1. **business summary 行**（`meta` の `<ul data-role="meta">` 直後、status chip-row の前）:
```tsx
{member.businessSummary ? (
  <p data-role="biz-summary">{member.businessSummary}</p>
) : null}
```

2. **curated タグ chip 行**（status の `chip-row`（L108-114）に隣接して追加。tag は別 `ul[data-role="tag-row"]`）:
```tsx
{cardTags.length > 0 ? (
  <ul data-role="tag-row">
    {cardTags.map((t) => (
      <li
        key={t.code}
        data-role="tag-chip"
        data-tone={t.isPhase ? phaseTone(t.code) : "stone"}
        data-phase={t.isPhase ? "true" : undefined}
      >
        {t.label}
      </li>
    ))}
  </ul>
) : null}
```

3. **list density**（L98-120 の isList ブロック）: business summary は**出さない**。tag は phase chip のみ（`cardTags` は `selectCardTags(...,"list")` で既に phase 1 件のみ）を既存 `chip-row` 末尾に少量追加するか、`tag-row` を list でも同 markup で描画。情報過多回避のため list の tag-chip は phase のみ。

4. **occupation 視認性（AC-6）**: markup（`<li data-role="occupation">` L84-89）は据置。強調は A5 CSS（`font-weight`/`color`）で実現。

> ⚠️ `member.businessSummary` / `member.tags` は zod optional。null/undefined ガードを `?` チェック・`selectCardTags` 内ガードで担保（[VSCPKR-03] 内部 state を持たず props 由来）。

### A3: `TagPicker.client.tsx`（修正・現状 L53）

import 追加:
```ts
import { normalizeTagLabel } from "../../lib/tags/tag-display";
```

L53 の `#{opt.label}` を置換:
```tsx
#{normalizeTagLabel(opt)} <span data-role="tag-count">({opt.count})</span>
```
`opt` は `{code,label,count}`（`TagPickerOption`）。`normalizeTagLabel` は `Pick<…,"code"|"label">` を受けるためそのまま渡せる。AC-7。

### A4: `members-search.ts` `toApiQuery`（修正・現状 L66-75）

末尾 `return params;` の直前に常時付与:
```ts
params.set("expand", "tags");
```
- `MembersSearch` 型 / `parseSearchParams` / schema は**変更不要**（URL から expand を受けない・内部固定）。
- 代替案（不採用）: schema に `expand: z.array(...)` 追加（URL 露出不要のため最小案を採る）。

### A4: `app/(public)/page.tsx`（修正・現状 L63）

```ts
listMembersRaw("limit=6&sort=recent&expand=tags", { revalidate: ... })
```
home は `listMembersRaw`（raw query）経由のため `toApiQuery` を通らない → query 文字列に直接 `&expand=tags` を含める（M-1 実測）。

### B3: `packages/shared/src/zod/viewmodel.ts`（修正・現状 L124-138 `.strict()`）

`PublicMemberListItemZ` の `tags` の後に追加:
```ts
    // public-home-card: list endpoint が businessOverview 先頭 1 行（cap120）を projection。.strict() のため optional 宣言必須。AC-5
    businessSummary: z.string().optional(),
```
⚠️ `.strict()` のため、これを**先に追加しないと** B1 が businessSummary を返した瞬間 `toPublicMemberListView` の `PublicMemberListViewZ.parse` が落ちる。→ 実装順序で B3 先行。

### B2: `public-member-list-view.ts`（修正・現状 L16-31 `PublicMemberListItemSource`）

`tags?` の後に追加:
```ts
  // public-home-card: businessOverview 先頭 1 行（use-case が cap 済み）。undefined のときキー無し。AC-5
  businessSummary?: string;
```
`stripForbidden`（L43-47）/ `toPublicMemberListView`（L49-62）は変更不要（businessSummary は forbidden でないため素通し → `.parse` で許容）。

### B1: `list-public-members.ts`（修正・現状 L29-36 / L38-46 / L118-135）

1. `SUMMARY_KEYS`（L29-36）に追加:
```ts
const SUMMARY_KEYS = [
  STABLE_KEY.fullName,
  STABLE_KEY.nickname,
  STABLE_KEY.occupation,
  STABLE_KEY.location,
  STABLE_KEY.ubmZone,
  STABLE_KEY.ubmMembershipType,
  STABLE_KEY.businessOverview, // public-home-card: 先頭1行を businessSummary に projection。AC-5
] as const;
```
→ L112 の `SUMMARY_KEYS.includes(stable_key)` filter を通過し取得対象になる（repository SELECT 変更不要）。

2. truncate helper（`parseJsonString` 付近・L38-56 に追加）:
```ts
const FIRST_LINE = /\r?\n/;
const BIZ_SUMMARY_MAX = 120;
/** businessOverview を先頭 1 行・trim・120 字 cap（超過時末尾 …）に整える。空は undefined。AC-5 */
const toBusinessSummary = (raw: string): string | undefined => {
  const first = raw.split(FIRST_LINE)[0]?.trim() ?? "";
  if (!first) return undefined;
  return first.length > BIZ_SUMMARY_MAX ? `${first.slice(0, BIZ_SUMMARY_MAX)}…` : first;
};
```

3. item 構築（L121-134）に追加（undefined のときキーを付けない spread）:
```ts
    const businessSummary = toBusinessSummary(
      parseJsonString(byKey.get(STABLE_KEY.businessOverview) ?? null),
    );
    items.push({
      memberId: m.member_id,
      // …既存フィールド…
      photoUrl: photoMap.get(m.member_id),
      ...(businessSummary ? { businessSummary } : {}),
      ...(wantTags ? { tags: tagsByMember?.get(m.member_id) ?? [] } : {}),
    });
```

- 入出力: 入力 = ParsedPublicMemberQuery + Deps / 出力 = `PublicMemberListResponse`。
- 副作用: D1 read のみ（既存 `listFieldsByResponseIds` の取得 key が増えるだけ・新 query なし）。
- エラーハンドリング: `parseJsonString` が空文字 → `toBusinessSummary` が `undefined` → キー非付与。`.strict()` zod で最終 fail-close。

### A5: `legacy-public.css`（修正・`[data-component="member-card"]` ブロック L1483-1601 付近）

Phase 2 §2.6 の CSS を既存トークンのみで追記（HEX 禁止 AC-8）。既存 chip（`[data-role="zone"]`/`[data-role="status"]` 付近）の inline-flex/padding/radius を tag-chip に踏襲。`tag-row` は flex-wrap。`biz-summary` は `-webkit-line-clamp:2`。`[data-role="occupation"]` に font-weight/color。dense/list は density セレクタで gap 調整。

## 5.3 実装順序（依存）

[Feedback RT-03] 依存順序を厳守。

1. **B3（zod）先行**: `PublicMemberListItemZ` に `businessSummary` 追加 → `packages/shared` ビルド。これがないと B1/B2 の view parse が落ちる。
2. **A1（util）**: `tag-display.ts` 新規（他 web lane の import 元）。
3. **A/B 並列**:
   - Lane A: A2（MemberCard）/ A3（TagPicker）/ A4（wiring）/ A5（CSS）
   - Lane B: B1（list projection）/ B2（view-model 型）
4. **validation lane（直列で締め）**: typecheck → lint → verify:tokens → vitest。

## 5.4 ローカル実行・検証コマンド

```bash
mise exec -- pnpm install                  # worktree 依存（前提）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens            # HEX 直書き 0 件（AC-8）
# web test
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/tags apps/web/src/components/public
# api test
cd apps/api && mise exec -- pnpm exec vitest run src/use-cases/public --root ../..
# api diff が projection のみ（AC-9）
git diff --name-only -- apps/api packages/shared apps/web
```

## 5.5 DoD（Definition of Done）

| # | 条件 | 確認手順 |
| --- | --- | --- |
| D-1 | ビルド成功 | `pnpm typecheck` exit 0 / `pnpm lint` exit 0 |
| D-2 | focused vitest pass | §5.4 の web/api vitest 全 pass（Phase 4 全 TC GREEN） |
| D-3 | HEX 0 件 | `pnpm verify:tokens` green（AC-8） |
| D-4 | api diff は projection のみ | `git diff -- apps/api` が `SUMMARY_KEYS`/`toBusinessSummary`/item 付与/view-model 型のみ。新 endpoint・migration・repository SELECT 変更なし（AC-9） |
| D-5 | migration 追加 0 | `apps/api/migrations/` に新ファイルなし（AC-9） |
| D-6 | AC-1..AC-9 達成 | 下表の trace 全行を確認 |

### AC trace（Phase 5）

| AC | 実装根拠 |
| --- | --- |
| AC-1 | A1 `normalizeTagLabel` + A2/A3 適用 |
| AC-2 | A1 `selectCardTags`（HIDDEN_CATEGORIES + CARD_CATEGORY_ORDER） |
| AC-3 | A4 `toApiQuery` `expand=tags` + page.tsx raw query（M-1） |
| AC-4 | A2 tag-row + `phaseTone` + density 別件数 + A5 強調 CSS |
| AC-5 | B1 `toBusinessSummary` + B2 source 型 + B3 zod optional + A2 biz-summary 行 + A5 line-clamp |
| AC-6 | A2 occupation 据置 + A5 強調 / region 除外（AC-2 と同 util）/ list business summary 非表示 |
| AC-7 | A3 TagPicker `normalizeTagLabel` |
| AC-8 | A5 既存トークンのみ・`verify:tokens` |
| AC-9 | D-4 / D-5（projection のみ・surface 不変） |

## Canonical Compliance Addendum

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- workflow_state: `implemented_local_evidence_captured`

## 目的

本 Phase の上部本文を正本とし、AC-1..AC-9 を実コード・テスト・証跡へ接続する。

## 実行タスク

- [x] Phase 本文の該当タスクを完了
- [x] 実装対象・検証対象を AC trace に接続
- [x] Phase 12 / artifacts の状態語彙と整合

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`

## 成果物/実行手順

本ファイル本文の手順と `artifacts.json.metadata.verify_commands` を正本とする。実装済み成果物は `apps/web` / `apps/api` / `packages/shared` と Phase 11 / 12 outputs に反映済み。

## 完了条件

- [x] AC trace が維持されている
- [x] focused tests が PASS している
- [x] Phase 11 local visual evidence が存在する
- [x] Phase 12 strict 7 が存在する

## 統合テスト連携

focused Vitest 6 files / 50 tests PASS を主証跡とし、typecheck / lint / verify:tokens / verify:phase12-compliance / gate-metadata を全体 gate とする。

