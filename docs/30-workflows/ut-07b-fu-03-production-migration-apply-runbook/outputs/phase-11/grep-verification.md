# Grep Verification（runbook + scripts + CI gate の網羅検証）

## Scope

実装仕様書スコープに対する static document verification。Token / Account ID / OAuth 値の不在と、対象オブジェクト・運用境界語・実装ファイル参照の網羅を grep で確認する。

## A. 機密値混入チェック（期待: 0 hit）

```bash
# A-1: CLOUDFLARE_API_TOKEN 値（40 文字級）混入
rg -i "cloudflare_api_token=[A-Za-z0-9_-]{20,}" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/

# A-2: Account ID 値（32 hex）混入
rg -nE "account_id=[a-f0-9]{32}" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/

# A-3: OAuth トークン文字列の不在
rg -nE '\b[A-Za-z0-9_-]{40,}\b' \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/ \
  | grep -vE '(commit|sha|hash|run-id|migration|FAKE|REDACTED)'

# A-4: production 実 apply 結果値混入
rg -i "Applied [0-9]+ migration|production apply result row" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/
```

期待: 全て 0 hit（変数名 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / sample `***FAKE_TOKEN_***` は allow-list）。

## B. 対象オブジェクト網羅（期待: 全 hit）

| Term | Expected | Result |
| --- | --- | --- |
| `0008_schema_alias_hardening.sql` | target migration named | PASS |
| `ubm-hyogo-db-prod` | target database named | PASS |
| `--env production` | production env flag named | PASS |
| `schema_aliases` | target table | PASS |
| `idx_schema_aliases_revision_stablekey_unique` | unique index | PASS |
| `idx_schema_aliases_revision_question_unique` | unique index | PASS |
| `backfill_cursor` | added column | PASS |
| `backfill_status` | added column | PASS |
| `ユーザー承認` | approval gate | PASS |
| `本タスク内では production 実 apply を実行しない` | execution boundary | PASS |
| `DRY_RUN=1` | dry-run gate | PASS |

## C. 実装ファイル参照網羅（F1-F9）

```bash
rg -n "scripts/d1/(preflight|postcheck|evidence|apply-prod)\.sh|cf\.sh d1:apply-prod|d1-migration-verify\.yml|test:scripts" \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/
```

期待: 各 F1-F9 が runbook / Phase 5 / Phase 11 / Phase 12 の少なくとも 1 箇所で参照されている。

## D. wrangler 直叩き禁止

```bash
rg -nE '^[^#]*\bwrangler\b' \
  docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/ \
  | grep -v 'scripts/cf.sh' \
  | grep -v 'wrangler d1 migrations apply'  # cf.sh が wrap する説明文脈は許可
```

期待: 直叩き例 0 件。`bash scripts/cf.sh ...` 経由のみ。

## 結果サマリ

| カテゴリ | 期待 | 実走 |
| --- | --- | --- |
| A. 機密値混入 | 0 hit | NOT_EXECUTED_IN_THIS_REVIEW |
| B. 対象オブジェクト網羅 | 全 hit | DOC_PASS（仕様書記述で網羅確認済み） |
| C. 実装ファイル参照 | F1-F9 全網羅 | DOC_PASS |
| D. wrangler 直叩き | 0 件 | DOC_PASS |
