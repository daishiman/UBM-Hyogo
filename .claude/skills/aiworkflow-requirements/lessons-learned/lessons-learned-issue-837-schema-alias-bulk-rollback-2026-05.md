---
task: issue-837
recorded: 2026-05-24
topics: [schema-alias, bulk-rollback, fan-out, concurrency, transaction-boundary, d1-access-boundary, automation-30, const-004, const-005, visual-evidence, user-gate, template-symmetry, naming-consistency, ssot]
related-references:
  - references/workflow-issue-837-schema-alias-bulk-rollback-artifact-inventory.md
  - references/task-workflow-active.md
  - docs/30-workflows/issue-837-schema-alias-bulk-rollback/
  - docs/30-workflows/issue-837-schema-alias-bulk-rollback/outputs/phase-12/skill-feedback-report.md
  - docs/30-workflows/unassigned-task/serial-05-step-03-followup-006-schema-alias-bulk-rollback.md
  - apps/web/src/lib/admin/api.ts
  - apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx
  - apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts
  - apps/web/src/components/admin/SchemaDiffPanel.tsx
  - docs/00-getting-started-manual/specs/01-api-schema.md
  - docs/00-getting-started-manual/specs/11-admin-management.md
classification:
  - workflow/spec-created-misclassification-recovery
  - design/transaction-boundary-under-d1-access-ban
  - workflow/template-symmetry-clone
  - testing/visual-evidence-filename-ssot
---

# Lessons Learned — Issue #837 Schema Alias Bulk Rollback (2026-05)

Issue #837「schema alias 複数一括 rollback」は、既存 single rollback endpoint `POST /admin/schema/aliases/:aliasId/rollback`（#778）を `apps/web` の client-side bounded fan-out で呼び出す client-only 拡張として実装した。兄弟 #776（bulk resolve）の対称機能。本タスクで得た 4 教訓を classification-first で整理する。出典は `docs/30-workflows/issue-837-schema-alias-bulk-rollback/outputs/phase-12/`（特に `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）と実装差分。

---

## L-837-001. workflow / `spec_created` 誤分類の同一サイクル是正（CONST_004/005 gate）

### 状況
初稿は `implementation` taskを「仕様書だけ作成して `spec_created` で close-out」していた。

### 何が起きたか
automation-30 再検証で、`implementation` task を実コードなしの `spec_created` で閉じる記述は CONST_004（監査は並列・編集は直列で完遂）/ CONST_005（検出した改善点は今回サイクル内で完了）に不準拠と判定された。仕様書と「コード未実装」の矛盾が残ったまま Phase 12 が完了扱いになる状態だった。

### 対応
- 同一サイクル内で `apps/web` 実装・focused tests・typecheck・manual specs（01/11）・aiworkflow ledgers・source unassigned consumed trace まで昇格。
- `workflow_state` を `spec_created` → `implemented_local_evidence_captured` に再分類し、`index.md` / `artifacts.json` / `outputs/artifacts.json` の 3 箇所を一致させた。
- runtime screenshot / staging smoke / commit / push / PR / Issue mutation のみ user-gated evidence として残した。

### 再発防止
- Phase 12 close-out 時、`taskType: implementation` なのに changed-files に `apps/web` / `apps/api` 実コードが 0 件なら `spec_created` で閉じない。`implemented_local_evidence_captured` 以上へ昇格するか、明示的に `spec_created` が正である根拠（条件付き実装 gate 等）を `phase12-task-spec-compliance-check.md` に記載する。
- このルールは task-specification-creator SKILL.md v2026.05.19 entry に成文化済み。本教訓はその発火実例として参照する。

### 関連 path
- `docs/30-workflows/issue-837-schema-alias-bulk-rollback/index.md`（workflow_state 再分類）
- `docs/30-workflows/issue-837-schema-alias-bulk-rollback/outputs/phase-12/phase12-task-spec-compliance-check.md`

---

## L-837-002. 設計 / D1 直接アクセス禁止下の transaction 境界 — per-alias 独立 commit 採用・全件 atomic 不採用

### 状況
「複数 alias をまとめて rollback したい」という要求に対し、全件 atomic（1 件失敗で全件巻き戻し）にすべきか迷いが残りやすい設計判断だった。

### 何が起きたか
不変条件7（`apps/web` から D1 binding 直接アクセス禁止）により、client 層から D1 横断 transaction を張れない。Workers の single rollback endpoint は 1 リクエスト 1 alias の atomic 実行で、これを `apps/web` から束ねる手段は client-side fan-out のみ。全件 atomic を成立させるには新 batch endpoint + D1 schema 変更が必要で、本タスク不変条件（API/D1 変更なし）と衝突する。

### 対応
- **per-alias 独立 commit を採用**。各 `rollbackSchemaAlias` 呼び出しが alias 単位で atomic。1 件の `version_mismatch`(409) が他の成功 row を巻き戻さない（AC-2）。
- partial failure は「成功分は確定・失敗分のみ `error.kind` 付きで modal に残し再取消導線」を出す設計に固定（FR-7）。
- `concurrency` 既定 8 / `BULK_ROLLBACK_MAX_ROWS=50` で律速。50 件超は UI で分割実行を強制。
- 全件 atomic 不採用理由を index.md アーキテクチャ決定表 → implementation-guide.md まで一貫して引用。

### 再発防止
- 「bulk = atomic」と暗黙に仮定しない。`apps/web` 起点の bulk 操作は **既存 per-resource endpoint の client fan-out が既定**で、atomic が要件なら API/D1 変更を伴う別タスクへ分離する。
- bulk 操作 spec の Phase 1 で「transaction 境界 / partial failure 時の成功分の扱い / 上限件数」を必須決定項目として明記する。

### 関連 path
- `apps/web/src/lib/admin/api.ts`（`rollbackSchemaAliasBulk` / `BULK_ROLLBACK_MAX_ROWS` / error.kind マッピング）
- `apps/web/src/components/admin/hooks/useSchemaDiffBulkRollbackSelection.ts`（partial / all-fail / 例外のロック解放経路）
- `docs/00-getting-started-manual/specs/01-api-schema.md`

---

## L-837-003. workflow / 兄弟テンプレートの対称複製 + 命名一貫性表

### 状況
#776（bulk resolve）が既に client-side bounded fan-out + modal + selection hook を確立していた。

### 何が起きたか
#837 は #776 の逆操作（確定の取り消し）であり、構造をほぼ 1:1 で複製できた。Phase 1 で新旧命名を 1:1 対応させる表を先に固定したことで、Phase 2 以降の型名・component 名・hook 名の設計衝突を未然に防げた。

### 対応
- 対応表: `postSchemaAliasBulk`→`rollbackSchemaAliasBulk` / `SchemaAliasBulkRowResult`→`SchemaAliasRollbackBulkRowResult` / `SchemaDiffBulkResolveModal`→`SchemaDiffBulkRollbackModal` / `useSchemaDiffBulkSelection`→`useSchemaDiffBulkRollbackSelection`。
- `runWithConcurrency` は #776 で確立済の private util を再利用し重複定義しない（Phase 9 gate に `grep -rn "runWithConcurrency"` で 1 定義のみ確認を組み込み）。

### 再発防止
- 既存兄弟機能の対称機能を起票する際は、Phase 1 で「旧→新 命名 1:1 表」を成果物に含める。これが命名衝突と SSOT 違反（util 重複定義）の予防 gate になる。

### 関連 path
- `apps/web/src/components/admin/SchemaDiffBulkRollbackModal.tsx`
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`（HistoryPane への bulk rollback mode 統合）
- `docs/00-getting-started-manual/specs/11-admin-management.md`

---

## L-837-004. テスト / VISUAL 証跡ファイル名の SSOT 化

### 状況
VISUAL task の screenshot / 補助証跡ファイル名が複数 Phase 文書に散在していた。

### 何が起きたか
当初 `phase-09-quality-assurance.md` が NFR-5 証跡を `outputs/phase-11/nfr5-performance.md` と記載していたが、`artifacts.json` の planned 名は `perf-30rows.md` で不一致だった。実 capture 前に表記ゆれが発生していた。

### 対応
- `phase-09` / `phase-11` / `artifacts.json` の canonical を `perf-30rows.md` に統一。
- screenshot canonical 名（`bulk-rollback-{select,modal,partial-failure,success}-{desktop-1280,mobile-375}.png`）を `artifacts.json` の `planned_visual_evidence_files` で先行固定し、implementation-guide の参照と完全一致させた（FB-VISUAL-CAP-001）。

### 再発防止
- VISUAL task は証跡ファイル名を task root 生成時に `artifacts.json` 1 箇所で固定し、各 Phase 文書はそこを引用する（手書きで再記述しない）。runtime capture が user-gated でも、名前だけは事前確定できる。

### 関連 path
- `docs/30-workflows/issue-837-schema-alias-bulk-rollback/artifacts.json`（`planned_visual_evidence_files`）
- `docs/30-workflows/issue-837-schema-alias-bulk-rollback/outputs/phase-12/implementation-guide.md`（視覚証跡セクション）

---

## 横断サマリ

| 教訓 ID | classification | 主要 gate / artifact |
|---------|----------------|----------------------|
| L-837-001 | workflow/spec-created-misclassification-recovery | `taskType=implementation` + changed-files に実コード 0 件なら `spec_created` で閉じない |
| L-837-002 | design/transaction-boundary-under-d1-access-ban | per-alias 独立 commit / 全件 atomic は API+D1 変更タスクへ分離 |
| L-837-003 | workflow/template-symmetry-clone | 兄弟機能の対称複製は Phase 1「旧→新 命名 1:1 表」+ util SSOT grep gate |
| L-837-004 | testing/visual-evidence-filename-ssot | 証跡ファイル名は `artifacts.json` 1 箇所固定・各 Phase は引用 |

4 教訓は Phase 12 `skill-feedback-report.md` と対応する。schema alias の後続 bulk 操作（bulk delete / bulk update 等）では本ファイルの L-837-002（transaction 境界）と L-837-003（対称複製）を起点に Progressive Disclosure で辿ること。
