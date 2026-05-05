# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合（U-UT01-07） |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-30 |
| 前 Phase | 11 (NON_VISUAL evidence / docs-only smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| タスク分類 | docs-only-design-reconciliation（spec_created） |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created（docs-only 設計 reconciliation のため、本ワークフローでは `completed` へ昇格させない） |
| user_approval_required | false |

## 目的

U-UT01-07（`sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の整合）の Phase 1〜11 成果物を、workflow-local 文書と `.claude/skills/aiworkflow-requirements/indexes/` に反映する。本タスクは GitHub Issue #261（CLOSED）の「タスク仕様書作成」段階に閉じており、`metadata.workflow_state` は `spec_created` を維持する。Phase 12 の必須 5 タスクと必須 7 outputs を完了し、Phase 13（PR 作成）の承認ゲート前提を整える。

本ワークフローは **docs-only-design-reconciliation** であり、物理 DDL 発行・migration 追加・コード変更は一切含まない（それらは下流 UT-04 / UT-09 のスコープ）。

## 必須 5 タスク（task-specification-creator skill 準拠）

1. **実装ガイド作成（Part 1: 中学生レベル / Part 2: 技術者レベル）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A 中心 / Step 2 は条件付き N/A）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

## workflow_state 取り扱い【重要】

- 本タスクの taskType は **docs-only-design-reconciliation**。設計 reconciliation の成果物のみで、物理実装を伴わない。
- Phase 12 完了後も:
  - `artifacts.json`（root）の `metadata.workflow_state` は **`spec_created` を維持**（`completed` に書き換えない）。
  - `phases[*].status` は当該 Phase の docs 完了に応じて `completed` に更新してよい。
  - `metadata.docsOnly` は **true**。
- docs-only / spec_created タスクは workflow root を据え置き、`phases[].status` のみ更新するルール（phase-12-pitfalls.md「設計タスクの workflow root を completed にしてしまう」漏れパターン）に厳格に従う。
- 本タスクで決定した canonical name / マッピング / 後方互換戦略は **下流 UT-04 / UT-09 が参照する設計入力** であり、本タスク自体が implemented 状態になることはない。

## 実行タスク（Phase 12 内訳）

- **Task 12-1**: 実装ガイド（Part 1 中学生 / Part 2 技術者）を 1 ファイルに統合作成。`sync_log` / `sync_job_logs` / `sync_locks` の関係を一般用語と技術用語の両方で説明。
- **Task 12-2**: system-spec-update-summary を Step 1-A 中心で構造化。`.claude/skills/aiworkflow-requirements/references/database-schema.md` に既存 sync 系記述がなければ「既存 drift なし」と明記し、canonical 追補の要否は UT-04 に委譲する。Step 2 は新規 TS 型・API・IPC 追加なしのため N/A。
- **Task 12-3**: documentation-changelog を出力。本ワークフローで作成した文書一覧（13 Phase + index + artifacts + outputs）と更新履歴を記録。
- **Task 12-4**: unassigned-task-detection を必ず出力。`idempotency_key` / `processed_offset` 物理追加判定タスクは UT-04 内で扱うため新規起票せず、UT-09 実装受け皿未確定のみ follow-up 化する。
- **Task 12-5**: skill-feedback-report を改善点なしでも必ず出力。docs-only-design-reconciliation の運用知見を skill へフィードバック。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md | 原典 / scope / 完了条件 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造定義 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 漏れパターン / 苦戦防止 Tips |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 実装ガイド執筆ガイド |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md | 完了チェック |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 正本（Step 1-A 同期先） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | 論理 13 カラム正本 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理側現状（Read のみ） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 物理利用フロー（Read のみ） |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-12.md | 構造リファレンス |

## 実行手順

### ステップ 1: 実装ガイド作成（Task 12-1）

`outputs/phase-12/implementation-guide.md` に Part 1（中学生レベル / 例え話 3 つ以上）と Part 2（技術者レベル）の 2 部構成で記述する。

- Part 1: 「ノート」「正本」「概念名と背番号」の例え話で `sync_log`（概念）/ `sync_job_logs`（ledger）/ `sync_locks`（ロック）の責務分離を説明。
- Part 2: canonical 名の決定根拠（物理 canonical 採択）、論理 13 カラム → 物理 N:M マッピング表、後方互換戦略 4 案比較、UT-04 / UT-09 への引き継ぎ事項。

### ステップ 2: システム仕様更新（Task 12-2）

`outputs/phase-12/system-spec-update-summary.md` に以下を記述する。

**Step 1-A: spec_created タスク記録 + 関連 doc リンク + indexes**

- `.claude/skills/aiworkflow-requirements/references/database-schema.md` の sync 系記述に対する grep 実測を提示する。現行ファイルで sync 系記述 0 件なら「既存 drift なし」とし、canonical 追補は UT-04 で判定する。
- 本ワークフローでは新規 DDL / API / shared schema を追加しないため、`database-schema.md` 本文の DDL 追補は **本タスクの spec PR では行わない**。
- 同期対象の indexes は `resource-map` / `quick-reference` に U-UT01-07 workflow 導線を追加する。`topic-map` / `keywords` は references 本文更新なしのため本タスクでは差分対象外。
- 原典 unassigned `docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md` の状態を `unassigned` → `spec_created` に更新する記載を含める。

**Step 1-B: 実装状況テーブル更新（spec_created）**

- 原典 unassigned doc / 親タスク UT-01 の関連タスク表で本タスクを `spec_created` に更新（実適用は Phase 13 PR で）。
- 下流 UT-04 / UT-09 の index.md（存在すれば）に「上流 reconciliation 済」を反映する diff plan のみ記載。

**Step 1-C: 関連タスクテーブル更新**

- U-UT01-08（enum 統一）/ U-UT01-09（retry 統一）の直交関係を本タスク成果物本文で再確認。

**Step 2（条件付き）: 新規インターフェース追加時のみ → 本タスクは N/A**

- 本タスクは **設計 reconciliation のみ**で、TypeScript インターフェース・API endpoint・IPC 契約・UI route の新規追加は **0 件**。
- DDL も発行しないため、`database-schema.md` への DDL 追記も本タスクスコープ外。
- よって **Step 2 = N/A** と明記する（BLOCKED ではなく N/A：API/D1 schema/IPC/UI/auth/Cloudflare のドメイン仕様に touch しないため）。

### ステップ 3: ドキュメント更新履歴作成（Task 12-3）

`outputs/phase-12/documentation-changelog.md` を出力。本ワークフローで新規作成した文書（13 Phase + index + artifacts + outputs/phase-01〜13）を一覧化し、workflow-local 同期と global skill sync を別ブロックで記録する。

### ステップ 4: 未割当タスク検出レポート（Task 12-4 / 0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を出力。本タスクから派生する追加 unassigned task の有無を判定し、以下を明記する:

- `idempotency_key` 物理追加判定 → **UT-04 内で扱う**ため新規起票しない
- `processed_offset` 物理追加判定 → **UT-04 内で扱う**ため新規起票しない
- enum 値 canonical 決定 → **U-UT01-08（既存）**で扱う
- retry / offset 値 canonical 決定 → **U-UT01-09（既存）**で扱う
- UT-09 implementation task の実パスが確認できない場合は受け皿確定 follow-up を作成する。

### ステップ 5: スキルフィードバックレポート（Task 12-5 / 改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力。docs-only-design-reconciliation taskType の運用知見を skill へフィードバック。改善点がない場合も「観察事項なし」を明記する。

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| resource-map | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES |
| quick-reference | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | YES |
| topic-map | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | references 本文更新なしのため対象外 |
| keywords | .claude/skills/aiworkflow-requirements/indexes/keywords.json | references 本文更新なしのため対象外 |
| 原典 unassigned | docs/30-workflows/unassigned-task/U-UT01-07-sync-log-naming-reconciliation.md | YES |
| skill / LOGS 本体 | 仕様本文・skill 挙動を変更しないため N/A | N/A |

## 二重 ledger 同期【必須】

- root `artifacts.json` 単体管理（本ワークフローでは `outputs/artifacts.json` を二重管理しない方針）。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `metadata.workflow_state`（spec_created 維持）/ `metadata.docsOnly` (true)。
- 本タスクの drift 防止チェック: `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` / `apps/api/migrations/` 非混入 / `apps/api/src/` 非混入が PR 境界と一致していること。

## docs-only / spec_created 取り扱いルール【必須】

- 本タスクは `taskType=docs-only-design-reconciliation`。本 PR で commit するのは `docs/30-workflows/u-ut01-07-sync-log-naming-reconciliation/` 配下の仕様書のみ。
- `apps/api/migrations/*.sql` / `apps/api/src/**` / `packages/shared/src/**` を本 PR に含めないこと。
- `phases[*].status` は `completed` に進めてよいが、`metadata.workflow_state` は **`spec_created` を維持**する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL evidence サマリーを `system-spec-update-summary.md` に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| 下流 UT-04 | canonical 名・マッピング・migration 戦略を引き継ぎ |
| 下流 UT-09 | canonical 名を実装で参照 |
| 直交 U-UT01-08 / U-UT01-09 | enum / retry を本タスクで決定しないことを明文化 |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも reconciliation の意図を理解できるレベルか。
- 実現性: Step 1-A の `database-schema.md` 反映 diff plan が現行ファイル構造と整合しているか。
- 整合性: same-wave sync の aiworkflow indexes / 原典 unassigned status が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の委譲先（UT-04 / UT-09 / U-UT01-08 / U-UT01-09）が実在 ID か。
- 認可境界: 本タスクで `apps/api/migrations/` / `apps/api/src/` を編集しない設計境界が PR 境界と一致しているか。
- Secret hygiene: ガイド内のサンプルに実 database_id / 実 token / 実会員データが含まれていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生） | 12 | completed | 例え話 3 つ以上必須 |
| 2 | 実装ガイド Part 2（技術者） | 12 | completed | canonical / マッピング / 後方互換 |
| 3 | system-spec-update-summary | 12 | completed | Step 1-A diff plan + Step 2 N/A 明記 |
| 4 | documentation-changelog | 12 | completed | workflow-local / global を別ブロック |
| 5 | unassigned-task-detection | 12 | completed | UT-09 受け皿 follow-up 1 件を formalize |
| 6 | skill-feedback-report | 12 | completed | 改善点なしでも出力 |
| 7 | same-wave sync (aiworkflow indexes + 原典 unassigned status) | 12 | completed | 必須 |
| 8 | workflow_state 維持確認 | 12 | completed | spec_created 据え置き |

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ナビ | outputs/phase-12/main.md | Phase 12 必須成果物へのトップ index |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A diff plan + Step 2 N/A 判定 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須。本 wave は UT-09 受け皿 follow-up 1 件 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | root evidence / validator 実測値 / same-wave sync 判定 |
| メタ | artifacts.json (root) | Phase 12 状態 / workflow_state は spec_created 維持 |

## 完了条件

- [x] 必須 7 ファイルが `outputs/phase-12/` 配下に揃っている
- [x] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 3 つ以上含まれる
- [x] system-spec-update-summary に Step 1-A diff plan / Step 2 N/A 判定が明記
- [x] documentation-changelog で workflow-local 同期と global skill sync が別ブロック
- [x] unassigned-task-detection が出力され、UT-09 受け皿未確定を follow-up 化している
- [x] skill-feedback-report が改善点なしでも出力されている
- [x] phase12-task-spec-compliance-check に成果物実体 / validator 実測値 / same-wave sync 証跡が記録されている
- [x] same-wave sync（aiworkflow indexes + 原典 unassigned status）が完了
- [x] `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` を維持
- [x] `apps/api/migrations/` / `apps/api/src/` 非混入を確認

## タスク100%実行確認【必須】

- 全実行タスク（8 件）の状態を `completed` に更新済み
- 必須 7 成果物が `outputs/phase-12/` に配置済み
- spec_created タスクの workflow_state 据え置きルールを維持済み

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - unassigned-task-detection → UT-04 / UT-09 / U-UT01-08 / U-UT01-09 への委譲明示
  - workflow_state=spec_created / docsOnly=true / spec PR 境界（実 DDL・実コード非混入）を Phase 13 PR body に明記
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - same-wave sync 未完了
  - workflow_state を誤って `completed` / `implemented` に書き換えてしまった
