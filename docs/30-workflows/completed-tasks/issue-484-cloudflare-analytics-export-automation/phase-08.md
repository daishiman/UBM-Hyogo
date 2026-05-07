# Phase 8: E2E / 受け入れ

## 目的
GitHub Actions 上での schedule + workflow_dispatch trigger 経由で end-to-end を検証する。`MOCK_FETCH=1` は実 API なしのローカル/CI 代替、`dry_run=true` は実 API あり・書き込みなしの workflow 検証として分離する。

## E2E シナリオ

### E-1: workflow_dispatch dry-run（実 API 1 回）
1. `gh workflow run cloudflare-analytics-export.yml --ref main -f dry_run=true`
2. workflow が完走（exit 0）
3. workflow logs に token 値が漏れていない（GitHub の secret masking で `***` になっていることを確認）
4. dry-run モードでは実ファイル生成・PR 作成を行わない

### E-2: workflow_dispatch 本実行（実 API 1 回）
1. `gh workflow run cloudflare-analytics-export.yml --ref main`
2. workflow が完走
3. 同一対象月の export / branch `analytics-export-YYYYMM` が既にある場合は fail し、二重 export しない
4. PR が自動作成され、PR diff に `analytics-export-YYYYMMDD-HHmm-UTC.json` が 1 件追加されている
5. CI 上で redaction-check が pass している
6. 出力 JSON に email / token / IP / URL query / member ID / session token が含まれていない

### E-3: schedule trigger（自然実行）
1. 翌月 1 日 02:00 UTC を待つ（または cron 短縮設定で smoke 実行）
2. workflow が自動起動
3. PR が自動生成

## 受け入れ基準
- E-1 / E-2 / E-3 のいずれかで実 token を使った export が成功し、redaction-check pass
- PR がレビュー可能な状態になる
- main direct push は禁止。automation branch push は PR 作成のためだけに許可する

## ロールバック手順
- workflow が誤動作した場合、`.github/workflows/cloudflare-analytics-export.yml` を削除する PR を出す
- 既に作成された export JSON は手動で archive に退避

## 成果物
- 本ファイル
- `outputs/phase-8/phase-8.md`
- E-2 実行時の PR URL（evidence）

## 完了条件
- implementation complete: `MOCK_FETCH=1` と redaction-check dummy fail / clean pass が成功
- runtime evidence captured: E-1（dry-run）または E-2（本実行）の PR 作成が成功し redaction-check pass

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` Long-term Analytics Evidence
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` GitHub Actions / PR branch flow
