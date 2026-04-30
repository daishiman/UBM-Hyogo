# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-30 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（legacy umbrella close-out） |
| visualEvidence | NON_VISUAL |
| user_approval_required | false |
| GitHub Issue | #234 (CLOSED, 維持) |

## 目的

Phase 1〜11 で得られた移植マトリクス・新設禁止方針・03a/03b/04c/09b への受入条件 patch 案・docs-only smoke 検証結果を、`.claude/skills/aiworkflow-requirements/references/`（特に `task-workflow.md`）・LOGS / SKILL.md 改訂履歴・関連タスク index・unassigned-task ledger に反映し、close-out に必須の **5 タスクすべて** と same-wave sync ルールを完了させる。

**docs-only タスクの close-out 据え置きルール【最重要】**:

- 本タスクは `apps/` / `packages/` 配下のコード変更を一切伴わない docs-only / legacy umbrella close-out タスクである。
- そのため Phase 12 完了時点でも root `artifacts.json` の `metadata.workflow_state` は **`spec_created` のまま据え置く**。
- `implemented` への昇格は派生 implementation タスク（03a / 03b / 04c / 09b）が完了した後にのみ起こり得る（本タスクの責務外）。
- `metadata.docsOnly = true` を維持し、実コード混入時の `implemented` 再判定ルートには入らない。

## 必須 5 タスク（task-specification-creator skill 準拠 / **すべて必須**）

1. **実装ガイド作成（2 パート構成）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須 / `task-specification-creator` と `aiworkflow-requirements` 両方）** — `outputs/phase-12/skill-feedback-report.md`

加えて **Phase 12 自身の compliance check** を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する。

## 実行タスク

- Task 12-1: 実装ガイド（Part 1 中学生レベル / Part 2 技術者レベル）を 1 ファイルに統合作成する。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + 条件付き Step 2 で構造化記述する。Step 2 は本タスクが docs-only / legacy umbrella close-out であるため「新規 IF 追加なし → Step 2 not required」と明示する。`aiworkflow-requirements` の index は `node scripts/generate-index.js` で `resource-map.md` / `quick-reference.md` / `topic-map.md` / `keywords.json` を同一 wave で再生成する。
- Task 12-3: documentation-changelog を `scripts/generate-documentation-changelog.js` 相当のフォーマットで出力する。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力する（後続 U02 / U04 / U05 が既起票済であることを cross-link 形式で formalize）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力する。`task-specification-creator` と `aiworkflow-requirements` の **両方** をテーブル行として記述（追加で `github-issue-manager` の所感も記載可）。
- Task 12-6: phase12-task-spec-compliance-check を実施する（docs-only close-out 据え置きルールの遵守チェックを含む）。
- Task 12-7: same-wave sync（LOGS.md ×2 / SKILL.md ×2 / topic-map）を完了する。
- Task 12-8: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）を同期する。`workflow_state` は `spec_created` のまま据え置く。
- Task 12-9: `validate-phase-output.js` と `verify-all-specs.js` を実行し、全 PASS を確認する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造規定 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 落とし穴集 |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync ルール |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | current facts 更新対象（UT-21 close-out 済追記） |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-11/main.md | docs-only smoke 検証結果の引き継ぎ |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-11/spec-integrity-check.md | aiworkflow-requirements 整合検証ログ |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-10/go-no-go.md | GO 判定 / 残課題 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-02/migration-matrix-design.md | 移植マトリクス |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-02/no-new-endpoint-policy.md | 新設禁止方針 |
| 必須 | docs/30-workflows/ut21-forms-sync-conflict-closeout/outputs/phase-05/implementation-runbook.md | 03a/03b/04c/09b 受入条件 patch 案 |
| 必須 | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | UT-21 当初仕様（legacy / 状態欄パッチ対象） |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 姉妹 close-out（フォーマット参考） |
| 必須 | docs/30-workflows/LOGS.md | task-level LOGS 同期対象 |
| 参考 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-12.md | 構造リファレンス |

## 実行手順

### ステップ 1: 実装ガイド作成（タスク 1）

`outputs/phase-12/implementation-guide.md` に以下 2 パートを記述する。

**Part 1（中学生レベル / 日常の例え話必須）— 「古い地図と新しい地図」アナロジー**:

- 全体メタファー: 「学校の宝探しで、昔配られた古い地図（UT-21 当初仕様 = Sheets 経由で宝箱を探す）と、今みんなが使っている新しい地図（現行 Forms sync 実装）がある。古い地図を捨てるのは怖いから倉庫にしまって、新しい地図に統一した話です」
- 例え話 1（同期元の違い）: 「古い地図は『校門の掲示板（Google Sheets）を見にいく』と書いてあったけど、今は『先生の出席簿（Google Forms API）を直接見る』方法に変わった。掲示板を見に行く道順を新しい地図に書き写すのではなく、出席簿を見る今のやり方を正本として残します」
- 例え話 2（新しい部屋を作らない判断）: 「古い地図には『宝物庫（`POST /admin/sync` という単一の入口）』と『記録部屋（`GET /admin/sync/audit`）』を新しく建てる、と書いてあった。でも今の校舎にはすでに『書類棚（`sync_jobs` ledger）』があって用が足りているので、新しい部屋は建てません。本当に必要かは別の宿題（U02）でゆっくり考えます」
- 例え話 3（残った宿題の引き渡し）: 「古い地図の中で『これは今でも大事だね』というメモ（Bearer guard / 409 排他 / D1 retry / manual smoke の 4 つ）は、今の地図を作っている 4 人の係（03a / 03b / 04c / 09b）に渡しました。本タスクではメモを誰に渡すかを決めるところまでで完結します」
- 締め: 「古い地図を破ると過去の議論が消えてしまうので、倉庫（unassigned-task/ 配下）にそのまま置いて、表紙に『これは古い地図、新しい地図はこっち →』と書きました（cross-link）」

**Part 2（技術者レベル）**:

- 棚卸し対象: UT-21 当初仕様（`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）の 5 項目（同期元 / 単一 endpoint / `GET /admin/sync/audit` / `sync_audit_logs` + `sync_audit_outbox` / 実装パス想定）
- 抽出キー: `forms.get` / `forms.responses.list` / `sync_jobs` / `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/sync/schema/`
- close-out カテゴリ:
  - **docs-only（本 PR で完結）**: 移植マトリクス / 新設禁止方針 / U02-U05 cross-link / aiworkflow-requirements `task-workflow.md` current facts への追記
  - **derived-task 移植（既存 03a/03b/04c/09b の Phase で適用）**: Bearer guard / 409 排他 / D1 retry+SQLITE_BUSY backoff / manual smoke
  - **後続独立タスク**: U02（audit table 要否）/ U04（real-env smoke）/ U05（実装パス境界）
- 派生 IMPL タスク命名規則は本タスクで新規には作らない（既存 03a/03b/04c/09b に吸収済 + U02/U04/U05 がすでに存在）
- 検証コマンド一覧: `rg` / `ls` + `test -e` / `gh issue view 234` / aiworkflow-requirements `task-workflow.md` との diff
- 不変条件 reaffirmation: #1（schema 過固定回避）/ #4（admin-managed 分離）/ #5（D1 アクセスは `apps/api` 限定）/ #7（Forms 再回答が本人更新の正式経路）

### ステップ 2: システム仕様更新（タスク 2）

`outputs/phase-12/system-spec-update-summary.md` を以下 4 ステップで構造化する。

**Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + LOGS.md ×2 + topic-map**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-21 close-out（本タスク）の Phase 1〜13 完了行追記 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | requirements skill 側の同期参照ログ（`task-workflow.md` current facts への「UT-21 は legacy umbrella として close-out 済」追記） |
| `.claude/skills/task-specification-creator/LOGS.md` | task-specification skill 側のフィードバック記録ログ（legacy umbrella close-out 形式の再利用例として記録） |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル更新（`task-workflow.md` current facts 追記事項） |
| `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴テーブル更新（更新事項あれば） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | **current facts への追記必須**: 「UT-21（Sheets sync direct 実装）は legacy umbrella として close-out 済。Forms sync（`forms.get` / `forms.responses.list` + `sync_jobs` ledger + `apps/api/src/jobs/sync-forms-responses.ts` / `apps/api/src/sync/schema/*`）が現行正本。`POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` は新設しない（U02 判定後まで保留）」 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `quick-reference.md` / `topic-map.md` / `keywords.json` | 「UT-21 close-out」「Forms sync 正本」「sync_jobs ledger」「legacy umbrella」キーワードへのリンク追加（`generate-index.js` で同期） |
| 関連 doc リンク | 03a / 03b / 04c / 09b / 02c / 姉妹 close-out（`task-sync-forms-d1-legacy-umbrella-001`）/ 後続 U02 / U04 / U05 への双方向リンク |

**Step 1-B: 実装状況テーブル更新（spec_created のまま据え置き）**

- 本タスクの index.md / artifacts.json は `status: spec_created` のまま据え置く。
- UT-21 当初仕様書（`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）の状態欄に「close-out 済 / 現行 Forms sync を正本とする / 本 close-out 仕様書 → `docs/30-workflows/ut21-forms-sync-conflict-closeout/`」をパッチで追記。
- **重要**: 本タスクは docs-only であり `implemented` には昇格しない。`workflow_state` は `spec_created` のまま据え置く。

**Step 1-C: 関連タスクテーブル更新**

- 03a / 03b / 04c / 09b の各 index.md「並列 / 関連」テーブルに本 close-out 完了情報を反映（実 patch 適用は各タスクの Phase で実施 / 本 PR は cross-link のみ）。
- 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary の index.md に `sync_jobs` ledger と本 close-out の整合確認情報を双方向リンク化。
- 姉妹 close-out（`task-sync-forms-d1-legacy-umbrella-001`）と本タスクの相互参照を双方向で記述。

**Step 2（条件付き）: 新規インターフェース追加時のみ**

- 本タスクは docs-only / legacy umbrella close-out であり、新規 API / 新規 D1 schema / 新規 IPC / 新規 Worker binding を一切追加しない。
- そのため **Step 2 は not required**。本タスクの主張は「`POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` を **追加しない**」ことそのものであり、IF 追加 PR ではない。
- `system-spec-update-summary.md` には「Step 2 not required: docs-only / no new interface (本タスクは IF 新設 **禁止** が成果物そのもの)」と明示する。

### ステップ 3: ドキュメント更新履歴作成（タスク 3）

`outputs/phase-12/documentation-changelog.md` を以下フォーマットで生成する。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-30 | 新規 | docs/30-workflows/ut21-forms-sync-conflict-closeout/ | UT-21 close-out 仕様書 13 Phase + index + artifacts.json |
| 2026-04-30 | 同期 | docs/30-workflows/LOGS.md | UT-21 close-out 完了行追加 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/LOGS.md | task-workflow.md current facts への close-out 済追記を記録 |
| 2026-04-30 | 同期 | .claude/skills/task-specification-creator/LOGS.md | legacy umbrella close-out 形式の実例記録 |
| 2026-04-30 | 更新 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | current facts への「UT-21 close-out 済 / Forms sync 正本 / endpoint 新設禁止」追記 |
| 2026-04-30 | 更新 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md / quick-reference.md / topic-map.md / keywords.json | 「UT-21 close-out」「Forms sync 正本」「legacy umbrella」キーワード追加 |
| 2026-04-30 | パッチ | docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md | 状態欄に close-out 済 / Forms sync 正本 / 本 close-out 仕様書リンクを追記 |
| 2026-04-30 | cross-link | 03a / 03b / 04c / 09b / 02c の index.md | 関連タスクテーブルに本 close-out を双方向リンク（実 patch 適用は各タスク内 / 本 PR は cross-link のみ） |

### ステップ 4: 未割当タスク検出レポート（タスク 4 / 0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を出力する。本タスクの主検出対象は派生 implementation タスクではなく、後続独立タスク U02 / U04 / U05 の **既起票確認** と新規派生有無の判定である。

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 / 既起票 |
| --- | --- | --- | --- |
| audit table（`sync_audit_logs` / `sync_audit_outbox`）の最終要否判定 | 設計判断 | `sync_jobs` ledger でカバー可能か精査し新設可否を確定 | UT21-U02（task-ut21-sync-audit-tables-necessity-judgement-001、**既起票**） |
| 実 secrets / 実 D1 環境での manual smoke | 検証 | staging 実環境で Bearer / 409 / retry / metrics を実測 | UT21-U04（task-ut21-phase11-smoke-rerun-real-env-001、**既起票**）+ 09b runbook |
| 実装パス境界（`apps/api/src/sync/{core,manual,scheduled,audit}` vs 現行 `apps/api/src/jobs/*` + `apps/api/src/sync/schema/*`）の最終整理 | 設計 / リファクタ | 現行構成を正本確定 / Cron handler 配置 / import path 整理 | UT21-U05（task-ut21-impl-path-boundary-realignment-001、**既起票**） |
| 03a / 03b / 04c / 09b の受入条件への patch 適用 | 実作業 | Phase 5 implementation-runbook の patch 案を各タスクに反映 | 既存 03a / 03b / 04c / 09b（**本 close-out では cross-link のみ**） |
| aiworkflow-requirements `task-workflow.md` current facts 追記 | docs 同期 | 本 Phase 12 Step 1-A で適用 | 本 PR 内（追加タスク不要） |
| 該当なし（新規派生 implementation タスク） | — | — | 該当なし（既存タスク + U02-U05 で網羅） |

> 0 件のときも本テーブルの構造は維持し、行を「該当なし」とすること。本タスクでは新規 IMPL タスク起票は **行わない**（既存タスク + U02/U04/U05 で完備）。

### ステップ 5: スキルフィードバックレポート（タスク 5 / 改善点なしでも出力必須・**両 skill 必須**）

`outputs/phase-12/skill-feedback-report.md` を出力する。`task-specification-creator` と `aiworkflow-requirements` の **両方** を必ず行として記述する。

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | legacy umbrella close-out（UT-09 姉妹形式）が再利用可能なテンプレートとして機能した。Phase 11 の NON_VISUAL 代替証跡（rg / cross-link / spec-integrity）が docs-only タスクで安定運用できた。Phase 12 必須 5 タスクの「0 件でも出力」「両 skill 必須」ルールが本タスクの薄い差分に対しても明確だった。 | `phase-12-spec.md` に「legacy umbrella close-out 専用の Step 1-A テンプレート（current facts 追記文言の固定化）」セクションを追加すると、姉妹 close-out 間の文言ドリフトを防げる。`phase-12-pitfalls.md` に「IF 新設 **禁止** が成果物そのものの場合 Step 2 は not required と明示する」例を追加。 |
| aiworkflow-requirements | `task-workflow.md` の current facts に UT-21 が legacy として残存していたため、本タスクで close-out 済追記が必要となった。current facts セクションに `last verified at: <YYYY-MM-DD>` と `superseded_by` フィールドが無く、legacy / current の区別が暗黙的だった。 | references 各ファイル冒頭に `last verified at` / `superseded_by` を必須メタデータ化する。`indexes/topic-map.md` に「legacy umbrella close-out 一覧」セクションを設け、UT-09 / UT-21 など同形式タスクを横断参照可能にする。 |
| github-issue-manager（補足） | Issue #234 (CLOSED) に対し CLOSED のまま仕様書を作成・cross-link する運用が問題なくできた。再オープン誘惑を避けるルールが原典指示で明示されていたため迷いなし。 | 改善点なし（現行運用で十分機能） |

### ステップ 6: Phase 12 compliance check（必須）

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を検証する。

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 5 タスクの成果物が揃っている | 7 ファイル（main.md + 6 補助。compliance check 含む） | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | 中学生 / 技術者の 2 パート + 「古い地図と新しい地図」アナロジー | PASS |
| Step 1-A / 1-B / 1-C が記述 | 仕様書同期サマリーに含まれる | PASS |
| Step 2 の必要性判定が記録 | `not required: docs-only / IF 新設禁止が成果物そのもの` 明示 | PASS |
| same-wave sync が完了 | LOGS.md ×2 + SKILL.md ×2 + topic-map + task-workflow.md current facts | PASS |
| skill-feedback が両 skill 記述 | task-specification-creator / aiworkflow-requirements 両方の行が存在 | PASS |
| 二重 ledger が同期 | root artifacts.json / outputs/artifacts.json | PASS |
| validate-phase-output.js | 全 Phase PASS | PASS |
| verify-all-specs.js | 全 spec PASS | PASS |
| docs-only close-out 据え置きルール遵守 | `workflow_state` が `spec_created` のまま | PASS |
| `apps/` / `packages/` 配下に変更が無い | `git status` で 0 件 | PASS |
| GitHub Issue #234 が CLOSED 維持 | `gh issue view 234` で state == CLOSED | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| LOGS #1 | .claude/skills/aiworkflow-requirements/LOGS.md | YES |
| LOGS #2 | .claude/skills/task-specification-creator/LOGS.md | YES |
| SKILL #1 | .claude/skills/aiworkflow-requirements/SKILL.md | YES（current facts 追記事項） |
| SKILL #2 | .claude/skills/task-specification-creator/SKILL.md | YES（更新事項あれば） |
| references | .claude/skills/aiworkflow-requirements/references/task-workflow.md | YES（current facts 追記必須） |
| Index | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES |
| Index | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | YES |
| Index | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |
| Index | .claude/skills/aiworkflow-requirements/indexes/keywords.json | YES |
| LOGS task-level | docs/30-workflows/LOGS.md | YES |

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger / 必要に応じ生成）を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.workflow_state` / `task.metadata.docsOnly`。
- **`workflow_state` は `spec_created` のまま据え置く**（docs-only 据え置きルール）。
- 片方のみ更新は禁止（drift の主要原因）。

## docs-only close-out ルール【必須・最重要】

- 本タスクは docs-only / legacy umbrella close-out であり `apps/` / `packages/` の変更を一切伴わない。
- そのため Phase 12 完了後も:
  - root `artifacts.json` の `metadata.workflow_state` は **`spec_created` のまま据え置く**
  - `metadata.docsOnly = true` を維持
  - `implemented` への昇格は派生 03a / 03b / 04c / 09b（および後続 U02 / U04 / U05）が完了した後にのみ起こり得る（本タスクの責務外）
- close-out の判定軸は「same-wave sync 完了 + 後続 U02/U04/U05 が cross-link 済 + aiworkflow-requirements `task-workflow.md` current facts 追記済 + validate / verify が exit 0」である。
- `git status` で `apps/` / `packages/` 配下の変更が検出された場合は即時停止し、本タスクが docs-only であるという前提を再確認する（Phase 5 へ差し戻し）。

## 漏れやすいポイント【pitfalls】

| # | 落とし穴 | 回避策 |
| --- | --- | --- |
| 1 | `task-workflow.md` current facts への追記を忘れる（最重要 sync 漏れ） | Step 1-A の必須行として明示。compliance check の必須項目化 |
| 2 | UT-21 当初仕様書（legacy）の状態欄パッチを忘れる | Step 1-B / documentation-changelog の固定行として記述 |
| 3 | skill-feedback で `aiworkflow-requirements` 行を忘れて `task-specification-creator` のみになる | 「両 skill 必須」を本ファイル ステップ 5 で太字明示 |
| 4 | `workflow_state` を `implemented` に誤昇格する | docs-only close-out ルール / compliance check / Phase 13 承認ゲートで三重防止 |
| 5 | 03a / 03b / 04c / 09b に patch を直接適用してしまう（本 PR は cross-link のみ） | Step 1-C で「実 patch 適用は各タスクの Phase 内」と固定 |
| 6 | Issue #234 を再オープンしてしまう | 原典指示「CLOSED のまま」を Phase 11 / Phase 13 で再確認 |
| 7 | `unassigned-task-detection.md` で新規 IMPL タスクを誤起票する | 既存 03a/03b/04c/09b + U02/U04/U05 で網羅済として「該当なし」を明示 |
| 8 | Step 2 を required と誤判定する | 本タスクの成果物が「IF 新設 **禁止**」そのものであり Step 2 は not required と明示 |

## validate-phase-output.js / verify-all-specs.js 実行確認

```bash
# Phase 単位の出力スキーマ検証
node scripts/validate-phase-output.js \
  --task ut21-forms-sync-conflict-closeout

# 全タスク仕様書の整合性検証
node scripts/verify-all-specs.js
```

- 期待: 両方とも exit code 0 / 全 PASS。
- FAIL 時: 該当 Phase の `outputs/` 不足ファイルまたは artifacts.json の drift を是正してから再実行。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | docs-only smoke 検証結果（rg / cross-link / spec-integrity）を `system-spec-update-summary.md` に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 / compliance check の PASS を承認ゲート前提化 |
| 関連タスク | 03a / 03b / 04c / 09b / 02c / U02 / U04 / U05 / 姉妹 close-out の index.md を双方向更新 |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が「古い地図と新しい地図」アナロジーで非エンジニアにも伝わるか。
- 実現性: Step 2 not required の判定が「IF 新設禁止が成果物そのもの」である本タスクの実態と整合しているか。
- 整合性: same-wave sync の 2 LOGS / 2 SKILL + `task-workflow.md` current facts + topic-map が最新コミットで一致しているか。
- 運用性: unassigned-task-detection が新規 IMPL を誤起票せず、既存 03a/03b/04c/09b + U02/U04/U05 への cross-link で完結しているか。
- 認可境界: implementation-guide のサンプルコマンドに `SYNC_ADMIN_TOKEN` / `GOOGLE_FORMS_API_KEY` 実値が含まれていないか。
- close-out 据え置き: `workflow_state` が `spec_created` のまま据え置かれているか / `apps/` 配下の変更が 0 件か。
- 不変条件: #1 / #4 / #5 / #7 への抵触懸念が本仕様書内に残っていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生 / 古い地図アナロジー） | 12 | spec_created | 例え話 3 つ以上 |
| 2 | 実装ガイド Part 2（技術者） | 12 | spec_created | 棚卸しキー / close-out カテゴリ |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A/B/C + Step 2 not required + task-workflow.md 追記必須 |
| 4 | documentation-changelog | 12 | spec_created | スクリプト準拠フォーマット |
| 5 | unassigned-task-detection | 12 | spec_created | 0 件でも出力 / 新規 IMPL なし明示 |
| 6 | skill-feedback-report | 12 | spec_created | 両 skill 必須 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | same-wave sync (LOGS×2 / SKILL×2 + task-workflow.md) | 12 | spec_created | 必須 |
| 9 | 二重 ledger 同期（workflow_state 据え置き） | 12 | spec_created | 必須 |
| 10 | validate / verify スクリプト | 12 | spec_created | exit 0 |

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/main.md | Phase 12 本体サマリー |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生 / 古い地図アナロジー） + Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2 not required + task-workflow.md 追記文言 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須（既起票 U02/U04/U05 cross-link） |
| FB | outputs/phase-12/skill-feedback-report.md | task-specification-creator / aiworkflow-requirements 両方必須 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | docs-only close-out 据え置きを含む全項目 PASS |
| メタ | artifacts.json (root) | Phase 12 状態の更新（workflow_state 据え置き） |

## 完了条件

- [ ] 必須 7 ファイル（main.md + 6 補助）が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に「古い地図と新しい地図」アナロジーと例え話が 3 つ以上含まれる
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2 not required（理由付き）が明記
- [ ] system-spec-update-summary に `task-workflow.md` current facts への追記文言（UT-21 close-out 済 / Forms sync 正本 / endpoint 新設禁止）が固定文として記載
- [ ] documentation-changelog に変更ファイルが網羅されている
- [ ] unassigned-task-detection が 0 件でも出力されており、既起票 U02 / U04 / U05 が cross-link 済として明記
- [ ] skill-feedback-report に `task-specification-creator` と `aiworkflow-requirements` の **両方** の行が存在
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（LOGS ×2 / SKILL ×2 + task-workflow.md + topic-map）が完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が同期
- [ ] `validate-phase-output.js` / `verify-all-specs.js` が exit code 0
- [ ] **`workflow_state` が `spec_created` のまま据え置かれている（docs-only close-out ルール）**
- [ ] `apps/` / `packages/` 配下の変更が 0 件（`git status` で確認）
- [ ] GitHub Issue #234 が CLOSED 維持

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 必須 7 成果物（main.md + 6 補助）が `outputs/phase-12/` に配置される設計になっている
- docs-only タスクの close-out 据え置きルール（`workflow_state` を `implemented` に昇格させない）が明記されている
- Step 2 not required の判定理由（IF 新設禁止が成果物そのもの）が手順に含まれている
- skill-feedback の両 skill 必須ルールが明示されている
- artifacts.json の `phases[11].status` が `spec_created` / `metadata.workflow_state` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection の「該当なし（新規 IMPL なし）+ 既起票 U02/U04/U05」 → PR body の関連タスク欄
  - aiworkflow-requirements `task-workflow.md` current facts 追記コミット → PR diff の中核
  - **docs-only close-out 据え置きルール（`workflow_state` 据え置き）を Phase 13 でも遵守する**
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - same-wave sync が未完了（LOGS ×2 / SKILL ×2 + task-workflow.md + topic-map）
  - skill-feedback で aiworkflow-requirements 行が欠落
  - 二重 ledger に drift がある
  - validate / verify スクリプトが FAIL
  - `apps/` / `packages/` 配下に意図せぬ変更が混入している（→ docs-only 前提崩壊 / Phase 5 へ差し戻し）
  - `workflow_state` が誤って `implemented` に昇格している
  - Issue #234 が誤って再オープンされている
