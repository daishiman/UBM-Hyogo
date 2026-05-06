# Phase 1: 要件定義

## 目的
Issue #484 の GO / NO-GO 条件と達成すべき不変条件を確定する。

## 入力
- Issue #484 本文
- `docs/30-workflows/completed-tasks/task-issue-347-cloudflare-analytics-export-automation-001.md`
- 親 decision: `docs/30-workflows/completed-tasks/issue-347-cloudflare-analytics-export-decision/outputs/phase-12/implementation-guide.md`

## 確定要件

### 機能要件
- F-1: 月次 1 回、aggregate-only Cloudflare Analytics を export する
- F-2: 出力 JSON は `analytics-export-YYYYMMDD-HHmm-UTC.json` 形式
- F-3: 出力先は `docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/outputs/phase-11/long-term-evidence/`
- F-4: 取得 metric は 4 group / 6 scalar: `requests` / `totalRequests` / `errors5xx` / `readQueries` / `writeQueries` / `invocations`
- F-5: GitHub Actions schedule + workflow_dispatch 両対応
- F-6: redaction check（個人情報禁止語句 grep）が CI gate
- F-7: active retention 12 件 + `archive/YYYY-MM/` rotation
- F-8: Cloudflare account scope metrics のため `CLOUDFLARE_ACCOUNT_TAG` を入力に含める

### 非機能要件
- N-1: Cloudflare API token は read-only analytics scope のみ
- N-2: partial output（rate limit / API error 時の中途半端な JSON）を残さない
- N-3: `.env` に実値を書かない（`op://` 参照のみ）
- N-4: Logpush / 有料機能を使わない
- N-5: Free plan 範囲で完結

### 不変条件（CONST）
- CONST-1: 個別レコード取得禁止（aggregate-only）
- CONST-2: email / token / IP / URL query / body / UA / member ID / session token を出力に含めない
- CONST-3: API token 実値を log / artifact / commit に残さない
- CONST-4: schedule は月次 1 回固定（cron `0 2 1 * *`）
- CONST-5: `workflow_dispatch` 本実行は同一対象月 1 回まで。既存 export または同月 branch があれば fail

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` Long-term Analytics Evidence
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` issue-347 / issue-484 entries

## GO / NO-GO 条件
- GO: Cloudflare API token (read-only analytics) が GitHub Secrets と 1Password vault に存在
- NO-GO: token 未配置、または親 decision workflow の implementation-guide が存在しない

## 成果物
- 本ファイル（要件定義の正本）
- `outputs/phase-1/phase-1.md`（Phase 実行時の追加メモ用）

## 完了条件
- 機能要件 7 件、非機能要件 5 件、CONST 4 件が確定している
- GO/NO-GO 条件が確認可能なコマンドベースで定義されている
