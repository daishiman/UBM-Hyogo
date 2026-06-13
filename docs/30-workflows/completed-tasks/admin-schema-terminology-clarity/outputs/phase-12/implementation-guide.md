# 実装ガイド — admin-schema-terminology-clarity

`[実装区分: 実装仕様書]` / status: `implemented_local_evidence_captured`

---

## Part 1: 中学生レベルの説明（専門用語なし）

### この画面は何をする画面か

学校で「アンケート用紙」を配るところを想像してください。アンケートには「名前」「学年」「好きな科目」
みたいな質問が並んでいます。このサイトでは、その「アンケート用紙」が Google フォームです。

ところが、アンケートはときどき作り直されます。たとえば「好きな科目」という質問を「得意な科目」に
書き換えたり、新しく「部活動」という質問を足したりします。すると困ったことが起きます。前のアンケートで
「好きな科目」に答えた人と、新しいアンケートで「得意な科目」に答えた人が、ほんとうは同じことを
答えているのに、コンピューターには「別の質問だ」と見えてしまうのです。

そこで管理者が「この新しい質問は、前のあの質問と同じ意味だよ」と教えてあげる必要があります。これが
この画面のお仕事です。新しい質問に「これは前のこの項目とつながっています」という名札（=「項目名」）を
つけてあげると、昔の回答と今の回答がちゃんと一本につながります。

### 何が困っていたか

これまでこの画面には、「スキーマ」「stableKey」「Bulk Resolve」「CURRENT REVISION」といった、
英語やプログラマーだけが分かる言葉がたくさん並んでいました。さらに「000000…」のような、人間には
意味のない長い番号も表示されていました。管理者の万壽本さんは「スキーマって何？」「この番号は何の番号？」と
手が止まってしまいました。

### どう直すか

むずかしい言葉を、ぜんぶやさしい日本語に言いかえます。

- 「スキーマ」→「フォーム項目の対応づけ」
- 「Bulk Resolve（まとめて resolve）」→「まとめて対応づけ」
- 「CURRENT REVISION + 000000…」→「現在のフォーム構成 / 最新版 ●適用中 /（取得: 2026年6月9日）」

意味のない番号（000000…）は画面から隠して、人が読める日付だけを見せます。番号そのものはコンピューターの
中ではちゃんと残っているので、機能はまったく変わりません。見え方だけをやさしくする、というお直しです。

### 例え話でまとめると

たとえるなら、外国語のメニューしかなかったレストランに、日本語のメニューを置いてあげるようなものです。
料理（=機能）は何も変わりません。お客さん（=管理者）が「これは何だろう」と迷わず注文できるように、
言葉だけを分かりやすくします。

---

## Part 2: 開発者レベルの説明

### 変更ファイル一覧（apps/web 表現層のみ・12 ファイル）

| # | パス | 種別 | 主な変更 |
|---|------|------|---------|
| 1 | `apps/web/src/lib/format/datetime.ts` | 編集 | `formatJstDate` 追加 |
| 2 | `apps/web/src/components/shell/shell-config.ts` | 編集 | nav label「スキーマ」→「フォーム項目」 |
| 3 | `apps/web/app/(admin)/admin/schema/page.tsx` | 編集 | header / CurrentRevisionCard / REVISIONS / ALIAS HISTORY 文言・生 ID 撤去 |
| 4 | `apps/web/app/(admin)/admin/schema/history/page.tsx` | 編集 | eyebrow / breadcrumb 日本語化 |
| 5 | `apps/web/src/components/admin/SchemaPurposeExplainer.tsx` | 編集 | eyebrow 日本語化 |
| 6 | `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | Bulk Resolve/Rollback / DIFF ITEMS / resolve 履歴 / DL ラベル / toast 日本語化 |
| 7 | `apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx` | 編集 | モーダル見出し・table header 日本語化 |
| 8 | `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx` | 編集 | モーダル見出し日本語化 |
| 9 | `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | 編集 | aria-label 日本語化 |
| 10 | `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx` | 編集 | eyebrow 日本語化 |
| 11 | `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx` | 編集 | アラート文言・リンク日本語化 |
| 12 | `apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx` | 編集 | KPI label「Schema issues」→「未対応のフォーム項目」 |

> 用語集 SSOT 3 ファイル（`schemaGlossary.ts` / `schemaReviewTerms.ts` / `schemaHistoryGlossary.ts`）は
> ユーザー方針「用語集カード内のみ技術名併記を残す」に従い **据置（変更なし）**。

テスト同 wave 更新: `page.spec.tsx` / `SidebarNavItem.spec.tsx` / `shell-config.spec.tsx` /
`SidebarShell.server.spec.tsx`（および `SchemaDiffPanel.component.spec.tsx` / `SchemaAlertCard.spec.tsx` の
実在確認後）。Playwright 5 ファイルは文言整合のため同 wave で期待文字列を更新（本サイクルでは実行しない）。

### 新規 helper `formatJstDate` の TypeScript signature

`apps/web/src/lib/format/datetime.ts` に追加する純粋関数（fail-soft・date-only）:

```ts
const JST_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** ISO 文字列を「2026年6月9日」へ整形。無効値は空文字を返し、呼び出し側で行ごと非表示にできる。 */
export function formatJstDate(iso: string | null | undefined): string;
```

- 入出力: `string | null | undefined` → `string`。
- 無効値（`null` / `undefined` / `Number.isNaN(new Date(iso).getTime())`）は throw せず空文字 `""` を返す（WEEKGRD-02）。
- 既存 `formatJstDateTime` は変更しない（後方互換）。
- `CurrentRevisionCard` は `formatJstDate(diff.capturedAt ?? diff.items[0]?.createdAt)` を使い、空文字なら「取得: …」行ごとレンダリングしない。

### 用語リネーム表（表現層文字列のみ・抜粋）

| 箇所 | 現状 | 変更後 |
|------|------|--------|
| サイドバー nav label | `スキーマ` | `フォーム項目` |
| ページ見出し | `スキーマ差分のレビュー` | `フォーム項目の対応づけ` |
| パンくず | `ADMIN / SCHEMA` / `Form schema` | `管理 / フォーム項目` / `フォーム項目` |
| CURRENT REVISION eyebrow | `CURRENT REVISION` | `現在のフォーム構成` |
| 生 revisionId 表示 | `<h2 className="mono">{revisionId}</h2>` | `<h2>最新版</h2>`（生 ID 非描画） |
| active バッジ | `active` | `適用中` |
| REVISIONS eyebrow | `REVISIONS` | `フォーム構成の履歴` |
| diff 件数 | `{n} diff items` | `{n} 件の変更点` |
| ALIAS HISTORY eyebrow | `ALIAS HISTORY / resolve log` | `対応づけの記録` |
| diff items eyebrow | `DIFF ITEMS` | `項目別の変更点` |
| ボタン | `Bulk Resolve` / `Bulk Resolve 確定` | `まとめて対応づけ` / `まとめて対応づけを実行` |
| ボタン | `Bulk Rollback` / `Bulk Rollback 確認` | `まとめて取り消し` / `まとめて取り消しの確認` |
| モーダル h3 | `resolve の取り消し` | `対応づけの取り消し` |
| DL ラベル | `alias label` / `stableKey` / `resolved at` / `resolved by` | `表示名` / `項目キー` / `対応づけ日時` / `対応づけた人` |
| FORM SCHEMA GUIDE eyebrow | `FORM SCHEMA GUIDE` | `フォーム項目の対応づけガイド` |
| aria-label | `stableKey の変更` | `項目キーの変更` |
| ダッシュボード アラート | `スキーマ未解決: {n} 件` | `未対応のフォーム項目: {n} 件` |
| KPI label | `Schema issues` | `未対応のフォーム項目` |

> 完全な行単位の正本は `shared-context.md` §2-1〜§2-10 を参照。内部識別子（変数名・型名・testid・
> API フィールド・href・data 属性）は変更しない（CLAUDE.md invariant #5）。
> `href: "/admin/schema"`・testid `admin-kpi-card-schema` は不変。

### grep gate（DoD）

実装後、以下の grep が用語集 SSOT ファイル以外で 0 件であることを確認する:

```bash
grep -rn 'CURRENT REVISION\|FORM SCHEMA GUIDE\|DIFF ITEMS\|Bulk Resolve\|Bulk Rollback\|ALIAS HISTORY' \
  apps/web/src apps/web/app
```

あわせて次の検証コマンドを実行済み:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens          # HEX 直書き 0
git diff --quiet -- apps/api             # API 非接触
```

### post-review correction（2026-06-11）

実装レビューで、Playwright の期待文字列に旧文言が残っている漏れを検出し、下記 5 ファイルを新 UI 文言へ同期した:

- `apps/web/playwright/page-objects/AdminSchemaPage.ts`
- `apps/web/playwright/tests/issue776-schema-bulk-resolve.spec.ts`
- `apps/web/playwright/tests/task15-admin-screenshots.spec.ts`
- `apps/web/playwright/tests/admin-pageheader-task-c.spec.ts`
- `apps/web/playwright/tests/visual-staging-authenticated/admin-schema-authenticated.spec.ts`

再検証:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm exec vitest run apps/web/app/'(admin)'/admin/schema/page.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffBulkResolveModal.component.spec.tsx apps/web/src/components/admin/__tests__/SchemaDiffHistoryPanel.component.spec.tsx apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/features/admin/components/__tests__/KpiGrid.spec.tsx
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test apps/web/playwright/page-objects/AdminSchemaPage.ts apps/web/playwright/tests/issue776-schema-bulk-resolve.spec.ts apps/web/playwright/tests/task15-admin-screenshots.spec.ts apps/web/playwright/tests/admin-pageheader-task-c.spec.ts apps/web/playwright/tests/visual-staging-authenticated/admin-schema-authenticated.spec.ts --list
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
git diff --quiet -- apps/api
```

### 視覚証跡

本ウェーブは `implemented_local_evidence_captured` の VISUAL タスクであり、ローカル証跡は captured、
authenticated staging スクリーンショットは **staging_visual_pending_user_gate** である。
`outputs/phase-11/phase11-capture-metadata.json` は `status: "staging_visual_pending_user_gate"` /
`screenshots: []` であり、`outputs/phase-11/screenshots/` は空（未取得）。撮影計画は
`outputs/phase-11/screenshot-plan.json` に定義済みで、以下 4 枚を authenticated staging に対して取得する
（取得は user-gated 作業）:

| 計画ファイル名 | 内容 |
|----------------|------|
| `admin-schema-terminology-header-renamed.png` | サイドバー「フォーム項目」+ 見出し「フォーム項目の対応づけ」+ パンくず「管理 / フォーム項目」 |
| `admin-schema-current-revision-hidden-id.png` | CURRENT REVISION カードが日本語表記になり生 revisionId が非表示 |
| `admin-schema-diff-panel-japanese-actions.png` | DIFF ITEMS / Bulk Resolve / resolve 履歴 の日本語化 |
| `admin-dashboard-form-item-alert.png` | ダッシュボードのアラート「未対応のフォーム項目: N 件」+ KPI |

> 参照: `outputs/phase-11/screenshot-plan.json`。VISUAL 証跡の実取得は user-gated（ユーザー承認後）。
