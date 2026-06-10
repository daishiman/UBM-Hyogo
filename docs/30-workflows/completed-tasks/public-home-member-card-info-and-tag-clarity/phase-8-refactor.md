# Phase 8: リファクタリング

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- 前提: Phase 1（要件・AC）/ Phase 2（設計）/ Phase 3（設計レビュー PASS）/ Phase 4〜7（テスト計画・実装・テスト追加・カバレッジ）
- 本 Phase の責務: 実装後の重複解消・命名整理・SRP 観点の整理を行い保守性を高める。新機能追加は行わない。

## 目的

実装後のコードについて重複削減・命名整理・SRP 観点の整理を行い、保守性を高める。新機能追加は行わず、`対象 / Before / After / 理由` テーブル（[Feedback RT-03]）で各観点の採否と根拠を明記する。新規 primitive を作らない原則（AC-4 / mvp-recovery 不変条件 #3）を全観点で再確認する。

## リファクタリング方針

本タスクの変更対象は `apps/web`（util / MemberCard / TagPicker / wiring / CSS）+ `apps/api`（list projection）+ `packages/shared`（zod）に閉じる。Phase 2 設計から「最小差分原則」を採用し、既存 `data-role` markup 流儀・`ChipTone` union・既存 endpoint surface を維持しているため大規模リファクタは発生しない。以下に **整理観点** を `対象 / Before / After / 理由` テーブル形式で列挙し、採否と根拠を明記する（[Feedback RT-03]）。

> **新規 primitive を作らない原則の再確認（AC-4 / mvp-recovery 不変条件 #3）**: 本タスクの全リファクタ観点は「既存 `data-role` span / `Chip` / `ChipTone` / 既存 CSS chip スタイルの流用」を前提とし、`Chip` 派生・新規 React component・新規 tone を **生やさない**。下記いずれの採否でも新規 primitive 追加には至らない。

## 実行タスク（対象 / Before / After / 理由）

### タスク 1: tag chip markup の `data-role` span 流儀統一

| 観点 | 内容 |
| --- | --- |
| 対象 | `MemberCard.tsx` の zone chip(`data-role="zone"`) / status chip(`data-role="status"`) / 新規 tag chip(`data-role="tag-chip"`) |
| Before | zone/status は `<span data-role data-tone={…}>`。新規 tag chip も同じ `data-role` span だが、tone 属性の付け方（`data-tone` / `data-phase`）が個別実装になりやすい |
| After | tag chip も既存 zone/status と同じ **`<li data-role="tag-chip" data-tone={…}>` span 流儀**に統一。phase 強調のみ `data-phase="true"` を追加属性として付与（tone は `phaseTone` の既存 `ChipTone` 値）。新規 `Chip` component には寄せない（既存カードが素の span で書かれているため流儀を合わせるのが最小差分） |
| 理由 | DRY・流儀統一。既存 zone/status の `data-role` span パターンに揃えることで CSS セレクタ（`[data-component="member-card"] [data-role="…"]`）を一貫させられる |
| 採否 | **採用（既存 `data-role` span 流儀に統一）**。新規 primitive は作らない |

### タスク 2: `normalizeTagLabel` を TagPicker と MemberCard で共有（DRY）

| 観点 | 内容 |
| --- | --- |
| 対象 | `apps/web/src/lib/tags/tag-display.ts` の `normalizeTagLabel` / 利用側 `MemberCard.tsx`（`selectCardTags` 経由）/ `TagPicker.client.tsx`（topTags chip） |
| Before | 矢印正規化ロジックが各所に散在する懸念（カードと picker で別実装すると `0to1→0→1` の正規化がドリフトする） |
| After | `tag-display.ts` の **単一 `normalizeTagLabel(tag)` を MemberCard（`selectCardTags` 内部）と TagPicker の両方から import**して共有。`selectCardTags` は内部で `normalizeTagLabel` を呼ぶため、カード側は二重正規化しない。TagPicker は `#{normalizeTagLabel(opt)}` で直接呼ぶ（`opt={code,label,count}` を `Pick<…,"code"|"label">` として受理） |
| 理由 | SSOT（Single Source Of Truth）。AC-1 と AC-7 が同一 util を共有することで「カードでは 0→1 だが picker では 0 to 1」という表記ドリフトを構造的に防ぐ |
| 採否 | **採用（単一 util 共有）**。これは Phase 2 設計の中核であり、リファクタというより「重複を最初から作らない」設計の追認 |

### タスク 3: `tag-display.ts` 内の定数・関数の責務分割可否

| 観点 | 内容 |
| --- | --- |
| 対象 | `tag-display.ts`（`TAG_LABEL_OVERRIDES` / `CARD_CATEGORY_ORDER` / `HIDDEN_CATEGORIES` 定数 + `normalizeTagLabel` / `selectCardTags` / `phaseTone` 関数） |
| Before | 1 ファイルに「表示 label 正規化」「カード選抜」「tone マッピング」の 3 責務が同居 |
| After | いずれも「公開カードのタグ表示」という同一ドメインの純関数 util。ファイル分割すると import パスが増え、`tag-display.spec.ts` のモジュール参照も変わる。**分割しない（現状維持）** |
| 理由 | SRP は「同一の変更理由でまとまっているか」で判断。3 つとも「カードのタグ表示仕様が変わったとき」に一緒に変わるため凝集度が高い。行数も小さい（YAGNI） |
| 採否 | **否（現状維持）**。将来 100 行超になれば `tag-label.ts` / `tag-select.ts` への分割を未タスク候補とする（CONST_007: 本サイクルスコープ外） |

### タスク 4: `toBusinessSummary` truncate helper の配置（use-case か view-model か）

| 観点 | 内容 |
| --- | --- |
| 対象 | `apps/api/src/use-cases/public/list-public-members.ts` の `toBusinessSummary`（先頭行抽出 + 120字 cap） |
| Before | truncate helper を use-case 内 local 関数として定義 |
| After | **use-case 内 local 関数として維持**。view-model（`public-member-list-view.ts`）は値の透過のみ（`businessSummary?` をそのまま流す）に責務を限定し、truncate（projection 仕様）は use-case 側に置く |
| 理由 | 「先頭 1 行・120 字 cap」は list endpoint の **projection 仕様**であり、view 変換（型整形）とは責務が異なる。use-case = データ整形ロジック、view-model = 型透過、という境界を保つ |
| 採否 | **否（分離せず use-case 内 local 維持）**。view-model への移動は責務混在を招くため不採用 |

### タスク 5: navigation drift（ナビ / 導線の意図せぬ変化）なし確認

| 観点 | 内容 |
| --- | --- |
| 対象 | `app/(public)/page.tsx`（home `/`）/ `app/(public)/members/page.tsx`（一覧）の wiring 変更 |
| Before | home `/` は `listMembersRaw("limit=6&sort=recent", …)`、`/members` は `listMembers(search, …)` |
| After | home `/` の query 文字列に `expand=tags` を追記（`listMembersRaw("limit=6&sort=recent&expand=tags", …)`）。`/members` は `toApiQuery` 末尾の `params.set("expand","tags")` で自動付与。**呼び出し導線・ルーティング・リンク・遷移先は一切変更しない** |
| 理由 | 本タスクはカードの表示情報を増やすだけで、ページ間遷移・ナビ構造には触れない。`expand=tags` は取得データの拡張であり navigation には影響しない |
| 採否 | **確認のみ（drift なし）**。`git diff` で `page.tsx` 変更が `expand=tags` 追記に限定され、`<Link>` / `redirect` / `href` 変更が無いことを確認する |

## 実行手順

### ステップ 1: tag chip markup の `data-role` span 流儀確認（MemberCard.tsx）

```tsx
// 既存 zone/status と同じ data-role span 流儀に統一（新規 Chip component に寄せない）
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
```

### ステップ 2: `normalizeTagLabel` 共有の import 確認

```bash
# normalizeTagLabel が tag-display.ts に 1 箇所だけ定義され、MemberCard 系と TagPicker から参照されること
grep -rn "normalizeTagLabel" apps/web/src
# 期待: 定義 1 (tag-display.ts) + selectCardTags 内部呼び出し + TagPicker import の参照のみ。重複定義 0
```

### ステップ 3: navigation drift なし確認

```bash
# page.tsx の変更が expand=tags 追記に限定され、リンク/遷移先が変わっていないこと
git diff -- "apps/web/app/(public)/page.tsx" "apps/web/app/(public)/members/page.tsx" \
  | grep -E '^\+' | grep -vE 'expand=tags|expand", *"tags' | grep -iE 'href|Link|redirect|push\(' \
  && echo "[REVIEW: navigation change detected]" || echo "[PASS: no navigation drift]"
```

### ステップ 4: リファクタ後の回帰確認

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/tags apps/web/src/components/public
cd apps/api && mise exec -- pnpm exec vitest run --root ../.. src/use-cases/public
```

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 設計正本 | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-2-design.md` | util / markup / CSS 設計の根拠 |
| 変更対象 util | `apps/web/src/lib/tags/tag-display.ts` | `normalizeTagLabel` 共有・3 関数の凝集 |
| 変更対象 component | `apps/web/src/components/public/MemberCard.tsx` | tag chip `data-role` span 流儀統一 |
| 変更対象 picker | `apps/web/src/components/public/TagPicker.client.tsx` | `normalizeTagLabel` 共有利用 |
| 変更対象 use-case | `apps/api/src/use-cases/public/list-public-members.ts` | `toBusinessSummary` 配置判断 |
| 既存 chip 流儀 | `apps/web/src/components/public/MemberCard.tsx`（`data-role="zone"`/`"status"`） | markup 流儀の参照元 |
| 既存 primitive | `apps/web/src/components/ui/Chip.tsx` / `apps/web/src/lib/tones.ts` | 流用対象（新規生成しない） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | 公開ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/web/src/components/public/MemberCard.tsx` | 編集 | tag chip を既存 zone/status と同じ `data-role` span 流儀に統一（新規 primitive なし） |
| `apps/web/src/lib/tags/tag-display.ts` | 確認 | `normalizeTagLabel` を MemberCard / TagPicker の SSOT として共有（重複定義 0） |
| 本 Phase 8 仕様書 | 文書 | 対象/Before/After/理由 テーブル・採否判定・navigation drift なし確認 |

## 統合テスト連携

- Phase 9 QA で focused vitest を実行し、リファクタによる回帰がないことを確認する。
- tag chip の `data-role` span 流儀統一は DOM 構造（`data-role` 属性）を保つため、`MemberCard.spec.tsx` の `data-role` ベース確認に影響しない。
- `normalizeTagLabel` 共有は AC-1（カード）と AC-7（picker）の表記一致を構造的に担保し、Phase 11 視覚で両画面の表記一致を確認する。

## 完了条件

1. tag chip markup が既存 zone/status と同じ `data-role` span 流儀に統一されている（新規 primitive 0・[Feedback RT-03] テーブルで採用記録）。
2. `normalizeTagLabel` が `tag-display.ts` に単一定義され、MemberCard 系と TagPicker から共有参照されている（重複定義 0）。
3. `tag-display.ts` の責務分割・`toBusinessSummary` の view-model 移動は採否判定を本文に記録し、いずれも「否（現状維持）」が確定している。
4. navigation drift なし（`page.tsx` 変更が `expand=tags` 追記に限定・リンク/遷移先不変）が確認されている。
5. 新規 primitive を作らない原則（AC-4 / 不変条件 #3）が全観点で再確認されている。
6. `pnpm typecheck` / `pnpm lint` / focused vitest（web + api）が全 green である（リファクタによる回帰なし）。
