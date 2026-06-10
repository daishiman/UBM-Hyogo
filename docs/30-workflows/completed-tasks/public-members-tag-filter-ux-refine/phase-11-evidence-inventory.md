# Phase 11: 手動テスト検証

| 項目 | 値 |
|------|-----|
| Phase | Phase 11 — Evidence Inventory |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `local_evidence_present_runtime_visual_pending`（local static screenshot present・staging runtime screenshot pending） |
| taskType | `implementation`（UI 表現層改善） |
| visualEvidence | `VISUAL` |
| relatedIssue | `null` |
| 正参照 | [`_shared-context.md`](./_shared-context.md) / [`phase-02-design.md`](./phase-02-design.md) |

> 本 Phase の全記述は `_shared-context.md`（特に §7 証跡境界）を正本とし、矛盾してはならない。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 実行タスク

- Phase 11 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
- `_shared-context.md` の AC / INV / 変更対象と矛盾しないことを確認する。

## 参照資料

- `_shared-context.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル
- 対応する `apps/web` / `outputs/` / skill 正本同期の実変更

## 完了条件

- [x] 必須見出しを満たす
- [x] 4条件（矛盾なし・漏れなし・整合性あり・依存関係整合）に反しない

## 統合テスト連携

- focused Vitest / typecheck / lint / token gate の結果を Phase 11 evidence と Phase 12 compliance に同期する。
<!-- validator-facing required sections: end -->

## 目的

公開メンバー一覧 `/members` のタグ絞り込み UI/UX 改善（タグ chip 横並び化 + フィルタ領域グルーピング + 選択強調是正 + member-grid 過密緩和）について、受入条件 AC-1〜AC-11 を裏付ける **証跡（evidence）の所在と staging runtime の残境界**を定義する。

本サイクルは `implemented_local_runtime_pending` であり、コード差分・focused Vitest・typecheck・lint・token gate・local static screenshot PNG は生成済みである。staging data-backed runtime screenshot は未取得であり、user-gated として残す。

## 0. screenshot_mode

`VISUAL`。本タスクは公開ページ `/members` の見た目（タグ chip の配置・フィルタ領域の階層・グリッド余白）を変更するため、視覚回帰を screenshot で裏付ける必要がある。

Current status: `local_static_visual_present_staging_pending`。local static screenshot 5 件は取得済みであり、正本は `outputs/phase-11/metadata.json`（`status: "local_static_visual_present_staging_pending"`・5 件の `local-static-visual`）を参照する。staging runtime PASS は本サイクルでは主張しない。

## 1. capture 戦略

- local static screenshot は localhost `/members` 上で tag fixture を注入して取得済み。現在の API response が `topTags` を返さなかったため、配置・選択強調・mobile wrap の視覚契約を local static evidence として固定した。
- staging data-backed screenshot 取得は user-gated（実装完了後の staging 上で実行）。
- 撮影対象 route は `/members`（公開メンバー一覧）の 1 ルート。状態（state）別に複数 screenshot を取得する。
- 取得済み screenshot のファイル名・route・state は `outputs/phase-11/metadata.json` の `screenshots[]` を正本とする（本 inventory の §4 表と 1:1 対応）。
- 配置: `docs/30-workflows/completed-tasks/public-members-tag-filter-ux-refine/outputs/phase-11/screenshots/`
- metadata: `outputs/phase-11/metadata.json` に `{ tc, route, state, filename, evidenceType, capturedAt }`（作成済・status=local_static_visual_present_staging_pending）。

## 2. NON_VISUAL 代替検証（取得済み）

VISUAL screenshot に加え、DOM 構造・既存挙動回帰・トークン遵守を機械検証で裏付ける。staging visual は未実行だが、local verification は取得済み。

| 検証 | 対象 | 取得 Phase | 本サイクル status |
|------|------|-----------|------------------|
| `typecheck` | `apps/web`（型変更ゼロを確認） | Phase 7 / 9 | present |
| `lint` | `apps/web` | Phase 9 | present |
| vitest（focused） | `TagPicker.client.spec.tsx` / `MemberFilters.client.spec.tsx` / `MemberGrid.spec.tsx` / `MemberCard.spec.tsx` / `members/page.spec.tsx` | Phase 6 / 7 | present |
| `verify:design-tokens` | HEX/任意色 0 件（AC-6） | Phase 9 | present |
| `git diff --name-only` | `apps/api` / `packages/shared` / D1 / Form 差分 0（AC-8） | Phase 9 | present |
| 新規 primitive grep | `apps/web/src/components/ui/` 追加 0（AC-7） | Phase 9 | present |

## 3. fixture / preconditions

- TC-1〜TC-3 / TC-5: `GET /public/members` が `topTags`（`{code,label,count}[]`）を複数件返す seed 状態で `/members` を表示。タグ chip が横並び・折り返しする件数（十数件想定）を確保。
- TC-4: モバイル viewport（`max-width: 640px`）でフィルタを展開（`expanded=true`）し、タグ chip が wrap する状態を撮影。
- TC-5: クエリ `?tag=<code>` で 1 件以上のタグを選択し、`aria-checked="true"` の accent 強調を確認。
- いずれも既存 API endpoint surface のみ利用（INV-1）。D1 / API / Form 変更なし（INV-4）。

## 4. Phase 11 evidence file inventory

> 下表は `verify-phase11-evidence-existence.ts` の parse 対象。local static screenshot 5 件と metadata は実在するため `present` とする。ファイル名・route・state は `outputs/phase-11/metadata.json` の `screenshots[]` と 1:1 対応する。

| # | Classification | Path | Status | route | state | tc |
|---|---------------|------|--------|-------|-------|----|
| 1 | screenshot | outputs/phase-11/screenshots/public-members-tag-filter-horizontal.png | present | /members | tag filter chips horizontal flex-wrap (after) | TC-1 |
| 2 | screenshot | outputs/phase-11/screenshots/public-members-filter-region-grouped.png | present | /members | filter region grouping (search/zone/status/tags) | TC-2 |
| 3 | screenshot | outputs/phase-11/screenshots/public-members-grid-spacing.png | present | /members | member grid spacing refined (comfy density) | TC-3 |
| 4 | screenshot | outputs/phase-11/screenshots/public-members-mobile-filter-tags.png | present | /members | mobile filter expanded + tags wrap | TC-4 |
| 5 | screenshot | outputs/phase-11/screenshots/public-members-tags-selected.png | present | /members | selected tags highlighted (aria-checked=true) | TC-5 |
| 6 | metadata | outputs/phase-11/metadata.json | present | /members | local static visual present + staging runtime pending | all |

> screenshot 5 件は AC-1（横並び）/ AC-2（グルーピング）/ AC-4（grid 余白）/ AC-9（モバイル wrap）/ AC-3（選択強調）に対応。metadata.json は local static evidence の正本であり、staging runtime screenshot は `screenshot-plan.json` に pending として残す。

## 5. 完了条件

- [x] `## 目的` 見出しを冒頭に配置
- [x] screenshot_mode = VISUAL・current status = local_static_visual_present_staging_pending を明記
- [x] `## 4. Phase 11 evidence file inventory` に Path 列を持つ表を配置・local static screenshot rows `present` / staging runtime remains pending
- [x] tc / route / filename を `outputs/phase-11/metadata.json` と 1:1 対応
- [x] NON_VISUAL 代替検証（typecheck/lint/vitest/verify-design-tokens）を取得済みとして列挙
- [x] staging screenshot pending と local static visual present の境界を明記（§0 / §7 証跡境界）
