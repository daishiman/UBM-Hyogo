# shared-context — admin-schema-terminology-clarity（設計 SSOT）

> 本ファイルは Phase 1〜13 全体の **設計正本**。Phase 4 以降の SubAgent はこのファイルを最初に読み、用語リネーム表・変更ファイル表・DoD をここから引用すること。

---

## 0. タスク要約

| 項目 | 値 |
|------|-----|
| taskId | `TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001` |
| 実装区分 | **実装仕様書**（コード変更を伴う。CONST_004 デフォルト） |
| taskType | implementation |
| visualEvidence | `VISUAL_ON_EXECUTION`（UI 文言変更＝視覚的差分あり） |
| workflow_state | `implemented_local_evidence_captured`（実装・ローカル検証完了。authenticated staging screenshot / commit / PR は user-gated） |
| implementation_mode | `new` |
| branch | `feat/admin-schema-terminology-clarity` |
| 変更範囲 | **`apps/web` 表現層のみ**。API / D1 / Google Form / endpoint surface は一切変更しない |

### 真の論点（1文）

「スキーマ」「stableKey」「resolve」「revision」「CURRENT REVISION」「Bulk Resolve」等の**エンジニア用語・英語表記が `/admin/schema` とその波及先で非エンジニア管理者に表示されており、何をする画面か・表示番号が何かを直感的に理解できない**。表示文言を平易な日本語へ統一し、意味のない内部 revisionId 生表示を隠すことで認知負荷を下げる。

### why now / why this way

- why now: 非エンジニア管理者（万壽本大嗣 = 管理者ロール）が実 staging で「スキーマって何」「000000 の番号は何」と躓いた実フィードバック。
- why this way: 機能・API は既に完成しており（diff 取得 / alias 確定 / rollback / backfill）、痛点は**表現層の用語設計のみ**。よって API を触らず表現層の文字列 SSOT 化で解決する（CLAUDE.md invariant #5 / UI-prototype invariant #1 と整合）。

---

## 1. ユーザー確定方針（AskUserQuestion 回答）

| 論点 | 確定方針 |
|------|---------|
| 「スキーマ」の新名称 | **「フォーム項目の対応づけ」**。サイドバー=「フォーム項目」、ページ見出し=「フォーム項目の対応づけ」、パンくず=「管理 / フォーム項目」、ダッシュボード=「未対応のフォーム項目: N 件」 |
| 英語テクニカル表記 | **原則すべて日本語のみ表示**。英語併記は削除。ただし**用語集カード内のみ**「項目キー（技術名: stableKey）」形式で技術名を残す（開発者・引き継ぎ用） |
| CURRENT REVISION の生 revisionId（例 `000000…` + active バッジ） | **生 ID を非表示**にする。「現在のフォーム構成 / 最新版 ●適用中 /（取得: 2026年6月9日）」のように人が読める表記に置換 |

---

## 2. 用語リネーム正本テーブル（表現層文字列のみ）

> 下表が**唯一の正本**。実装フェーズはこの右列の文字列へ機械的に置換する。「内部識別子（変数名・型名・testid・API フィールド・href・data 属性）は変更しない」。

### 2-1. ナビゲーション / パンくず

| ファイル:行 | 現状 | 変更後 |
|------------|------|--------|
| `apps/web/src/components/shell/shell-config.ts:65` | label `"スキーマ"` | `"フォーム項目"` |
| `apps/web/app/(admin)/admin/schema/page.tsx:150` | eyebrow `"ADMIN / SCHEMA"` | `"管理 / フォーム項目"` |
| `apps/web/app/(admin)/admin/schema/page.tsx:151` | title `"スキーマ差分のレビュー"` | `"フォーム項目の対応づけ"` |
| `apps/web/app/(admin)/admin/schema/page.tsx:152` | description（schema 用語混在） | `"Googleフォームの設問が増減・変更されたとき、新しい設問に項目名をつけて、過去の回答とのつながりを保つ作業をします。"` |
| `apps/web/app/(admin)/admin/schema/page.tsx:153` | breadcrumb `{ label: "Form schema" }` | `{ label: "フォーム項目" }` |
| `apps/web/app/(admin)/admin/schema/history/page.tsx:27` | eyebrow `"ADMIN / SCHEMA"` | `"管理 / フォーム項目"` |
| `apps/web/app/(admin)/admin/schema/history/page.tsx:32` | breadcrumb `"Form schema"` | `"フォーム項目"` |

> `href: "/admin/schema"`（shell-config.ts:64）・ルートパス・testid は**変更しない**（CLAUDE.md invariant #5: API/URL surface 不変）。

### 2-2. CURRENT REVISION カード（revisionId 生表示の撤去）

`apps/web/app/(admin)/admin/schema/page.tsx` `CurrentRevisionCard`（行29-60）:

| 行 | 現状 | 変更後 |
|----|------|--------|
| :38 | eyebrow `"CURRENT REVISION"` | `"現在のフォーム構成"` |
| :40-42 | `<h2 className="mono">{revisionId}</h2>`（生 ID 表示） | `<h2>最新版</h2>`（生 revisionId は描画しない） |
| :44 | `<Chip tone="green">active</Chip>` | `<Chip tone="green">適用中</Chip>` |
| :47 | `"フォームの現在の版数です。設問構成の変化をこの版で確認します。"` | `"いま会員サイトに反映されているフォームの構成です。設問の変化はこの構成を基準に確認します。"` |
| :48-50 | `hash: {hash} · 取得: {capturedAt}`（mono 生表示） | `（取得: {formatJstDate(capturedAt)}）`。`hash` 生表示は撤去。日付が無効なときは取得行ごと非表示（fail-soft） |
| :54 | `"バージョン履歴を開く"` | 据置（日本語のため変更不要） |

### 2-3. REVISIONS / ALIAS HISTORY セクション（page.tsx `RevisionAndAliasHistory` 行89-142）

| 行 | 現状 | 変更後 |
|----|------|--------|
| :96 | eyebrow `"REVISIONS"` | `"フォーム構成の履歴"` |
| :98 | title `"フォーム版数の履歴"` | `"フォーム構成の履歴"` |
| :105 | `<span className="mono">{revisionId}</span>`（生 ID） | `<span>最新版</span>`（生 revisionId は描画しない） |
| :107 | `<Chip tone="green">active</Chip>` | `<Chip tone="green">適用中</Chip>` |
| :110 | `{diff.total} diff items` | `{diff.total} 件の変更点` |
| :120 | eyebrow `"ALIAS HISTORY / resolve log"` | `"対応づけの記録"` |
| :121 | title `"対応づけ履歴"` | 据置 |

> alias 行（:131-133）の `alias.stableKey` / `aliasQuestionId` / `resolvedAt` / `resolvedBy` は**データ値**なので mono 表示のまま据置（リネーム対象外）。

### 2-4. SchemaPurposeExplainer.tsx

| 行 | 現状 | 変更後 |
|----|------|--------|
| :27 | eyebrow `"FORM SCHEMA GUIDE"` | `"フォーム項目の対応づけガイド"` |
| :28 | h2 `"このページでできること"` | 据置 |
| FLOW_STEPS（:5-16） | 日本語 | 据置 |
| glossary（schemaGlossary 由来） | `項目キー / 対応づけ / フォーム版数` + 技術名 | 据置（**用語集カード内なので技術名併記を許容**） |

### 2-5. SchemaReviewGuide.tsx

| 箇所 | 方針 |
|------|------|
| 見出し `"フォームの設問変更を、過去データと繋げて整理します"` | 据置（日本語） |
| glossary（schemaReviewTerms 由来、`plainLabel()` で「永続的な名前（技術名: stableKey）」形式） | 据置（用語集カード内のため技術名併記を許容） |

### 2-6. SchemaDiffPanel.tsx（インライン英語の日本語化）

| 行 | 現状 | 変更後 |
|----|------|--------|
| :264 | `"resolve の取り消し"`（モーダル h3） | `"対応づけの取り消し"` |
| :266-273 | DL ラベル `alias label` / `stableKey` / `resolved at` / `resolved by` | `表示名` / `項目キー` / `対応づけ日時` / `対応づけた人` |
| :335-336 | h2 `"resolve 履歴"` | `"対応づけの記録"` |
| :351 | button `"Bulk Rollback"` | `"まとめて取り消し"` |
| :366 | button `"Bulk Rollback 確認"` | `"まとめて取り消しの確認"` |
| :436 | toast `alias「{label}」を割当てました。…` | `「{label}」に項目キーを割り当てました。5 分以内なら取り消せます。` |
| :723 | `"alias を割当てました"` | `"項目キーを割り当てました"` |
| :782 | eyebrow `"DIFF ITEMS"` | `"項目別の変更点"` |
| :798 | button `"Bulk Resolve"` | `"まとめて対応づけ"` |
| :818 | button `"Bulk Resolve 確定"` | `"まとめて対応づけを実行"` |
| :976 | `<strong>対応づけると起きること</strong>` | 据置 |
| :978-979 | 説明文中の `backfill が走り` | `…過去の回答にもさかのぼって反映されます`（`backfill` 生語を撤去） |

> `TYPE_LABELS`（:68-79: 追加/変更/削除/未解決）は日本語のため据置。

### 2-7. SchemaDiffBulkResolveModal.tsx / SchemaDiffBulkRollbackModal.tsx

| 行 | 現状 | 変更後 |
|----|------|--------|
| BulkResolveModal:51 | `"Bulk Resolve 確認"` | `"まとめて対応づけの確認"` |
| BulkResolveModal:54 | `…{n} 件の stableKey 割当を一括で実行します。` | `…{n} 件の項目キーの割り当てをまとめて実行します。` |
| BulkResolveModal:68-71 | table header `questionId` / `stableKey` / `推奨` / `状態` | `設問の元ID` / `項目キー` / `推奨` / `状態` |
| BulkRollbackModal（同型の英語見出し） | `Bulk Rollback…` | `まとめて取り消し…`（同方針で日本語化） |

> 実装時に BulkRollbackModal.tsx の実文字列を grep で確認し、`Bulk Rollback` / `rollback` / `stableKey` の表示文字列を本表方針で日本語化する。

### 2-8. SchemaDiffHistoryPanel.tsx / SchemaHistoryPurposeExplainer.tsx

| 行 | 現状 | 変更後 |
|----|------|--------|
| HistoryPanel:208 | aria-label `"stableKey の変更"` | `"項目キーの変更"` |
| HistoryPanel:210-216 | `旧` / `新` | 据置 |
| HistoryPurposeExplainer:15 | eyebrow `"ALIAS HISTORY"` | `"対応づけの記録"` |

### 2-9. ダッシュボード波及（_dashboard）

| ファイル:行 | 現状 | 変更後 |
|------------|------|--------|
| `_dashboard/SchemaAlertCard.tsx:17` | `"スキーマ未解決: {count} 件"` | `"未対応のフォーム項目: {count} 件"` |
| `_dashboard/SchemaAlertCard.tsx:20` | `"alias の確定が必要なフォーム項目があります。"` | `"対応づけが必要なフォーム項目があります。"` |
| `_dashboard/SchemaAlertCard.tsx:27` | `"schema 管理を開く →"` | `"フォーム項目の対応づけを開く →"` |
| `_dashboard/KpiGrid.tsx:25-28` | KpiCard label `"Schema issues"` | `"未対応のフォーム項目"`（testid `admin-kpi-card-schema` は**据置**） |

### 2-10. 用語集 SSOT 3ファイル（技術名併記を許容＝大幅変更なし）

| ファイル | 方針 |
|---------|------|
| `apps/web/src/components/admin/schemaGlossary.ts` | `plainLabel`/`technicalName` 構造は据置。用語集カードでのみ表示されるため英語技術名を残す。`describeSchemaStat` の label/hint（未対応/新規設問 等）は日本語のため据置 |
| `apps/web/src/components/admin/schemaReviewTerms.ts` | `technical`/`plain`/`description` 構造据置。`plainLabel()` の「永続的な名前（技術名: stableKey）」形式は用語集内表示なので許容 |
| `apps/web/src/lib/admin/schemaHistoryGlossary.ts` | 用語集の `term: "stableKey"` / `"batchId"` は技術名併記許容のため据置。`schemaHistoryPurposeSteps` の日本語据置 |

> **用語集は「技術名併記を意図的に残す唯一の場所」**。ここを日本語のみにすると引き継ぎ・調査時に API フィールド名と画面の対応が取れなくなるため、ユーザー方針「用語集のみ技術名併記」に従い据置とする。

---

## 3. 新規 helper（revisionId 非表示に伴う日付整形）

`apps/web/src/lib/format/datetime.ts` に **date-only fail-soft helper** を追加する:

```ts
const JST_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** ISO 文字列を「2026年6月9日」へ整形。無効値は空文字を返し、呼び出し側で行ごと非表示にできる。 */
export function formatJstDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return JST_DATE_FORMATTER.format(d);
}
```

- 既存 `formatJstDateTime` は変更しない（後方互換）。
- 入出力: `string|null|undefined → string`。副作用なし。無効入力で throw しない（WEEKGRD-02: 純粋関数ガードは例外を投げず無効値=空文字返却）。
- `CurrentRevisionCard` は `formatJstDate(diff.capturedAt ?? diff.items[0]?.createdAt)` を使い、空文字なら「取得: …」行ごとレンダリングしない。

---

## 4. 変更対象ファイル一覧（変更種別）

### 実装ファイル（apps/web 表現層）

| # | パス | 種別 | 主な変更 |
|---|------|------|---------|
| 1 | `apps/web/src/lib/format/datetime.ts` | 編集 | `formatJstDate` 追加 |
| 2 | `apps/web/src/components/shell/shell-config.ts` | 編集 | nav label「スキーマ」→「フォーム項目」 |
| 3 | `apps/web/app/(admin)/admin/schema/page.tsx` | 編集 | header/CurrentRevisionCard/REVISIONS/ALIAS HISTORY の文言・生ID撤去 |
| 4 | `apps/web/app/(admin)/admin/schema/history/page.tsx` | 編集 | eyebrow/breadcrumb 日本語化 |
| 5 | `apps/web/src/components/admin/SchemaPurposeExplainer.tsx` | 編集 | eyebrow 日本語化 |
| 6 | `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 編集 | Bulk Resolve/Rollback/DIFF ITEMS/resolve 履歴/DLラベル/toast 日本語化 |
| 7 | `apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx` | 編集 | モーダル見出し・table header 日本語化 |
| 8 | `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx` | 編集 | モーダル見出し日本語化 |
| 9 | `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` | 編集 | aria-label 日本語化 |
| 10 | `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx` | 編集 | eyebrow 日本語化 |
| 11 | `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx` | 編集 | アラート文言・リンク日本語化 |
| 12 | `apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx` | 編集 | KPI label「Schema issues」→「未対応のフォーム項目」 |

> 用語集 SSOT 3ファイル（schemaGlossary.ts / schemaReviewTerms.ts / schemaHistoryGlossary.ts）は §2-10 の通り**据置**（変更なし）。

### テストファイル（同 wave で更新）

| # | パス | 種別 | 変更 |
|---|------|------|------|
| T1 | `apps/web/app/(admin)/admin/schema/page.spec.tsx` | 編集 | 期待文字列を新文言へ（「フォーム項目の対応づけ」「現在のフォーム構成」「フォーム構成の履歴」「対応づけの記録」、生 revisionId 非表示の assert 追加） |
| T2 | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 編集 | label「スキーマ」→「フォーム項目」 |
| T3 | `apps/web/src/components/shell/__tests__/shell-config.spec.tsx` | 編集 | label 期待値更新 |
| T4 | `apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx` | 編集 | nav label 期待値更新（href/badge は不変） |
| T5 | `apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx`（既存があれば） | 編集 | Bulk Resolve 等の期待文字列更新 |
| T6 | `apps/web/src/features/admin/components/_dashboard/__tests__/SchemaAlertCard.spec.tsx`（存在確認） | 編集/新規 | アラート文言更新 |

> 実装時に各 spec の実在を `ls` で確認し、存在しないものは新規作成 or 該当 assert を持つ既存 spec を特定する。

### Playwright（本サイクルでは実行しないが文言整合のため同 wave 更新）

| パス | 変更 |
|------|------|
| `apps/web/playwright/tests/admin-sidebar-public-return-link.spec.ts:177` | 期待 HTML `スキーマ`→`フォーム項目` |
| `apps/web/playwright/tests/admin-pageheader-task-c.spec.ts:40` | heading `スキーマ差分のレビュー`→`フォーム項目の対応づけ` |
| `apps/web/playwright/tests/task15-admin-screenshots.spec.ts:22` | `スキーマ未解決: 5 件`→`未対応のフォーム項目: 5 件` |
| `apps/web/playwright/tests/visual-staging-authenticated/admin-schema-authenticated.spec.ts:25` | heading 期待値更新 |
| `apps/web/playwright/page-objects/AdminSchemaPage.ts:11` | heading 期待値更新 |

> CLAUDE.md invariant #8: 新規テストは `*.spec.{ts,tsx}` のみ。既存ファイル編集なので影響なし。

---

## 5. 不変条件（CONST 由来 + プロジェクト invariant）

1. **API/D1/Form/endpoint surface を変更しない**（CLAUDE.md invariant #5、UI-prototype invariant #1）。`/admin/schema` の href・API パス・レスポンスフィールド名・testid・data 属性・型名・変数名は不変。
2. **OKLch トークン正本**（UI-prototype invariant #2）: 色は触らない。HEX 直書き禁止。本タスクは文言のみなので新規スタイル追加なし。
3. **用語集カード内のみ技術名併記を許容**。それ以外の画面表示から英語テクニカル用語を撤去。
4. **生 revisionId をユーザーに表示しない**（隠す）。内部データとしては保持し描画しないだけ（データ取得ロジック不変）。
5. **DOM contract 保持**: aria-label のテキストは変えるが role/testid/構造は不変。既存テストの testid 参照を壊さない。

---

## 6. DoD（Definition of Done・全フェーズ共通）

- [ ] §2 リネーム表の全行が実装され、画面表示から対象英語表記が消えている（用語集カード内併記を除く）
- [ ] CURRENT REVISION / REVISIONS の生 revisionId が画面に描画されない（`formatJstDate` 経由の日付のみ）
- [ ] サイドバー「スキーマ」が「フォーム項目」になり、href `/admin/schema` は不変
- [ ] ダッシュボードのアラート/KPI が新文言になり testid `admin-kpi-card-schema` 不変
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS（必要なら `--fix`）
- [ ] focused vitest（T1〜T6 該当）PASS
- [ ] `mise exec -- pnpm verify:tokens` PASS（HEX 直書き 0）
- [ ] `git diff --quiet -- apps/api`（API 非接触確認）
- [ ] `grep -rn 'CURRENT REVISION\|FORM SCHEMA GUIDE\|DIFF ITEMS\|Bulk Resolve\|Bulk Rollback\|ALIAS HISTORY' apps/web/src apps/web/app` が用語集ファイル以外で 0 件

---

## 7. SubAgent lane 構成（Phase 4 以降）

| Lane | 担当 Phase | 内容 |
|------|-----------|------|
| Lane A | 4, 5, 6, 7 | テスト作成・実装手順・テスト拡充・カバレッジ |
| Lane B | 8, 9, 10, 11 | リファクタリング・品質保証・最終レビュー・手動テスト（+ Phase 11 補助6成果物） |
| Lane C | 12, 13 | Phase 12 厳格7成果物・Phase 13（user-gated） |

各 Lane は本 shared-context.md を唯一の設計正本として参照する。
