# Phase 1: 要件定義

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|-----|
| Phase | Phase 1 — 要件定義 |
| workflow_id | `public-members-tag-filter-ux-refine` |
| status | `spec_created` |
| taskType | `implementation`（UI 表現層改善） |
| visualEvidence | `VISUAL`（local static screenshot captured、staging screenshot pending） |
| relatedIssue | `null` |
| 正参照 | [`_shared-context.md`](./_shared-context.md) |

> 本 Phase の全記述は `_shared-context.md` を正本とし、矛盾してはならない。


<!-- validator-facing required sections: start -->

## メタ情報

- workflow_id: `public-members-tag-filter-ux-refine`
- status: `implemented_local_runtime_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`

## 目的

公開メンバー一覧のタグ絞り込み UI を、実コード・仕様書・証跡が矛盾しない形で改善する。

## 実行タスク

- Phase 1 の責務に沿って、CSS/markup/test/証跡/正本同期の該当項目を確認する。
- `_shared-context.md` の AC / INV / 変更対象と矛盾しないことを確認する。

## 参照資料

- `_shared-context.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

- 本 Phase ファイル
- 対応する `apps/web` / `outputs/` / skill 正本同期の実変更

## 統合テスト連携

- focused Vitest / typecheck / lint / token gate の結果を Phase 11 evidence と Phase 12 compliance に同期する。
<!-- validator-facing required sections: end -->

## 0. 実装区分の根拠（CONST_004）

本タスクは staging の UI/UX 観察（タグが縦積みで見にくい）を起点とするが、解決には
**`apps/web` の CSS（`legacy-public.css`）への新規ルール追加と、最小の markup（data-role 付与）変更**
が必要である。設定変更・ドキュメント整備のみでは完結せず、コード差分を伴う。
よって **docs-only ではなく「実装仕様書」** として扱う（CONST_004: コード変更を伴う UI 改善 → 実装仕様書）。

本サイクルでは `apps/web` の CSS / 最小 markup / focused tests / local static screenshot まで生成し、commit・push・PR・staging screenshot は user-gated として残す（`_shared-context.md` §7）。

## 1. 真の論点（RCA・実コード Read で再裏取り）

**機能不足ではなく UI 表現層（CSS）の欠落。** 以下を本 Phase で実コード Read により再確認した:

### 1.1 主因: `tag-picker-options` の display 不在 → block flow 縦積み

- `apps/web/src/components/public/TagPicker.client.tsx`（L35）は
  `<ul data-role="tag-picker-options">` で、各候補を `<li><button data-component="tag-pill" role="switch" aria-checked>…</button></li>` として列挙する。
- `[data-role="tag-picker-options"]` の CSS ルールは **両 CSS ファイルに存在しない**（再 grep 確認: `grep -rn "tag-picker-options" apps/web/src/styles/` → `NOT FOUND`）。
- `<ul>` / `<li>` の既定は block flow であり、`display` 指定が無いため tag-pill が **縦に 1 個ずつ積まれる**。これがユーザー報告「タグが縦に並んで見にくい」の直接原因。
- `tag-pill` 自体は `display: inline-flex`（`globals.css` L1734-1750）だが、親の `<li>` が block の縦積みである限り横並びにならない。

### 1.2 副因（実コードで判明した追加事実）: 選択強調セレクタの不一致

- `globals.css` L1756 の選択強調ルールは `[data-component="tag-pill"][aria-selected="true"]` だが、
  `TagPicker.client.tsx` L44 のボタンは `aria-checked={isSelected}` を使用しており **`aria-selected` 属性を付与していない**。
- 結果として、**現状は選択中タグの視覚強調（背景反転）が効いていない**。横並び化（AC-1）に加え、選択強調（AC-3）も併せて是正が必要。
  本不一致は Phase 2 設計で `[aria-checked="true"]` セレクタを追加して解決する（INV-7 = 機能不変・見た目のみ改善 に整合）。

### 1.3 API 無罪（INV-4 の根拠）

- タグ chip の描画ソース `topTags`（`{code,label,count}[]`）は `GET /public/members` の `aggregateTopTags()` から正常に返る。
- 解決は `apps/web` の UI 表現層（CSS + 最小 markup）のみで完結し、`apps/api` / `packages/shared` / D1 / Google Form は変更不要。

## 2. CSS 正本ファイルの確定（実測）

`_shared-context.md` の指示に従い、`tag-picker-options` ルールを追加する正本ファイルを実 grep で確定した。

| 観点 | 実測結果 |
|------|---------|
| `member-filters` / `filter-grid` / `tag-picker` wrapper / `tag-picker-heading` / `selected-filters-bar` / `member-grid`（density）/ `member-card` のレイアウトルール | **すべて `legacy-public.css`**（L1350-1494 に集約） |
| `tag-pill` chip 単体スタイル（padding/border/hover/選択強調） | `globals.css` L1734-1760 |
| `member-filters` の mobile collapse（`filters-summary-mobile` / `filters-body`） | `globals.css` L2316-2332 |
| `tag-picker` 内 disabled ボタン | `globals.css` L2334-2337 |
| `[data-role="tag-picker-options"]` | **両ファイルに不在**（新規追加対象） |

### 確定

- **`tag-picker-options` の flex 横並びルールは `legacy-public.css` に追加する。**
  根拠: 親 `[data-component="tag-picker"]` wrapper（border-top/margin/padding）、`tag-picker-heading`、
  および周辺レイアウト（`filter-grid` / `member-grid` 余白）がすべて `legacy-public.css` に同居しており、
  フィルタ領域グルーピングと member-grid 余白調整も同ファイルで一貫管理するのが cascade 上自然で、保守性が高い。
- **`tag-pill` の選択強調セレクタ修正（`aria-checked` 追加）は `globals.css`**（L1756 の既存ルール近傍）で行う。
  根拠: chip 単体スタイルは `globals.css` が正本であり、選択強調も同ブロックに属する。

> Phase 2 §1 で legacy-public.css への CSS 追加、§3 で globals.css の選択強調セレクタ追加を設計する。

## 3. 引用: 既存スタイルの現行値（実 Read 済）

### 3.1 `tag-pill`（`globals.css` L1734-1760・抜粋）

```css
[data-component="tag-pill"] {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--ubm-color-surface-bg);
  border: 1px solid var(--ubm-color-border-default);
  border-radius: var(--ubm-radius-sm);
  color: var(--ubm-color-text-secondary);
  font-size: var(--ubm-text-xs);
  font-weight: 500;
  cursor: pointer;
  /* transition 省略 */
}
[data-component="tag-pill"]:hover { border-color: var(--ubm-color-border-strong); }
[data-component="tag-pill"][aria-selected="true"] {   /* ← aria-checked と不一致（§1.2） */
  background: var(--ubm-color-text-primary);
  border-color: var(--ubm-color-text-primary);
  color: var(--ubm-color-surface-panel);
}
```

### 3.2 上限到達 disabled（`globals.css` L2334-2337）

```css
[data-component="tag-picker"] button[aria-disabled="true"] {
  opacity: 0.45;
  cursor: not-allowed;
}
```

`TagPicker.client.tsx` は上限到達時に未選択 chip を `aria-disabled` にし、`<p data-role="tag-limit-hint" aria-live="polite">` を表示する（L45, L59-63）。この挙動は **不変に保つ**（INV-7）。

### 3.3 `tag-picker` wrapper / heading（`legacy-public.css` L1431-1441）

```css
[data-component="member-filters"] [data-component="tag-picker"] {
  border-top: 1px solid var(--ubm-color-border-default);
  margin-top: var(--ubm-space-4);
  padding-top: var(--ubm-space-4);
}
[data-component="member-filters"] [data-role="tag-picker-heading"] {
  color: var(--ubm-color-text-secondary);
  font-size: var(--ubm-text-sm);
  font-weight: 600;
  margin-bottom: var(--ubm-space-3);
}
```

### 3.4 利用可能トークン（`tokens.css` 実 Read 済）

| 種別 | トークン | 値 |
|------|---------|-----|
| space | `--ubm-space-1` … `--ubm-space-4` | 4 / 8 / 12 / 16 px |
| accent | `--ubm-color-accent` | `oklch(0.52 0.10 55)` |
| accent | `--ubm-color-accent-soft` | `oklch(0.95 0.03 65)` |
| accent | `--ubm-color-accent-ink` | `oklch(0.38 0.10 55)` |
| 面 | `--ubm-color-surface-bg` / `surface-panel` | テーマ変数（利用側は変数参照のみ） |
| 境界 | `--ubm-color-border-default` / `border-strong` | テーマ変数 |
| 文字 | `--ubm-color-text-primary` / `text-secondary` / `text-muted` | テーマ変数 |
| radius | `--ubm-radius-sm` / `md` / `lg` | 8 / 12 / 16 px |
| text | `--ubm-text-xs` / `sm` | 11 / 12.5 px |

> 色はすべて上記トークン変数経由で参照する。HEX 直書き / `bg-[#xxx]` は禁止（INV-2 / AC-6）。

## 4. 要件

### 4.1 機能要件

| ID | 要件 |
|----|------|
| FR-1 | タグ候補（`tag-pill`）を横並び（flex + flex-wrap）にし、件数が多い場合は折り返す。縦積みを解消する。 |
| FR-2 | フィルタ領域（検索 / UBM区画 / 参加ステータス / 並び替え / タグ）をラベル・余白・区切りで視覚的にグルーピングし、階層を明確にする。 |
| FR-3 | 選択中タグ（`aria-checked="true"`）の視覚強調が横並びでも判別可能にする（accent トークン経由）。 |
| FR-4 | メンバーグリッド（`member-grid`）の列 / gap / カード余白を整理し過密感を解消する。comfy / dense / list の 3 密度を維持する。 |

### 4.2 非機能要件

| ID | 要件 |
|----|------|
| NFR-1 | 色は OKLch トークン経由（`verify-design-tokens` pass）。 |
| NFR-2 | a11y 維持（既存 role/aria、フォーカス順序、コントラスト AA）。 |
| NFR-3 | レスポンシブ（モバイル: フィルタ折りたたみ + タグ横並び wrap / デスクトップ: 同様に wrap）で破綻なし。 |
| NFR-4 | 新規 primitive を生やさない（既存 `components/ui` + 既存 data-* selector で構成）。 |

## 5. 不変条件（`_shared-context.md` §3 より転記）

| ID | 条件 |
|----|------|
| INV-1 | 既存 API endpoint surface のみ利用、新 endpoint 追加禁止。 |
| INV-2 | OKLch トークン正本化（`tokens.css`）、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。 |
| INV-3 | `apps/web` から D1 直接アクセス禁止。 |
| INV-4 | `apps/api/` / `packages/shared/` / D1 migration / Google Form を変更しない（UI 表現層のみ）。 |
| INV-5 | テストファイルは `*.spec.{ts,tsx}` のみ。 |
| INV-6 | 新規 primitive を生やさない（既存 `components/ui` + 既存 data-* で構成）。 |
| INV-7 | `tag-pill` の `role="switch"` / `aria-checked` / トグル挙動 / 上限 hint / empty option を不変に保つ（機能温存・見た目のみ改善）。 |

## 6. 受入条件（`_shared-context.md` §4 より転記）

| ID | 条件 | 検証方法 |
|----|------|---------|
| AC-1 | `[data-role="tag-picker-options"]` が `display:flex` + `flex-wrap:wrap` + `gap`（OKLch/space トークン経由）で tag-pill が横並びになり、縦積みが解消される。折り返し時の行間も適切 | Phase 4 CSS/DOM spec + Phase 11 screenshot |
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

## 7. スコープ

### 7.1 スコープ内

- `legacy-public.css` への `tag-picker-options` flex 横並びルール追加 + フィルタ領域グルーピング + member-grid 余白調整。
- `globals.css` の `tag-pill` 選択強調セレクタ修正（`aria-checked` 対応）。
- `TagPicker.client.tsx` / `MemberFilters.client.tsx` の最小 markup 変更（data-role / グルーピング section）。`role="switch"` / `aria-checked` / URL query 正本ロジックは不変。
- 上記 markup 変更に追随する既存 spec の assertion 更新（`TagPicker.client.spec.tsx` / `MemberFilters.client.spec.tsx`）。

### 7.2 スコープ外（`_shared-context.md` §6）

| 項目 | 理由 | 扱い |
|------|------|------|
| タグの category 別グルーピング表示 | `topTags` は flat 配列。category 軸は API/schema 拡張が必要（INV-4 違反） | Phase 12 baseline（非起票・YAGNI） |
| タグ検索ボックス | 現 topTags 件数では過剰。発見性は flex-wrap で十分 | Phase 12 baseline（非起票・YAGNI） |
| メンバーカードの全面刷新 | 「整える」範囲を超える。余白/階層調整に限定 | スコープ外明記 |
| ページ全体のフルリライト | AskUser 回答により対象外 | スコープ外明記 |

## 8. carry-over / 衝突確認

- 起点は staging UI 観察（Issue 紐付けなし）。先行で衝突する変更なし。
- 形式テンプレ: `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/`（同型 VISUAL workflow）。

## 完了条件

- [x] 実装区分（実装仕様書）と CONST_004 根拠を明記
- [x] RCA を実コード Read で再裏取り（主因 = tag-picker-options display 不在 / 副因 = 選択強調セレクタ不一致）
- [x] CSS 正本ファイルを実測確定（legacy-public.css に tag-picker-options / globals.css に選択強調修正）
- [x] 既存スタイル（tag-pill L1734-1760 / disabled L2334）とトークンを引用
- [x] INV-1〜7 / AC-1〜11 を `_shared-context.md` から正確に転記
- [x] スコープ / スコープ外を確定
