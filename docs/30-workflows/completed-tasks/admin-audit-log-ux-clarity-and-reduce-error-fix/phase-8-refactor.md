# Phase 8 — リファクタリング

> 正本: [shared-context.md](./shared-context.md)。本書は GREEN 後のリファクタ方針を確定する。
> 実装・grep の実行は行わない（**手順記述のみ**）。判定結果は実装ターンで埋める。

---

## 1. リファクタ対象テーブル [Feedback RT-03]

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| RF-1 | `AuditLogPanel.tsx` の結果表示（279-293 `<table className="tbl">` + `AuditRow` 136-170） | 4列テーブル + 行ごとに `JsonDisclosure` を before/after の **2個**描画 | `<ol.admin-audit-timeline>` + `AuditLogCard`（before/after を**1 details に集約**） | 情報設計改善（読める化）。テーブル過密の解消。重複 disclosure の単一化 |
| RF-2 | 404 hint（265-268・インライン JSX 条件） | `error.includes("404")` を JSX 内に直書き | `auditErrorMessage.ts` の `toAuditErrorView()` 純関数へ集約。Banner は view を表示するだけ | エラー分岐ロジックの presentational からの分離。テスト容易性 |
| RF-3 | datalist（210-213・action のみ 2 option） | action preset 2個をインライン | `AUDIT_GLOSSARY` 隣の `AUDIT_ACTION_PRESETS` / `AUDIT_TARGET_TYPE_PRESETS`（auditGlossary.ts）から map 描画 | preset の SSOT 化。targetType datalist 追加 |
| RF-4 | 用語・目的の暗黙知 | 画面に説明ゼロ（コード内コメントもなし） | `AuditPurposeGuide` + `auditGlossary.ts`（plain/technical SSOT） | 用語のユビキタス言語化（DDD）。Lane A/B 双方から import 可 |
| RF-5 | `TagCatalogPanel` props 受領（44/164/205/210） | `initial.items` / `initial.total` を無防備参照 | `const safeItems = initial?.items ?? []` / `safeTotal = initial?.total ?? 0` を関数冒頭に集約し以降は safe 変数を使う | reduce クラッシュ根絶（AC-6）。防御の単一化 |

> RF-1〜RF-4 は Lane A/B、RF-5 は Lane C。いずれも `apps/web` 表現層に閉じる（AC-8）。

---

## 2. OOS-4 判定手順（旧 `.admin-audit-table*` CSS / `.tbl`）

> shared-context §7 OOS-4 / §5-3 に基づく。**実行はしない。実装ターンで以下手順を実行し判定を埋める。**

### 2-1. 全参照確認コマンド

```bash
# 旧 audit テーブル CSS の全参照（src / app 両方）
grep -rn 'admin-audit-table' apps/web/src apps/web/app
# tbl クラスの className 参照
grep -rn 'className="tbl"' apps/web/src apps/web/app
grep -rn 'tbl' apps/web/src/styles/globals.css
```

### 2-2. 仕様策定時点の事前 grep 結果（証跡）

実装ターンの基準とするため、仕様策定時点（dev tip 6581abd 直系）の参照を記録する:

| クラス | 参照箇所（事前 grep） | 判定の見込み |
|--------|----------------------|-------------|
| `.admin-audit-table-scroll`（globals.css 1610） | 定義1（css）+ 使用1（`AuditLogPanel.tsx:278`） | RF-1 でカード化すると `AuditLogPanel.tsx` の使用が消える → **audit 外の参照ゼロ** |
| `.admin-audit-table`（globals.css 1614） | 定義1（css）のみ。**使用箇所ゼロ**（`<table>` は汎用 `.tbl` を使用） | カード化前から未使用 → **削除候補** |
| `.tbl`（汎用ユーティリティ） | `AuditLogPanel.tsx:279` で使用。`.tbl` の **CSS 定義は globals.css に無し**（他所の汎用 or 別 layer）。他画面でも広く使われる汎用クラス | **削除しない（残置）**。audit 専用ではない |

### 2-3. 判定ルール（実装ターンで適用）

1. カード化（RF-1）完了後に §2-1 の grep を**再実行**する。
2. `.admin-audit-table` / `.admin-audit-table-scroll` が **`AuditLogPanel.tsx` 以外から参照ゼロ**かつ AuditLogPanel もカード化で参照を失っていれば → globals.css 1608-1618 の当該 2 ブロックを**削除**する。削除時は `grep -rn 'admin-audit-table' apps/web` がゼロ件であるスクショ/出力を証跡として Phase 11 or 作業ログに残す。
3. もし他画面（例: 別 admin テーブル）から `.admin-audit-table*` 参照が見つかれば → **残置**し、残置理由（参照元パス）を本ファイルに追記する（OOS-4 を未タスクに残す）。
4. `.tbl` は汎用クラスのため **本タスクでは触らない**（audit 専用ではない＝削除すると他画面に波及）。

> 現時点の見込み（事前 grep ベース）: `.admin-audit-table` / `.admin-audit-table-scroll` は audit 専用かつカード化で参照消失 → **削除可能性が高い**。ただし最終判定は実装ターンの再 grep に従う（証跡優先）。

---

## 3. duplicate（重複）の確認方針

| 重複候補 | 確認方針 | 期待 |
|---------|---------|------|
| mask ロジック | `AuditLogCard` は既存 exported `maskAuditJson` / `maskAuditText` / `summarizeAuditJson` を**再利用**し、マスク処理を再実装しない | カード内に新たな mask 正規表現を増やさない（[FB-SDK-07-1] 既存再利用優先）。`grep -rn 'masked-email\|PII_KEY_PATTERN' apps/web/src/components/admin` で mask 定義が AuditLogPanel.tsx 1箇所に留まることを確認 |
| batchId 抽出 | `extractBatchId`（既存 exported）を AuditLogCard が再利用 | batchId 抽出ロジックを二重定義しない |
| 404/error 文言 | 404 hint 文言を `auditErrorMessage.ts` に一本化（RF-2） | AuditLogPanel JSX とエラー関数に同文言が二重に残らない |
| appliedFilters の期間整形 | 日付整形を `auditAppliedFilters.ts` 内で完結 or 既存 `formatJst` 再利用 | 期間表示ロジックを複数箇所に散らさない |
| 防御ガード | `safeItems` / `safeTotal` を1箇所で算出し以降参照 | `?? []` / `?? 0` を 164/205/210 に散在させない（RF-5 で関数冒頭集約） |

---

## 4. navigation drift の確認方針

| 観点 | 確認方針 | 期待 |
|------|---------|------|
| audit へのリンク変更なし | admin shell nav の `/admin/audit` エントリは本タスクで触らない | nav の href / ラベルが drift していないこと（`grep -rn '/admin/audit' apps/web/src/components/admin` で nav 定義を確認） |
| reset リンク維持 | AuditLogPanel の `data-role="reset"` の `/admin/audit` リンク（252）を維持 | リセット導線が壊れない |
| catalog 導線変更なし | `/admin/tags/catalog` への nav は本タスクで変更しない（OOS-3 は別 WF） | catalog 防御ガードのみで導線は drift しない |
| pagination href | `buildAuditHref` のシグネチャ維持（AC-7） | 次ページ href の query 構築が drift しない（既存 spec が担保） |

---

## 5. リファクタ後の不変条件再確認

- 既存 exported 純関数（`maskAuditJson` / `summarizeAuditJson` / `formatJst` / `maskAuditText` / `buildAuditHref` / `extractBatchId`）の**シグネチャ不変**（AC-7）。
- 機械可読 id（`data-component="admin-audit"` / `data-testid="audit-batch-id"` / `data-role="reset"`）**維持**。新規要素のみ新規 id（不変条件8）。
- HEX ゼロ・OKLch トークンのみ（AC-9）。新規 CSS は `var(--ubm-*)` / `color-mix(in oklch, ...)`。
