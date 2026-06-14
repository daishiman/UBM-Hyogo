# Phase 5: 実装

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-ADMIN-SCHEMA-TERMINOLOGY-CLARITY-001 |
| Phase | 5 / 13（実装） |
| タスク種別 | UI task（VISUAL / implemented_local_evidence_captured） |
| 設計正本 | [shared-context.md](../../shared-context.md) |

## 目的

[shared-context.md §2](../../shared-context.md) リネーム正本テーブルの全行を、変更ファイルごとの実装手順へ再構成する。各ファイルの Before/After 文字列を明示し、[§3](../../shared-context.md) の `formatJstDate` 追加手順、実装順序、DOM contract 保持制約を確定する。新規作成ファイルは作らず、編集 12 ファイル + テスト + Playwright 文字列の更新に限定する。

## 実行タスク

1. **helper 追加（datetime.ts）**: `apps/web/src/lib/format/datetime.ts` に `JST_DATE_FORMATTER` 定数と `formatJstDate(iso): string` を追加する。既存 `formatJstDateTime` は 1 行も変更しない。`formatJstDate` は fail-soft（`!iso` または `Number.isNaN` で `""` 返却、throw しない）。
2. **shell-config**: `shell-config.ts:65` の label `"スキーマ"` → `"フォーム項目"`。`href: "/admin/schema"`（:64）は変更しない。
3. **page.tsx ヘッダー**: §2-1 の :150 eyebrow → `"管理 / フォーム項目"`、:151 title → `"フォーム項目の対応づけ"`、:152 description → §2-1 指定文、:153 breadcrumb label → `"フォーム項目"`。
4. **page.tsx CurrentRevisionCard（:29-60）**: §2-2 の通り :38 eyebrow → `"現在のフォーム構成"`、:40-42 を `<h2>最新版</h2>`（生 `{revisionId}` 描画を削除）、:44 Chip → `"適用中"`、:47 説明文置換、:48-50 を `formatJstDate(capturedAt)` 経由の `（取得: …）` のみとし `hash` 生表示を撤去。空文字なら取得行ごと非レンダリング。
5. **page.tsx RevisionAndAliasHistory（:89-142）**: §2-3 の通り :96/:98 → `"フォーム構成の履歴"`、:105 を `<span>最新版</span>`（生 revisionId 削除）、:107 Chip → `"適用中"`、:110 → `件の変更点`、:120 → `"対応づけの記録"`。alias 行 :131-133 のデータ値は据置。
6. **history/page.tsx**: :27 eyebrow → `"管理 / フォーム項目"`、:32 breadcrumb → `"フォーム項目"`。
7. **SchemaPurposeExplainer.tsx**: :27 eyebrow → `"フォーム項目の対応づけガイド"`。FLOW_STEPS/glossary は据置。
8. **SchemaDiffPanel.tsx**: §2-6 の全行を置換（:264/:266-273/:335-336/:351/:366/:436/:723/:782/:798/:818/:978-979）。`backfill が走り` → `過去の回答にもさかのぼって反映されます`。`TYPE_LABELS` は据置。
9. **SchemaDiffBulkResolveModal.tsx**: §2-7 の :51/:54/:68-71 を日本語化（`questionId`→`設問の元ID`, `stableKey`→`項目キー`）。
10. **SchemaDiffBulkRollbackModal.tsx**: 実文字列を `grep -n 'Bulk Rollback\|rollback\|stableKey' apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx` で確認し、§2-7 方針（`Bulk Rollback…`→`まとめて取り消し…`）で日本語化する。
11. **SchemaDiffHistoryPanel.tsx**: :208 aria-label `"stableKey の変更"` → `"項目キーの変更"`（role/testid 不変）。
12. **SchemaHistoryPurposeExplainer.tsx**: :15 eyebrow `"ALIAS HISTORY"` → `"対応づけの記録"`。
13. **SchemaAlertCard.tsx**: :17/:20/:27 を §2-9 の文言に置換。
14. **KpiGrid.tsx**: :25-28 label `"Schema issues"` → `"未対応のフォーム項目"`。testid `admin-kpi-card-schema` は据置。
15. **テスト更新**: T1〜T6 を Phase 4 設計どおり新文言へ更新する。
16. **Playwright 文字列更新**: [shared-context.md §4](../../shared-context.md) の Playwright 5 ファイル（spec 4 + page-object 1）の期待 HTML/heading を新文言へ更新する（本サイクルでは実行しないが文言整合のため同 wave）。

## 参照資料

- [shared-context.md](../../shared-context.md) — §2 リネーム正本 / §3 helper / §4 変更ファイル一覧 / §5 不変条件
- [phase-2.md](../phase-2/phase-2.md) — 既存コンポーネント再利用・DOM contract 設計
- [phase-4.md](../phase-4/phase-4.md) — テスト設計（実装後 Green 化対象）

## 成果物

- ファイルごとの Before/After 実装手順
- `formatJstDate` 追加コード手順
- 実装順序の確定
- DOM contract 保持制約

### `formatJstDate` 追加手順（§3 転記）

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

- 既存 `formatJstDateTime` は不変（後方互換）。
- 入出力: `string|null|undefined → string`。副作用なし。無効入力で throw しない。

### Before/After 主要行（抜粋）

| ファイル:行 | Before | After |
|------------|--------|-------|
| shell-config.ts:65 | `"スキーマ"` | `"フォーム項目"` |
| page.tsx:151 | `"スキーマ差分のレビュー"` | `"フォーム項目の対応づけ"` |
| page.tsx:38 | `"CURRENT REVISION"` | `"現在のフォーム構成"` |
| page.tsx:40-42 | `<h2 className="mono">{revisionId}</h2>` | `<h2>最新版</h2>` |
| page.tsx:44 | `active` | `適用中` |
| page.tsx:110 | `{diff.total} diff items` | `{diff.total} 件の変更点` |
| SchemaDiffPanel:798 | `"Bulk Resolve"` | `"まとめて対応づけ"` |
| SchemaDiffPanel:351 | `"Bulk Rollback"` | `"まとめて取り消し"` |
| SchemaAlertCard:17 | `"スキーマ未解決: {count} 件"` | `"未対応のフォーム項目: {count} 件"` |
| KpiGrid:25-28 | `"Schema issues"` | `"未対応のフォーム項目"` |

> 全 Before/After は [shared-context.md §2-1〜§2-9](../../shared-context.md) を正本とし、本表は抜粋。

### 新規作成ファイル: なし

編集ファイル一覧（[shared-context.md §4](../../shared-context.md) 転記）:

1. `apps/web/src/lib/format/datetime.ts`（`formatJstDate` 追加）
2. `apps/web/src/components/shell/shell-config.ts`
3. `apps/web/app/(admin)/admin/schema/page.tsx`
4. `apps/web/app/(admin)/admin/schema/history/page.tsx`
5. `apps/web/src/components/admin/SchemaPurposeExplainer.tsx`
6. `apps/web/src/components/admin/SchemaDiffPanel.tsx`
7. `apps/web/src/components/admin/SchemaDiffBulkResolveModal.tsx`
8. `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx`
9. `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx`
10. `apps/web/src/components/admin/SchemaHistoryPurposeExplainer.tsx`
11. `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx`
12. `apps/web/src/features/admin/components/_dashboard/KpiGrid.tsx`

> 用語集 SSOT 3ファイル（schemaGlossary.ts / schemaReviewTerms.ts / schemaHistoryGlossary.ts）は §2-10 の通り据置（変更なし）。

### 実装順序（依存順）

1. `datetime.ts`（helper を先に作り page.tsx が参照可能にする）
2. `shell-config.ts`
3. `page.tsx`（ヘッダー → CurrentRevisionCard → RevisionAndAliasHistory）
4. 各コンポーネント（SchemaPurposeExplainer / SchemaDiffPanel / 2 モーダル / HistoryPanel / HistoryPurposeExplainer）
5. ダッシュボード（SchemaAlertCard / KpiGrid）
6. spec 更新（T1〜T6）
7. Playwright 文字列更新

### DOM contract 保持制約

- testid / role / href / data 属性 / 変数名 / 型名 / API フィールド名は不変（[shared-context.md §5](../../shared-context.md)）。
- aria-label はテキストのみ変更し role/構造は不変。
- 生 revisionId / hash はデータとして保持し、描画のみ削除（データ取得ロジック不変）。

## 統合テスト連携

- 実装後に Phase 4 の T1〜T6 と `formatJstDate` 単体テストが Green になることを focused vitest で確認する。
- `git diff --quiet -- apps/api` で API 非接触を機械確認する（AC-11）。
- `mise exec -- pnpm verify:tokens` で HEX 直書き 0 を回帰確認する。

## 完了条件

- [ ] `formatJstDate` が追加され既存 `formatJstDateTime` が不変
- [ ] §2 リネーム表の全 12 ファイルの Before/After が実装手順化されている
- [ ] 新規作成ファイルが「なし」と明記され編集 12 ファイルが一覧化されている
- [ ] 生 revisionId / hash の描画削除手順（CurrentRevisionCard / RevisionAndAliasHistory）が明記されている
- [ ] BulkRollbackModal の grep 確認手順が実装手順に含まれている
- [ ] 実装順序（helper → shell-config → page.tsx → 各コンポーネント → dashboard → spec → Playwright）が確定している
- [ ] DOM contract 保持（testid/role/href/data 属性 不変）が制約として明記されている
