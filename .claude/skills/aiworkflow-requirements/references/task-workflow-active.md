# タスク実行仕様書生成ガイド / active guide

> 親仕様書: [task-workflow.md](task-workflow.md)
> 役割: active guide
> 区分: 正本（current contract）

## 概要

本ドキュメントは、複雑なタスクを単一責務の原則に基づいて分解し、各サブタスクに最適なスラッシュコマンド・エージェント・スキルの組み合わせを選定するためのガイドラインを定義する。

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
| task-claude-code-permissions-deny-bypass-verification-001 | spec_created / docs-only / NON_VISUAL | `docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-verification-001/` | Claude Code `permissions.deny` と `--dangerously-skip-permissions` の優先関係を公式 docs 調査 + isolated 実機検証 runbook として仕様化。実検証は `task-claude-code-permissions-deny-bypass-execution-001` へ分離 |
| task-worktree-environment-isolation | spec_created / docs-only / NON_VISUAL | `docs/30-workflows/task-worktree-environment-isolation/` | worktree / tmux / shell state 分離仕様を development-guidelines と lessons-learned に同期済み。コード実装は未タスクへ分離 |
| TASK-SKILL-CODEX-VALIDATION-001 | completed / Phase 1-12 完了 / Phase 13 user_approval_required / NON_VISUAL | `docs/30-workflows/completed-tasks/skill-md-codex-validation-fix/` | Codex SKILL.md frontmatter 検証契約 R-01〜R-07 を validator + 二段ガード + CLI 経路三段目で実装。AC-1〜AC-8 8/8 PASS。current facts: (1) `description ≤1024 字 / string scalar / YAML 構文有効`、(2) 二段ガード（generate / write）+ `quick_validate` 三段目、(3) フィクスチャ 30 件 `*.fixture` 化で skill discovery 圏外化、(4) 退避先 Markdown 統一（`references/{topic}.md`）、(5) Anchors ≤5 / Trigger keywords ≤15 自動退避、(6) `.claude/` ↔ `.agents/` 同 wave sync、(7) codex_validation.test.js 24 ケース GREEN、(8) follow-up 3 件を unassigned-task-detection.md に分離 |
| task-lefthook-multi-worktree-reinstall-runbook | spec_created / docs-only / runbook-spec / NON_VISUAL | `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook/` | 30+ worktree への lefthook 一括再 install runbook 仕様を確定。`doc/00-getting-started-manual/lefthook-operations.md` への差分追記内容を Step 2-1〜2-4 で specify。固有教訓は `lessons-learned-lefthook-mwr-runbook-2026-04.md`（L-MWR-001〜006）。スクリプト実装（`scripts/reinstall-lefthook-all-worktrees.sh`）は別 Wave に分離 |
| ut-06-followup-A-opennext-workers-migration | implemented / static_verified / NON_VISUAL | `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/` | apps/web `wrangler.toml` を Pages 形式から OpenNext Workers 形式へ移行。AC-1〜AC-7 / AC-13〜AC-16 は静的検証済み。AC-8〜AC-12（build / staging deploy / smoke / bundle size / fallback 実測）はユーザー承認後に Phase 11 へ追記 |
| 04c-parallel-admin-backoffice-api-endpoints | completed / Phase 1-12 完了 / Phase 13 pending / NON_VISUAL | `docs/30-workflows/04c-parallel-admin-backoffice-api-endpoints/` | UBM-Hyogo 管理者バックオフィス API（9 router / 16 endpoint）を `apps/api` に実装。dashboard / members（list/detail/status/notes/delete/restore）/ tags-queue（resolve）/ schema（diff/aliases）/ meetings（list/create/attendance）。05a close-out で人間向け `/admin/*` は Auth.js JWT + `admin_users.active` 判定の `requireAdmin` へ差し替え済み。同期系 `/admin/sync*` のみ `SYNC_ADMIN_TOKEN` Bearer を維持。不在 endpoint（`PATCH /admin/members/:memberId/profile` / `PATCH /admin/members/:memberId/tags`）は構造で保証。新規 repository: `apps/api/src/repository/dashboard.ts` / `apps/api/src/repository/memberTags.ts`（`assignTagsToMember`）。検証: typecheck エラー 0 / vitest 251 PASS。固有教訓 `lessons-learned-04c-admin-backoffice-2026-04.md`（L-04C-001〜005） |
| 05b-parallel-magic-link-provider-and-auth-gate-state | completed_without_pr / Phase 1-12 完了 / Phase 13 pending / NON_VISUAL | `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/` | Magic Link 発行・検証と AuthGateState 判定 API を `apps/api` に実装。`GET /auth/gate-state`、`POST /auth/magic-link`、`POST /auth/magic-link/verify`、`POST /auth/resolve-session`、Resend mailer、email/IP rate limit、`magic_tokens.deleteByToken` rollback、apps/web 同 origin proxy 3 本、shared auth 補助 alias export（`SessionUserAuthGateState`）を追加。`/no-access` route 不在と apps/web D1 直参照不在は fs-check で保証。Phase 11 は `ui_routes: []` のため screenshot ではなく Hono direct fetch + Vitest + fs-check evidence。Auth.js Credentials Provider 本体と `/api/auth/callback/email` route は 06b 未タスクへ分離済み。正本仕様は `api-endpoints.md` / `environment-variables.md` / `lessons-learned-05b-magic-link-auth-gate-2026-04.md` に同期済み。 |
| 05a-parallel-authjs-google-oauth-provider-and-admin-gate | completed / Phase 1-12 完了 / Phase 13 pending（user approval 待ち） / VISUAL smoke deferred to 09a | `docs/30-workflows/05a-parallel-authjs-google-oauth-provider-and-admin-gate/` | Auth.js v5 Google OAuth provider、`GET /auth/session-resolve`（`X-Internal-Auth` 必須 / D1 直接アクセス禁止の唯一経路）、共有 HS256 JWT session（`memberId` / `isAdmin` のみ最小化）、apps/web `/admin/*` middleware（UI gate）、apps/api `requireAdmin`（API gate）を実装。`packages/shared/src/auth.ts` に `AuthSessionUser` / `SessionJwtClaims` / `GateReason`（`unregistered` / `deleted` / `rules_declined` 05b と共有命名）/ JWT sign/verify / Auth.js encode/decode adapter を追加。人間向け admin API 9 router は `requireAdmin` に差し替え、sync 系は `requireSyncAdmin`（`SYNC_ADMIN_TOKEN` Bearer）を維持。D1 `sessions` テーブル不採用で無料枠 reads/day を温存。Phase 11 は OAuth credentials / staging 未接続のため screenshot smoke を 09a に委譲し、代替として JWT互換・session-resolve・admin route gate tests を PASS。固有教訓 `references/lessons-learned-05a-authjs-admin-gate-2026-04.md`（L-05A-001〜006）。Follow-up: unassigned-task-001（Phase 11 staging 実 OAuth screenshot）/ unassigned-task-002（Google OAuth verification 本番申請、MVP 卒業時）/ unassigned-task-003（admin 剥奪即時反映 B-01 用 KV revocation list 設計検討、D1 sessions 復活禁止） |
| UT-01 Sheets→D1 同期方式定義 | spec_created / docs-only / NON_VISUAL / design_specification | `docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/` | Cron pull 採択、手動 / 定期 / バックフィル 3 フロー、`sync_log` 論理設計、Sheets 優先 SoT を確定。既存 `apps/api` 実装との差分（`sync_job_logs` / `sync_locks`、enum、retry、offset、shared 契約）は U-7〜U-10 として未タスク化。Phase 13 はユーザー承認待ち |
| 06b-parallel-member-login-and-profile-pages | completed / Phase 1-12 完了 / Phase 13 pending（user approval 待ち） / VISUAL partial captured | `docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/` | apps/web 会員向け `/login` と `/profile` を実装。`/login` は AuthGateState 5 状態（input / sent / unregistered / rules_declined / deleted）、Magic Link form、Google OAuth button、`/no-access` 不採用、sent email 非表示、`normalizeRedirectPath` による safe redirect を提供。`/profile` は 04b `/me` `/me/profile` を `fetchAuthed` で取得し、read-only `StatusSummary` / `ProfileFields` / 外部 Google Form `EditCta` / `AttendanceList` を表示。`apps/web/middleware.ts` は `/profile/:path*` 未ログインを `/login?redirect=...` へ誘導。検証: `@ubm-hyogo/web typecheck` PASS、06b focused Vitest 23 PASS、Phase 11 local `/login` screenshot M-01〜M-05 + `/profile` redirect curl captured。Follow-up: `UT-06B-PROFILE-VISUAL-EVIDENCE`（logged-in profile / staging screenshot）, `UT-06B-MAGIC-LINK-RETRY-AFTER`（429 Retry-After UI 復元） |

### unassigned-task → Phase 1-13 仕様書ディレクトリへの昇格パターン

- **用途**: `docs/30-workflows/unassigned-task/` の簡易仕様書を完全な Phase 1-13 仕様書に昇格させる
- **配置先**: `docs/30-workflows/completed-tasks/{{task-id}}/`
- **手順**:
  1. unassigned-task 仕様書の Why/What/How を Phase 1 要件定義へ変換
  2. Phase 2-13 の仕様書を task-specification-creator テンプレートで生成
  3. 元の unassigned-task ファイルを completed-tasks に移動
  4. aiworkflow-requirements の同 wave 更新
- **参考**: UT-UIUX-VISUAL-BASELINE-DRIFT-001（2026-04-03）
