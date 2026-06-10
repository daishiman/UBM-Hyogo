# Unassigned Task Detection

[実装区分: 実装仕様書]

本タスク（`admin-schema-history-purpose-clarity-and-filter-fix`）のサイクル内未対応・将来候補を current / baseline 分離で記録する。

---

## current（本サイクルで対応すべき残課題）

**0 件。**

本サイクル（Lane A〜E）の AC-1〜AC-10 は 1 実装サイクルに収まる設計であり、本サイクル中に対応すべき未割当タスクはない。TODO / skip / 設計レビュー BLOCKER いずれも 0。

---

## baseline（将来候補・本サイクル外・CONST_007 例外条件 1 該当）

Phase 3 設計レビュー §4 MINOR 指摘を将来タスク候補として記録する。いずれも「今サイクルで対応すると技術的・整合性的に破綻する（API 接触 / 未マージ依存）」ため分離が妥当。

| ID | 課題 | 本サイクルで分離する理由 | 将来の実施場所 |
|----|------|--------------------------|----------------|
| M-1 | `schemaHistoryGlossary`（history 専用）と先例 `schemaGlossary`（`/admin/schema` 専用・未マージ）が将来重複しうる | 本サイクルでは分離が正。両者マージ後に共通用語集へ統合する候補。現時点で統合すると未マージ先例への依存が発生し破綻する | 両者マージ後の別タスク |
| M-2 | API `appliedFilters` の strict 化が web/api 双方で重複定義（shared 型化していない） | 既存設計の踏襲。shared 化は API 接触かつスコープ拡大のため本サイクル外（不変条件 #5 apps/api 非接触に抵触する） | shared 型化の別タスク |

---

## 関連タスク差分確認（重複起票回避）

| 確認対象 | 結果 |
|----------|------|
| 先例 `admin-schema-page-purpose-clarity-ux`（schemaGlossary 出自） | M-1 の統合先候補。未マージのため本サイクルでの統合は不可。重複起票しない（baseline 記録のみ） |
| `parent_workflows`: `issue-777-schema-diff-resolve-history-view` | 履歴 view の機能本体（完成済）。本タスクは表現層改修のみで重複なし |
| `parent_workflows`: `admin-schema-page-prototype-alignment-and-diff-fetch-fix` | `/admin/schema`（diff）側の整合。本タスクは `/admin/schema/history` 側で対象画面が異なり重複なし |
| 既存 open issue | M-1 / M-2 に対応する open issue は確認時点で重複なし。新規 Issue 起票は user-gated（relatedIssue=null） |

---

## まとめ

- current 0 件（本サイクルで対応すべき残課題なし）。
- baseline 2 件（M-1 / M-2）。いずれも将来候補として記録のみ。新規 Issue 起票・タスク化は user-gated。
