# 実装ガイド — 公開ホーム メンバーカード 情報設計 & タグ明瞭化

- task_id: `public-home-member-card-info-and-tag-clarity`
- status: **implemented_local_evidence_captured**（実コード実装・focused tests・local visual PNG・Phase 12 同期まで完了。staging screenshot / commit / push / PR は user-gated）

---

## Part 1: 中学生にも分かる説明（専門用語なし・日常の例え話）

### 何を直すの？

会員サイトのトップページには、人ごとに「名刺カード」のようなものが並んでいます。
今このカードを見ても、**その人が何をやっている人なのかがよく分かりません**。

困りごとは 4 つあります。

1. カードに「何をやっているか」がほとんど書いていない。名前と顔写真と住んでいる地域くらい。
2. 事業の段階を表す札（ふだ）に「0 to 1」と英語っぽく書いてある。本当は矢印で「0→1」と書きたい。
   （これは「ゼロから 1 を作る、立ち上げ期」という意味の合言葉です。）
3. 「阪神に住んでいる」みたいな**地域の札はどうでもいい**のに、目立つ場所に出てしまっている。
4. 結果として、名前・顔・何をやっているか、がパッと分かりません。

### どう直すの？

カードを「名刺」だと思ってください。今の名刺には住所しか書いていない状態です。
そこに次の 3 つを足して、いらない地域の札をはがします。

1. **事業の段階の札**（0→1 / 1→10 / 10→100 のどれか）を一番目立つ色で 1 つ出す。
   - 「0→1」=これから始める段階、「1→10」=広げる段階、「10→100」=大きくする段階、というイメージ。
2. **業種やスキルの札**を数個だけ出す（多すぎると読む気がなくなるので 2〜3 個まで）。
3. **事業の一言説明**（その人が書いた事業概要の最初の 1 行・長すぎたら 120 文字で切る）を出す。
4. **地域の札ははがす**（カードには出さない）。

そして「0 to 1」という見た目だけを、表示するときに「0→1」へ自動で書き換えます。
中身のデータは変えません。**眼鏡をかけ替えて見え方だけ整える**イメージです。

### なぜデータ自体を直さないの？

データを直すと、間違えたときに全員に影響します。
今回は「見せ方」だけの問題なので、**表示する瞬間だけ書き換える**方が安全です。
これは料理に例えると、材料（データ）はそのままで、お皿への盛り付け方（表示）だけ変えるのと同じです。

### 確認の仕方（実装が終わったあと）

トップページを開いて、カードに事業段階の札・業種の札・一言説明が出ていて、
地域の札が消えていて、札の表記が「0→1」になっていれば成功です。

---

## Part 2: 技術者向け（型 / シグネチャ / API / エラーハンドリング / 定数）

> 識別子は Phase 2 設計（`phase-2-design.md`）の実シグネチャから引用。手書き drift を避けるため、実装時はこの定義に揃える。

### Lane A1 — `apps/web/src/lib/tags/tag-display.ts`（新規・純関数）

```ts
import type { PublicMemberTag } from "@ubm-hyogo/shared"; // { code; label; category }

// AC-1: code 駆動の矢印正規化。未知 code は label をそのまま返す（fallback）。
const TAG_LABEL_OVERRIDES: Record<string, string> = {
  int_0to1: "0→1",
  int_1to10: "1→10",
  int_10to100: "10→100",
};
export function normalizeTagLabel(tag: Pick<PublicMemberTag, "code" | "label">): string {
  return TAG_LABEL_OVERRIDES[tag.code] ?? tag.label;
}

// AC-2: カード表示の category 優先度（小さいほど先頭）。
const CARD_CATEGORY_ORDER: Record<string, number> = { interest: 0, business: 1, skill: 2 };
const HIDDEN_CATEGORIES = new Set(["region", "role", "status"]); // AC-2/AC-6

export interface CardTag { code: string; label: string; category: string; isPhase: boolean; }

// AC-2/AC-4: density に応じた curated タグ選抜・整列。
export function selectCardTags(
  tags: readonly PublicMemberTag[] | undefined,
  density: "comfy" | "dense" | "list",
): CardTag[];

// AC-4/AC-8: 既存 ChipTone のみを返す（新 tone 禁止）。
export function phaseTone(code: string): "cool" | "warm" | "amber" | "stone";
```

- `selectCardTags` 件数規約: `list` = phase 最大 1 件のみ / `dense` = phase 1 + business/skill 最大 2 件 / `comfy` = phase 1 + 最大 3 件。
- 整列: `CARD_CATEGORY_ORDER` 昇順 → 同 category は `code.localeCompare` 昇順（M-3: 件数順は YAGNI）。
- 副作用なし（純関数）。`tags` が undefined / 空配列なら `[]` を返す。

### Lane A2 — `MemberCard.tsx`

- props は `PublicMemberListItem`（optional `businessSummary` / optional `tags`）。density = `comfy | dense | list`。
- comfy/dense: `head` 後に `member.businessSummary` がある時のみ `<p data-role="biz-summary">`。`chip-row` に `selectCardTags(member.tags, density)` の結果を `<ul data-role="tag-row"><li data-role="tag-chip" data-tone=... data-phase=...>` で描画。
- phase chip: `data-tone={phaseTone(t.code)}` / `data-phase="true"`。非 phase: `data-tone="stone"`。
- list: phase chip のみを既存 `chip-row` に少量追加。business summary は非表示。
- **エラーハンドリング / ガード**: `member.businessSummary` / `member.tags` は optional のため null/undefined ガード必須（`cardTags.length > 0` / `member.businessSummary ?` 三項）。新規 primitive を作らず既存 `data-role` span 流儀に合わせる（AC-4 / 不変条件 #3）。

### Lane A3 — `TagPicker.client.tsx`

- topTags chip の `#{opt.label}` を `#{normalizeTagLabel({ code: opt.code, label: opt.label })}` に置換（AC-7）。`opt` は `{code,label,count}`。

### Lane A4 — expand=tags wiring（AC-3・最小案）

- `apps/web/src/lib/url/members-search.ts` の `toApiQuery(search)` 末尾で `params.set("expand", "tags")` を常時付与。
  - `MembersSearch` 型 / `parseSearchParams` / schema は変更不要（URL から expand を受けない）。
- `app/(public)/page.tsx` が `listMembers` か `listMembersRaw` かを実装時に grep 確認（M-1）。`listMembersRaw` 経由なら query 文字列側に `expand=tags` を含めるか `listMembers` へ寄せる。

### Lane B1/B2/B3 — businessSummary projection（AC-5）

`packages/shared/src/zod/viewmodel.ts`（依存順序: 最初に確定）:

```ts
// PublicMemberListItemZ（.strict()）に追加。未追加だと API が business を返した瞬間 parse 落ち。
businessSummary: z.string().optional(),
```

`apps/api/src/use-cases/public/list-public-members.ts`:

```ts
const FIRST_LINE = /\r?\n/;
const BIZ_SUMMARY_MAX = 120;
const toBusinessSummary = (raw: string): string | undefined => {
  const first = raw.split(FIRST_LINE)[0]?.trim() ?? "";
  if (!first) return undefined;
  return first.length > BIZ_SUMMARY_MAX ? `${first.slice(0, BIZ_SUMMARY_MAX)}…` : first;
};
```

- `SUMMARY_KEYS` に `STABLE_KEY.businessOverview` を追加 → L112 の `SUMMARY_KEYS.includes(stable_key)` filter を通過し取得対象になる（repository SELECT 変更不要）。
- item 構築に `businessSummary: toBusinessSummary(parseJsonString(byKey.get(STABLE_KEY.businessOverview) ?? null))`。undefined のときキーを付けない（spread）か view-model 側で落とす。
- `expand=tags` 判定は既存 `query.expand.includes("tags")`（L88）。
- **visibility 前提チェック（M-2）**: businessOverview は `ubm_profile` の public 項目。実装時に field schema で visibility=public を確認し、非 public なら projection しない分岐を入れる。

`apps/api/src/view-models/public/public-member-list-view.ts`:
- `PublicMemberListItemSource` 型に `businessSummary?: string` を追加し、view 変換で透過（undefined は出力しない）。

### Lane A5 — CSS（`apps/web/src/styles/legacy-public.css` / AC-8）

`[data-component="member-card"]` 配下に既存トークンのみで追記（HEX 禁止）:
- `[data-role="biz-summary"]`: `-webkit-line-clamp: 2` の 2 行 clamp、`var(--ubm-color-text-secondary)`。
- `[data-role="tag-row"]`: `display: flex; flex-wrap: wrap; gap: var(--ubm-space-1)`。
- `[data-role="tag-chip"][data-phase="true"]`: `font-weight: 600`（事業フェーズ強調）。
- `[data-role="occupation"]`: `font-weight: 500; color: var(--ubm-color-text-primary)`（AC-6 occupation 視認性）。
- 既存 `[data-role="zone"]` / `[data-role="status"]` の inline-flex/padding/radius を tag-chip に踏襲。

### 定数一覧

| 定数 | 値 | 所在 | 根拠 AC |
| --- | --- | --- | --- |
| `TAG_LABEL_OVERRIDES` | `{ int_0to1:"0→1", int_1to10:"1→10", int_10to100:"10→100" }` | `tag-display.ts` | AC-1/AC-7 |
| `CARD_CATEGORY_ORDER` | `{ interest:0, business:1, skill:2 }` | `tag-display.ts` | AC-2/AC-4 |
| `HIDDEN_CATEGORIES` | `{ region, role, status }` | `tag-display.ts` | AC-2/AC-6 |
| comfy 件数 | phase 1 + rest 3 | `selectCardTags` | AC-4 |
| dense 件数 | phase 1 + rest 2 | `selectCardTags` | AC-4 |
| list 件数 | phase 1 のみ | `selectCardTags` | AC-4 |
| `BIZ_SUMMARY_MAX` | `120` | `list-public-members.ts` | AC-5 |

### 検証コマンド（実装後）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/tags apps/web/src/components/public
cd apps/api && mise exec -- pnpm exec vitest run src/use-cases/public --root ../..
```

## 視覚証跡

- 本タスクは VISUAL。screenshot 計画は Phase 11（`../phase-11-manual-test.md` / `../phase-11/screenshot-plan.json`）を参照。
- local component harness の実 PNG は `outputs/phase-11/screenshots/member-card-home-comfy-with-tags.png` に取得済み。`businessSummary`、`0→1` phase chip、business/skill chip、region tag 非表示を確認した。
- staging screenshot は deploy 後・user-gated。追加取得予定の canonical は `member-card-tag-phase-emphasis.png` / `member-card-dense.png` / `member-card-list.png` / `tag-picker-arrow-normalized.png`。
