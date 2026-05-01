# Phase 12: ドキュメント更新

> **本仕様書は 300 行を超過する可能性があるが、docs-only / spec_created タスクで 7 必須成果物の構成が意味的に分割不可能なため例外条項を適用する**
> （`.claude/skills/task-specification-creator/references/phase-template-phase12.md` §「phase-12.md の 300 行上限と設計タスクの例外条項」準拠）。
> 加えて、Phase 11 NON_VISUAL 代替証跡（main / manual-evidence / link-checklist）と Phase 12 outputs を直列記述する必要があるため、分散すると mirror parity 監査時の追跡コストが増大する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-30 |
| 前 Phase | 11（NON_VISUAL evidence / docs walkthrough） |
| 次 Phase | 13（PR 作成） |
| 状態 | spec_created |
| タスク分類 | docs-only-contract（仕様策定のみ） |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| workflow_state | **spec_created（本 Phase で `completed` に書き換え禁止）** |
| user_approval_required | false |
| GitHub Issue | #262（CLOSED のまま据え置き / 再 OPEN しない） |

## 目的

U-UT01-08（sync 状態 enum / trigger enum canonical 統一）の Phase 1〜11 成果物を、workflow-local 文書と aiworkflow-requirements skill indexes / `database-schema.md` / `architecture-overview-core.md` の参照導線へ反映する。本タスクは GitHub Issue #262 が **CLOSED のまま** のため、Issue ライフサイクルを再 OPEN せず、PR / 仕様書リンクを comment 追記する形で履歴のみ完結させる（`spec_created` close-out）。

Phase 12 の必須 7 成果物を完了し、Phase 13（PR 作成・user 承認ゲート）の前提を整える。

## 必須 7 成果物（task-specification-creator skill 準拠 / 1 つ欠落で FAIL）

| # | ファイル | 由来 Task | 欠落時の扱い |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 本体（7 成果物ナビ） | FAIL |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 1（Part 1 中学生 + Part 2 技術者） | FAIL |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 2（Step 1-A/B/C + Step 2 判定） | FAIL |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 3（更新ファイル一覧） | FAIL |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 4（**0 件でも出力必須**） | FAIL |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 5（**改善点なしでも出力必須**） | FAIL |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 6（最終確認 root evidence） | FAIL |

> Task 6 の `PASS` 断言は、7 ファイル実体 + same-wave sync 証跡 + ledger parity が揃った後にのみ許可する。

## workflow_state 取り扱い【最重要】

- 本タスクの taskType は **docs-only**、taskState は **spec_created**。Phase 12 完了後も以下を厳守する。
  - root `artifacts.json` の `metadata.workflow_state` は **`spec_created` を維持**（`completed` / `applied` / `implemented` に書き換え禁止）。
  - `phases[*].status` は当該 Phase の docs 完了に応じて `completed` に更新してよい。
  - `metadata.docsOnly` は **true**（コード変更なし / 仕様書のみ）。
  - `metadata.github_issue_state` は **CLOSED** のまま（本タスクで再 OPEN しない）。
- docs-only / spec_created タスクは workflow root を据え置き、`phases[].status` のみ更新するルール（`spec-update-workflow.md` / `phase-12-pitfalls.md`「設計タスクの workflow root を completed にしてしまう」漏れパターン）に厳格に従う。
- 実装フェーズ（UT-04 migration / UT-09 sync job rewrite / U-UT01-10 shared 実コミット）が別 PR で merge された段階で初めて、各実装タスク側で `implementation_ready` → `implemented` への昇格を行う（本タスクの workflow_state は **永続的に spec_created**）。

### CLOSED Issue の扱い（`spec_created` 専用ルール）

- 採用条件: governance / 既存方針の追認 / docs-only 再構築のように、Issue が要求する作業は完了済 or 不要で、仕様書として履歴を残すこと自体が目的のとき。本タスクはこの条件に該当する。
- 必須記録:
  - `index.md` Decision Log に「Issue #262 を reopen せず仕様作成のみで履歴を完結させる」根拠を 1 段落明記。
  - Issue 側へは PR / 仕様書リンクを `gh issue comment` で残す（双方向リンク維持）。
  - `task-workflow-completed.md` / Step 1-A の same-wave 更新は通常通り実施。
- 禁止事項: Issue を無言放置 / reopen 判断を曖昧にする / spec を残さず close-out する。

## 実行タスク

- Task 12-1: 実装ガイド（Part 1 中学生 / Part 2 技術者）を 1 ファイルに統合作成する。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + Step 2 判定で構造化記述する。
- Task 12-3: documentation-changelog を出力する。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力する（SF-03 4 パターン照合の有無を明記）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力する。
- Task 12-6: phase12-task-spec-compliance-check を実施する（必須 7 ファイル × 各判定）。
- Task 12-7: same-wave sync（aiworkflow indexes + 原典 unassigned status）を完了する。
- Task 12-8: 二重 ledger（root `artifacts.json` ↔ `outputs/artifacts.json`）を同期する。
- Task 12-9: workflow_state が `spec_created` のまま、`docsOnly=true` / Issue #262 CLOSED 維持 / `apps/api/migrations/` 非混入 / `packages/shared/src/` 非混入を最終チェックする。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 7 成果物仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造定義（5 必須タスク + Task 6） |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 漏れパターン |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 実装ガイド執筆要領 |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/B/C / Step 2 / same-wave sync |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-step2-domain-sync.md | Step 2 判定基準（N/A / BLOCKED / 実施） |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | docs-only / spec_created 例外条項 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md | 起票仕様 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/index.md | 本 workflow 目次 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-02/ | canonical 決定 / マッピング表 / shared 配置 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-05/ | 仕様 runbook / 書き換え対象リスト |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/outputs/phase-11/main.md | NON_VISUAL evidence |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 正本（Step 1-A 同期先） |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | sync ジョブ・enum 文脈の参照導線 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | キーワード索引 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | spec sync root |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/keywords.json | 索引再生成対象 |
| 必須 | docs/30-workflows/LOGS.md | task-level LOGS 同期対象 |
| 必須 | CLAUDE.md | 不変条件 #5（D1 直アクセスは apps/api 限定）/ ブランチ戦略 / solo 運用 |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-12.md | docs-only / spec_created Phase 12 構造リファレンス |
| 参考 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-12.md | CLOSED Issue 据え置きパターン |

## 実行手順

### Task 1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`）

1 ファイル内で **Part 1 + Part 2** を 2 部構成で記述する。

**Part 1（中学生レベル / 例え話 3 つ以上 / 専門用語回避）必須要件**:

- 「enum とは何か」を「クラスの『出席状況』ラベル（出席 / 遅刻 / 欠席 / 早退）のように、選べる選択肢が決まっている記号の集まり」と例える。
- 「なぜ統一が必要か」を先に説明（「同じ意味なのに『成功』と書く人と『success』と書く人と『completed』と書く人がいると、後で集計するとき同じ票が 3 グループに分かれて『成功 0 件』に見えてしまう」）。
- 「2 段階 migration の必要性」を「先に古い名札を新しい名札に貼り替えてから、入口で名札チェックを始める。逆順だと既存の人が全員追い返されて教室に入れなくなる」と例える。
- 専門用語セルフチェック: 「enum」「CHECK 制約」「shared パッケージ」「Zod schema」「canonical」を使う場合は括弧書きで日常語を補う（例: 「canonical（みんなの正解とする 1 つの基準）」）。

**Part 2（技術者レベル）必須要件**:

- TypeScript 型シグネチャ案: `export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';` と `export type SyncTriggerType = 'manual' | 'cron' | 'backfill';` を含める。
- 値マッピング表: `running → in_progress` / `success → completed` / `skipped → skipped` / `admin → manual`（+ `triggered_by='admin'`）の対応を 3 列表で記述。
- 変換 SQL 疑似例（実行は UT-04 / UT-09 / 文書化のみ）:

  ```sql
  -- Step 1: 値変換（CHECK 制約追加より先に流す）
  UPDATE sync_job_logs SET status = 'in_progress' WHERE status = 'running';
  UPDATE sync_job_logs SET status = 'completed' WHERE status = 'success';
  UPDATE sync_job_logs SET trigger_type = 'manual', triggered_by = 'admin'
    WHERE trigger_type = 'admin';

  -- Step 2: CHECK 制約追加（値変換完了後）
  -- ALTER TABLE は SQLite では recreate 必須（UT-04 で具体化）
  ```

- shared import パス案: `import type { SyncStatus, SyncTriggerType } from '@repo/shared/types/sync';` / `import { syncStatusSchema } from '@repo/shared/zod/sync';`（実コミットは U-UT01-10）。
- エラー処理: 未知 enum 値が来た場合の型ガード（`assertNever` / exhaustive switch）パターン記述。
- 設定可能パラメータ: 配置決定（types only / Zod 併設）、`triggered_by` カラム追加の有無、5 値目 `skipped` の終端状態フラグ。

### Task 2: システム仕様更新（`outputs/phase-12/system-spec-update-summary.md`）

#### Step 1-A: spec_created タスク記録 + 関連 doc リンク + indexes（必須）

| 同期対象（aiworkflow-requirements） | 記述内容 |
| --- | --- |
| `references/database-schema.md` | sync_job_logs / sync_locks セクションに canonical enum 5 値 / 3 値の **更新候補** を追記（実 DDL 反映は UT-04 で実施 / 本タスクは正本仕様の予告として記述）|
| `references/architecture-overview-core.md` | sync ジョブの章に「U-UT01-08 で enum canonical 確定（spec_created）」のリンクを追記 |
| `indexes/topic-map.md` | U-UT01-08 workflow 導線追加（`enum` / `sync_status` / `trigger_type` キーワード）|
| `indexes/resource-map.md` | workflow inventory 追加 |
| `indexes/quick-reference.md` | U-UT01-08 spec sync root 追加 |
| `indexes/keywords.json` | 索引再生成（`pnpm indexes:rebuild` 実行） |
| `docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md` | ヘッダ「状態」を `unassigned` → `spec_created` に更新 |
| `docs/30-workflows/LOGS.md` | 完了行追記（spec_created close-out 行） |

#### Step 1-B: 実装状況テーブル更新（**spec_created**）

- `docs/30-workflows/unassigned-task/U-UT01-08-*.md` の状態欄を `spec_created` に更新。
- `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/index.md` の関連タスク欄で U-UT01-08 を `spec_created` に反映。
- 本タスクは spec のみのため `implemented` には更新しない。

#### Step 1-C: 関連タスクテーブル更新

- U-UT01-07 / U-UT01-09 / U-UT01-10 / UT-04 / UT-09 の `index.md` 「上流 / 関連」テーブルに U-UT01-08 spec 完了情報を反映。
- 双方向リンク維持。

#### Step 2 判定: **N/A**

判定根拠（必須 3 項目記述 / phase-12-pitfalls.md「Step 2 必要性判定の記録漏れ」回避）:

- 本タスクは sync enum の **値ドメイン契約** のみで、TypeScript インターフェース / API endpoint / IPC 契約 / shared package 型の **新規実装コミットなし**。
- `references/database-schema.md` への DDL 正本同期は **更新候補の予告** として記述するに留め、実 DDL 反映は UT-04 で実施。Step 2 相当の正本登録自体は不要。
- shared 実コミット（`packages/shared/src/types/sync.ts` / `packages/shared/src/zod/sync.ts`）は U-UT01-10 で実施するため、本 Phase 12 ではスコープ外。

> Step 2 = N/A 判定の根拠を **3 項目で明記** することで、phase-12-pitfalls.md「Step 2 必要性判定の記録漏れ」を回避する。仕様 → 実装 enum のドリフト解消方針は「U-UT01-10 が本タスク決定を継承して実装する」ことを明記する。

#### 仕様 → 実装 enum ドリフト解消方針（追加記述）

| ドリフト軸 | 現状 | 解消方針 | 担当タスク |
| --- | --- | --- | --- |
| `status` 5 値 vs 既存 4 値 | UT-01 論理 4 値 / 既存実装 4 値（差あり） | canonical 5 値（`skipped` 終端状態化） | UT-04（migration）/ UT-09（コード rewrite） |
| `trigger_type` 3 値 vs `admin` 混在 | 既存 `admin` 混在 | canonical 3 値 + `triggered_by` 別カラム化 | UT-04（カラム追加 migration）/ UT-09 |
| shared 配置 | 不在 | `packages/shared/src/types/sync.ts` + Zod 併設 | U-UT01-10（実コミット） |

### Task 3: documentation-changelog（`outputs/phase-12/documentation-changelog.md`）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-30 | 新規 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/ | 13 Phase + index + artifacts.json + outputs/ |
| 2026-04-30 | 更新 | docs/30-workflows/unassigned-task/U-UT01-08-*.md | 状態を spec_created に変更 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/references/database-schema.md | sync enum canonical 5/3 値の更新候補追記 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | sync ジョブ章に U-UT01-08 リンク追記 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | U-UT01-08 導線追加 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory 追加 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | U-UT01-08 spec sync root |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/keywords.json | 索引再生成 |
| 2026-04-30 | 追記 | docs/30-workflows/LOGS.md | U-UT01-08 完了行 |

workflow-local 同期と global skill sync を **別ブロック** で記録する（[Feedback BEFORE-QUIT-003] 対策）。

### Task 4: unassigned-task-detection（`outputs/phase-12/unassigned-task-detection.md`） / **0 件でも出力必須**

SF-03 設計タスク特有 4 パターンを必ず照合する:

| パターン | 検出結果 | 委譲先 |
| --- | --- | --- |
| 型定義→実装 | `packages/shared/src/types/sync.ts` / `zod/sync.ts` 実コミット未済 | **U-UT01-10** （新規起票せず既存タスク委譲） |
| 契約→テスト | `assertNever` / exhaustive switch 型テスト未実装 | **U-UT01-10** |
| UI 仕様→コンポーネント | UI ラベル / i18n リソース更新未済 | UT-08 監視 or 別タスク |
| 仕様書間差異→設計決定 | UT-01 論理（4 値）と本タスク決定（5 値）の差異 | **UT-04**（migration で吸収） / **UT-09**（コード rewrite で吸収） |

**追加検出（既存タスク委譲のみ / 新規起票なし）**:

| 検出項目 | 種別 | 委譲先 | 配置先 |
| --- | --- | --- | --- |
| 物理 migration（CHECK 制約 + 変換 UPDATE）の DDL 化 | 実作業 | UT-04 | docs/30-workflows/unassigned-task/UT-04-*.md（既存）に追記 |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` の実書き換え | 実作業 | UT-09 | docs/30-workflows/unassigned-task/UT-09-*.md（既存）に追記 |
| shared 実コミット（types + zod） | 実作業 | U-UT01-10 | docs/30-workflows/unassigned-task/U-UT01-10-*.md（既存）に追記 |
| 集計クエリ / UI ラベル更新の grep-and-replace 漏れ防止 | 検証 | UT-08 監視ダッシュボード or 別タスク | 起票見送り（記録のみ） |

> 0 件でも「設計タスク 4 パターン照合済 / 既存タスク委譲 4 件」を summary に明記する（phase-12-pitfalls.md「未タスク検出レポートで 0 件判定のまま未修正」対策）。

### Task 5: skill-feedback-report（`outputs/phase-12/skill-feedback-report.md`） / **改善点なしでも出力必須**

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | docs-only / NON_VISUAL / spec_created / CLOSED Issue の 4 軸組合せが phase-12-pitfalls.md と phase-template-phase12.md / phase-template-phase13.md に分散 | 4 軸組合せ専用のクイックリファレンス（1 ページ）を references に追加検討 |
| aiworkflow-requirements | `database-schema.md` への enum canonical 反映時の「正本予告（spec_created）」と「実反映（implemented）」の段階表記方法が暗黙 | DDL 段階表記テンプレ（spec_predicted / impl_applied）を references に追加検討 |
| github-issue-manager | CLOSED Issue を再 OPEN せず `Refs #<issue>` で履歴を残すパターンの comment テンプレが未提供 | `gh issue comment` テンプレ追加検討 |

> 改善点なしの場合も「観察事項のみ / なし」を明記する。

### Task 6: phase12-task-spec-compliance-check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 7 ファイル成果物が揃っている | main / implementation-guide / spec-update-summary / changelog / unassigned-detection / skill-feedback / compliance-check | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | Part 1 例え話 3 つ以上 + 専門用語セルフチェック済 | PASS |
| Step 1-A / 1-B / 1-C 記述 | spec-update-summary に明示 | PASS |
| Step 2 判定（N/A 根拠 3 項目） | N/A 理由 3 項目明記 | PASS |
| same-wave sync 完了 | aiworkflow indexes 4 ファイル + 原典 unassigned status + LOGS.md | PASS |
| 二重 ledger parity | root artifacts.json / outputs/artifacts.json drift 0 | PASS |
| workflow_state 維持 | `spec_created` / `docsOnly=true` / `github_issue_state=CLOSED` | PASS |
| spec PR 境界遵守 | `apps/api/migrations/` / `apps/api/src/` / `packages/shared/src/` 非混入 | PASS |
| 機密情報非混入 | 実 token / database_id / 実会員データ 0 件 | PASS |
| Issue #262 再 OPEN 禁止 | `gh issue reopen` を実行しない / Decision Log 1 段落明記 | PASS |
| Phase 11 NON_VISUAL 連動 | main / manual-evidence / link-checklist 揃い、screenshots/ 不在 | PASS |

### same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| resource-map | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES |
| quick-reference | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | YES |
| topic-map | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |
| keywords | .claude/skills/aiworkflow-requirements/indexes/keywords.json | YES（`pnpm indexes:rebuild` で再生成） |
| 原典 unassigned | docs/30-workflows/unassigned-task/U-UT01-08-*.md | YES |
| LOGS | docs/30-workflows/LOGS.md | YES（完了行追記）|
| skill / SKILL.md 本体 | 仕様本文・skill 挙動を変更しないため | N/A |

### 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）が存在すれば必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.workflow_state` / `task.metadata.docsOnly` / `task.metadata.github_issue_state`。
- 片方のみ更新は禁止（drift の主要原因）。
- **本タスクの drift 防止チェック**: `task.metadata.workflow_state = "spec_created"` / `task.metadata.docsOnly = true` / `task.metadata.github_issue_state = "CLOSED"` の 3 項目が両 ledger と PR 境界で一致していること。
- `outputs/artifacts.json` が存在しない場合は root ledger が唯一正本である旨を compliance check に明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL evidence サマリーを `system-spec-update-summary.md` に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| 関連タスク | U-UT01-07 / U-UT01-09 / U-UT01-10 / UT-04 / UT-09 の index.md を双方向更新 |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも canonical 統一の意図を理解できるか。
- 実現性: Step 1-A の `database-schema.md` 反映が現行ファイル構造と整合しているか（架空セクション名を作っていないか）。
- 整合性: same-wave sync の aiworkflow indexes / 原典 unassigned status が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の委譲先が **既存タスク** のみで、新規起票が発生していないか（責務拡散防止）。
- 認可境界: 実装ガイドの SQL 例が DB 直アクセスを `apps/api` に閉じる（不変条件 #5）前提か / `wrangler` 直呼びを推奨していないか。
- Secret hygiene: ガイド内のサンプルに実 database_id / 実 API token / 実会員データが含まれていないか。
- Issue ライフサイクル: GitHub Issue #262 が CLOSED のまま、本 Phase で `gh issue reopen` を実行しないこと。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide Part 1（中学生） | 12 | spec_created | 例え話 3 つ以上必須 |
| 2 | implementation-guide Part 2（技術者） | 12 | spec_created | 型 / SQL / shared import パス |
| 3 | system-spec-update-summary（Step 1-A/B/C） | 12 | spec_created | aiworkflow indexes + LOGS |
| 4 | system-spec-update-summary（Step 2 = N/A 根拠 3 項目） | 12 | spec_created | ドリフト解消方針記述 |
| 5 | documentation-changelog | 12 | spec_created | workflow-local / global を別ブロック |
| 6 | unassigned-task-detection（SF-03 4 パターン） | 12 | spec_created | 0 件でも出力 / 既存タスク委譲のみ |
| 7 | skill-feedback-report | 12 | spec_created | 改善点なしでも出力 |
| 8 | phase12-task-spec-compliance-check | 12 | spec_created | 11 項目 PASS |
| 9 | same-wave sync（aiworkflow indexes + 原典 unassigned status + LOGS） | 12 | spec_created | 必須 |
| 10 | 二重 ledger 同期 | 12 | spec_created | workflow_state=spec_created / CLOSED 維持 |
| 11 | Issue #262 comment（PR / 仕様書リンク） | 12 | spec_created | `gh issue reopen` 禁止 / `gh issue comment` のみ |

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者・型・SQL・shared import） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C + Step 2 = N/A 根拠 3 項目 + ドリフト解消方針 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 変更ファイル一覧（workflow-local / global 別ブロック） |
| 検出 | outputs/phase-12/unassigned-task-detection.md | SF-03 4 パターン / 既存タスク委譲 4 件（0 件でも出力） |
| FB | outputs/phase-12/skill-feedback-report.md | 観察事項（改善点なしでも出力） |
| 集約 | outputs/phase-12/main.md | Phase 12 index と 7 成果物ナビ |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 11 項目 PASS 期待 |
| メタ | artifacts.json (root) | Phase 12 状態の更新 / `workflow_state=spec_created` 維持 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期（存在する場合） |

## 完了条件

- [ ] 必須 7 ファイルが `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成、Part 1 に例え話 3 つ以上、専門用語セルフチェック済
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（N/A 根拠 3 項目）が明記
- [ ] documentation-changelog で workflow-local 同期と global skill sync が別ブロック
- [ ] unassigned-task-detection で SF-03 4 パターン照合済 / 既存タスク委譲 4 件記述（新規起票なし）
- [ ] skill-feedback-report が改善点なしでも出力されている
- [ ] phase12-task-spec-compliance-check の 11 項目すべてが PASS
- [ ] same-wave sync（aiworkflow indexes 4 ファイル + 原典 unassigned status + LOGS.md）完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が parity（drift 0）
- [ ] `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` / `metadata.github_issue_state = "CLOSED"` を維持
- [ ] spec PR 境界遵守（`apps/api/migrations/` / `apps/api/src/` / `packages/shared/src/` 非混入）
- [ ] GitHub Issue #262 を再 OPEN していない（`gh issue comment` のみで PR / 仕様書リンクを残す）
- [ ] index.md Decision Log に「Issue #262 を reopen せず仕様作成のみで履歴を完結させる」根拠 1 段落明記

## タスク100%実行確認【必須】

- 全実行タスク（11 件）の状態が `spec_created` で、Phase 完了時に `completed` へ更新可能な設計
- 必須 7 成果物が `outputs/phase-12/` に配置される設計
- spec_created タスクの workflow_state 据え置きルール / CLOSED Issue 据え置きルールが手順に含まれている
- artifacts.json の `phases[11].status` が `completed`、`metadata.workflow_state` が `spec_created` のまま

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成 / **user_approval_required = true**）
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection（既存タスク委譲 4 件） → 関連タスクへの双方向リンク反映済み
  - workflow_state=spec_created / docsOnly=true / Issue #262 CLOSED / spec PR 境界（コード非混入）を Phase 13 PR body に明記
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - same-wave sync 未完了
  - 二重 ledger に drift がある
  - workflow_state を誤って `completed` / `implemented` に書き換えてしまった
  - GitHub Issue #262 を再 OPEN してしまった
  - PR body に `Closes #262` を採用してしまった（→ Phase 13 で `Refs #262` のみ採用）
