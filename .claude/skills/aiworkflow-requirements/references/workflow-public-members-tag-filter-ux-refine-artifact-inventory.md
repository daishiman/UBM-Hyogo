# workflow-public-members-tag-filter-ux-refine Artifact Inventory

## Summary

| Item | Value |
| --- | --- |
| workflow | `public-members-tag-filter-ux-refine` |
| status | `implemented_local_runtime_pending / implementation / VISUAL` |
| workflow root | `docs/30-workflows/completed-tasks/public-members-tag-filter-ux-refine/` |
| surface | public `/members` |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/web/src/styles/legacy-public.css` | tag picker options flex-wrap, filter group rhythm, comfy grid token gap |
| `apps/web/src/styles/globals.css` | selected tag pill `[aria-checked="true"]` accent styling |
| `apps/web/src/components/public/MemberFilters.client.tsx` | input filter group wrapper |
| `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx` | tag picker DOM/aria regression |
| `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | filter group regression |

## Evidence

| Evidence | Status |
| --- | --- |
| focused Vitest 5 files / 28 tests | PASS |
| web typecheck | PASS |
| web lint | PASS |
| root `pnpm verify:tokens` | PASS |
| local static visual screenshots 5 PNG | present |
| staging data-backed screenshots | pending user gate |

## Invariants

- `apps/api`, `packages/shared`, D1 migrations, and Google Form specs unchanged.
- Existing `GET /public/members` surface and `topTags` shape unchanged.
- No new primitive under `apps/web/src/components/ui/`.
- Commit, push, PR, and staging screenshot capture remain user-gated.

## Lessons Learned

- L-PMF-001: 「UI が見にくい」という観察起点の報告は、短絡的な API/機能追加に向かわず、まず実コードを Read して表現層（CSS）の欠落を主因確定する。本件の真因は `[data-role="tag-picker-options"]` に `display` 系ルールが無く HTML block flow で `<li>` が縦積みになっていたこと。データ・API（`topTags = aggregateTopTags()`）の無罪は grep + Read で裏取りしてから設計に入る（API/D1/Form 非変更を確定 → INV-4）。
- L-PMF-002: `implemented_local_runtime_pending` VISUAL workflow では local static screenshot と staging runtime screenshot の境界を明示する。local PNG が実在する場合は Phase 11 evidence inventory を `present` とし、`outputs/phase-11/metadata.json` の `status: local_static_visual_present_staging_pending` / `evidenceType: local-static-visual` と parity を取る。strict 7 outputs は staging runtime PASS を意味せず「local 実装 + static visual + staging pending 境界」の自己診断証跡である。
- L-PMF-003: 主因調査中に発見した既存バグ（選択強調セレクタ `aria-selected` ↔ markup `aria-checked` の不一致）は、機能不変・見た目のみ改善（INV-7）に整合する範囲なら同サイクルで併せて是正すると UX 改善の完成度が上がる。
- L-PMF-004: UI 表現層のみの改修（CSS + 最小 markup・公開 surface 不変）では Phase 12 Step 2（ドメイン正本反映）を **N/A 判定**として根拠付きで明記する。`docs/00-getting-started-manual/specs/*.md` は API contract / schema / auth / page surface を記述対象とするため、見た目の並べ方（CSS）変更は反映対象外。判定根拠は task-spec-creator `phase-template-phase12.md` の「不変条件 #1〜#7 に touch するか」フローと一致。
- L-PMF-005: スコープ外項目（category 別グルーピング表示 / タグ検索ボックス / カード全面刷新）は「先送り」ではなく「YAGNI による非起票 baseline」として理由付きで記録し、CONST_007（1 サイクル完結・先送り 0）と整合させる。category 別表示は flat `topTags` を category 軸で束ねる API/schema 拡張が必要で INV-4 違反のため非起票。
- L-PMF-006: skill 同期 wave で artifact-inventory の `## Lessons Learned` セクションは最も欠落しやすい（本件も初回作成時に欠落・後続検証で補完）。task-spec-creator 側の「UI 表現層 = Step 2 N/A」「VISUAL close-out 再分類」は既存 `phase-template-phase12.md` / SKILL-changelog でカバー済みのため、SSOT インフレ回避で references への新規追記はしない。検証では「同期漏れ補完」と「重複追記回避」を両立させる。
