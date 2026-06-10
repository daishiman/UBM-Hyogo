# 実装ガイド — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書]` / status: `implemented_local_evidence_captured`（実装は本 wave で完了）

---

## Part 1: 中学生にも分かる説明

### なぜ必要か（先に理由）

学校で配るアンケート用紙を思い浮かべてください。去年のアンケートには「好きな教科は？」という質問がありました。今年、先生が用紙を作り直して質問の文章をちょっと変えたとします。すると、コンピュータから見ると「これは新しい質問かもしれない」と分からなくなり、去年の答えと今年の答えがバラバラに保存されてしまいます。

そこで、人間が「この新しい質問は、去年のあの質問と同じものだよ」と教えてあげる作業が必要になります。これをこのページ（`/admin/schema`）でやっています。

### 何をするか

このページは、Google フォームの質問が増えたり減ったり変わったりしたときに、それを見つけて、新しい質問に「ずっと変わらない名前（あだ名のようなもの）」をつける場所です。名前をつけると、過去の回答と新しい質問が自動でつながります。

### 今回の困りごとと直し方

今までは、質問のカード（例: `737NEW4`）をクリックすると、名前をつける入力欄が**画面のずっと下の方**に出ていました。クリックした人は「あれ？ クリックしたのに、何が起きたの？」と分からなくなっていました。さらに「stableKey」「resolve」のような難しい言葉ばかりで、何の役に立つのかも分かりませんでした。

今回はこれを次のように直します。

1. カードをクリックしたら、入力欄が**そのカードのすぐ下**に開くようにする（だから「何が起きたか」がすぐ分かる）。
2. 難しい言葉を「永続的な名前（技術名: stableKey）」のように、やさしい日本語を先に書いて技術名をかっこ書きにする。
3. ボタンの近くに「名前をつけると、過去の回答が新しい質問につながります」という一言の説明を出す。
4. ページの一番上に「このページでできること」を 3 ステップの流れで説明する。

### 今回作ったもの

- 質問カードのすぐ下に開く名前割り当てフォーム。
- 「このページでできること」を説明する 3 ステップの案内。
- `stableKey` などの技術用語をやさしい日本語で説明する用語ミニ集。
- クリックしたボタンと開いたフォームの関係を支援技術へ伝える開閉情報。

### 例え話のまとめ

「新しい転校生（新しい質問）に、クラスのみんなが呼ぶあだ名（永続的な名前）をつけてあげる。あだ名をつけると、去年からの友達（過去の回答）とちゃんとつながる」。この作業を、迷わずできるように画面を整えるのが今回のゴールです。

---

## Part 2: 開発者向け技術詳細

### 背景

`/admin/schema`（`apps/web/app/(admin)/admin/schema/page.tsx`）はスキーマ差分レビュー画面。`SchemaDiffPanel.tsx`（1049 行）が added/changed/removed/unresolved の 4 ペインと alias 割当フォーム、bulk resolve、rollback/undo、recompute を担う。機能・API（`POST /admin/schema/aliases` の 200/202 分岐含む）は完成済み。**真因は apps/web 表現層の情報設計欠如**であり、(1) 割当フォームが `.schema-grid` の後（パネル最下部）に描画されクリック位置から離れる (2) 専門用語が無説明 (3) 達成価値の文脈ヘルプ欠如、の 3 点。

### 要約（変更の骨子）

| # | 変更 | ファイル |
|---|------|---------|
| 1 | 割当フォームを `.schema-grid` 後ろ → 各カード（`grouped[t].map`）の当該カード直下（`active?.diffId === it.diffId && active.questionId`）へインライン移設 | `SchemaDiffPanel.tsx` |
| 2 | 技術名→やさしい日本語の SSOT 純データ + `plainLabel`/`termDescription` 追加 | `schemaReviewTerms.ts`（新規） |
| 3 | ページ冒頭の目的説明（3 ステップ + 用語ミニ集） | `SchemaReviewGuide.tsx`（新規） |
| 4 | 文脈ヘルプ・label/ボタン文言・ペイン平易化 | `SchemaDiffPanel.tsx` |
| 5 | インラインフォーム/guide/glossary のスタイル（OKLch token のみ） | `globals.css` |

### インターフェース / 型定義（TypeScript）

```ts
// apps/web/src/components/admin/schemaReviewTerms.ts
export interface SchemaReviewTerm {
  technical: string;   // 技術名（stableKey 等）
  plain: string;       // やさしい日本語の主ラベル
  description: string;  // 一文の平易な説明
}
export const SCHEMA_REVIEW_TERMS: Record<string, SchemaReviewTerm>;  // 12 語（shared-context §2 A を逐語）
export function plainLabel(technical: string): string;       // `${plain}（技術名: ${technical}）` / 未登録は technical をそのまま返す
export function termDescription(technical: string): string;  // 登録キーの description / 未登録は ""（例外を投げない）
```

```tsx
// apps/web/src/components/admin/SchemaReviewGuide.tsx
export function SchemaReviewGuide(): JSX.Element;  // props なし。ui-card / eyebrow / h-section primitive のみ
```

### APIシグネチャ

既存 endpoint surface は変更しない。UI は既存 client helper をそのまま呼び出す。

```ts
postSchemaAlias(body: {
  diffId: string;
  questionId: string;
  stableKey: string;
}): Promise<SchemaAliasApplyBody>;

rollbackSchemaAlias(input: {
  aliasId: string;
  version: number;
}): Promise<unknown>;

recomputeSchemaAlias(input: {
  aliasId: string;
}): Promise<unknown>;
```

### 使用例

```tsx
// page.tsx（result.ok ブロック先頭）
<SchemaReviewGuide />
<CurrentRevisionCard diff={result.data} />
// …

// SchemaDiffPanel.tsx（grouped[t].map 内・各カード直下）
<div className={`schema-field-card diff-${it.type}`}>
  {/* …chip / label button / questionId / status… */}
  {active?.diffId === it.diffId && active.questionId && (
    <form
      id={`schema-assign-form-${it.diffId}`}
      data-component="schema-assign-inline-form"
      className="schema-assign-inline-form"
    >
      <p data-role="assign-help">
        この設問に永続的な名前（技術名: stableKey）をつけると、過去のフォーム回答が新しい設問に自動で対応づきます。
      </p>
      {/* 既存の onSubmit / state / validation を再利用 */}
    </form>
  )}
</div>
```

### エラーハンドリング

- 未登録 technical 名: `plainLabel` は原文保持、`termDescription` は `""`（防御的・例外なし／WEEKGRD-02）。
- HTTP 202 retryable continuation のフィードバック表示は不変（回帰テストで担保）。
- bulk limit（`BULK_LIMIT = 50`）超過 warning は不変。

### エッジケース

- `active && !active.questionId`: 「この diff には questionId がないため alias 割当はできません。」alert を当該カード直下へ移設（インライン化後も維持）。
- 同じカードを再クリックしたときは既存 `onSelect` の state 遷移を使い、フォーム表示と入力 focus の挙動を変えない。
- `resolvedAliases` が存在する履歴は「割り当て済みの記録」と説明し、rollback 専用記録と誤解させない。
- 開閉トリガーは `aria-expanded` / `aria-controls` で、クリックしたカード内フォームとの関係を明示する。

### 設定項目と定数一覧

| 定数 | 値 | 出典 |
|------|-----|------|
| `BULK_LIMIT` | 50 | 既存（不変） |
| `SCHEMA_REVIEW_TERMS` キー | stableKey/questionId/alias/resolve/unresolved/added/changed/removed/revision/backfill/recompute/rollback（12 語） | 新規 SSOT |
| 主ラベル形式 | `${plain}（技術名: ${technical}）` | 新規 |

### テスト構成

| テスト | 対象 | 主な検証 |
|--------|------|----------|
| `schemaReviewTerms.spec.ts` | 用語 SSOT | 登録語、未登録 fallback、ラベル形式 |
| `SchemaReviewGuide.spec.tsx` | 目的説明 | 3 ステップ、用語ミニ集 |
| `SchemaDiffPanel.component.spec.tsx` | 差分カード操作 | カード直下フォーム、文脈ヘルプ、ARIA 開閉関係、履歴説明、既存 202/bulk/rollback 回帰 |
| `page.spec.tsx` | `/admin/schema` 統合 | `SchemaReviewGuide` が成功レスポンス時にページへ組み込まれること |
| `admin-schema-diff.spec.ts` | local Playwright visual | Phase 11 screenshot canonical 4 件 |

### 視覚証跡

VISUAL_ON_EXECUTION タスク。local Playwright fixture で Phase 11 screenshot canonical 4 件を取得する。authenticated staging runtime は user-gated のため、staging PNG は別途取得する。

| canonical 名 | 状態 |
|-------------|------|
| `schema-review-guide-default.png` | 目的説明表示 |
| `schema-diff-card-collapsed.png` | フォーム未展開 |
| `schema-diff-card-inline-form-expanded.png` | カード直下にフォーム展開 |
| `schema-assign-help-visible.png` | 文脈ヘルプ + やさしい用語表示 |

参照: `phase-11-manual-test.md` / `outputs/phase-11/manual-test-result.md` / `outputs/phase-11/phase11-capture-metadata.json`。

### 検証コマンド（本 wave）

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

### 既知制限

- 用語ミニ集は主要 4-6 語に限定（全 31 設問の用語集化は初回スコープ外・将来層）。
- authenticated staging runtime 検証はユーザー承認後に実行する。
