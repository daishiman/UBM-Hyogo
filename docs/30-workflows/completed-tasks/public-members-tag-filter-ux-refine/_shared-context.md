# _shared-context.md — public-members-tag-filter-ux-refine

> 本ファイルは全 Phase / 全 Lane エージェントの**正参照（single source of truth）**。
> 各 Phase 仕様書はここに記載した調査結果・方針・AC・不変条件・変更ファイルと矛盾してはならない。

## 0. タスク要約

| 項目 | 内容 |
|------|------|
| workflow_id | `public-members-tag-filter-ux-refine` |
| 起点 | staging UI/UX 観察（ユーザー報告） |
| relatedIssue | `null`（Issue 紐付けなし。Refs 不要） |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| workflow_state | `implemented_local_runtime_pending`（ローカル実装・focused tests・local static visual evidence 取得済み。staging runtime visual は user-gated） |
| implementation_mode | `existing-hardening`（既存ページの UI 表現層改善） |
| branch | `feat/public-members-tag-filter-ux`（dev 完全同期上に作成） |
| 出力先 | `docs/30-workflows/completed-tasks/public-members-tag-filter-ux-refine/` |

### ユーザー報告（原文趣旨）
> staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members` ページで、絵（メンバーのアバター）と「タグで絞り込み」のタグが**縦に並んでいるため非常に見にくい**。UI・UX を整えてほしい。

### 確定方針（AskUser 2 問の回答）
- **スコープ**: タグ絞り込み UI の横並び化 **＋ 周辺レイアウト整え**（フィルタ領域全体の視覚整理 + メンバーグリッドの余白・階層調整）。ページ全体フルリライトはしない。
- **タグ UI 方式**: 既存 `tag-pill`（`role="switch"`）を維持しつつ **chip 群を横並び flex-wrap**（タグ数が多い場合は折り返し）。carousel / dropdown は採用しない。

## 1. 真の論点（Phase 1 で確定済の RCA）

**機能不足ではなく UI 表現層（CSS）の欠落。** 調査で実ファイルを Read して裏取りした事実:

- `apps/web/src/components/public/TagPicker.client.tsx`（L23-66）の
  `<ul data-role="tag-picker-options">` に **`display` 系 CSS が一切定義されていない** →
  HTML 既定の block flow で `<li>` が縦積みになり、tag-pill が縦に 1 個ずつ並ぶ。
- `apps/web/src/styles/globals.css` / `apps/web/src/styles/legacy-public.css` に
  `[data-role="tag-picker-options"]` のルールが **存在しない**（grep 確認済）。
- データ・API は無罪: `topTags` は `GET /public/members` の `aggregateTopTags()` から
  正常に返っており、`apps/api` / `packages/shared` / D1 / Google Form は変更不要。
  **解決は `apps/web` の UI 表現層（CSS + 最小 markup）のみで完結する。**

> Phase 1 は上記を実コード Read で再裏取りし、CSS 正本ファイル（globals.css か legacy-public.css か）を確定すること。

## 2. 対象コードマップ（調査で裏取り済・行番号は調査時点）

| 役割 | パス | 備考 |
|------|------|------|
| ルート本体 | `apps/web/app/(public)/members/page.tsx`（L1-135） | Server Component。MemberFilters / MemberGrid / DensityToggle をレンダー。`<main data-page="members" data-density>` |
| フィルタ親 | `apps/web/src/components/public/MemberFilters.client.tsx`（L1-219） | URL query 正本。mobile 展開のみ React state。検索 / Zone / Status Select / TagPicker を内包 |
| **タグ絞り込み（主因）** | `apps/web/src/components/public/TagPicker.client.tsx`（L1-67） | `<ul data-role="tag-picker-options">`（CSS 不在）/ `<button role="switch" aria-checked data-component="tag-pill">` |
| メンバーカード | `apps/web/src/components/public/MemberCard.tsx`（L1-125） | `data-role="head"` は grid `auto minmax(0,1fr)`。Avatar lg/md/sm |
| グリッド | `apps/web/src/components/public/MemberGrid.tsx` | density comfy/dense/list |
| Avatar | `apps/web/src/components/ui/Avatar.tsx` | size sm/md/lg/xl。photoUrl(presigned R2) or hue placeholder |
| CSS: tag-pill | `apps/web/src/styles/globals.css`（L1734-1760） | `[data-component="tag-pill"]` inline-flex / padding / border / aria-selected |
| CSS: tag-pill disabled | `apps/web/src/styles/globals.css`（L2334） | `button[aria-disabled="true"]` opacity / cursor |
| CSS: tag-picker wrapper | `apps/web/src/styles/legacy-public.css`（L1431-1441） | `[data-component="tag-picker"]` border-top / margin / padding + heading |
| CSS: member grid 密度 | `apps/web/src/styles/legacy-public.css`（L1449-1490） | `[data-component="member-grid"][data-density=...]` grid-template-columns |
| tokens | `apps/web/src/styles/tokens.css`（L1-180） | OKLch 正本。`--ubm-color-accent` 等。HEX 直書き禁止 |

### 既存 primitives（`apps/web/src/components/ui/`・PascalCase）
Avatar / Badge（tone: default\|accent\|success\|warning\|danger\|info, outline）/ Chip（ChipTone, dot）/ Card / Button / Select / Search / LinkPills。
**新規 primitive を追加してはならない（INV-6）。** 横並び化は CSS + 既存 data-* selector で実現する。

### データ shape（参考・変更不可）
`PublicMemberListView = { items: PublicMemberListItem[], pagination, topTags: {code,label,count}[] }`。
`topTags` がタグ chip の描画ソース。`GET /public/members?...&tag=...` の query で絞り込み（URL 正本）。

### 既存テスト（編集対象になり得る）
- `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx`（chip render / toggle / aria-disabled 上限 / empty option）
- `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx`
- `apps/web/src/components/public/__tests__/MemberGrid.spec.tsx`
- `apps/web/src/components/public/__tests__/MemberCard.spec.tsx`
- `apps/web/app/(public)/members/page.spec.tsx`

## 3. 不変条件（全 Phase 順守）

| ID | 条件 | 根拠 |
|----|------|------|
| INV-1 | 既存 API endpoint surface のみ利用、新 endpoint 追加禁止 | CLAUDE.md 重要な不変条件 / UI prototype alignment 不変条件 1 |
| INV-2 | OKLch トークン正本化（`tokens.css`）、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止 | UI prototype alignment 不変条件 2（`verify-design-tokens`） |
| INV-3 | `apps/web` から D1 直接アクセス禁止 | CLAUDE.md 重要な不変条件 5 |
| INV-4 | `apps/api/` / `packages/shared/` / D1 migration / Google Form を変更しない（UI 表現層のみ） | 本タスク RCA（API 無罪） |
| INV-5 | テストファイルは `*.spec.{ts,tsx}` のみ | CLAUDE.md 重要な不変条件 8 |
| INV-6 | 新規 primitive を生やさない（既存 `components/ui` + 既存 data-* で構成） | UI prototype alignment 不変条件 3 |
| INV-7 | `tag-pill` の `role="switch"` / `aria-checked` / トグル挙動 / 上限 hint / empty option を不変に保つ（機能温存・見た目のみ改善） | アクセシビリティ回帰防止 |

## 4. 受入条件（Acceptance Criteria）

| ID | 条件 | 検証方法 |
|----|------|---------|
| AC-1 | `[data-role="tag-picker-options"]` が `display:flex` + `flex-wrap:wrap` + `gap`（OKLch/space トークン経由）で tag-pill が**横並び**になり、縦積みが解消される。折り返し時の行間も適切 | Phase 4 CSS/DOM spec + Phase 11 screenshot |
| AC-2 | フィルタ領域（検索 / Zone / Status / タグ）がラベル・余白・区切りで視覚的にグルーピングされ、階層が明確になる | Phase 4 spec + Phase 11 screenshot |
| AC-3 | 選択中タグ（`aria-checked="true"`）の視覚強調が横並びでも判別可能（accent トークン） | Phase 4 spec |
| AC-4 | メンバーグリッド（`member-grid`）の列 / gap / カード余白が整理され過密感が解消（comfy/dense/list 3 密度を維持） | Phase 4 spec + Phase 11 screenshot |
| AC-5 | `tag-pill` の `role="switch"` / `aria-checked` / トグル / 上限 hint / empty option 挙動が不変（既存 spec が緑） | Phase 6 既存 spec 回帰 |
| AC-6 | 全色が OKLch トークン経由。`verify-design-tokens` が pass（HEX/任意色 0 件） | Phase 9 gate |
| AC-7 | 新規 primitive 追加 0（`apps/web/src/components/ui/` に新ファイルなし） | Phase 9 grep |
| AC-8 | `apps/api/` / `packages/shared/` / D1 migration / Google Form の差分 0 | Phase 9 `git diff --name-only` |
| AC-9 | レスポンシブ（モバイル: フィルタ折りたたみ + タグ横並び wrap / デスクトップ: 同様に wrap）で破綻なし | Phase 11 screenshot（mobile/desktop） |
| AC-10 | a11y 維持（既存 role/aria、フォーカス順序、コントラスト AA） | Phase 9 a11y チェック |
| AC-11 | `typecheck` / `lint` / 関連 vitest（TagPicker/MemberFilters/MemberGrid/MemberCard + 追加分）green、`bash scripts/verify-pr-ready.sh` pass | Phase 7 / Phase 9 |

## 5. 変更対象ファイル（実装済み）

| # | パス | 種別 | 主変更 |
|---|------|------|--------|
| 1 | `apps/web/src/styles/legacy-public.css` | 編集済み | `[data-role="tag-picker-options"]` に flex/flex-wrap/gap、`filter-group` グルーピング、member-grid comfy gap token 化 |
| 2 | `apps/web/src/styles/globals.css` | 編集済み | `tag-pill` 選択強調を `[aria-checked="true"]` に対応し accent token 化 |
| 3 | `apps/web/src/components/public/TagPicker.client.tsx` | 無変更 | 既存 `data-role="tag-picker-options"` / `role="switch"` / `aria-checked` / 上限 hint を維持（INV-7） |
| 4 | `apps/web/src/components/public/MemberFilters.client.tsx` | 編集済み（最小） | `filter-grid` + result count を `data-role="filter-group"` で包む。URL query 正本ロジックは不変 |
| 5 | `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx` | 編集済み | tag-picker options container と `aria-checked` 選択状態の assertion を追加 |
| 6 | `apps/web/src/components/public/__tests__/MemberFilters.client.spec.tsx` | 編集済み | `filter-group` wrapper assertion を追加 |
| 7 | `apps/web/src/components/public/MemberCard.tsx` / `MemberGrid.tsx` | 無変更 | 過密解消は member-grid CSS gap で吸収 |

> CSS 主体の改修であり LOC は小規模（合計 ~150 LOC + test 調整）。**1 サイクル内で完了するスコープ。先送りタスクなし（CONST_007）。**

## 6. スコープ外（今回サイクルに含めない・将来 baseline 候補）

| 項目 | 理由 | 扱い |
|------|------|------|
| タグの category 別グルーピング表示 | 現 `topTags` は code/label/count のフラット配列。category 軸は API/schema 拡張が必要（INV-4 違反） | Phase 12 unassigned baseline（非起票・YAGNI） |
| タグ検索ボックス（タグが多数時の絞り込み入力） | 現状の topTags 件数では過剰。発見性は flex-wrap で十分 | Phase 12 baseline（非起票・YAGNI） |
| メンバーカードのデザイン全面刷新 | 「整える」範囲を超える。今回は余白/階層調整に限定 | スコープ外明記 |

## 7. implemented_local_runtime_pending VISUAL の証跡境界（validator 準拠）

- 本サイクルは `apps/web` の実コード差分、focused tests、typecheck/lint/token gate、local static visual PNG を生成済み。
- `outputs/phase-11/metadata.json` は `status: "local_static_visual_present_staging_pending"`、screenshots 配列 5 件は `evidenceType: "local-static-visual"` / `capturedAt` 付き。
- Phase 11 evidence inventory 表は local static screenshot 5 件 + metadata を `present` として扱う。
- staging data-backed runtime screenshot は未取得。`screenshot-plan.json` に pending-staging-visual として残し、user-gated 境界に置く。
- `outputs/phase-12/phase12-task-spec-compliance-check.md` は canonical 9 見出し（`## Required Sections` 由来）を逐語含む（テンプレ: `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/outputs/phase-12/phase12-task-spec-compliance-check.md`）。
- `artifacts.json` の `gates[].status` は enum / `passed_at` は ISO datetime or null / `evidence_path` は実在パス（gate-metadata:validate）。
- user-gated（本サイクルで実行しない）: staging deploy / staging runtime screenshot capture / commit / push / PR。

## 8. テンプレ参照（形式の正本）

実績ある同型 VISUAL workflow を形式テンプレとして流用する:
`docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/`
（index.md / artifacts.json / phase-01..13 / outputs/phase-12/* の構造と見出しを踏襲。内容は本タスク向けに置換）
