# Phase 12: Skill Feedback Report

## テンプレート改善

### 1. spec-from-closed-issue モードの Phase 12 記述指針

spec-from-closed-issue モードでも、`taskType=implementation` かつ同一 cycle で実装可能な場合は、仕様書作成で止めず実コード・実設定・実テストへ反映する必要がある。一方で、実装前の Phase 11/12 は「～を満たすこと」、実装後は「PASS 済み」と状態語彙を切り替えないと drift する。

**反映**: `task-specification-creator/references/phase12-skill-feedback-promotion.md` に closed issue implementation closeout rule を追加し、`spec_created` から `implemented_local_evidence_captured` への同波再分類を必須化した。

### 2. NON_VISUAL 宣言の配置

Phase 11 テンプレートの冒頭に `NON_VISUAL` 宣言ブロック（タスク種別・非視覚的理由・代替証跡方針）を標準欄として設ける。現状は各担当者が自由記述しているため粒度がばらつく。

## ワークフロー改善

### 3. lib 完了済み・env 配線のみ残存タスクの切り分け知見

本タスクでは `security-headers.ts`（lib 層）は実装済みで変更禁止であり、`env.ts` の配線変更のみが新規スコープである。このような「lib SSOT 確定 → 呼び出し層の配線のみ残存」パターンでは、Phase 2〜5 でスコープを明確に「配線層のみ」と記述し、lib 層の変更禁止を冒頭に宣言することで仕様書の誤解を防げる。

### 4. spec-from-closed-issue の issue 状態管理

GitHub issue が CLOSED の場合、Phase 12 の system-spec-update-summary で `issue_status: CLOSED` / `spec_created: true` を明記し、「GitHub state は変更しない」方針を宣言することで、後から仕様書を参照したときに混乱しない。テンプレートに `issue_status` 欄を必須化することを推奨する。

### 5. Production cutover runbook の Phase 12 記載標準化

production 切替が「コード変更を伴わない ops 操作のみ」のタスクでは、`implementation-guide.md` に runbook を必ず含め、`unassigned-task-detection.md` でその runbook への参照を記録する規約を設けると、後続オペレーターが迷わない。

## ドキュメント改善

### 6. 段階導入環境の wrangler.toml vars 表の標準化

staging と production で異なる env var 値を持つ場合、`implementation-guide.md` の Part 2 に環境別 vars 対比表を必ず含める規約とする。本タスクで採用した形式（`[vars]` / `[env.staging.vars]` / `[env.production.vars]` の三段対比）をテンプレート例として登録することを推奨する。

### 7. soft 依存 issue の明示

関連 issue に「soft 依存（ブロッカーではない）」と「独立（スコープ分離）」の 2 種があるが、現状テンプレートにはこの区別欄がない。`system-spec-update-summary.md` の Step 1-C テーブルに「依存関係」列を追加する改善が有効。本タスクで採用した形式（`soft 依存 / 独立`）をそのまま標準とすることを提案する。
