# Lessons Learned — Issue #235 Sync Audit Tables Necessity Judgement（2026-05-31）

> task: `task-ut21-sync-audit-tables-necessity-judgement-001`（Issue #235 CLOSED 維持・judgement / docs-only / NON_VISUAL）
> 関連 spec: `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`、同 `phase-{01..13}.md`
> 関連 成果物: 同 `outputs/phase-02/gap-analysis-and-verdict.md`（正本判定）、`outputs/phase-05/verdict-runbook.md`、`outputs/phase-06/failure-cases.md`、`outputs/phase-11/manual-test-result.md`、`outputs/phase-12/{implementation-guide,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`
> 関連 実測 source（変更ゼロ）: `apps/api/migrations/0003_auth_support.sql`（`sync_jobs`）、`apps/api/migrations/0002_sync_logs_locks.sql`（`sync_job_logs` / `sync_locks`）、`apps/api/src/jobs/_shared/sync-jobs-schema.ts`（`metrics_json` zod）、`apps/api/migrations/0014_notification_outbox.sql`（outbox 前例）
> 関連 reference: `references/task-workflow.md`、`references/task-workflow-active.md`、`references/workflow-issue-235-sync-audit-tables-necessity-judgement-artifact-inventory.md`
> 親 / 原典: `docs/30-workflows/completed-tasks/ut21-forms-sync-conflict-closeout/`（Issue #234, UT21-U02 で本判定へ委譲）、`docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`

## 教訓一覧

### L-I235-001: 判定（judgement）タスクで verdict が no-change に着地する場合は CONST_004 例外の docs-only 仕様書として起票する

- **背景**: 本タスクの成果物は「`sync_audit_logs` / `sync_audit_outbox` を新設するか否かの確定判定」そのものであり、判定結論が「新設不要」だったため、目的達成にコード変更が一切不要だった。CONST_004 のデフォルト（実装仕様書）をそのまま適用すると、後続の実装プロンプトが「実装すべきコードがある」と誤認して `apps/api` を触りに行く事故が起きうる。
- **教訓**: judgement タスクで結論が no-change（新設不要 / 据え置き / 撤回）に着地する場合は、index 冒頭に **§実装区分判定** を立て、「成果物＝判定そのもの」「コード変更ゼロ」「CONST_004 例外条件（純粋に判定・合意形成で完結し目的達成にコード変更不要）に該当」を明記する。`metadata.implementationClassification = "docs-only"` と `verdict` を artifacts.json に固定し、後続プロンプトが誤って実装に走らない構造を作る。
- **将来アクション**: `task-specification-creator` の判定タスク類型に「verdict=no-change → docs-only 例外 + §実装区分判定 必須」をチェック項目として置く（task-spec-creator `lessons-learned/non-visual-governance-pattern.md` と接続）。

### L-I235-002: 「新設不要」は実測コミット固定 + ギャップ表 + 実需ベース前例の三点で支え、推測判定を避ける

- **背景**: 「現行 ledger で足りる」という結論は印象論になりやすい。本タスクは実測基準コミット（origin/dev `f6faeb005`）を固定し、現行 `sync_jobs` / `sync_job_logs` / `metrics_json` zod schema を実ファイルから棚卸しした上で、UT-21 audit 観点 4 種（O-1 実行ごと詳細 / O-2 書込失敗 outbox / O-3 後追い清書 / O-4 行単位差分）× 現行カバー可否のギャップ表で 1 観点ずつ充足根拠を示した。
- **教訓**: necessity judgement では **(a) 実測基準コミットの固定、(b) 観点 × 現行カバー可否のギャップ表（◯/△/✕ 凡例で「集計で代替」を△として明示）、(c) 同リポジトリの実需ベース前例（`notification_outbox` は at-least-once 配送が真に必要だったため新設した実績）** の三点で結論を支える。「outbox を一律で作らない」ではなく「実需が観測される領域にのみ新設する」という運用原則を前例で裏づけると、判定が再現可能になる。O-2 が不要（sync が冪等・cursor 再開）なら O-3 flush も連鎖的に不要、という依存も明記する。
- **将来アクション**: aiworkflow-requirements の DB / schema 判定 reference に「necessity judgement = 実測コミット + ギャップ表 + 実需前例」の 3 点テンプレを常置する。

### L-I235-003: CLOSED Issue 由来の確定判定タスクは spec_created を据え置き、completed へ自動昇格しない

- **背景**: 親 close-out が「保留（U02 へ委譲）」とした状態を確定判定で閉じるタスクだが、これは「実装タスクとして完了した」わけではない。phases[*].status を completed に昇格させると、機械可読サマリー上「実装が走った」と誤読される。
- **教訓**: judgement タスクは `workflow_state = spec_created` / `phases[*].status` 全件 `spec_created` を据え置く（監査タスクテンプレ §完了ステータス判断）。`artifacts.json` と `outputs/artifacts.json` は byte-identical を維持し、`metadata.docsOnly = true` / `implementation_mode = "verify_existing"` を固定する。close-out 自動化で root → `completed-tasks/` へディレクトリ移動されても、ステータスは spec_created のまま（dir 位置 ≠ phase status）。
- **将来アクション**: dir 移動アノマリを見つけたら revert 前に「全 reference の指す先（root か completed-tasks か）」と「親タスクの配置」を集計して整合性を確認する。本タスクでは 8 skill 参照 + 19 内部参照が全て completed-tasks に整合し親 ut21 も completed-tasks 配置だったため、移動は整合した close-out と判定し revert しなかった（[[feedback_grep_head_exit_code_pitfall]] と同じく「正本の集計で判定する」原則）。

### L-I235-004: CLOSED Issue のまま仕様書化する場合は reopen 禁止・`Refs #235` のみ

- **背景**: Issue #235 は CLOSED。確定判定の証跡化のために仕様書を作るが、Issue 状態を触る必要はない。
- **教訓**: CLOSED Issue 由来タスクは **reopen しない**。artifacts.json `githubIssue.state = "CLOSED"` を固定し、PR 本文は `Closes #235` を禁止して `Refs #235` のみを使う（[[lessons-learned-issue-299-schema-questions-fallback-retirement]] L-299-004 と同型）。スコープに「Issue #235 の reopen / state 変更」を含まないと明記する。

### L-I235-005: 将来再評価トリガはテーブル化して記録するが「現時点の未タスク」ではない

- **背景**: 「新設不要」は永続結論ではなく前提条件付きの結論。条件が変われば再評価が要る。一方、トリガを先に未タスク化 / 実装すると過剰実装（Phase 6 F-1）になる。
- **教訓**: 解除条件（T-1 行単位独立監査の要求 / T-2 `sync_jobs` 書込失敗の別経路記録要求 / T-3 外部監査・コンプライアンス分離要求）を **§解除条件テーブル**として index と phase-02/phase-05 に記録するが、これは「実需発生時に新規実装タスクを起票する条件」であって現時点の未タスクではない。`unassigned-task-detection.md` は current（本サイクル発生の未タスク）= 0 件 と baseline（既存保留の解消）を分離して記述し、将来トリガを未タスク 0 件の根拠として明示する。これは CONST_005 が禁じる「今回完了すべき改善の先送り」には該当しない。
- **将来アクション**: judgement タスクの横断ガイドに「verdict=no-change → 解除条件テーブル必須 + 将来トリガは未タスク化しない」を載せる（skill-feedback-report が横断ガイド化候補として記録済み）。

### L-I235-006: docs-only 判定の close-out は code-change=0 を Phase 11 で実証し、命名の近い既存文字列の grep 誤検知に注記を残す

- **背景**: docs-only を主張する以上、「本当にコードを触っていない」ことを証跡化しないとレビューで疑義が残る。また判定対象（`sync_audit_logs` / `sync_audit_outbox`）と紛らわしい既存の `sync_audit`（単数）コメント文字列が実コードに存在し、grep で誤検知しうる。
- **教訓**: docs-only judgement の Phase 11 evidence に `git status --short apps packages`（= 0 件）を一次証跡として記録し artifacts に固定する（本タスク Phase 11 TC-8）。さらに、判定対象と語幹が近い既存文字列（`sync_audit` 単数 コメント等）は判定対象テーブルと別物である旨の **grep 誤検知注記** を artifact inventory と implementation-guide に残し、後続の自動 grep gate が誤って「対象が存在する」と判定するのを防ぐ。同 wave で `references/{task-workflow,task-workflow-active}.md`・`indexes/{quick-reference,resource-map,topic-map,keywords.json}`・両 `LOGS/_legacy.md`・workflow artifact inventory を同期し、`SKILL.md` 本体と schema は既存テンプレで吸収できるため no-op routing とする。
- **将来アクション**: docs-only close-out チェックリストに「code-change=0 の Phase 11 実証」と「語幹近接文字列の grep 誤検知注記」を必須項目として追加する。
