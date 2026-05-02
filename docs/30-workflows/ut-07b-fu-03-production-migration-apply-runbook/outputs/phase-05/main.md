# Phase 5 成果物: 実装仕様 + 運用 runbook

> **冒頭明記**: 本 runbook 内では production 実 apply を **実行しない**。
> 実行は次の **4 ゲート** すべて通過後の別運用とする:
> 1. commit（feature ブランチに本タスク成果物が commit 済）
> 2. PR（`dev` または `main` への PR が opened 状態）
> 3. merge（PR が `main` へ merge 済 / CLOSED merged）
> 4. ユーザー明示承認（production apply 承認の明示文言取得）
>
> Cloudflare / Wrangler 操作は `bash scripts/cf.sh` 経由のみ。`wrangler` 直接呼び禁止。
> Token 値 / Account ID 値は runbook・evidence のいずれにも記録しない。

## 適用対象

- 適用対象 SQL: `apps/api/migrations/0008_schema_alias_hardening.sql`
- 対象 D1 DB: `ubm-hyogo-db-prod`
- 対象環境フラグ: `--env production`
- 検証対象 5 オブジェクト:
  - `schema_aliases` table
  - `idx_schema_aliases_revision_stablekey_unique`
  - `idx_schema_aliases_revision_question_unique`
  - `schema_diff_queue.backfill_cursor`
  - `schema_diff_queue.backfill_status`

## exit code 規約

| code | 意味 |
| --- | --- |
| 0 | 成功 |
| 1 | verify 失敗 |
| 2 | 引数誤り / 確認プロンプト拒否 / 未知サブコマンド |
| 3 | preflight 失敗（既適用 / 認証失敗 / DB 不在） |
| 4 | apply 失敗（UNIQUE 衝突 / duplicate column / ネット中断） |
| 5 | postcheck 失敗（5 オブジェクトいずれか欠落） |
| 6 | evidence 検証失敗（redaction 違反 / ファイル欠落） |

---

# Part A: コード実装手順

## F1: `scripts/d1/preflight.sh`

ヘッダ: `#!/usr/bin/env bash` + `set -euo pipefail`、`set -x` 禁止。

引数:

```text
preflight.sh <db_name> --env <production|staging> --migration <name>
```

関数:

| 関数 | 役割 |
| --- | --- |
| `parse_args` | 引数誤りで exit=2 |
| `verify_auth` | `cf.sh whoami` exit≠0 で exit=3 |
| `verify_db_exists` | `cf.sh d1 list` で DB 名突合、不在で exit=2 |
| `list_migrations` | `cf.sh d1 migrations list` の JSON を返す |
| `assert_unapplied` | 既適用なら stderr `already applied` / exit=3 |
| `emit_preflight_json` | stdout に `{db,env,migration,unapplied[],head_sha,utc_at}` |

stdout 例:

```json
{
  "db": "ubm-hyogo-db-prod",
  "env": "production",
  "migration": "0008_schema_alias_hardening",
  "unapplied": ["0008_schema_alias_hardening"],
  "head_sha": "<HEAD>",
  "utc_at": "2026-05-03T00:00:00Z"
}
```

## F2: `scripts/d1/postcheck.sh`

引数: `postcheck.sh <db_name> --env <production|staging>`

関数:

| 関数 | SQL |
| --- | --- |
| `verify_table` | `SELECT name FROM sqlite_master WHERE type='table' AND name='schema_aliases'` |
| `verify_unique_indexes` | `... WHERE type='index' AND name IN ('idx_schema_aliases_revision_stablekey_unique','idx_schema_aliases_revision_question_unique')` |
| `verify_columns` | `PRAGMA table_info(schema_diff_queue)` で `backfill_cursor` / `backfill_status` 確認 |
| `emit_postcheck_json` | `{objects:{...:true},missing:[],verified_at:...}` |

exit: 0=全 OK / 1=欠落 / 5=DB 接続失敗。

## F3: `scripts/d1/evidence.sh`

引数: `evidence.sh --ts <UTC ts> --type <preflight|apply|postcheck|meta> [--stdin]`

関数:

| 関数 | 役割 |
| --- | --- |
| `mkdir_evidence` | `.evidence/d1/<ts>/` を冪等作成 |
| `redact_stream` | `[A-Za-z0-9_-]{40,}` と 32 桁 hex を `***REDACTED***` 置換 |
| `save_artifact` | redact 後を `.evidence/d1/<ts>/<type>.{json,log}` に保存 |
| `emit_meta_json` | `commit_sha` / `migration_sha` / `utc_at` / `operator` を `meta.json` |
| `verify_redaction` | 保存後 grep でパターン残存ゼロ、残存で exit=6 |

保存先構造:

```
.evidence/d1/<UTC-timestamp>/
├── preflight.json
├── apply.log
├── postcheck.json
└── meta.json
```

## F4: `scripts/d1/apply-prod.sh`（オーケストレータ）

引数: `apply-prod.sh <db_name> --env <env> --migration <name>`、環境変数 `DRY_RUN=1`。

擬似コード:

```text
1. parse_args
2. ts=$(date -u +%Y%m%dT%H%M%SZ)
3. preflight.sh ... | tee >(evidence.sh --ts $ts --type preflight --stdin)
   失敗で exit=3
4. if DRY_RUN!=1: 確認プロンプト [y/N]、N で exit=2
5. if DRY_RUN!=1: cf.sh d1 migrations apply 実行 → evidence.sh --type apply
   失敗で exit=4
   else: echo "[DRY_RUN] skipping migrations apply" → evidence
6. postcheck.sh ... → evidence.sh --type postcheck、失敗で exit=5
7. evidence.sh --type meta、失敗で exit=6
8. exit 0
```

DRY_RUN=1 では apply はスキップ、preflight + skipped postcheck evidence + meta evidence のみ実行。migration 未適用の staging でも PR gate として exit 0 を期待するため、schema 存在 postcheck は実 apply 後のみ必須。
mock テストで `MOCK_WRANGLER_LAST_ARGS` に `migrations apply` が現れないことを assert する。

## F5: `scripts/cf.sh` 編集

dispatch に追加:

```text
d1:apply-prod)
  shift
  exec bash "$(dirname "$0")/d1/apply-prod.sh" "$@"
  ;;
```

未知サブコマンド: exit=2、stderr `unknown subcommand: <name>`。

## F6: `.github/workflows/d1-migration-verify.yml`

トリガー: `pull_request` paths `apps/api/migrations/**`, `scripts/d1/**`, `scripts/cf.sh`。

| job | 内容 | PASS 条件 |
| --- | --- | --- |
| `bats-unit` | `pnpm test:scripts` | 19 ケース全 PASS |
| `staging-dry-run` | `DRY_RUN=1 bash scripts/cf.sh d1:apply-prod ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening` | exit=0、`.evidence/d1/<ts>/` 4 ファイル生成 |
| `redaction-check` | `bash scripts/d1/__tests__/redaction-check.sh` | 4 種 grep 0 件 |
| `lint-shell` | 任意追加 gate | 現 workflow では未実装 |

## F7: `scripts/d1/__tests__/`

| ファイル | テスト数 |
| --- | --- |
| `preflight.bats` | 5（TC-U-PF-01〜05） |
| `postcheck.bats` | 4（TC-U-PC-01〜04） |
| `evidence.bats` | 4（TC-U-EV-01〜04） |
| `apply-prod.bats` | 4（TC-U-AP-01〜04） |
| `cf.bats` | 2（TC-U-CF-01〜02） |

mock 配置: `__tests__/mocks/wrangler`、fixture: `__tests__/fixtures/`。

## F9: `package.json` 編集

```json
{
  "scripts": {
    "test:scripts": "bats scripts/d1/__tests__/*.bats"
  }
}
```

---

# Part B: 運用 runbook（5 セクション）

## Section 1: Preflight

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
bash scripts/d1/preflight.sh ubm-hyogo-db-prod --env production --migration 0008_schema_alias_hardening
```

期待:
- 全コマンド exit=0
- preflight.sh stdout JSON の `unapplied` に `0008_schema_alias_hardening`
- Token 値が一切出力されない

異常分岐: exit=3 → Phase 6 FC-01〜05。

## Section 2: Apply

```bash
bash scripts/cf.sh d1:apply-prod \
  ubm-hyogo-db-prod --env production --migration 0008_schema_alias_hardening
```

確認プロンプト:

```text
Apply 0008_schema_alias_hardening to ubm-hyogo-db-prod (production)? [y/N]
```

期待:
- `y` で続行、`n`/空 Enter で exit=2
- 続行時 stdout に `Migration applied` 相当
- exit=0

異常分岐:
- UNIQUE 衝突 / duplicate column → exit=4 → Phase 6 FC-06 / FC-07（**rollback 不可、自己判断で追加 SQL 発行禁止**）
- ネット中断 → exit=4 → Phase 6 FC-08（同一コマンドで 1 回のみ再試行可）

## Section 3: Post-check

`apply-prod.sh` 内で自動実行。独立検証も可能:

```bash
bash scripts/d1/postcheck.sh ubm-hyogo-db-prod --env production
```

期待:
- exit=0
- stdout JSON で `objects` 5 キー全 `true`、`missing` 空

異常分岐: exit=5 → Phase 6 FC-10〜12（部分適用扱い、判断待ち）。

read-only smoke のみ許可。INSERT / UPDATE / DELETE / DROP は本 runbook 範囲外（Phase 6 FC-13）。

## Section 4: Evidence

保存先: `.evidence/d1/<UTC-timestamp>/{preflight.json, apply.log, postcheck.json, meta.json}`

検証コマンド:

```bash
bash scripts/d1/__tests__/redaction-check.sh
```

期待: 4 種 grep（Token 形式 / 32 桁 hex / `set -x` 由来 / wrangler 直叩き）全て 0 件。
違反時 exit=6 → Phase 6 FC-15〜18。

`meta.json` 必須フィールド: `commit_sha`, `migration_sha`, `utc_at`, `operator`。

## Section 5: Failure handling

| exit | 主な原因 | 分岐 |
| --- | --- | --- |
| 2 | 引数誤り / 確認拒否 / 未知サブコマンド | 訂正後やり直し |
| 3 | preflight 失敗 | Phase 6 FC-01〜05 |
| 4 | apply 失敗 | Phase 6 FC-06〜09、自己判断で追加 SQL 発行禁止 |
| 5 | postcheck 失敗 | Phase 6 FC-10〜12、rollback 不可なら判断待ち |
| 6 | evidence redaction 違反 | Phase 6 FC-15〜18、Token Roll 検討 |

### SLA / escalation

- 判断待ちに入ったら同一セッション内で停止。
- 24h 以内に派生 Issue（`outputs/phase-12/unassigned-task-detection.md` 参照）にコメント投稿。
- 24h 応答なしで「現状維持（apply 未完）で停止」を既定。
- 部分適用時のみ UT-07B `rollback-runbook.md` 経由で rollback 要否をユーザーに上申（rollback 実行はユーザー再承認後）。

---

## ローカル実行コマンドまとめ

```bash
# 単体テスト
mise exec -- pnpm test:scripts

# staging dry-run
DRY_RUN=1 bash scripts/cf.sh d1:apply-prod \
  ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening

# redaction-check
bash scripts/d1/__tests__/redaction-check.sh

# shellcheck
shellcheck scripts/d1/*.sh scripts/cf.sh
```

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 「実 apply 実行しない」を冒頭明記、Part A↔Part B 章対応 1:1 |
| 漏れなし | PASS | F1〜F7, F9 / 5 セクション / exit 0〜6 / 4 ゲート / 5 オブジェクトを全網羅 |
| 整合性 | PASS | UT-07B `migration-runbook.md` 継承、`scripts/cf.sh` 経由縛り遵守 |
| 依存関係整合 | PASS | 上流 UT-07B / U-FIX-CF-ACCT-01 完了済、Phase 4 / 6 / 7 / 11 と接続 |
