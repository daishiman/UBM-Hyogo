# Phase 2: 設計

- Phase 目的: util / コンポーネント / CSS / API projection / 型の設計と lane topology・既存コンポーネント再利用可否を固定する。
- 入力: Phase 1（AC-1..AC-9）、`_shared-context.md` の grounded facts。
- 出力: 本ファイル（実装の設計正本）。

## 2.0 既存コンポーネント再利用可否（FB-SDK-07-1）

| 必要物 | 既存流用 | 判定 |
| --- | --- | --- |
| タグ chip 表示 | `ui/Chip.tsx`（tone/dot）or 既存 `data-role` span 流儀 | **再利用**。新規 primitive を作らない（AC-4 / mvp-recovery 不変条件 #3） |
| tone 色 | `lib/tones.ts` の `ChipTone` union | **再利用**。新 tone は足さない |
| business summary clamp | CSS `line-clamp`（プロトタイプ `-webkit-line-clamp:2` 既存パターン） | **再利用** |
| expand=tags 取得 | API 実装済み | **再利用**（web wiring のみ） |
| businessOverview データ | 既存 response_fields カラム | **再利用**（projection 追加のみ） |

→ 新規実装は `tag-display.ts`（純関数 util）のみ。他は既存資産の接続・表現。

## 2.1 Lane A1 — `apps/web/src/lib/tags/tag-display.ts`（新規・純関数）

```ts
import type { PublicMemberTag } from "@ubm-hyogo/shared"; // { code; label; category }

/** interest タグ等の表示 label を正規化（矢印表記）。code 駆動・未知は label そのまま。 AC-1 */
const TAG_LABEL_OVERRIDES: Record<string, string> = {
  int_0to1: "0→1",
  int_1to10: "1→10",
  int_10to100: "10→100",
};
export function normalizeTagLabel(tag: Pick<PublicMemberTag, "code" | "label">): string {
  return TAG_LABEL_OVERRIDES[tag.code] ?? tag.label;
}

/** カード表示するタグの category 優先度（小さいほど先頭）。除外カテゴリは undefined。 AC-2 */
const CARD_CATEGORY_ORDER: Record<string, number> = {
  interest: 0, // 事業フェーズ（最優先・強調）
  business: 1, // 業種
  skill: 2,    // スキル
};
const HIDDEN_CATEGORIES = new Set(["region", "role", "status"]); // カード非表示 AC-2/AC-6

export interface CardTag { code: string; label: string; category: string; isPhase: boolean; }

/** density に応じて curated タグを選抜・整列して返す。 AC-2/AC-4 */
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
  // phase chip は別枠で常に先頭。残り business/skill を density で制限。
  const phase = visible.filter((t) => t.isPhase);
  const rest = visible.filter((t) => !t.isPhase);
  if (density === "list") return phase.slice(0, 1);
  const restLimit = density === "dense" ? 2 : 3;
  return [...phase.slice(0, 1), ...rest.slice(0, restLimit)];
}

/** phase chip の tone。既存 ChipTone を流用（新 tone 禁止）。 AC-4/AC-8 */
export function phaseTone(code: string): "cool" | "warm" | "amber" | "stone" {
  if (code === "int_0to1") return "cool";    // info 系（0→1）
  if (code === "int_1to10") return "warm";   // accent 系（1→10）
  if (code === "int_10to100") return "amber"; // ok 系（10→100）
  return "stone";
}
```

- 入力: タグ配列 + density。出力: 選抜済み `CardTag[]`。副作用なし（純関数）。
- 設計判断: **code 駆動**で正規化（label が将来変わっても安全）。除外は category ベース（region/role/status）。phase は category=interest を 1 件だけ強調枠に出す。

## 2.2 Lane A2 — `MemberCard.tsx` 改修

comfy/dense（非 list）レイアウトに以下を挿入:
1. `head` の後、`meta`(occupation/location) の前後に **business summary 行**（`member.businessSummary` があるとき）:
   ```tsx
   {member.businessSummary ? (
     <p data-role="biz-summary">{member.businessSummary}</p>
   ) : null}
   ```
2. status chip 行（`chip-row`）に **curated タグ chip** を追加。`selectCardTags(member.tags, density)` を使用:
   ```tsx
   {cardTags.length > 0 ? (
     <ul data-role="tag-row">
       {cardTags.map((t) => (
         <li key={t.code} data-role="tag-chip" data-tone={t.isPhase ? phaseTone(t.code) : "stone"} data-phase={t.isPhase ? "true" : undefined}>
           {t.label}
         </li>
       ))}
     </ul>
   ) : null}
   ```
- occupation 視認性（AC-6）: `meta` の occupation `<li>` に強調クラス（CSS で font-weight / color）。markup は据置で CSS のみで実現。
- list density: タグは phase chip のみ（`selectCardTags(..., "list")`）を既存 `chip-row` に少量追加。情報過多を避けるため business summary は list では非表示。
- ⚠️ `member.businessSummary` / `member.tags` は optional のため null/undefined ガード必須。

## 2.3 Lane A3 — `TagPicker.client.tsx`

topTags chip 表示で `#{opt.label}` を `#{normalizeTagLabel(opt)}` に置換（AC-7）。`opt` は `{code,label,count}` を持つので `normalizeTagLabel({code,label})` で適用可能。

## 2.4 Lane A4 — expand=tags wiring（最小案）

`toApiQuery`（`members-search.ts` L66-75）の末尾で常時付与:
```ts
params.set("expand", "tags");
```
- `MembersSearch` 型・`parseSearchParams`・schema は変更不要（URL から expand を受ける必要は無い）。
- home `/`（`app/(public)/page.tsx`）が `listMembers` 経由か `listMembersRaw` 経由かを実装時に確認。`listMembersRaw` の場合は呼び出し側 query 文字列に `expand=tags` を含める or `listMembers` へ寄せる。
- 代替案（不採用）: schema に `expand: z.array(...)` を足す。URL 露出が不要なため最小案を採る。

## 2.5 Lane B1/B2/B3 — businessSummary projection

- **B3 (`packages/shared/src/zod/viewmodel.ts`)**: `PublicMemberListItemZ`（.strict()）に `businessSummary: z.string().optional()` を追加。⚠️ .strict() なので**追加しないと API が business を返した瞬間 parse 落ち**。
- **B1 (`list-public-members.ts`)**:
  - `SUMMARY_KEYS` に `STABLE_KEY.businessOverview` を追加（L29-36）。→ L112 の filter を通過し取得対象になる。
  - truncate helper:
    ```ts
    const FIRST_LINE = /\r?\n/;
    const BIZ_SUMMARY_MAX = 120;
    const toBusinessSummary = (raw: string): string | undefined => {
      const first = raw.split(FIRST_LINE)[0]?.trim() ?? "";
      if (!first) return undefined;
      return first.length > BIZ_SUMMARY_MAX ? `${first.slice(0, BIZ_SUMMARY_MAX)}…` : first;
    };
    ```
  - item 構築（L121-134）に `businessSummary: toBusinessSummary(parseJsonString(byKey.get(STABLE_KEY.businessOverview) ?? null))` を追加。undefined のときキーを付けない（spread）か、view-model 側で落とす。
- **B2 (`public-member-list-view.ts`)**: `PublicMemberListItemSource` 型に `businessSummary?: string` を足し、view 変換でそのまま透過（undefined は出力しない）。
- **visibility 前提**: businessOverview は `ubm_profile` の public 項目。list が response_fields を直読みするため、visibility=public であることを実装時に field schema で確認（非 public の場合は projection しない分岐を入れる）。

## 2.6 Lane A5 — CSS（`legacy-public.css` カードブロック）

`[data-component="member-card"]` 配下に追記（既存トークンのみ・HEX 禁止 AC-8）:
```css
[data-component="member-card"] [data-role="biz-summary"] {
  font-size: var(--ubm-font-size-sm, 0.8125rem);
  color: var(--ubm-color-text-secondary);
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
  overflow: hidden;
}
[data-component="member-card"] [data-role="tag-row"] {
  display: flex; flex-wrap: wrap; gap: var(--ubm-space-1, 0.25rem);
  list-style: none; margin: 0; padding: 0;
}
[data-component="member-card"] [data-role="tag-chip"] { /* chip 既存トークン流用 */ }
[data-component="member-card"] [data-role="tag-chip"][data-phase="true"] { font-weight: 600; /* 事業フェーズ強調 */ }
[data-component="member-card"] [data-role="meta"] [data-role="occupation"] { font-weight: 500; color: var(--ubm-color-text-primary); }
```
- 既存 chip スタイル（`[data-role="zone"]`/`[data-role="status"]` L1582 付近）の inline-flex/padding/radius を tag-chip に踏襲。
- dense/list での gap・行折返しを density セレクタで調整。

## 2.7 lane topology / 並列度

- 直列ゲート: Phase 1→2→3。
- 実装並列（後続プロンプト）: B3（zod）を先に → A2/A1/A3/A5（web）と B1/B2（api）は並列可。validation lane（typecheck/lint/tokens/vitest）は直列で締める。
- SubAgent lane は 3 並列以下。

## 2.8 リスクと対策

| リスク | 対策 |
| --- | --- |
| `.strict()` zod に businessSummary 未追加で parse 落ち | B3 を最初に確定（依存順序明記） |
| businessOverview が長文で list payload 肥大 | server 側 120 字 cap + 先頭 1 行のみ |
| businessOverview が非 public | 実装時 field schema で visibility 確認・非 public なら projection しない |
| 新 tone 追加の誘惑 | phaseTone は既存 ChipTone のみ返す |
| list density で情報過多 | list は phase chip のみ・business summary 非表示 |

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

