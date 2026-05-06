# Phase 12: 実装ガイド・skill反映・コンプライアンス

task-specification-creator skill が定める Phase 12 の **6 必須タスク + Task 6 evidence** を実行する。Phase 12 strict outputs は本 workflow の `outputs/phase-12/` に実体配置済み。

## Task 12-1: 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）

配置: `outputs/phase-12/implementation-guide.md`

### Part 1（中学生レベル）

このしくみは、サイトを使ってくれた人の数や、エラーが出た回数といった「合計の数」だけを、毎月 1 回コンピュータに自動で記録させる仕組みです。

スクリーンショットだけだと、半年後に「先月よりエラーが増えたかな?」と比べにくくなります。そこで、機械が読める JSON という形式で数字だけを保存しておきます。

大事なルールは「個人を特定できる情報は絶対に保存しない」ことです。メールアドレス、IP アドレス、URL に含まれる秘密の文字列は記録から外します。記録してよいのは「合計値」だけです。

毎月 1 日の朝（UTC 02:00）に GitHub Actions というロボットが動いて、Cloudflare に「先月の数字を教えて」と聞き、結果を JSON にして保存します。古いファイル（13 か月以上前）は archive フォルダに引っ越しさせて、最新 12 か月だけ手前に残します。

### Part 2（技術者レベル）

aggregate-only Cloudflare GraphQL Analytics を月次 cron で取得し、ALLOWED_METRIC_FIELDS（`requests`/`totalRequests`/`errors5xx`/`readQueries`/`writeQueries`/`invocations`）以外を whitelist で drop した JSON を atomic write する。

Token は GitHub Secrets `CLOUDFLARE_ANALYTICS_API_TOKEN` から injection し、workflow logs では GitHub の secret masking で `***` 化する。出力は `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/analytics-export-YYYYMMDD-HHmm-UTC.json`。

redaction-check shell が email / IPv4 / bearer token / URL query / member ID / session-cookie の 6 パターンを grep し、1 件でも検出すれば exit 1 で workflow を fail させ commit させない。Cloudflare zone/account identifiers are used only as GraphQL inputs and are persisted as `[redacted]`. partial output 防止のため fetch script は tmp file → rename の atomic write、failure 時は tmp 削除。

retention は active 12 件、超過分は `archive/YYYY-MM/` に rename。

## Task 12-2: システム仕様書更新

`.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` の current applied 表に automation 経路を追加（Phase 10 で実施）。

## Task 12-3: ドキュメント更新履歴作成

配置: `outputs/phase-12/documentation-changelog.md`

更新ファイル列挙（canonical absolute path）:
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
- `docs/30-workflows/issue-484-cloudflare-analytics-export-automation/index.md` および `phase-01.md` 〜 `phase-13.md`
- `docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md`（status link 追記）

## Task 12-4: 未タスク検出レポート

配置: `outputs/phase-12/unassigned-task-detection.md`

state: unassigned 0 件 / blocking dependency 1 件

ただし**前提タスク**として以下が必要（依存であり、本仕様書からの先送りではない）:
- Cloudflare API token (read-only analytics scope) の発行と GitHub Secrets / 1Password vault 配置 — 本仕様書の着手前提

## Task 12-5: skill フィードバックレポート

配置: `outputs/phase-12/skill-feedback-report.md`

3 観点固定で記述:
- テンプレ改善: NON_VISUAL automation workflow 用に Phase 11 evidence inventory の table テンプレ提案
- ワークフロー改善: docs-only decision → automation impl への consume link を双方向化する手順
- ドキュメント改善: redaction-check pattern 集を skill references として共通化（`deployment-cloudflare-secret-redaction.md` 新設提案）

## Task 12-6: タスク仕様書コンプライアンスチェック

配置: `outputs/phase-12/phase12-task-spec-compliance-check.md`

CONST_005 必須項目チェック:
- [x] 変更対象ファイル一覧（パス + 種別）
- [x] 主要関数・型のシグネチャ
- [x] 入力・出力・副作用
- [x] テスト方針
- [x] ローカル実行コマンド
- [x] DoD

CONST_007 スコープチェック:
- [x] 1 サイクル内完了スコープ
- [x] unassigned 0 件 / blocking dependency 1 件（runtime secret placement のみ明示）

## 成果物
- 本ファイル
- `outputs/phase-12/` 配下 7 strict files

## 完了条件
- 6 必須タスク + compliance check すべて成果物配置済み
- compliance-check で全項目 [x]

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` Issue #484 same-wave sync
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` active task ledger
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` same-wave log headline
