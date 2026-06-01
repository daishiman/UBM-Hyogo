# issue-235-sync-audit-tables-necessity-judgement - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| タスク名 | `sync_audit_logs` / `sync_audit_outbox` の必要性判定（`sync_jobs` ledger 不足分析） |
| ディレクトリ | docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement |
| Wave | 1 |
| 実行種別 | serial（判定タスク単一責務。設計直列 → 検証直列） |
| 作成日 | 2026-05-31 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | docs-only / 設計判定（NON_VISUAL・監査タスク再解釈） |
| visualEvidence | NON_VISUAL |
| 実装区分 | **ドキュメントのみ仕様書**（CONST_004 例外：判定結果が「新設不要」でありコード変更を要さないため。判定根拠は本 index §実装区分判定 と outputs/phase-02 / phase-05 に明記） |
| implementation_mode | verify_existing |
| priority | MEDIUM |
| 検出元 | UT21-U02（親 close-out `ut21-forms-sync-conflict-closeout` Phase 2 §(d) で本判定へ明示委譲） |
| 親タスク | task-ut21-forms-sync-conflict-closeout-001（Issue #234, CLOSED） |
| 原典 spec | docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md |
| GitHub Issue | #235 (CLOSED — クローズドのまま仕様書化。reopen しない) |

## 実装区分判定（CONST_004）

本タスクは **判定（judgement）タスク** であり、成果物は「`sync_audit_logs` / `sync_audit_outbox` を新設するか否かの確定判定」そのものである。

- 最新コード（origin/dev `f6faeb005`）を実測した結果、判定結論は **「新設不要：現行 `sync_jobs` ledger + `sync_job_logs` + 構造化 `metrics_json` で UT-21 audit 観点を充足」** に確定する。
- この結論は **コード変更を一切要さない**（テーブルを作らない＝マイグレーション追加なし／`apps/api` 実装変更なし）。
- したがって本仕様書は CONST_004 のデフォルト（実装仕様書）ではなく、**例外条件「対象タスクが純粋に判定・合意形成で完結し、目的達成にコード変更が不要」** に該当する docs-only 仕様書として作成する。
- 将来 §解除条件（AC-7）が満たされた場合に限り、その時点で **別タスクの実装仕様書**（マイグレーション + `apps/api` audit writer）を起票する。これは CONST_005 が禁じる「今回完了すべき改善の先送り」ではなく、現時点では実需が存在しない将来条件であり、本サイクルで「新設不要」の判定は完了している。

## 目的

UT-21 が当初前提としていた `sync_audit_logs`（毎実行の詳細監査ログ）と `sync_audit_outbox`（audit 書き込み失敗時の at-least-once 退避 outbox）を新規テーブルとして導入すべきか、現行の `sync_jobs` ledger（+ 補助台帳 `sync_job_logs`・構造化 `metrics_json`）の活用で十分かを、**最新コードベースの実測に基づいて** 確定判定する。親 close-out が「保留（U02 へ委譲）」とした状態を、確定した判定証跡として閉じる。

## スコープ

### 含む

- `sync_jobs` 現行 schema（`apps/api/migrations/0003_auth_support.sql`）の棚卸し
- 補助台帳 `sync_job_logs` / `sync_locks`（`apps/api/migrations/0002_sync_logs_locks.sql`）と `metrics_json` zod schema（`apps/api/src/jobs/_shared/sync-jobs-schema.ts`）の棚卸し
- UT-21 が要求した audit 観点（実行ごと詳細 / best-effort 失敗 outbox / 後追い清書 / 行単位差分）の列挙
- ギャップ分析（観点 × 現行 ledger カバー可否）と判定（新設不要 / `sync_jobs` 拡張 / 新規テーブル）
- `sync_audit_logs` / `sync_audit_outbox` がコードベースに存在しないことの実測根拠（rg/grep）
- 判定結果の記録と、親 close-out §(d) 保留方針・解除条件との整合確認
- 判定が「新設不要」である場合の docs-only 確定（CONST_004 例外明記）

### 含まない

- 新テーブルのマイグレーション SQL 作成（判定が「新設要」になった場合は別タスクの実装仕様書）
- `apps/api` 側 audit writer の実装
- `metrics_json` zod schema の変更（現行で構造化済み・拡張不要と判定）
- commit / push / PR 作成（Phase 13 で user 承認後にのみ実施）
- GitHub Issue #235 の reopen / state 変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-ut21-forms-sync-conflict-closeout-001（Issue #234 CLOSED） | 親 close-out。Phase 2 §(d) で本判定へ明示委譲 |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `sync_jobs` repository / D1 直接アクセス境界の正本 |
| 横 | 03a / 03b（forms schema / response sync） | `sync_jobs` ledger の書き込み元・409 排他 / D1 retry の正本 |
| 参照 | apps/api/src/repository/syncJobs.ts | `sync_jobs` lifecycle 実装（start/succeed/fail/findLatest/listRecent） |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md | 原典 U02 spec（本仕様書の上位文書・判定フレームワーク 4.3） |
| 必須 | docs/30-workflows/completed-tasks/ut21-forms-sync-conflict-closeout/outputs/phase-02/migration-matrix-design.md | 親 close-out §(d) 保留方針・解除条件 |
| 必須 | apps/api/migrations/0003_auth_support.sql | `sync_jobs` 現行 DDL |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | `sync_job_logs` / `sync_locks` 現行 DDL |
| 必須 | apps/api/src/jobs/_shared/sync-jobs-schema.ts | `metrics_json` zod schema / PII 禁止キー |
| 必須 | apps/api/src/repository/syncJobs.ts | `sync_jobs` lifecycle 実装 |
| 参照 | apps/api/migrations/0014_notification_outbox.sql | outbox パターンの既存前例（実需ベース新設の根拠） |
| 参照 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | `sync_jobs` current facts |

## 受入条件 (AC)

- AC-1: `sync_jobs` 現行 schema（`job_id` / `job_type` / `started_at` / `finished_at` / `status` / `error_json` / `metrics_json`）が棚卸し表として記録されている
- AC-2: 補助台帳 `sync_job_logs`（カウント列）と `metrics_json` zod schema（構造化キー）の現行構造が棚卸しされている
- AC-3: UT-21 audit 観点 4 種（実行ごと詳細 / outbox 失敗退避 / 後追い清書 / 行単位差分）× 現行 ledger カバー可否のギャップ表が作成されている
- AC-4: 判定基準 4.3 の 3 条件（行単位差分必須 / sync_jobs 書込失敗の別経路記録 / 外部監査・コンプラ分離要請）への該当/非該当判定が記録されている
- AC-5: 最終判定（新設不要 / `sync_jobs` 拡張 / 新規テーブル）が一意に記録されている（結論: **新設不要**）
- AC-6: 判定が「新設不要」のため本タスクが docs-only（コード変更ゼロ）であることが CONST_004 例外として明記されている
- AC-7: 解除条件（将来 新設を再検討するトリガと、その時の受け皿＝別実装タスク）が明記されている
- AC-8: 親 close-out §(d) の保留方針・解除条件と本判定が整合している（U02 が解除条件の判定主体であった旨）
- AC-9: `sync_audit_logs` / `sync_audit_outbox` がコードベース（`apps/api/migrations` / `apps/api/src`）に存在しないことの実測根拠（rg/grep 出力）が記録されている
- AC-10: 不変条件 #4（Form schema 外データは admin-managed 分離）/ #5（D1 直接アクセスは `apps/api` に閉じる）に違反する記述が存在しない
- AC-11: GitHub Issue #235 が CLOSED 状態のまま、本仕様書が成果物として参照可能になっている
- AC-12: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義（監査スコープ・inventory） | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計（ギャップ分析・判定フレーム適用） | phase-02.md | spec_created | outputs/phase-02/gap-analysis-and-verdict.md |
| 3 | 設計レビュー（判定再解釈方針固定） | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | raw evidence 収集（検索戦略） | phase-04.md | spec_created | outputs/phase-04/raw-evidence.md |
| 5 | 判定確定ランブック（verdict 記録） | phase-05.md | spec_created | outputs/phase-05/verdict-runbook.md |
| 6 | 異常系検証（誤判定シナリオ） | phase-06.md | spec_created | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/ac-matrix.md |
| 8 | 正本突合（DRY 化） | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証（正本整合監査） | phase-09.md | spec_created | outputs/phase-09/main.md |
| 10 | 最終レビュー（GO/NO-GO） | phase-10.md | spec_created | outputs/phase-10/go-no-go.md |
| 11 | 再現コマンド手動検証（NON_VISUAL） | phase-11.md | spec_created | outputs/phase-11/manual-test-result.md |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/main.md + 6 補助ファイル |
| 13 | PR作成 | phase-13.md | spec_created | outputs/phase-13/pr-info.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 監査スコープ・inventory・4条件評価・真の論点 |
| 設計 | outputs/phase-02/gap-analysis-and-verdict.md | UT-21 audit 観点 × 現行 ledger ギャップ表 + 判定基準 4.3 適用 + 確定判定 |
| レビュー | outputs/phase-03/main.md | 代替案比較（新設要 / 拡張 / 新設不要）+ 判定再解釈方針固定 |
| 証跡 | outputs/phase-04/raw-evidence.md | rg/grep 検索コマンドと raw 出力（sync_audit_* 非存在 / sync_jobs 棚卸し） |
| 判定 | outputs/phase-05/verdict-runbook.md | 確定判定の記録 + docs-only 確定 + 解除条件 |
| 異常系 | outputs/phase-06/failure-cases.md | 過剰実装 / 早期却下 / 解除条件未記録 等の誤判定シナリオ |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 成果物 トレース |
| 突合 | outputs/phase-08/main.md | 親 close-out §(d) / task-workflow.md current facts 突合 |
| QA | outputs/phase-09/main.md | 正本整合監査・最終確認 |
| ゲート | outputs/phase-10/go-no-go.md | GO/NO-GO 判定 |
| 証跡 | outputs/phase-11/manual-test-result.md | NON_VISUAL 一次証跡（再現コマンド実行記録） |
| 証跡 | outputs/phase-11/reproduction-verification.md | 判定根拠の再現コマンド再確認 |
| ガイド | outputs/phase-12/main.md | Phase 12 本体サマリー |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け）+ Part 2（技術者向け） |
| ガイド | outputs/phase-12/system-spec-update-summary.md | 仕様書同期サマリー |
| ガイド | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| ガイド | outputs/phase-12/unassigned-task-detection.md | 未タスク検出（0 件でも出力必須） |
| ガイド | outputs/phase-12/skill-feedback-report.md | skill フィードバック |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | canonical 9 見出し準拠の Phase 12 最終確認 |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare D1 | `sync_jobs` / `sync_job_logs` ledger 保管 | 無料枠 |
| Cloudflare Workers (apps/api) | Forms sync ランタイム | 無料枠 |
| Google Forms API | `forms.responses.list`（冪等・cursor 再開）正本 sync 元 | 無料 |
| ripgrep (`rg`) | `sync_audit_*` 非存在 / `sync_jobs` 参照の実測 | OSS |

## Secrets 一覧（このタスクで導入・参照）

本タスクは docs-only であり新規 Secret は導入しない。

| Secret 名 | 用途 | 参照のみ |
| --- | --- | --- |
| （なし） | — | — |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #4 | Form schema 外データは admin-managed として分離 | `sync_jobs` / `sync_job_logs` ledger の admin-managed 性質を再確認。判定はこの境界を変更しない |
| #5 | D1 直接アクセスは `apps/api` に閉じる | 棚卸し対象 DDL / repository はすべて `apps/api` 配下。`apps/web` から D1 を参照する記述を持ち込まない |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-12 が Phase 7 / 10 で完全トレースされる
- 最終判定（新設不要）が outputs/phase-05/verdict-runbook.md に一意記録されている
- docs-only（コード変更ゼロ）が `git status --short apps packages` 0 件で実証される
- Phase 12 の same-wave sync（LOGS / SKILL / topic-map）が破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦想定 / 知見

**1. 判定の難しさ（過剰実装 vs 早期却下）**
「将来の監査要件」を理由に新設すると過剰実装。逆に「現状不要」で却下すると後で schema migration が必要。判定基準 4.3 を事前明文化し、3 軸（行単位 / job 単位 / 失敗リカバリ）+ 運用イベント（外部監査 / コンプラ）の 2 段階で判定する。

**2. outbox 新設前例の解釈**
`apps/api/migrations/0014_notification_outbox.sql` に `notification_outbox` が実在する。これは「outbox を作らない方針」ではなく「at-least-once 配送が真に必要な領域（通知）にのみ実需ベースで新設する」運用が確立している証跡。sync audit には現時点でその実需がないため非該当、という根拠に使う。

**3. docs-only 据え置きの判定**
判定結論が「新設不要」のため本タスクはコード変更ゼロ。`spec_created` を `completed` へ自動昇格しない（監査タスクテンプレ §完了ステータス判断）。実装タスクとして完了したわけではなく、判定仕様書としての存続意義を明示する。

**4. CLOSED Issue への仕様書紐付け**
GitHub Issue #235 は CLOSED。ユーザー指示により reopen せず、仕様書側に Issue 番号のみ記録する。

**5. 親 close-out との二重正本回避**
親 close-out Phase 2 §(d) は本判定へ「委譲」しただけで確定判定は未記録。本仕様書が確定判定の正本となるが、親 §(d) の保留方針・解除条件を上書きせず、それを継承・確定する形で記述する。

## 関連リンク

- 上位 README: ../README.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/235 (CLOSED)
- 原典 U02 spec: ../unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md
- 親 close-out: ../completed-tasks/ut21-forms-sync-conflict-closeout/index.md
- 親 §(d) 保留方針: ../completed-tasks/ut21-forms-sync-conflict-closeout/outputs/phase-02/migration-matrix-design.md
