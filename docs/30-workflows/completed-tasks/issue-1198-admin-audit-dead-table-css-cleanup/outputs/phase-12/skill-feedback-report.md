# Skill Feedback Report — issue-1198

- 区分: 実装仕様書（NON_VISUAL / **implemented_local_evidence_captured**）
- 対象 skill: `task-specification-creator`

---

## 観点別フィードバック

### テンプレート改善

- 特に致命的な不足なし。canonical 9 見出し / Phase 11 evidence テーブル構造（`classification` / `path` / `status`）/ strict 7 inventory の SSOT 固定は機能しており、本 NON_VISUAL / dead code cleanup タスクでも逐語適用できた。
- 小改善案: 「dead code cleanup（CSS / export 削除）」タイプの NON_VISUAL タスクで、grep gate を主証跡とする際の「定義ファイル自身を `--include` で除外する」注意点を phase-1 / phase-11 テンプレに boilerplate として 1 行載せると、後述の誤判定再発を構造的に防げる。

### ワークフロー改善

- **核心知見（CSS dead-code 判定 grep の落とし穴）**: 親 workflow `admin-audit-log-ux-clarity-and-reduce-error-fix` の Phase 8 OOS-4 では、dead CSS 判定の grep が **CSS 定義ファイル（`globals.css`）自身のヒットを「参照あり」と誤カウント**し、3 セレクタを「残置（参照あり）」へ誤分類した。その結果、削除可能な dead CSS の削除が見送られた。
  - → **改善**: CSS（あるいは任意の宣言）の「未参照判定」grep では、**定義元ファイル（`.css`）を `--include` 等で必ず除外する**。除外しないと定義行自身がヒットし続け、永久に「参照あり」と誤判定する。本タスクでは `grep -rn ... apps/web/src apps/web/app --include="*.tsx" --include="*.ts"`（`.css` を含めない）で「コンポーネントからの参照」のみを数え、定義ファイル自身を除外した。これにより参照 0 件が独立検証で確定した。
  - → **追加の注意**: 出力ファイル名（例: Playwright スクショ名 `admin-audit-filtered.png`）が grep にヒットしても CSS クラスセレクタ参照ではない。「文字列の部分一致」と「実際のクラス参照」を区別する手順を明示する。

### ドキュメント改善

- **判断例の記録**: GitHub Issue #1198 の既定ラベルは `type:refactoring`（CSS 削除）だが、root cause（カード化移行で未参照化した dead CSS の残置 = SSOT / コード衛生違反）の解消にはコード変更（`globals.css` の 3 ブロック削除）が必須のため、CONST_004（ラベルより実態優先）に従い **実装仕様書** として作成した。この分類昇格の意図を artifacts.json `spec_classification_note` に残し、後続レビューで追えるようにした。
- **行番号アンカーの stale 化**: issue 本文の「行 1602-1618」は後続コミットでファイルが伸長し stale（現行 2023-2039）。削除範囲は **セレクタ名でアンカー**する方針を明記した。CLOSED issue を現行コードへ再スコープする際の典型パターンとして記録価値あり。

---

## promotion 判断

| 知見 | promotion 判断 |
| --- | --- |
| CSS dead-code 判定 grep は定義ファイル（.css）自身を除外しないと永久に「参照あり」になる（親 Phase8 OOS-4 誤判定の再発防止） | **同一 wave で promotion 済み**。`task-specification-creator/references/patterns-validation-and-audit.md` に「CSS dead-code grep は consumer 側に限定する」パターンを追加し、`SKILL.md` / `SKILL-changelog.md` に履歴を反映 |
| docs-only / refactoring ラベル → CONST_004 で実装仕様書化 | **既 promotion 済み知見の再適用**（親 issue-1065 で `phase12-skill-feedback-promotion.md` に蓄積済み）。本タスクは同パターンの追加事例として記録のみ |
| CLOSED issue の行番号アンカー stale → セレクタ名アンカーへ訂正 | **記録のみ**（`closed-issue-canonical-workflow-recovery.md` の既存運用に沿った適用例。今回の新規 promotion 対象は CSS dead-code consumer grep に限定） |

> 本タスクの skill-feedback には新規の致命的不足はない。一方で、CSS dead-code grep の定義ファイル除外は再発防止効果が高く、task-specification-creator へ最小 promotion 済み。`aiworkflow-requirements` は IPC/API/state SSOT 対象でなく apps/web 表現層 CSS のため、公開契約仕様は N/A とし、workflow discovery / ledger 同期のみ実施する。
