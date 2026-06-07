# Skill Feedback Report — issue-1103

- 区分: 実装仕様書（NON_VISUAL / status: implemented_local_evidence_captured）
- 対象 skill: `task-specification-creator`

---

## 観点別フィードバック

### テンプレート改善

- 特に致命的な不足なし。canonical 9 見出し / Phase 11 evidence テーブル構造（`Classification` / `Path` / `Status`・3 値）の SSOT 固定は機能しており、本タスクでも逐語適用できた。
- 小改善案: 「CSS / 構造的重複の削除タスク」向けに、NON_VISUAL 宣言の代替証跡として **diff（byte 一致）+ cascade 文脈同一の二重証明**を標準テンプレ化すると、視覚不変の根拠記述が一貫する。

### ワークフロー改善

- **核心知見 1**: CSS の構造的重複（同一ブロックの 2 回定義）は、**byte 一致 diff（差分 0）+ cascade 文脈（@layer / @media）同一**の二重証明をしてから削除すると、computed style 不変を数学的に保証できる。byte 一致だけでは「片方が別の @media / layer に内包されていて片方だけ効く」ケースを見落とすため、cascade 文脈同一の確認を必ずセットにする。
  - 本タスクでは両ブロックが同一 `@layer components` 直下・@media 非内包であることを確認し、後発削除で視覚不変を保証した。
- **核心知見 2**: issue 記載の **行番号は陳腐化しやすい**。issue #1103 は対象を `[data-shell]` + typography・行番号 1417/1549 と記すが、現行コードでは parallel-01 P1-1〜P1-5 ブロック全体が 1642-1772 / 1774-1904 へシフトし、`[data-shell="sidebar"]` も 1708/1840 へ移動していた。spec 作成時に**現行コードへ再 grep して範囲を再スコープ**することが必須。

### ドキュメント改善

- **判断例の記録**: issue ラベルが `type:refactoring` / `type:followup`（docs-only ではない）でも、root cause（CSS 構造的重複）の解消にコード変更（重複ブロック削除）が必須のため、CONST_004（ラベルより実態優先）に従い**実装仕様書**として作成した。この判断を index.md の実装区分判定根拠に残し、後続レビューで分類意図が追えるようにした。

---

## promotion 判断

| 知見 | promotion 結果（implemented_local_evidence_captured・2026-06-05） |
| --- | --- |
| CSS 構造的重複は byte 一致 diff + cascade 文脈同一の二重証明後に削除する | **本 wave promotion 不要（N/A）**。docs spec 生成のみで skill template 改訂を要さない。知見として本 report に記録し、同種タスクが再来し汎用パターンとして確立した段階で references への promotion を再判断する |
| issue の行番号は陳腐化しやすく、現行コードへ再 grep して範囲を再スコープする | **本 wave promotion 不要（N/A）**。既存 references（issue 前提の実コード検証 / Issue #1065 由来 L-I1065-001 等）と方向性が重複しており、新規 promotion せず本 report に記録するに留める |

> 本タスクは既存 skill template で扱えるため、上記 2 知見の task-specification-creator references への promotion は本 wave では行わない（N/A・scoped no-op）。`aiworkflow-requirements` は task workflow / artifact inventory への状態同期を行う。commit / push / PR / completed-tasks への physical move は user-gated。
