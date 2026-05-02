# タスク実行仕様書生成ガイド / active guide

> 親仕様書: [task-workflow.md](task-workflow.md)
> 役割: active guide
> 区分: 正本（current contract）

## 概要

本ドキュメントは、複雑なタスクを単一責務の原則に基づいて分解し、各サブタスクに最適なスラッシュコマンド・エージェント・スキルの組み合わせを選定するためのガイドラインを定義する。

### UT-03 Sheets API 認証方式設定（2026-04-29）

| 項目 | 値 |
| --- | --- |
| ステータス | completed / Phase 1-12 完了 / Phase 13 pending / NON_VISUAL |
| 成果物 | `docs/30-workflows/ut-03-sheets-api-auth-setup/` |
| 実装 | `packages/integrations/google/src/sheets/auth.ts` / `auth.test.ts` / `auth.contract.test.ts` |
| 公開契約 | `@ubm-hyogo/integrations-google` の `sheets` namespace export |
| 後続 | UT-09 / UT-21 が consumer。実 Google Sheets API smoke は UT-26 で実施 |

### UT-07B Schema Alias Hardening（2026-05-01）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL |
| 成果物 | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/` |
| 実装 | `apps/api/migrations/0008_schema_alias_hardening.sql` / `apps/api/src/repository/schemaAliases.ts` / `apps/api/src/workflows/schemaAliasAssign.ts` / `apps/api/src/routes/admin/schema.ts` |
| 公開契約 | `POST /admin/schema/aliases` HTTP 202 retryable continuation（`backfill_cpu_budget_exhausted`） |
| 検証 | local typecheck + route/workflow/repository tests 完了。10,000 行 staging D1 / Workers 実測は `staging-deferred` |
| 後続 | queue/cron split は Phase 11 staging evidence で必要性が出た場合のみ formalize |

### 04b Follow-up 004 Admin Queue Resolve Workflow（2026-05-01）

| 項目 | 値 |
| --- | --- |
| ステータス | implementation_completed / Phase 1-12 完了 / Phase 13 pending_user_approval / VISUAL deferred-to-staging |
| 成果物 | `docs/30-workflows/04b-followup-004-admin-queue-resolve-workflow/` |
| 実装 | `apps/api/src/routes/admin/requests.ts`, `apps/api/src/repository/adminNotes.ts`, `apps/web/app/(admin)/admin/requests/page.tsx`, `apps/web/src/components/admin/RequestQueuePanel.tsx`, `apps/web/src/lib/admin/api.ts` |
| 公開契約 | `GET /admin/requests`, `POST /admin/requests/:noteId/resolve` |
| 検証 | repository / route / UI component focused Vitest、api/web typecheck。実 screenshot は admin session + D1 fixture staging task へ委譲 |
| 後続 | notification / audit target taxonomy / retention physical deletion / staging visual evidence |

### Issue #112 API Worker Env 型 SSOT（2026-05-01）

| 項目 | 値 |
| --- | --- |
| ステータス | implemented-local / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL |
| 成果物 | `docs/30-workflows/issue-112-02c-followup-api-env-type-helper/` |
| 実装 | `apps/api/src/env.ts` / `apps/api/src/repository/_shared/db.ts` / `scripts/lint-boundaries.mjs` |
| 公開契約 | `Env` interface を API Worker binding 型の SSOT とし、`ctx(env: Pick<Env, "DB">)` で repository context を作る |
| 検証 | typecheck / lint PASS。API full test は pre-existing `schemaDiffQueue.test.ts` 2 件失敗を記録。boundary lint は `../../api/src/env` relative import も遮断 |
| 後続 | KV / R2 / OAuth / Magic Link HMAC key は各後続タスクで `wrangler.toml` と `Env` を同一 wave 同期 |

### 目的

ユーザーから与えられた複雑なタスクを分解し、以下を実現する：

- 単一責務の原則に基づいたサブタスク分割
- 各サブタスクに最適なコマンド・エージェント・スキルの選定
- そのまま実行可能な仕様書ドキュメントの生成
- TDDサイクル（Red→Green→Refactor）の組み込み
- 品質ゲートの明確化

### 成果物配置

生成された仕様書は以下のパス形式で配置する。

| 要素       | 説明                               | 例                                                        |
| ---------- | ---------------------------------- | --------------------------------------------------------- |
| ベースパス | `docs/30-workflows/`               | 固定                                                      |
| 機能名     | 実装対象の機能を表すディレクトリ名 | `skill-import-agent/`                                     |
| ファイル名 | `task-step{N}-{機能名}.md` 形式    | `task-step1-init.md`                                      |
| 完全パス例 | 上記を組み合わせた配置先           | `docs/30-workflows/skill-import-agent/task-step1-init.md` |

---

### docs-only direction-reconciliation の stale 撤回境界

docs-only / direction-reconciliation で採用方針 A を維持する場合でも、既存 references、runtime mount、cron、Secret、migration に不採用方針 B の current 風記述・経路が残るなら、Phase 12 Step 2 は「不発火」ではなく **stale 撤回として発火**させる。

- 正本採用更新: 不採用方針を新たに current 登録しない。
- stale 撤回: 残存する不採用方針の current 風記述・runtime 経路を audit し、撤回・停止タスクを起票する。
- 判定表記: 実測 PASS、記述済み、pending_creation、NOT_APPLICABLE を分け、未実行 validator や未起票タスクを PASS としない。

第一適用例: `docs/30-workflows/ut09-direction-reconciliation/`。

---

## ドキュメント構成

| ドキュメント     | ファイル                                             | 説明                                           |
| ---------------- | ---------------------------------------------------- | ---------------------------------------------- |
| フェーズ定義     | [task-workflow-phases.md](./task-workflow-phases.md) | Phase 0〜6の詳細定義とテンプレート             |
| ルール・選定基準 | [task-workflow-rules.md](./task-workflow-rules.md)   | 品質ゲート、コマンド・エージェント・スキル選定 |

---

## フェーズ構造（概要）

すべてのタスクは以下のフェーズ構造に従う。詳細は [task-workflow-phases.md](./task-workflow-phases.md) を参照。

| フェーズ                                  | ID接頭辞 | 目的                                         |
| ----------------------------------------- | -------- | -------------------------------------------- |
| Phase 0: 要件定義                         | `T-00`   | タスクの目的、スコープ、受け入れ基準を明文化 |
| Phase 1: 設計                             | `T-01`   | 要件を実現可能な構造に落とし込む             |
| Phase 2: テスト作成 (TDD: Red)            | `T-02`   | 期待される動作を検証するテストを先行作成     |
| Phase 3: 実装 (TDD: Green)                | `T-03`   | テストを通すための最小限の実装               |
| Phase 4: リファクタリング (TDD: Refactor) | `T-04`   | 動作を変えずにコード品質を改善               |
| Phase 5: 品質保証                         | `T-05`   | 定義された品質基準をすべて満たすことを検証   |
| Phase 6: ドキュメント更新                 | `T-06`   | 実装内容をシステム要件ドキュメントに反映     |

### フェーズ遷移図

以下の表はフェーズ間の遷移関係を示す。通常は上から順に進行し、Phase 5で品質ゲートを通過しない場合はPhase 4に戻る。

| 遷移元                    | 遷移先                    | 条件                 |
| ------------------------- | ------------------------- | -------------------- |
| Phase 0: 要件定義         | Phase 1: 設計             | 要件定義完了         |
| Phase 1: 設計             | Phase 2: テスト作成       | 設計完了             |
| Phase 2: テスト作成       | Phase 3: 実装             | テスト作成完了       |
| Phase 3: 実装             | Phase 4: リファクタリング | 実装完了             |
| Phase 4: リファクタリング | Phase 5: 品質保証         | リファクタリング完了 |
| Phase 5: 品質保証         | Phase 6: ドキュメント更新 | 品質ゲート通過       |
| Phase 5: 品質保証         | Phase 4: リファクタリング | 品質ゲート未通過     |
| Phase 6: ドキュメント更新 | 完了                      | ドキュメント更新完了 |

---

## 品質ゲート（概要）

次フェーズに進む前に満たすべき品質基準。詳細は [task-workflow-rules.md](./task-workflow-rules.md) を参照。

- 機能検証: 全テスト成功（ユニット、統合、E2E）
- コード品質: Lintエラーなし、型エラーなし、フォーマット適用済み
- テスト網羅性: カバレッジ基準達成（60%以上）
- セキュリティ: 脆弱性スキャン完了、重大な脆弱性なし

---

## 出力テンプレート

### ファイル配置

タスク実行仕様書は `docs/30-workflows/{機能名}/task-step{N}-{機能名}.md` の形式で配置する。詳細は「成果物配置」セクションの表を参照。

### テンプレート構造

タスク実行仕様書は以下の構造を持つ：

1. **ユーザーからの元の指示** - 元の指示文をそのまま記載
2. **タスク概要** - 目的、背景、最終ゴール、成果物一覧
3. **参照ファイル** - コマンド・エージェント・スキル選定の参照先
4. **タスク分解サマリー** - 全サブタスクの一覧表
5. **実行フロー図** - Mermaidによるフロー可視化
6. **各フェーズの詳細** - Phase 0〜5の各サブタスク詳細
7. **品質ゲートチェックリスト** - 完了条件のチェック項目
8. **リスクと対策** - リスク分析と対応方針
9. **前提条件** - タスク実行の前提
10. **備考** - 技術的制約、参考資料

---

## 実行時のコマンド・エージェント・スキル

### 本ドキュメント作成に使用するコマンド

| コマンド       | 用途                                                            |
| -------------- | --------------------------------------------------------------- |
| `/sc:workflow` | PRDと機能要件から構造化された実装ワークフローを生成             |
| `/sc:document` | コンポーネント、関数、API、機能の重点的文書生成                 |
| `/sc:design`   | システムアーキテクチャ、API、コンポーネントインターフェース設計 |

### 本ドキュメント作成に使用するエージェント

| エージェント           | 用途                                                   |
| ---------------------- | ------------------------------------------------------ |
| `technical-writer`     | 使いやすさとアクセシビリティに重点を置いた技術文書作成 |
| `requirements-analyst` | 曖昧なプロジェクトアイデアを具体的な仕様に変換         |
| `system-architect`     | スケーラブルシステムアーキテクチャ設計                 |

### 本ドキュメント作成に使用するスキル

タスク実行仕様書の生成には、プロジェクト固有のスキル定義（`.claude/skills/skill_list.md`）を参照する。

---

## 昇格パターン集

## Current Active / Spec Created Tasks

| タスク | 状態 | 仕様書 root | Phase 12 状態 |
| --- | --- | --- | --- |
| UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC | spec_created / docs-only / NON_VISUAL / Phase 1-12 outputs present / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-observability-matrix-sync/` | 05a `observability-matrix.md` を対象 5 workflow（`ci.yml` / `backend-ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml`）へ同期。mapping は workflow file / display name / trigger / job id / required status context を分離し、required context は confirmed 値（`ci` / `Validate Build` / `verify-indexes-up-to-date`）を正とする。原典 unassigned は `transferred_to_workflow`。 |
| 03a-stablekey-literal-lint-enforcement | enforced_dry_run / warning mode / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/03a-stablekey-literal-lint-enforcement/` | 03a AC-7 stableKey literal 直書き禁止の静的検査を standalone Node script として実装。warning mode は `pnpm lint` chain に統合済み、strict mode は 147 legacy violations で fail するため fully enforced 未達。元 unassigned `completed-tasks/task-03a-stablekey-literal-lint-001.md` は consumed。follow-up は legacy cleanup と strict CI gate の 2 件。 |
| issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring | spec_created / docs-only / NON_VISUAL | `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/` | CLOSED issue #191 の補完仕様として、`schema_aliases` D1 table、07b `POST /admin/schema/aliases` の write target replacement、03a alias-first lookup + temporary `schema_questions.stable_key` fallback を正本化。実装本体 / fallback retirement / direct update guard は `docs/30-workflows/unassigned-task/task-issue-191-*.md` 3 件へ分離 |
| ut-cicd-drift-impl-pages-vs-workers-decision | spec_created / docs-only / NON_VISUAL / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-pages-vs-workers-decision/` | ADR-0001 Pages vs Workers deploy target decision を Accepted / Workers cutover として確定。`apps/web/wrangler.toml` は OpenNext Workers 形式、`.github/workflows/web-cd.yml` は Pages deploy 残として current facts を分離し、実 cutover は `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md` に委譲。 |
| task-claude-code-permissions-deny-bypass-verification-001 | spec_created / docs-only / NON_VISUAL | `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001/` | Claude Code `permissions.deny` と `--dangerously-skip-permissions` の優先関係を公式 docs 調査 + isolated 実機検証 runbook として仕様化。実検証は `task-claude-code-permissions-deny-bypass-execution-001` へ分離 |
| utgov001-second-stage-reapply | spec_created / implementation / NON_VISUAL / Phase 13 approval gate（三役: user 承認 + 実 PUT 実行 + PR 作成）/ `user_approval_required=true` | `docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/` | UT-GOV-001 `contexts=[]` fallback を UT-GOV-004 confirmed contexts で後追い再 PUT する仕様。Phase 13 で **自走禁止 3 項目**（(1) `gh api -X PUT .../branches/{dev,main}/protection` 実 PUT / (2) `git commit` + `git push` / (3) `gh pr create`）を user 明示承認後にのみ実行。Issue #202 は **CLOSED のまま** で `Refs #202` のみ採用（`Closes #202` 禁止 / 再オープン禁止）。dev / main 独立 PUT（直列実行）/ rollback payload は UT-GOV-001 のものを再利用・上書き禁止 / admin token は `op://Employee/ubm-hyogo-env/GITHUB_ADMIN_TOKEN` 経由で揮発取得。applied GET evidence 後に `task-utgov001-references-reflect-001` へ引き渡す |
| task-utgov001-references-reflect-001 | docs-only / NON_VISUAL / Phase 1-12 executed / Phase 13 approval gate（commit・push・PR blocked） | `docs/30-workflows/completed-tasks/task-utgov001-references-reflect-001/` | Issue #303 reflect task。fresh GitHub GET evidence を `outputs/phase-13/branch-protection-applied-{dev,main}.json` に保存し、aiworkflow-requirements の branch protection current applied へ同期。current applied contexts は dev/main とも `ci`, `Validate Build`、strict は dev=false / main=true。`verify-indexes-up-to-date` は expected-context drift として扱い、current applied に混入しない。Issue #303 は closed のまま `Refs #303`。 |
| task-worktree-environment-isolation | spec_created / docs-only / NON_VISUAL | `docs/30-workflows/task-worktree-environment-isolation/` | worktree / tmux / shell state 分離仕様を development-guidelines と lessons-learned に同期済み。コード実装は未タスクへ分離 |
| TASK-SKILL-CODEX-VALIDATION-001 | completed / Phase 1-12 完了 / Phase 13 user_approval_required / NON_VISUAL | `docs/30-workflows/completed-tasks/skill-md-codex-validation-fix/` | Codex SKILL.md frontmatter 検証契約 R-01〜R-07 を validator + 二段ガード + CLI 経路三段目で実装。AC-1〜AC-8 8/8 PASS。current facts: (1) `description ≤1024 字 / string scalar / YAML 構文有効`、(2) 二段ガード（generate / write）+ `quick_validate` 三段目、(3) フィクスチャ 30 件 `*.fixture` 化で skill discovery 圏外化、(4) 退避先 Markdown 統一（`references/{topic}.md`）、(5) Anchors ≤5 / Trigger keywords ≤15 自動退避、(6) `.claude/` ↔ `.agents/` 同 wave sync、(7) codex_validation.test.js 24 ケース GREEN、(8) follow-up 3 件を unassigned-task-detection.md に分離 |
| ut-02a-section-field-canonical-schema-resolution | verified / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/` | Issue #108。`apps/api/src/repository/_shared/builder.ts` の broad section assignment / stable_key label leakage / heuristic field kind fallback を `MetadataResolver` + generated static manifest baseline へ置換。`FieldKind` に `consent` / `system` を追加し、public / member / admin 3 view は同一 resolver から section/key/kind/label を導出。Phase 11 は builder unit test / drift detection log / three-view parity の NON_VISUAL evidence。Phase 12 は aiworkflow-requirements indexes と legacy mapping を same-wave sync。03a alias queue 接続、manifest stale detection、retirement 条件は `docs/30-workflows/unassigned-task/task-ut02a-canonical-metadata-diagnostics-hardening-001.md` に分離。 |
| task-lefthook-multi-worktree-reinstall-runbook | spec_created / docs-only / runbook-spec / NON_VISUAL | `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook/` | 30+ worktree への lefthook 一括再 install runbook 仕様を確定。`doc/00-getting-started-manual/lefthook-operations.md` への差分追記内容を Step 2-1〜2-4 で specify。固有教訓は `lessons-learned-lefthook-mwr-runbook-2026-04.md`（L-MWR-001〜006）。スクリプト実装（`scripts/reinstall-lefthook-all-worktrees.sh`）は別 Wave に分離 |
| ut-06-followup-A-opennext-workers-migration | implemented / static_verified / NON_VISUAL | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` | apps/web `wrangler.toml` を Pages 形式から OpenNext Workers 形式へ移行。AC-1〜AC-7 / AC-13〜AC-16 は静的検証済み。AC-8〜AC-12（build / staging deploy / smoke / bundle size / fallback 実測）はユーザー承認後に Phase 11 へ追記 |
| FIX-CF-ACCT-ID-VARS-001 | implemented / static_verified / NON_VISUAL / Phase 13 user_approval_required | `docs/30-workflows/completed-tasks/fix-cf-account-id-vars-reference/` | `.github/workflows/backend-ci.yml` 4 箇所と `.github/workflows/web-cd.yml` 2 箇所の `CLOUDFLARE_ACCOUNT_ID` 参照を `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` に同期。Repository Variable 登録あり / Secret 不在を `gh api` で確認済み。actionlint / yamllint はローカル未導入のため deferred。関連未タスク `U-FIX-CF-ACCT-01` / `U-FIX-CF-ACCT-02` を formalize。 |
| UT-06-FU-A-PROD-ROUTE-SECRET-001 | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / docs-only / NON_VISUAL | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` | UT-06-FU-A OpenNext Workers production cutover 前の route / custom domain / secret key / observability target split-brain 防止 runbook。`outputs/phase-05/runbook.md` を workflow-local 正本とし、secret 値は記録せず key 名のみ、Cloudflare 操作は `bash scripts/cf.sh` 経由、production deploy / DNS 切替 / Worker 削除は別承認に分離。原典 unassigned は `docs/30-workflows/completed-tasks/UT-06-FU-A-production-route-secret-observability.md` に移動済み。route inventory は design workflow `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/` と実装 follow-up `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md` に分離済み。Logpush target diff automation は `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/` で implementation_complete。Phase 11 evidence は NON_VISUAL infrastructure verification の format check 完了であり、production 実測 PASS は別承認 operation に分離。固有教訓 `references/lessons-learned-ut06-fu-a-prod-route-secret-2026-04.md`（L-UT06FUA-001〜007）、artifact inventory `references/workflow-ut-06-fu-a-prod-route-secret-001-artifact-inventory.md`。 |
| UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 | spec_created / docs-only / NON_VISUAL / Phase 12 completed / Phase 13 blocked_pending_user_approval | `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/` | production Worker route inventory script の設計 close-out。`InventoryReport` SSOT、GET allowlist（workers scripts / zone workers routes / workers domains）、secret leak guard、mutation grep、NON_VISUAL evidence を固定。元 unassigned `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md` は consumed pointer。実装・実 command・親 runbook 追記・実測 evidence は `docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-impl-001.md` に委譲。 |
| UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001 | implementation_complete / Phase 1-12 completed / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/` | production observability target diff script。公開入口は `bash scripts/cf.sh observability-diff --current-worker ubm-hyogo-web-production --legacy-worker ubm-hyogo-web --config apps/web/wrangler.toml`、内部実装は `scripts/observability-target-diff.sh` / `scripts/lib/redaction.sh`。Workers Logs / Tail / Logpush / Analytics Engine の 4 軸を新旧 Worker で比較し、token / credential / sink URL query は redaction 済みで出力する。検証は `bash tests/unit/redaction.test.sh` 11 PASS、`bash tests/integration/observability-target-diff.test.sh` 18 PASS。起源 unassigned `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` は transferred_to_workflow。 |
| 04c-parallel-admin-backoffice-api-endpoints | completed / Phase 1-12 完了 / Phase 13 pending / NON_VISUAL | `docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/` | UBM-Hyogo 管理者バックオフィス API（9 router / 16 endpoint）を `apps/api` に実装。dashboard / members（list/detail/status/notes/delete/restore）/ tags-queue（resolve）/ schema（diff/aliases）/ meetings（list/create/attendance）。05a close-out で人間向け `/admin/*` は Auth.js JWT + `admin_users.active` 判定の `requireAdmin` へ差し替え済み。同期系 `/admin/sync*` のみ `SYNC_ADMIN_TOKEN` Bearer を維持。不在 endpoint（`PATCH /admin/members/:memberId/profile` / `PATCH /admin/members/:memberId/tags`）は構造で保証。新規 repository: `apps/api/src/repository/dashboard.ts` / `apps/api/src/repository/memberTags.ts`（`assignTagsToMember`）。検証: typecheck エラー 0 / vitest 251 PASS。固有教訓 `lessons-learned-04c-admin-backoffice-2026-04.md`（L-04C-001〜005） |
| 04b-followup-001-admin-queue-request-status-metadata | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/04b-followup-001-admin-queue-request-status-metadata/` | `admin_member_notes` に `request_status` / `resolved_at` / `resolved_by_admin_id` と partial index `idx_admin_notes_pending_requests` を追加。`adminNotes.hasPendingRequest` は `request_status='pending'` 限定、`markResolved` / `markRejected` は pending 条件付き UPDATE。`docs/00-getting-started-manual/specs/07-edit-delete.md` / `08-free-database.md` / `references/database-admin-repository-boundary.md` と同期済み。 |
| issue-106-admin-member-notes-repository-task-spec | implementation / NON_VISUAL / implemented_pending_user_approval / Phase 1-12 完了 / Phase 13 blocked_pending_user_approval | `docs/30-workflows/completed-tasks/issue-106-admin-member-notes-repository-task-spec/` | Closed issue #106 の再検証 workflow。現行正本は `apps/api/src/repository/adminNotes.ts` / `listByMemberId` で、`adminMemberNotes.ts` は重複新設しない。member_id filter、空配列、`created_at DESC`、admin note mutation の `audit_log` append、admin detail audit と `admin_member_notes` の非混同を regression tests で固定。 |
| 07b-parallel-schema-diff-alias-assignment-workflow | completed_without_pr / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL / superseded-by UT-07B hardening | `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/` | 初期 07b では `schema_diff_queue` の alias 候補提示・dryRun・apply workflow を `apps/api` に実装。UT-07B hardening 以降の current contract は `schema_aliases` INSERT、collision `409 stable_key_collision`、HTTP 202 retryable continuation。旧 `schema_questions.stable_key` direct update / collision 422 記述は historical baseline としてのみ扱う。 |
| UT-07B-schema-alias-hardening-001 | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/` | issue-191 の `schema_aliases` write target replacement を上位前提に、07b alias apply を DB constraint / resumable back-fill / HTTP 202 retryable continuation で harden した追加実装タスク。10,000 行 staging evidence は Cloudflare staging credentials 前提のため Phase 11 deferred。Issue #293 は CLOSED 維持、PR では `Refs #293` のみ採用。 |
| 05b-parallel-magic-link-provider-and-auth-gate-state | completed_without_pr / Phase 1-12 完了 / Phase 13 pending / NON_VISUAL | `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/` | Magic Link 発行・検証と AuthGateState 判定 API を `apps/api` に実装。`GET /auth/gate-state`、`POST /auth/magic-link`、`POST /auth/magic-link/verify`、`POST /auth/resolve-session`、Resend mailer、email/IP rate limit、`magic_tokens.deleteByToken` rollback、apps/web 同 origin proxy 3 本、shared auth 補助 alias export（`SessionUserAuthGateState`）を追加。`/no-access` route 不在と apps/web D1 直参照不在は fs-check で保証。Phase 11 は `ui_routes: []` のため screenshot ではなく Hono direct fetch + Vitest + fs-check evidence。Auth.js Credentials Provider 本体と `/api/auth/callback/email` route は 05b-B で implemented-local 済み。正本仕様は `api-endpoints.md` / `environment-variables.md` / `lessons-learned-05b-magic-link-auth-gate-2026-04.md` に同期済み。 |
| 05b-B-magic-link-callback-credentials-provider | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval | `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/` | 05b 起票元 `task-05b-authjs-callback-route-credentials-provider-001.md` を Phase 1-13 workflow へ昇格し、Auth.js Credentials Provider `id="magic-link"`、`/api/auth/callback/email` GET route、`verify-magic-link.ts` helper、failure redirect mapping、focused tests を実装。apps/web D1 direct access 禁止は boundary check PASS。dev-server curl / Auth.js real Set-Cookie / staging smoke は 09a 系 runtime evidence に委譲。旧 `02-application-implementation/05b-B...` path は legacy register に記録。 |
| 02c-followup-002-fixtures-prod-build-exclusion | spec_created / implementation-spec / docs-only / NON_VISUAL / Phase 1-12 spec complete / Phase 13 blocked_pending_user_approval | `docs/30-workflows/02c-followup-002-fixtures-prod-build-exclusion/` | 02c Phase 12 unassigned-task #6 を Phase 1-13 workflow へ昇格。対象は `apps/api` の `__fixtures__` / `__tests__` を production build artifact から除外する build/test boundary、Vitest fixture compatibility、dependency-cruiser import guard。runtime implementation / tests / artifact grep は未実行で、Phase 11 reserved evidence path に分離。元 unassigned task path は legacy stub として canonical root へ誘導。 |
| 05a-parallel-authjs-google-oauth-provider-and-admin-gate | completed / Phase 1-12 完了 / Phase 13 pending（user approval 待ち） / VISUAL smoke deferred to 09a | `docs/30-workflows/completed-tasks/05a-parallel-authjs-google-oauth-provider-and-admin-gate/` | Auth.js v5 Google OAuth provider、`GET /auth/session-resolve`（`X-Internal-Auth` 必須 / D1 直接アクセス禁止の唯一経路）、共有 HS256 JWT session（`memberId` / `isAdmin` のみ最小化）、apps/web `/admin/*` middleware（UI gate）、apps/api `requireAdmin`（API gate）を実装。`packages/shared/src/auth.ts` に `AuthSessionUser` / `SessionJwtClaims` / `GateReason`（`unregistered` / `deleted` / `rules_declined` 05b と共有命名）/ JWT sign/verify / Auth.js encode/decode adapter を追加。人間向け admin API 9 router は `requireAdmin` に差し替え、sync 系は `requireSyncAdmin`（`SYNC_ADMIN_TOKEN` Bearer）を維持。D1 `sessions` テーブル不採用で無料枠 reads/day を温存。Phase 11 は OAuth credentials / staging 未接続のため screenshot smoke を 09a に委譲し、代替として JWT互換・session-resolve・admin route gate tests を PASS。固有教訓 `references/lessons-learned-05a-authjs-admin-gate-2026-04.md`（L-05A-001〜006）。Follow-up: unassigned-task-001（Phase 11 staging 実 OAuth screenshot）/ unassigned-task-002（Google OAuth verification 本番申請、MVP 卒業時）/ unassigned-task-003（admin 剥奪即時反映 B-01 用 KV revocation list 設計検討、D1 sessions 復活禁止） |
| 05b-A-auth-mail-env-contract-alignment | spec_created / docs-only / remaining-only / NON_VISUAL / Phase 13 pending_user_approval | `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/` | Magic Link メール送信の env 名 drift を解消する仕様整流タスク。正本 env 名は `MAIL_PROVIDER_KEY`（Secret）/ `MAIL_FROM_ADDRESS`（Variable）/ `AUTH_URL`（Variable）。旧 `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL` は新規 provisioning しない stale manual-spec 名として撤回。Phase 11 は NON_VISUAL readiness templates のみ、実 staging smoke は 09a、production readiness は 09c、callback/provider 統合は 05b-B に委譲。 |
| ut-05a-followup-google-oauth-completion | spec_created / implementation / VISUAL | `docs/30-workflows/ut-05a-followup-google-oauth-completion/` | 05a follow-up 001（staging OAuth smoke evidence）と 002（Google OAuth verification）を統合。単一 OAuth client / redirect URI matrix / Cloudflare Secrets placement / consent screen / Stage A-B-C manual smoke を仕様化し、B-03 解除条件 a/b/c を `13-mvp-auth.md` と同期する。現時点は repo 外の Google Cloud Console / Cloudflare Secrets 操作未実行のため workflow root は `spec_created` を維持し、Phase 11 screenshots は placeholder のみ。実 evidence 取得後に Phase 12 system spec update を再適用する。 |
| u-04-serial-sheets-to-d1-sync-implementation | completed / Phase 1-12 完了 / Phase 13 pending（user approval 待ち） / NON_VISUAL | `docs/30-workflows/completed-tasks/u-04-serial-sheets-to-d1-sync-implementation/` | UT-01 の Sheets→D1 同期方式を `apps/api/src/sync/` に実装。`POST /admin/sync/run`、`POST /admin/sync/backfill`、`GET /admin/sync/audit`、Cloudflare Cron `0 * * * *` の `runScheduledSync(env)` を追加。`requireSyncAdmin` / `SYNC_ADMIN_TOKEN` Bearer、`withSyncMutex`、`sync_job_logs` audit ledger、`sync_locks` mutex、Workers 互換 fetch + `crypto.subtle` Sheets client を採用。Phase 11 は UI 変更なしのため NON_VISUAL、代替 evidence を `outputs/phase-11/evidence/non-visual-evidence.md` に配置。staging smoke は 05b、cron monitoring / 30 分超 running alert は 09b へ relay。 |
| U-UT01-08 sync enum canonicalization | spec_created / docs-only / NON_VISUAL / Phase 13 pending_user_approval | `docs/30-workflows/u-ut01-08-sync-enum-canonicalization/` | UT-01 論理設計と既存 `sync_job_logs` / `sync_locks` 実装の enum drift を契約化。canonical `status` は `pending` / `in_progress` / `completed` / `failed` / `skipped`、canonical `trigger_type` は `manual` / `cron` / `backfill`。既存 `running -> in_progress`、`success -> completed`、`admin -> manual + triggered_by='admin'` を migration 変換案として固定。コード変更なし。実 migration / sync literal rewrite / shared type+Zod は UT-04 / UT-09 / U-UT01-10 に委譲。 |
| U-UT01-07-FU01 UT-09 canonical sync job receiver | completed / docs-only / NON_VISUAL / Phase 1-12 完了 / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/u-ut01-07-fu01-ut09-canonical-sync-job-receiver/` | 親 U-UT01-07 Phase 2 の canonical 名 `sync_job_logs` / `sync_locks` と `sync_log` 物理化禁止を UT-09 実装受け皿へ引き渡す receiver 仕様。受け皿 path は既存 `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`。本タスクはコード・migration・script・hook・CI gate を作らず、UT-09 / governance guard へ委譲する。 |
| UT-04 D1 データスキーマ設計 | spec_created / docsOnly=true / NON_VISUAL / Phase 13 blocked | `docs/30-workflows/ut-04-d1-schema-design/` | Cloudflare D1 初期 schema の current canonical set を `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs` に確定。旧 `members` は legacy、既存 `sync_job_logs` / `sync_locks` は UT-09 owned transition tables として扱う。`references/database-schema.md` / `references/database-schema-ddl-template.md` / `references/database-indexes.md` に DDL 反映テンプレとインデックス責務分離を同期済み。実 migration 投入、seed data、shared Zod codegen、sync ledger transition は未タスクとして分離。workflow root は `spec_created` を維持し、実 DDL merge まで `implemented` に昇格しない。 |
| UT-01 Sheets→D1 同期方式定義 | spec_created / docs-only / NON_VISUAL / design_specification | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/` | Cron pull 採択、手動 / 定期 / バックフィル 3 フロー、`sync_log` 論理設計、Sheets 優先 SoT を確定。既存 `apps/api` 実装との差分（`sync_job_logs` / `sync_locks`、enum、retry、offset、shared 契約）は U-7〜U-10 として未タスク化。Phase 13 はユーザー承認待ち |
| U-UT01-09 retry 回数と offset resume 方針の統一 | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/` | UT-01 U-9 の canonical 設計判断記録。legacy Sheets→D1 sync の retry max=3、backoff base 1s / factor 2 / cap 32s / jitter ±20%、`processed_offset` = chunk index（chunk 100）を採択。実コード反映（`DEFAULT_MAX_RETRIES=3`、withRetry cap/jitter、migration、resume）は UT-09、物理 ledger mapping は U-UT01-07 へ委譲。現行 Forms sync / `sync_jobs.metrics_json.cursor` 契約は上書きしない。 |
| 06b-parallel-member-login-and-profile-pages | completed / Phase 1-12 完了 / Phase 13 pending（user approval 待ち） / VISUAL partial captured | `docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/` | apps/web 会員向け `/login` と `/profile` を実装。`/login` は AuthGateState 5 状態（input / sent / unregistered / rules_declined / deleted）、Magic Link form、Google OAuth button、`/no-access` 不採用、sent email 非表示、`normalizeRedirectPath` による safe redirect を提供。`/profile` は 04b `/me` `/me/profile` を `fetchAuthed` で取得し、read-only `StatusSummary` / `ProfileFields` / 外部 Google Form `EditCta` / `AttendanceList` を表示。`apps/web/middleware.ts` は `/profile/:path*` 未ログインを `/login?redirect=...` へ誘導。検証: `@ubm-hyogo/web typecheck` PASS、06b focused Vitest 23 PASS、Phase 11 local `/login` screenshot M-01〜M-05 + `/profile` redirect curl captured。Follow-up: `UT-06B-PROFILE-VISUAL-EVIDENCE`（logged-in profile / staging screenshot）, `UT-06B-MAGIC-LINK-RETRY-AFTER`（429 Retry-After UI 復元） |
| 06b-A-me-api-authjs-session-resolver | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/06b-A-me-api-authjs-session-resolver/` | `/profile` SSR が cookie forwarding で呼ぶ `/me` / `/me/profile` を、apps/api 側で Auth.js session cookie/JWT から解決する follow-up 実装。`apps/api/src/middleware/me-session-resolver.ts` が `authjs.session-token` / `__Secure-authjs.session-token` / next-auth v4 migration cookie / Authorization Bearer JWT を `AUTH_SECRET` で検証し、dev-only `x-ubm-dev-session` は `ENVIRONMENT === "development"` 限定で fail-closed。`apps/api/src/index.ts` の `/me` mount を inline dev-only resolver から `createMeSessionResolver()` に差し替え。Focused tests: `apps/api/src/middleware/me-session-resolver.test.ts` 12 cases（dev path / production rejection / env missing rejection / cookie names / wrong secret / expired / missing / malformed）。staging / production live smoke と deploy は 09a / 09c gate。旧 root `docs/30-workflows/02-application-implementation/06b-A-me-api-authjs-session-resolver/` は legacy mapping に登録。 |
| 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | spec_created / scaffolding-only / VISUAL_DEFERRED / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/08b-parallel-playwright-e2e-and-ui-acceptance-smoke/` | apps/web Playwright scaffold を追加。`apps/web/playwright.config.ts`、page objects、7 skipped spec、auth/D1 fixture placeholder、manual-only `.github/workflows/e2e-tests.yml`、Phase 11 evidence inventory を作成。実 screenshot / real axe / real Playwright report は未取得で、CI gate 化も未実施。full execution は `docs/30-workflows/unassigned-task/task-08b-playwright-e2e-full-execution-001.md` または 09a staging smoke へ委譲。 |
| ut-06b-profile-logged-in-visual-evidence | spec_created / Phase 1-12 spec drafted / Phase 13 pending / VISUAL evidence external-gated by 09a staging | `docs/30-workflows/ut-06b-profile-logged-in-visual-evidence/` | 親 06b の Phase 11 で未取得だった `/profile` logged-in 画面 visual evidence を補完する canonical workflow。Phase 1-13 仕様書を formalize し、`apps/web/src/__tests__/static-invariants.test.ts` の S-04 read-only invariant に `<button type="submit">` 検出を追加して submit 経路全体を構造保証。Phase 11 evidence captured は staging 09a deploy smoke 成立後（external_gate）に解放。legacy stub `docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md` は Canonical Status 見出しを追加し本 canonical へ片方向リンク。固有教訓 `references/lessons-learned-06b-profile-logged-in-visual-evidence-2026-04.md`（L-06B-001〜005）。 |
| 09a-parallel-staging-deploy-smoke-and-forms-sync-validation | spec_created / implementation spec / docsOnly=true / NON_VISUAL close-out / VISUAL_ON_EXECUTION / Phase 13 blocked_until_user_approval | `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` | staging deploy smoke と Forms sync validation の実行仕様。05a/06a/06b/06c/08b から委譲された staging visual smoke、03a/03b/U-04 の schema/response sync evidence、Cloudflare free-tier / authz / web-D1 boundary を Phase 11 実行時に取得する。今回 close-out では placeholder を PASS と扱わず、`outputs/phase-11/*` は `NOT_EXECUTED` 境界を明記。root / outputs `artifacts.json` parity と Phase 12 7成果物を配置済み。実 staging 実行は `docs/30-workflows/unassigned-task/task-09a-exec-staging-smoke-001.md` に formalize 済みで、09c はその実測 evidence まで blocked。 |
| ut-09a-exec-staging-smoke-001 | spec_created / implementation / VISUAL_ON_EXECUTION / Phase 11 executed_BLOCKED / Phase 13 blocked_until_user_approval | `docs/30-workflows/ut-09a-exec-staging-smoke-001/` | 09a staging smoke 実行 follow-up。2026-05-02 に user 明示指示後 Phase 11 を試行したが、`bash scripts/cf.sh whoami` が unauthenticated となり staging deploy / Playwright screenshot / Forms sync / wrangler tail は BLOCKED。さらに親 09a canonical directory が現 worktree に不在のため AC-1 placeholder 置換も不可。09c blocker decision: `blocked`, reason=`cloudflare_unauthenticated + 09a_directory_missing`, evidence=`docs/30-workflows/ut-09a-exec-staging-smoke-001/outputs/phase-11/main.md`, checked_at=`2026-05-02`。Follow-up: `docs/30-workflows/unassigned-task/task-09a-cloudflare-auth-token-injection-recovery-001.md`, `docs/30-workflows/unassigned-task/task-09a-canonical-directory-restoration-001.md`。 |
| 09b-parallel-cron-triggers-monitoring-and-release-runbook | spec_created / docs-only / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/` | Cron triggers monitoring + release runbook 仕様。`apps/api/wrangler.toml` current facts (`0 * * * *`, `0 18 * * *`, `*/15 * * * *`) を監視対象として記録し、legacy Sheets hourly cron の撤回は UT21-U05 に分離。Phase 11 は screenshot 不要で `main.md` + `manual-smoke-log.md` + `link-checklist.md`、Phase 12 は skill 必須 7 成果物 + release / incident / diff plan、Phase 13 は user 明示承認まで PR 作成禁止。09a staging smoke と 09c production deploy へ runbook を引き渡す。artifact inventory: `references/workflow-task-09b-parallel-cron-triggers-monitoring-and-release-runbook-artifact-inventory.md`。lessons: `references/lessons-learned-09b-cron-monitoring-release-runbook-2026-05.md`。 |
| ut-02a-attendance-profile-integration | implemented / Phase 1-12 completed / NON_VISUAL / Phase 13 pending_user_approval | `docs/30-workflows/ut-02a-attendance-profile-integration/` | 02a Phase 12 由来の `MemberProfile.attendance` 実データ統合 follow-up。`createAttendanceProvider().findByMemberIds()`、D1 80-id chunked read、builder optional `attendanceProvider` injection、meeting/attendance branded type module を実装済み。`member_attendance` + `meeting_sessions` は `session_id` で INNER JOIN し、`held_on DESC` + `session_id ASC` で安定化する。旧単票は `docs/30-workflows/completed-tasks/UT-02A-ATTENDANCE-PROFILE-INTEGRATION.md` の Canonical Status で本 root へ誘導。09a/09b/09c、06b visual、U-UT01-08 enum canonicalization は削除・代替しない。artifact inventory: `references/workflow-ut-02a-attendance-profile-integration-artifact-inventory.md` / 固有教訓: `references/lessons-learned-ut-02a-attendance-profile-integration-2026-05.md` / closeout: `changelog/20260501-ut-02a-attendance-profile-integration-closeout.md`。 |
| 09c-serial-production-deploy-and-post-release-verification | docs-only / spec_created / VISUAL / runtime evidence pending_user_approval | `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/` | Wave 9 terminal production release runbook specification。09a staging green と 09b release / incident runbook の引き渡しを受け、production D1 migration / deploy / release tag / smoke / 24h verification の runbook と evidence template を固定。実 production deploy は `task-09c-production-deploy-execution-001` に分離し、`bash scripts/cf.sh` wrapper、solo CI gate branch strategy、Phase 11 runtime evidence pending 境界を正本化。artifact inventory は `references/workflow-task-09c-serial-production-deploy-and-post-release-verification-artifact-inventory.md`、旧 root alias は `references/legacy-ordinal-family-register.md` に登録。 |
| 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / VISUAL screenshot deferred to 08b/09a | `docs/30-workflows/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages/` | apps/web `/admin` 5画面（dashboard / members / tags / schema / meetings）を App Router `(admin)` 配下に実装。04c admin API と 05a admin gate を接続し、`AdminSidebar`、`MemberDrawer`、`TagQueuePanel`、`SchemaDiffPanel`、`MeetingPanel`、`/api/admin/[...path]` proxy、Server Component `fetchAdmin` を追加。profile本文直接編集なし、tag直接編集なし、schema解消は`/admin/schema`のみ、deleted attendance除外、duplicate attendance disabled + 409/422 toast。検証: web typecheck PASS / Vitest 7 files 36 tests PASS。Phase 11 screenshot は D1 fixture・staging admin 前提のため 08b Playwright / 09a staging smoke に委譲。固有教訓 `references/lessons-learned-06c-admin-ui-2026-04.md`（L-06C-001〜005） |
| UT-07A-02 search-tags resolve contract follow-up | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/completed-tasks/ut-07a-02-search-tags-resolve-contract-followup/` | 07a resolve body contract を shared schema SSOT に昇格。`packages/shared/src/schemas/admin/tag-queue-resolve.ts` の strict discriminated union を API route と apps/web admin client が参照し、`confirmed + tagCodes` / `rejected + reason` / mixed body 400 / idempotent / 409 / 422 を focused Vitest 31 tests と typecheck で検証。`docs/30-workflows/completed-tasks/UT-07A-02-search-tags-resolve-contract-followup.md` は consumed。UT-07A-03 staging smoke の前提を満たす。 |
| 07a-parallel-tag-assignment-queue-resolve-workflow | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/completed-tasks/07a-parallel-tag-assignment-queue-resolve-workflow/` | tag assignment queue resolve workflow を `apps/api` に実装。`POST /admin/tags/queue/:queueId/resolve` は `{ action: "confirmed", tagCodes }` / `{ action: "rejected", reason }` を受け、guarded update 成功後だけ `member_tags` / `audit_log` を更新する。`queued/reviewing -> resolved/rejected`、同一 payload idempotent、409 race/state conflict、422 unknown tag/deleted member。03b response sync hook から未タグ member の candidate queue を自動投入。apps/web admin client と `TagQueuePanel`、packages/shared zod/type も `rejected` と resolve body に追従。検証: api typecheck PASS / web typecheck PASS / shared typecheck PASS / api Vitest 69 files 406 tests PASS / web Vitest 13 files 72 tests PASS。固有教訓 `references/lessons-learned-07a-tag-queue-resolve-2026-04.md`（L-07A-001〜007）。Follow-up: UT-07A-01 / UT-07A-03 / UT-07A-04（UT-07A-02 は consumed） |
| issue-109-ut-02a-tag-assignment-queue-management | implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval / Issue #109 CLOSED | `docs/30-workflows/completed-tasks/issue-109-ut-02a-tag-assignment-queue-management/` | 02a `memberTags.ts` read-only 境界を維持したまま、Forms sync から `tag_assignment_queue` へ candidate を投入する write-side repository / workflow を実装。`enqueueTagCandidate(env, payload)` は `createIdempotent` 経由で `<memberId>:<responseId>` key を使い、migration `0009_tag_queue_idempotency_retry.sql` で idempotency / retry / DLQ 列を追加。admin queue は `status=dlq` filter を許可。manual specs 08/11/12 と Phase 12 7 outputs は同一 wave 同期済み。follow-up: `task-issue-109-dlq-requeue-api-001.md`, `task-issue-109-retry-tick-and-dlq-audit-001.md`, `task-issue-109-tag-queue-pause-flag-001.md`, `task-schema-diff-queue-faked1-compat-001.md`。 |
| 07c-parallel-meeting-attendance-and-admin-audit-log-workflow | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/completed-tasks/07c-parallel-meeting-attendance-and-admin-audit-log-workflow/` | apps/api attendance 3 endpoint を 05a `requireAdmin` 配下で実装。`GET /admin/meetings/:sessionId/attendance/candidates` は session 不在 `404 session_not_found`、削除済み・登録済み member 除外。`POST /admin/meetings/:sessionId/attendance` は duplicate `409 attendance_already_recorded` / deleted `422 member_is_deleted` / session 不在 `404 session_not_found`。`DELETE /admin/meetings/:sessionId/attendance/:memberId` は row 不在を `404 attendance_not_found` に集約。add/remove 成功時のみ `audit_log` に `attendance.add` / `attendance.remove` を append（target_type=`meeting`, target_id=sessionId）。Phase 11 は API-only のため Vitest smoke evidence、visual は 08b/09a に委譲。固有教訓 `references/lessons-learned-07c-attendance-audit-2026-04.md`（L-07C-001〜005）。 |
| 07c-followup-003-audit-log-browsing-ui | completed / Phase 1-12 完了 / Phase 13 blocked_user_approval / VISUAL | `docs/30-workflows/completed-tasks/07c-followup-003-audit-log-browsing-ui/` | `/admin/audit` 監査ログ閲覧 UI と `GET /admin/audit` を実装。API は `requireAdmin`、複合 filter、UTC range、cursor pagination、limit 1-100、maskedBefore/maskedAfter projection、broken JSON parseError を提供し raw `before_json` / `after_json` を返さない。Web は admin proxy 経由の read-only table/filter/disclosure UI、JST 入力・表示、UI 側 PII 再 mask、AdminSidebar 導線を追加。検証: api typecheck PASS / web typecheck PASS / api Vitest 82 files 493 tests PASS / focused web Vitest 2 files 7 tests PASS。web 全体 test は既存 `/no-access` invariant で FAIL（本差分外）。Phase 11 screenshot 7 件を保存。 |
| 08a-parallel-api-contract-repository-and-authorization-tests | partial / Phase 1-10 completed / Phase 11-12 partial / Phase 13 pending_user_approval / NON_VISUAL | `docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/` | apps/api の API contract / repository / authz / brand type / invariant tests を整備。Phase 11 実測は 74 files / 442 tests PASS、coverage は Statements 84.18% / Branches 84.13% / Functions 83.37% / Lines 84.18% で AC-6 PARTIAL。代表 authz matrix + route tests で現状を観測し、全 endpoint generated matrix と public use-case coverage 補強は `docs/30-workflows/unassigned-task/UT-08A-01-public-use-case-coverage-hardening.md` に formalize。UI route なしのため screenshot 不要、Phase 11 evidence は `outputs/phase-11/evidence/{test-run.log,coverage-report.txt,ci-workflow.yml}`。Phase 12 close-out: `outputs/phase-12/{main,implementation-guide,documentation-changelog,system-spec-update-summary,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md`（全 6 + 1 揃い）。Follow-up は UT-08A-01〜06 の計 6 本を `unassigned-task/` に formalize（02 visual regression / 03 production load test / 04 D1 migration test guideline / 05 shared package type test / 06 test suffix rename）。task root path drift（`02-application-implementation/` → `30-workflows/` 直下）を `legacy-ordinal-family-register.md` の Task Root Path Drift Register に記録。 |
| 06a-parallel-public-landing-directory-and-registration-pages | completed / Phase 1-12 完了 / Phase 13 pending_user_approval / VISUAL | `docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/` | apps/web 公開 4 route（`/`, `/members`, `/members/[id]`, `/register`）を実装。`apps/web/src/lib/url/members-search.ts` は `q` max 200、`zone/status/tag/sort/density` を URL query 正本として parse し、`fetchPublic` 経由で 04a public API のみを呼ぶ。Phase 11 は `wrangler dev` esbuild mismatch のため local mock API で curl + screenshot smoke を PASS、実 Workers + D1 smoke は 08b / 09a に引き継ぎ。follow-up: real Workers/D1 smoke、OGP/sitemap、mobile FilterBar + tag picker、04a shared query parser extraction 継続。固有教訓 `references/lessons-learned-06a-public-web-2026-04.md`（L-06A-001〜005）。 |
| task-sync-forms-d1-legacy-umbrella-001 | spec_created / docs-only / NON_VISUAL | `docs/30-workflows/completed-tasks/task-sync-forms-d1-legacy-umbrella-001/` | 旧 UT-09 Sheets→D1 sync を legacy umbrella として close。実装責務は 03a（Forms schema sync）/ 03b（Forms response sync）/ 04c（admin sync endpoints; current canonical は `references/api-endpoints.md`）/ 09b（cron runbook）/ 02c（sync_jobs 排他）へ移管。単一 `/admin/sync`、`sync_audit`、Google Sheets API 前提を stale とし、Forms API / split endpoint / `sync_jobs` を current として固定。**retry/offset canonical（max retry=3 / exponential backoff base 1s/factor 2/cap 32s/jitter ±20% / `processed_offset` chunk index）は U-UT01-09（2026-04-30）にて確定済み**。実装反映時は `references/lessons-learned-u-ut01-09-retry-offset-2026-04.md`（L-UUT0109-001〜003）を参照する。 |
| 06a-followup-001-public-web-real-workers-d1-smoke | historical/design canonical / superseded-for-execution-by 06a-A / NON_VISUAL | `docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/` | 06a Phase 11 で deferred になった real Workers + D1 smoke を formalize した旧 root。設計背景と昇格 trace は保持するが、actual local / staging curl log と screenshot の保存先は current execution root `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/` に一本化する。元 unassigned task は `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md` に rename（昇格 trace のみ保持）。Issue #273 は CLOSED のまま `Refs #273` のみ。inventory: `references/workflow-task-06a-followup-001-real-workers-d1-smoke-artifact-inventory.md`。 |
| 06a-A-public-web-real-workers-d1-smoke-execution | spec_created / implementation-spec / docs-only / VISUAL_ON_EXECUTION / Phase 1-12 completed / Phase 13 pending_user_approval | `docs/30-workflows/06a-A-public-web-real-workers-d1-smoke-execution/` | 06a follow-up 001 の execution-oriented successor。既存 `completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/` を履歴・設計正本として残しつつ、実行時の local + staging real Workers/D1 smoke 手順、evidence path、Phase 12 strict 7 outputs、root/outputs `artifacts.json` parity、user approval gate を current execution root に固定する。`apps/web/wrangler.toml` の staging / production API URL と `scripts/cf.sh` wrapper は既存で足りるため、本 spec wave は code/env/CI を変更しない。actual curl log / screenshot は Phase 11 実行後に保存し、planned evidence を PASS と扱わない。actual Phase 11 evidence completion が 08b / 09a の下流解放条件。inventory: `references/workflow-task-06a-A-public-web-real-workers-d1-smoke-execution-artifact-inventory.md`。 |

### unassigned-task → Phase 1-13 仕様書ディレクトリへの昇格パターン

- **用途**: `docs/30-workflows/unassigned-task/` の簡易仕様書を完全な Phase 1-13 仕様書に昇格させる
- **配置先**: `docs/30-workflows/completed-tasks/{{task-id}}/`
- **手順**:
  1. unassigned-task 仕様書の Why/What/How を Phase 1 要件定義へ変換
  2. Phase 2-13 の仕様書を task-specification-creator テンプレートで生成
  3. 元の unassigned-task ファイルを completed-tasks に移動
  4. aiworkflow-requirements の同 wave 更新
- **参考**: UT-UIUX-VISUAL-BASELINE-DRIFT-001（2026-04-03）
