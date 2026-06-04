# Skill Feedback Report — issue-1065

- 区分: 実装仕様書（NON_VISUAL / spec_created）
- 対象 skill: `task-specification-creator`

---

## 観点別フィードバック

### テンプレート改善

- 特に致命的な不足なし。canonical 9 見出し / Phase 11 evidence テーブル構造（`Classification` / `Path` / `Status`・3 値）の SSOT 固定は機能しており、本タスクでも逐語適用できた。
- 小改善案: 「docs-only ラベル issue だが root cause 解消にコード変更が要る」ケースの判断手順（CONST_004 で実装仕様書化）を、phase-1 requirements テンプレに boilerplate 例として 1 行載せると判断が速い。

### ワークフロー改善

- **核心知見**: issue / unassigned-task の前提が**実コードと乖離**していた。issue は「`parseShellCollapsedCookie` が cookie ヘッダ全体を受け取り、`readCollapsedFromCookieString` と別契約」と記述するが、現行コードでは前者は **cookie 値のみ**を受ける value parser で、後者はその**直接 alias（同一関数）**。ヘッダ vs 値の契約差は存在しなかった。
  - → **改善**: spec 作成時（Phase 1-2）に「現行コードを必ず Read して issue 前提を検証する」ステップを明示的に置く。issue 記述を鵜呑みにすると、存在しない契約差を前提に過剰スコープな設計を生む。本タスクでは現行コードを読み、前提誤りを implementation-guide に訂正注記として残し、次の人が再び drift と誤認しないようにした。

### ドキュメント改善

- **判断例の記録**: GitHub Issue ラベルが `docs-only` でも、root cause（SSOT 違反 = dead alias 残存）の解消にはコード変更（alias 3 件削除）が必要なため、CONST_004（ラベルより実態優先）に従い**実装仕様書**として作成した。この「ラベル docs-only → 実態は実装仕様書」昇格の判断を artifacts.json `spec_classification_note` に残し、後続レビューで分類の意図が追えるようにした。
  - → skill references に同種の判断例（ラベルと実態の乖離時の分類昇格）を 1 ケース蓄積する価値あり。

---

## promotion 判断

| 知見 | promotion 結果（実装/同期 wave・2026-06-03 確定） |
| --- | --- |
| issue 前提と実コード乖離 → 現行コード検証ステップ必須 | **promoted** → `task-specification-creator/references/phase-template-phase1.md` §「Issue / unassigned-task 前提の実コード検証（Issue #1065 対策）」新設 + `references/patterns-lessons-and-pitfalls.md` L-I1065-001 |
| docs-only ラベル → CONST_004 で実装仕様書化 | **promoted** → `references/phase12-skill-feedback-promotion.md` Applied Examples（Issue #1065 行）+ `references/patterns-lessons-and-pitfalls.md` L-I1065-002 |

> 実装/同期 wave（2026-06-03）で上記 2 知見を `task-specification-creator` へ promotion 済み（`SKILL-changelog.md` v2026.06.03-issue1065-... / `SKILL.md` 先頭 / `references/resource-map.md` 変更履歴に記録）。`aiworkflow-requirements` は IPC/API/state SSOT 対象でなく apps/web 内部 helper のため N/A（scoped no-op・確定）。commit / push / PR / completed-tasks への physical move は user-gated。
