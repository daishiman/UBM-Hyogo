# _shared-context（Phase 4-13 spec エージェント共有正本）

> このファイルは並列 spec エージェントが Phase 4-13 を一貫して書くための grounded facts。
> 推測で書かず、ここの事実とコードの実 line を根拠にすること。

## task メタ

- task_id: `public-home-member-card-info-and-tag-clarity`
- workflow root: `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/`
- 実装区分: 実装仕様書 / taskType: implementation / visualEvidence: **VISUAL** / mode: edit / status: **spec_created**
- このプロンプトでは **コード実装はしない**。仕様書内に実装手順を書く。

## Acceptance Criteria（Phase 1 正本・全 Phase で trace）

- **AC-1**: interest タグ label を **web 表現層**で矢印表記へ正規化表示（`int_0to1→0→1` / `int_1to10→1→10` / `int_10to100→10→100`、code 駆動・label fallback）。API/D1/seed 非変更。
- **AC-2**: タグ表示に **category 優先度・フィルタ**を導入。表示優先 = `interest`（事業フェーズ）> `business`（業種）> `skill`（スキル）。**`region` / `role` / `status` カテゴリのタグはカード非表示**（status は既存 `ubmMembershipType` chip と重複するため除外）。
- **AC-3**: home `/` と `/(public)/members` の `listMembers` 呼び出しで **`expand=tags` を有効化**（`members-search.ts` に `expand` を足し、`toApiQuery` で付与。デフォルトで tags 取得）。
- **AC-4**: `MemberCard` に **curated タグ chip 行**を追加。事業フェーズ chip を最優先・強調表示。表示件数 = comfy: フェーズ + 最大 3 件 / dense: 最大 2 件 / list: フェーズ chip のみ（無ければ非表示）。**既存 `Chip`/`Badge` を流用し新規 primitive を作らない**。
- **AC-5**: list endpoint に **`businessSummary`**（`businessOverview` の先頭 1 行・server 側 cap **120 文字**）を追加。`PublicMemberListItem` zod に **optional** `businessSummary` を追加。`MemberCard`（comfy/dense）に business summary 行を `line-clamp: 2` で表示。**既存 `response_fields` カラム由来・新 endpoint / schema 変更なし**。
- **AC-6**: `occupation` の視認性を上げ、`region` タグをカードから排除して **情報過多を回避**（塩梅）。
- **AC-7**: `TagPicker.client.tsx` の topTags chip 表示にも **同じ正規化 util** を適用（ユーザーが「0 to 1」を見た箇所＝topTags フィルタ chip を網羅）。
- **AC-8**: **OKLch トークン正本・HEX 直書き禁止**（`verify:tokens` gate green）。CSS は `legacy-public.css` の `[data-component="member-card"]` ブロックへ既存トークンで追記。
- **AC-9**: **既存 API endpoint surface のみ**。新 endpoint 追加・D1 schema 変更・Google Form 変更なし。Lane A（apps/web）+ Lane B（apps/api list projection + packages/shared zod）の **1 実装サイクルで完結**（CONST_007）。

## Lane topology

| Lane | 責務 | 変更ファイル |
| --- | --- | --- |
| **A1 util** | `tag-display.ts` 新規: `normalizeTagLabel(tag)` / `selectCardTags(tags, density)` / category 優先・除外 | `apps/web/src/lib/tags/tag-display.ts`（新規） |
| **A2 card** | MemberCard に curated tag chip 行 + business summary 行 + occupation 強調 | `apps/web/src/components/public/MemberCard.tsx` |
| **A3 picker** | TagPicker の topTags label を normalizeTagLabel で表示 | `apps/web/src/components/public/TagPicker.client.tsx` |
| **A4 wiring** | `expand=tags` 有効化 | `apps/web/src/lib/url/members-search.ts`, `apps/web/src/lib/api/public.ts`, `apps/web/app/(public)/page.tsx`, `apps/web/app/(public)/members/page.tsx` |
| **A5 css** | カード tag chip 行 / business summary line-clamp CSS | `apps/web/src/styles/legacy-public.css` |
| **B1 api** | `SUMMARY_KEYS` に `businessOverview` 追加 + `businessSummary` truncate（先頭行・120字） | `apps/api/src/use-cases/public/list-public-members.ts` |
| **B2 vm** | view-model source/型に `businessSummary` 追加 | `apps/api/src/view-models/public/public-member-list-view.ts` |
| **B3 shared** | `PublicMemberListItemZ` に optional `businessSummary` | `packages/shared/src/zod/viewmodel.ts` |

依存: B3（zod 型）を先に確定すれば A2（カード表示）と B1（projection）は並行可能。1 サイクル内。

## 確定 grounded facts（実コード line）

### apps/web/src/components/public/MemberCard.tsx（現状）
- `PublicMemberListItem` を props（L9, L13-16）。density = comfy|dense|list（L11）。
- **タグを一切描画していない**。comfy/dense: head(Avatar+identity+zone chip) → `ul[data-role="meta"]`(occupation/location) → `div[data-role="chip-row"]`(status chip)。list: avatar / identity / chip-row(zone+status) / location / row-action。
- zone chip: `<span data-role="zone" data-tone={zoneTone(zone)}>{zone}</span>`（L52-57）。status: `statusTone(status)`（L76-80, L109-113）。
- `Avatar`/`Icon` を `../ui/` から import。`statusTone, zoneTone` を `../../lib/tones` から。

### apps/web/src/lib/tones.ts
- `ChipTone` union = stone|warm|cool|green|amber|red|neutral|success|warning|danger|info（L3-14）。
- `zoneTone(zone)`: `0_to_1`→cool / `1_to_10`→warm / `10_to_100`→amber / else stone（L16-21）。
- `statusTone(status)`: member→green / academy→cool / else stone（L23-27）。
- ⚠️ 新たな tone は足さない。phase chip の色分けは既存 tone（info/accent 相当＝cool/warm/amber 等）を流用。

### apps/web/src/components/ui/Chip.tsx
- `ChipProps { tone?: ChipTone; dot?: boolean; children }`。`<span data-tone data-dot className="ui-chip">`。新規 primitive は作らず Chip を流用してよい（ただし MemberCard は現状 chip を素の `<span data-role>` で書いているため、既存 markup 流儀に合わせて `data-role` span でも可。新規 primitive を生やさないことが必須条件）。

### apps/web/src/lib/api/public.ts
- `listMembers(search, options)`（L51-62）: `toApiQuery(search)` → `/public/members?qs`。`expand` は付かない。
- `listMembersRaw(query, options)`（L64-74）: raw query 文字列を直接渡す。home `/` がどちらを使うかは `app/(public)/page.tsx` を確認。

### apps/web/src/lib/url/members-search.ts
- `membersSearchSchema`（L25-32）: q/zone/status/tag/sort/density。`expand` 無し。
- `toApiQuery(search)`（L66-75）: 初期値を省略しつつ URLSearchParams 構築。ここに `expand=tags` を足す（常時 or デフォルト）。
- ⚠️ `MembersSearch` 型に expand を足すと parseSearchParams（L40-60）も更新が要る。デフォルト `["tags"]` 固定でよい（URL から expand を受ける必要は無い → schema に内部デフォルトとして持つ or toApiQuery で常時 append が最小）。**最小案: `toApiQuery` で常に `params.set("expand","tags")` を append**（schema 変更不要）。spec ではこの最小案を第一候補とし、members-search schema 拡張は代替案として記す。

### apps/api/src/use-cases/public/list-public-members.ts
- `SUMMARY_KEYS`（L29-36）= fullName/nickname/occupation/location/ubmZone/ubmMembershipType。← ここに `STABLE_KEY.businessOverview` を追加。
- `listFieldsByResponseIds` で取得後 L112 で `SUMMARY_KEYS.includes(stable_key)` filter → **businessOverview を SUMMARY_KEYS に足すだけで取得対象になる**（repository SELECT 変更不要）。
- item 構築は L118-135。`businessSummary: truncateSummary(parseJsonString(byKey.get(businessOverview)))` を追加。truncate helper（先頭改行まで→trim→120字 + 末尾省略記号）を use-case 内 or view-model に定義。
- `expand=tags` 判定は `query.expand.includes("tags")`（L88）で既存実装済み。
- ⚠️ **visibility 確認**: businessOverview は `ubm_profile` セクションの public 項目（`01-api-schema.md`）。list が response_fields を直読みするため、businessOverview が visibility=public であることを前提に公開してよい（詳細 endpoint も公開済み）。spec にこの前提チェックを明記。

### packages/shared/src/zod/viewmodel.ts
- `PublicMemberTagZ`（L117-121）= { code, label, category }.strict()。
- `PublicMemberListItemZ`（L124-138）.strict(): memberId/fullName/nickname/occupation/location/ubmZone(nullable)/ubmMembershipType(nullable)/photoUrl(optional url)/tags(optional array)。← **optional `businessSummary: z.string().optional()` を追加**（.strict() なので zod 追加必須・未追加だと parse 落ちる）。

### tag_definitions（D1 / apps/api/migrations/0004_seed_tags.sql）
- category: business(10) / skill(10) / interest(5: 0to1,1to10,10to100,DX,グローバル) / region(8: 神戸,西宮,姫路,阪神,…) / role(5) / status(3)。
- interest code: `int_0to1` label `0to1`、`int_1to10` label `1to10`、`int_10to100` label `10to100`。← AC-1 正規化対象。
- region code: `region_*`（例 `region_hanshin` 阪神）。← AC-2 カード非表示対象。

### デザイン正本 / primitive
- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx`（カードにタグ chip slice 表示 L154-205）、`styles.css` `.chip`（L358-390）。
- トークン: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/09b-design-tokens.md`（info=0→1, accent=1→10, ok=10→100 の zone alias）。
- 既存 primitive: `apps/web/src/components/ui/Chip.tsx`, `Badge.tsx`。**新規 primitive 禁止**。
- カード CSS 正本: `apps/web/src/styles/legacy-public.css` の `[data-component="member-card"]`（L1483-1601 付近）。globals.css L1764-1778 に focus 系。

## 検証コマンド（spec_created / 実装は後続）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens                       # HEX 直書き 0 件
git diff --name-only -- apps/api apps/web packages/shared
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity
pnpm verify:phase12-compliance
pnpm gate-metadata:validate --require-gates-for-changed docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/artifacts.json docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/outputs/artifacts.json
```

⚠️ web vitest は repo root が `.` なのでフルパス + `--root=.`。api vitest は `cd apps/api && pnpm exec vitest run src/... --root ../..`。

## 文体・形式ルール

- 日本語。各 Phase 冒頭に「Phase 目的」「入力」「出力」を置く。
- 実装仕様書なので CONST_005 必須項目（変更ファイル / シグネチャ / 入出力・副作用 / テスト / 実行コマンド / DoD）を Phase 4・5 で必ず埋める。
- AC-1..AC-9 への trace を各 Phase に明記。
- 既存コードの命名規則（camelCase 関数 / kebab-case ファイル / `data-role` 属性）に合わせる。
