# Staging Dry-Run 仕様（F4 apply-prod.sh + DRY_RUN=1）

## Scope

F4 `scripts/d1/apply-prod.sh` を `DRY_RUN=1` で staging に対して実行し、preflight → apply skip → skipped postcheck evidence → meta evidence の orchestration が読み取り系のみで完走することを確認する。本 Phase では production への接続は **記述しない / 実行しない**。

## 実行コマンド

```bash
DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging
```

または cf.sh ラッパ経由（F5）:

```bash
DRY_RUN=1 bash scripts/cf.sh d1:apply-prod ubm-hyogo-db-staging --env staging
```

## 期待 stdout（抜粋）

```
[apply-prod] target=ubm-hyogo-db-staging env=staging dry_run=1
[preflight] phase=migrations-list (read-only)
  0001_*  applied
  ...
  0008_schema_alias_hardening  pending
[preflight] phase=db-name-allowlist  result=ok
[preflight] phase=introspection  result=ok
[apply-prod] DRY_RUN=1 — skipping wrangler d1 migrations apply
[postcheck] querying 5 expected objects
  schema_aliases                                  : SELECT only
  idx_schema_aliases_revision_stablekey_unique    : SELECT only
  idx_schema_aliases_revision_question_unique     : SELECT only
  schema_diff_queue.backfill_cursor               : SELECT only
  schema_diff_queue.backfill_status               : SELECT only
[postcheck] DRY_RUN=1 — skipped schema existence check because migration apply was skipped
[evidence] writing redacted log to outputs/phase-11/staging-dry-run.md
[apply-prod] exit=0
```

## 期待 exit code

`0`（DRY_RUN=1 / staging 環境 / preflight PASS / skipped postcheck evidence / redact ログ書き出し全 OK）。

## Acceptance Boundary

- `DRY_RUN=1` 明示（CI / staging gate）
- `--env staging` のみ
- `migrations apply` は実行されない（DRY_RUN=1 で skip）
- `--env production` は記述しない / 実行しない
- raw Token / Account ID は記録しない

## 実走時に追記する項目

| 項目 | 値 |
| --- | --- |
| 実施日時 | YYYY-MM-DD HH:MM (JST) |
| 実施者 | （ユーザー） |
| 実 stdout（redact 後） | 期待 stdout と diff |
| 実 exit code | `0` 期待 |

## 現状

NOT_EXECUTED_IN_THIS_REVIEW. operator credential を持つ実施者が Phase 11 実施タスクで取得する。本仕様書段階では期待値のみ確定。
