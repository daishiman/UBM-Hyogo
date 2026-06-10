# Phase 8: リファクタリング — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書]` / `[状態: implemented_local_evidence_captured]`

本 Phase は**挙動不変**のリファクタリング計画を `対象 / Before / After / 理由` テーブル（Feedback RT-03）で記述する。実コード変更は本 wave で、テスト GREEN 維持のもとに行う。

---

## 1. 大原則

- **挙動不変**: 本 Phase のリファクタは Phase 4/6 のテストを **GREEN に保ったまま**行う。表示テキスト・DOM 位置・機械可読属性（`data-testid` / `aria-label`）・API contract は変えない。
- **新規 primitive を作らない**: プロトタイプ primitives（`ui-card` / `Chip` / `FormField` / `Input` 等）のみを使う。装飾は `globals.css` への追記で行い、新しい共有 UI primitive は生やさない（SSOT §0・不変条件・正本順位）。
- **不変条件 #14 を破らない**: `SchemaDiffPanel` / `SchemaReviewGuide` の runtime import は `page.tsx` に限定する。`SchemaDiffPanel` の exported type を使う type-only import は既存例外として許容し、runtime bundle 依存を増やさない。

---

## 2. リファクタ対象テーブル（対象 / Before / After / 理由）

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| RT-1 | 割当フォーム JSX（`SchemaDiffPanel.tsx`） | `.schema-grid` 後に置かれた単一の大きな `<form>` ブロック。クリックしたカードとフォームの距離が離れて因果が見えない | `grouped[t].map(...)` 内の当該カード直下に既存 `<form>` JSX を移設し、`id` / `aria-expanded` / `aria-controls` で開閉関係を明示する。ローカル component 抽出は行わない | 変更範囲を最小に保ち、既存 state / handler / focus 処理をそのまま再利用する。フォームは 1 箇所のみで、旧最下部フォームは削除済み |
| RT-2 | 用語ラベル生成 | カード内ラベル・guide の用語ミニ集・文脈ヘルプで「やさしい語（技術名: xxx）」を各所で文字列結合 | `schemaReviewTerms.ts` の `plainLabel` / `termDescription` に**一本化**。表示側はヘルパ呼び出しのみ。手書きの併記文字列結合を残さない | 用語併記形式（AC-3）の SSOT 化。形式変更が 1 箇所で済み、Phase 6 T6-FMT で形式崩れを検知できる。重複生成を排除 |
| RT-3 | 同義の muted ヘルプ文の散在（duplicate / navigation drift） | `assign-help` / bulk 補助 `<p>` / HistoryPane 補助文 / ペイン平易化 `<p>` が個別に直書きされ、文言が微妙にずれる risk | 文言を `schemaReviewTerms.ts`（または同ファイル内の定数）から引く形に寄せ、muted ヘルプの**文字色クラスを `[data-role]` / `.muted` で統一**。同義文の二重定義を避ける | navigation/wording drift の予防。SSOT から引くことで「割り当てると過去回答が対応づく」系の説明が画面間でぶれない。表示文字列は不変（同じ文を集約するだけ） |
| RT-4 | ペイン見出し直下の平易説明 | 各ペインで `termDescription(t)` を直接埋め込むが、`unresolved` だけ特別文言（SSOT §2 C-3） | 共通は `termDescription(t)`、`unresolved` の特別文言のみ明示分岐をローカル定数化して可読化 | 例外（unresolved 特別文言）の所在を明確化。分岐ロジックは不変・表示文も不変 |
| RT-5 | `globals.css` 追記の重複セレクタ | インラインフォーム枠・guide flow・glossary・ヘルプ muted で似た余白/色指定が重複しがち | 共通の muted 文字色は `var(--ubm-color-text-secondary)` を参照する単一ルールに寄せ、各セレクタは差分のみ記述 | CSS 重複削減。色は token 参照のみ（HEX 禁止・`verify:tokens` PASS / AC-7）。見た目は不変 |

---

## 3. 抽出可否の判断（インラインフォーム）

| 判断軸 | 結論 |
|--------|------|
| 抽出する／しない | **しない**（フォームは 1 箇所のみで、抽出より直接移設の方が差分が小さい） |
| 外部 export するか | **しない**（新規 export を増やさない） |
| 別ファイルに切り出すか | **しない**（別ファイル化は runtime import 境界を増やすため不要） |
| props 設計 | 新規 props なし。既存 internal state / handler を同じ component 内で再利用する（挙動不変） |

---

## 4. 挙動不変の保証

- リファクタ後も Phase 4（happy path）/ Phase 6（fail path・回帰）の全テストが **GREEN** であること。
- 特に回帰 guard（T6-202 / T6-BULK / T6-ALERT）が GREEN のまま = 表示位置・202 表示・bulk limit warning・alert 配置が不変であることを担保。
- `git diff --quiet -- apps/api` exit 0（AC-8）/ `verify:tokens` HEX 0（AC-7）はリファクタ後も維持。

---

## 5. リファクタ後の検証コマンド（本 wave で実行）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx
mise exec -- pnpm verify:tokens
git diff --quiet -- apps/api
```

---

## 完了条件

- `対象 / Before / After / 理由` テーブル（RT-1..RT-5）が記述済み。
- インラインフォームを抽出しない判断が、不変条件 #14（runtime import を増やさない）の観点で明記済み。
- 用語ラベル生成の `plainLabel` / `termDescription` 一本化、同義 muted ヘルプ文の集約（duplicate / navigation drift 整理）が含まれる。
- リファクタが**挙動不変**（テスト GREEN 維持）であり、**新規 primitive を作らない**方針が再確認済み。
- 本 Phase 対象のコード変更は Phase 5 実装として反映済み（`implemented_local_evidence_captured`）。実コード変更は本 wave。
