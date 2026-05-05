# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 canonical sync job implementation receiver (U-UT01-07-FU01) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-01 |
| 前 Phase | 11 (NON_VISUAL evidence / docs-only smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| sourceIssue | #333 (CLOSED) |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created（本タスクは仕様書作成のみで `completed` へ昇格させない） |
| user_approval_required | false |

## 目的

U-UT01-07-FU01（UT-09 canonical sync job implementation receiver）の Phase 1〜11 成果物を、workflow-local 文書と `.claude/skills/aiworkflow-requirements/indexes/` に反映する。本タスクは GitHub Issue #333（CLOSED）の「タスク仕様書作成」段階に閉じており、`metadata.workflow_state` は `spec_created` を維持する。Phase 12 の必須 5 タスク + Task 6 compliance check（必須 7 outputs）を完了し、Phase 13（PR 作成）の承認ゲート前提を整える。

本ワークフローは `taskType=docs-only` であり、本仕様書段階は **canonical 名引き渡し + 受け皿確定**のみを扱う。UT-09 の物理コード実装は本仕様書外（UT-09 implementation task のスコープ）。物理 DDL 発行・migration 追加・コード変更は本タスクに含まない。

## 必須 5 タスク + Task 6 compliance check（task-specification-creator skill 準拠）

1. **実装ガイド作成（Part 1: 中学生レベル / Part 2: 技術者レベル）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A 中心 / Step 2 は条件付き N/A）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`
6. **Phase 12 task-spec compliance check** — `outputs/phase-12/phase12-task-spec-compliance-check.md`

加えて `outputs/phase-12/main.md`（必須 7 ファイルへのトップ index）を出力する。

## canonical filename strict（必須 7 ファイル / 厳守）

| # | canonical filename |
| --- | --- |
| 1 | outputs/phase-12/main.md |
| 2 | outputs/phase-12/implementation-guide.md |
| 3 | outputs/phase-12/system-spec-update-summary.md |
| 4 | outputs/phase-12/documentation-changelog.md |
| 5 | outputs/phase-12/unassigned-task-detection.md |
| 6 | outputs/phase-12/skill-feedback-report.md |
| 7 | outputs/phase-12/phase12-task-spec-compliance-check.md |

## workflow_state 取り扱い【重要】

- 本タスクの taskType は `docs-only` で、本仕様書段階は **spec_created**（仕様書作成のみで物理実装を伴わない）。
- Phase 12 完了後も:
  - `artifacts.json`（root）の `metadata.workflow_state` は **`spec_created` を維持**（`completed` / `implemented` に書き換えない）。
  - `phases[*].status` は当該 Phase の docs 完了に応じて `completed` に更新してよい。
  - `metadata.docsOnly` は **true**（spec PR のため）。
- 本タスクで確定する canonical 受け皿は **UT-09 implementation task が参照する設計入力**であり、本タスク自体が implemented 状態になることはない。

## 実行タスク（Phase 12 内訳）

- **Task 12-1**: 実装ガイド（Part 1 中学生 / Part 2 技術者）を 1 ファイルに統合作成。
  - Part 1: 中学生レベル化要素 5 点必須（① 日常生活の例え話 / ② 専門用語セルフチェック表 5 用語以上 / ③ 学校生活レベル語彙 / ④ 「なぜ」先行 / ⑤ ドラフト逐語一致）。
  - Part 2: canonical 名（`sync_job_logs` / `sync_locks`）の UT-09 受け皿としての扱い、`sync_log` 概念名のままにする理由、UT-09 着手前 checklist。
- **Task 12-2**: system-spec-update-summary を Step 1-A / 1-B / 1-C で構造化。
  - Step 1-A: `.claude/skills/aiworkflow-requirements/references/database-schema.md` の sync 系記述に canonical 名 / `sync_log` 概念名注釈を反映する diff plan。
  - Step 1-B: 原典 unassigned `docs/30-workflows/unassigned-task/U-UT01-07-FU01-*.md`（存在すれば）の状態を `unassigned` → `spec_created` に更新する記載。
  - Step 1-C: 直交 U-UT01-08 / U-UT01-09 / UT-04 との関係を関連タスクテーブルで再確認。
  - Step 2: 新規 TS 型・API・IPC 追加 0 件のため **N/A** と明記。
- **Task 12-3**: documentation-changelog を出力。本ワークフローで作成した文書一覧（13 Phase + index + artifacts + outputs）と更新履歴を workflow-local / global skill sync の別ブロックで記録。
- **Task 12-4**: unassigned-task-detection を必ず出力。0 件でも出力必須。本 wave で UT-09 implementation task root が未確定の場合は受け皿確定 follow-up を formalize する。
- **Task 12-5**: skill-feedback-report を改善点なしでも必ず出力。
- **Task 12-6**: phase12-task-spec-compliance-check を出力。canonical filename strict 7 件 / Part 1 中学生レベル化要素 5 点 / same-wave sync / root evidence / validator 実測値を記録。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/ | 親タスク成果物（canonical 正本） |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 + 1 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造定義 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 漏れパターン / 苦戦防止 Tips |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 実装ガイド執筆ガイド（Part 1 中学生レベル化要素） |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md | 完了チェック |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 正本（Step 1-A 同期先） |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 物理 canonical 現状（Read のみ） |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 物理利用フロー（Read のみ） |
| 参考 | docs/30-workflows/completed-tasks/u-ut01-07-sync-log-naming-reconciliation/phase-12.md | 書式模倣元 |

## 実行手順

### ステップ 1: 実装ガイド作成（Task 12-1）

`outputs/phase-12/implementation-guide.md` に Part 1（中学生レベル）と Part 2（技術者レベル）の 2 部構成で記述する。

**Part 1 中学生レベル化要素 5 点必須**:
1. **日常生活の例え話**: 「学校の出席簿」=`sync_job_logs`、「教室のカギ」=`sync_locks`、「同期作業の総称」=`sync_log` 概念。
2. **専門用語セルフチェック表 5 用語以上**: `canonical 名` / `物理テーブル` / `概念名` / `idempotency` / `lock` / `migration` 等を「学校で言うとどれ？」形式で記述。
3. **学校生活レベル語彙**: 「先生」「ノート」「クラス委員」「日直」レベルで説明。
4. **「なぜ」先行**: 「なぜ canonical 名を分けるのか」「なぜ `sync_log` を物理化しないのか」を最初に説明し、How は後段。
5. **ドラフト逐語一致**: Part 1 で使う用語と Part 2 の technical 用語の対応表を最後に置き、Part 2 が Part 1 のドラフトと逐語的に一致することを確認。

**Part 2 技術者レベル**:
- canonical 名（`sync_job_logs` / `sync_locks`）の UT-09 受け皿としての利用方法
- `sync_log` 概念名のまま物理化しない設計判断（不変条件 #4 / AC-3）
- UT-09 着手前 checklist（canonical 名参照 / Phase 2 正本 4 ファイル read / 直交タスク非侵入確認）
- 親タスク（U-UT01-07）outputs/phase-02 4 ファイルへの link

### ステップ 2: システム仕様更新（Task 12-2）

`outputs/phase-12/system-spec-update-summary.md` に以下を記述する。

**Step 1-A: aiworkflow-requirements `database-schema.md` 反映 diff plan**

- `database-schema.md` の sync 系記述に canonical 名 `sync_job_logs` / `sync_locks` を明記。
- `sync_log` は **概念名のみ**（物理テーブルではない）の注釈を追記する diff plan を提示。
- 既存 sync 系記述が 0 件なら「既存 drift なし、canonical 追補の要否は UT-04 と本タスクで連名判定」と明記。
- 本ワークフローでは新規 DDL を追加しないため、`database-schema.md` 本文の DDL 追補は **本タスクの spec PR では実適用しない**（diff plan のみ）。
- 同期対象 indexes: `resource-map` / `quick-reference` に U-UT01-07-FU01 workflow 導線を追加。

**Step 1-B: 実装状況テーブル更新（spec_created）**

- 原典 unassigned doc / 親タスク U-UT01-07 の関連タスク表で本タスクを `spec_created` に更新。
- 下流 UT-09 implementation task の index.md（存在すれば）に「上流 receiver 仕様済」を反映する diff plan のみ記載。

**Step 1-C: 関連タスクテーブル更新**

- U-UT01-08（enum 統一）/ U-UT01-09（retry 統一）/ UT-04（D1 schema）との直交関係を本タスク成果物本文で再確認。

**Step 2（条件付き）: 新規インターフェース追加時のみ → 本タスクは N/A**

- TypeScript インターフェース・API endpoint・IPC 契約・UI route の新規追加は **0 件**。
- DDL も発行しないため、`database-schema.md` への DDL 追記も本タスクスコープ外。
- よって **Step 2 = N/A** と明記する（BLOCKED ではなく N/A）。

### ステップ 3: ドキュメント更新履歴作成（Task 12-3）

`outputs/phase-12/documentation-changelog.md` を出力。本ワークフローで新規作成した文書（13 Phase + index + artifacts + outputs/phase-01〜13）を一覧化し、workflow-local 同期と global skill sync を別ブロックで記録する。

### ステップ 4: 未割当タスク検出レポート（Task 12-4 / 0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を出力。本タスクから派生する追加 unassigned task の有無を判定し、以下を明記する:

- UT-09 implementation root 未確定の場合 → **受け皿確定 follow-up を新規起票**（本タスクの最重要 follow-up）。
- enum 値 canonical 決定 → **U-UT01-08（既存）**で扱う。
- retry / offset 値 canonical 決定 → **U-UT01-09（既存）**で扱う。
- `idempotency_key` / `processed_offset` 物理追加判定 → **UT-04 内で扱う**ため新規起票しない。

### ステップ 5: スキルフィードバックレポート（Task 12-5 / 改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力。`taskType=docs-only` でも spec_created 段階に閉じる運用知見を skill へフィードバック。改善点がない場合も「観察事項なし」を明記する。

### ステップ 6: Phase 12 task-spec compliance check（Task 12-6）

`outputs/phase-12/phase12-task-spec-compliance-check.md` を出力。以下の項目を実測値で記録する。

- canonical filename strict 7 件の存在確認（ls 結果）
- Part 1 中学生レベル化要素 5 点の充足判定
- same-wave sync 完了確認（aiworkflow indexes + 原典 unassigned）
- root evidence（artifacts.json `phases[*].status` / `metadata.workflow_state` / `metadata.docsOnly`）
- spec PR 境界 grep 結果（`apps/api/migrations/` / `apps/api/src/` 非混入）

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| resource-map | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES |
| quick-reference | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | YES |
| topic-map | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | references 本文更新なしのため対象外 |
| keywords | .claude/skills/aiworkflow-requirements/indexes/keywords.json | references 本文更新なしのため対象外 |
| 原典 unassigned | docs/30-workflows/unassigned-task/U-UT01-07-FU01-*.md（存在すれば） | YES |
| skill / LOGS 本体 | 仕様本文・skill 挙動を変更しないため N/A | N/A |

## 二重 ledger 同期【必須】

- root `artifacts.json` 単体管理（`outputs/artifacts.json` を二重管理しない）。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `metadata.workflow_state`（spec_created 維持）/ `metadata.docsOnly` (true)。
- root `artifacts.json` を唯一正本として Phase status を compliance check で確認（本 workflow は `outputs/artifacts.json` を作成しない）。
- drift 防止チェック: `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` / `apps/api/migrations/` 非混入 / `apps/api/src/` 非混入が PR 境界と一致していること。

## docs-only / spec_created 取り扱いルール【必須】

- 本タスクは `taskType=docs-only` だが、本仕様書段階は **仕様書 commit のみ**（spec PR）。
- `apps/api/migrations/*.sql` / `apps/api/src/**` / `packages/shared/src/**` を本 PR に含めないこと。
- `phases[*].status` は `completed` に進めてよいが、`metadata.workflow_state` は **`spec_created` を維持**する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL evidence サマリーを `system-spec-update-summary.md` に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| 親 U-UT01-07 | canonical 名引き渡しの完了報告 |
| 下流 UT-09 | canonical 名を実装で参照 |
| 直交 U-UT01-08 / U-UT01-09 / UT-04 | enum / retry / migration を本タスクで決定しないことを明文化 |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも UT-09 受け皿の意図を理解できるレベルか。
- 実現性: Step 1-A の `database-schema.md` 反映 diff plan が現行ファイル構造と整合しているか。
- 整合性: same-wave sync の aiworkflow indexes / 原典 unassigned status が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の委譲先（UT-09 / UT-04 / U-UT01-08 / U-UT01-09）が実在 ID か。
- 認可境界: 本タスクで `apps/api/migrations/` / `apps/api/src/` を編集しない設計境界が PR 境界と一致しているか。
- Secret hygiene: ガイド内のサンプルに実 database_id / 実 token / 実会員データが含まれていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生 / 5 点要素） | 12 | spec_created | 例え話 / セルフチェック表 / 学校語彙 / なぜ先行 / 逐語一致 |
| 2 | 実装ガイド Part 2（技術者） | 12 | spec_created | canonical / `sync_log` 概念名 / UT-09 着手前 checklist |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A diff plan + Step 2 N/A 明記 |
| 4 | documentation-changelog | 12 | spec_created | workflow-local / global を別ブロック |
| 5 | unassigned-task-detection | 12 | spec_created | UT-09 root 未確定時 follow-up 1 件 |
| 6 | skill-feedback-report | 12 | spec_created | 改善点なしでも出力 |
| 7 | phase12-task-spec-compliance-check | 12 | spec_created | strict 7 件 / 5 点要素 / sync 実測 |
| 8 | same-wave sync | 12 | spec_created | aiworkflow indexes + 原典 unassigned status |
| 9 | workflow_state 維持確認 | 12 | spec_created | spec_created 据え置き |

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ナビ | outputs/phase-12/main.md | Phase 12 必須成果物へのトップ index |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生 / 5 点要素） + Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C diff plan + Step 2 N/A 判定 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須。UT-09 root 未確定時 follow-up |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | strict 7 件 / 5 点要素 / sync 実測値 |
| メタ | artifacts.json (root) | Phase 12 状態 / workflow_state は spec_created 維持 |

## 完了条件

- [x] 必須 7 ファイルが `outputs/phase-12/` 配下に揃っている（canonical filename strict 厳守）
- [x] implementation-guide が Part 1 / Part 2 構成で、Part 1 中学生レベル化要素 5 点（例え話 / セルフチェック表 5 用語以上 / 学校語彙 / なぜ先行 / 逐語一致）が充足
- [x] system-spec-update-summary に Step 1-A/B/C diff plan / Step 2 N/A 判定が明記
- [x] documentation-changelog で workflow-local 同期と global skill sync が別ブロック
- [x] unassigned-task-detection が出力され、UT-09 root 未確定時は follow-up 化されている
- [x] skill-feedback-report が改善点なしでも出力されている
- [x] phase12-task-spec-compliance-check に成果物実体 / validator 実測値 / same-wave sync 証跡が記録されている
- [x] same-wave sync（aiworkflow indexes + 原典 unassigned status）が完了
- [x] `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` を維持
- [x] root `artifacts.json` が唯一正本であることを compliance check に明記
- [x] `apps/api/migrations/` / `apps/api/src/` 非混入を確認

## タスク100%実行確認【必須】

- 全実行タスク（9 件）の状態を `completed` に更新済み
- 必須 7 成果物が `outputs/phase-12/` に配置済み（canonical filename strict 厳守）
- spec_created タスクの workflow_state 据え置きルールを維持済み
- Part 1 中学生レベル化要素 5 点充足を compliance check で記録済み

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - unassigned-task-detection → UT-09 / UT-04 / U-UT01-08 / U-UT01-09 への委譲明示
  - workflow_state=spec_created / docsOnly=true / spec PR 境界（実 DDL・実コード非混入）を Phase 13 PR body に明記
  - sourceIssue #333 は CLOSED 済のため `Refs #333` 採用、`Closes` 禁止
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - same-wave sync 未完了
  - workflow_state を誤って `completed` / `implemented` に書き換えてしまった
  - Part 1 中学生レベル化要素 5 点のいずれかが欠落
