# Phase 5: 実装仕様書 + 運用 runbook（中核成果物）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 5 |
| 状態 | spec_created |
| taskType | implementation / scripts / runbook |
| subtype | production-migration-apply-orchestrator |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. 新スコープに従い、本 Phase は **2 部構成** とする:
   - **Part A: コード実装手順** — F1〜F7, F9 の各成果物の新規作成 / 編集仕様。シェル shebang・引数仕様・関数シグネチャ・stdout/stderr 例・exit code 規約まで spec レベルで書き下す。
   - **Part B: 運用 runbook** — Part A で作る F4（`apply-prod.sh`）を呼ぶ承認ゲート付き手順を 5 セクションで規定する。
2. 本タスク内では production 実 apply を **実行しない**。実行は (a) commit / (b) PR / (c) merge / (d) ユーザー明示承認 の 4 ゲートを全て通過した後の別運用として行う。
3. `bash scripts/cf.sh` 経由のみを許可し、`wrangler` 直接呼びはコードブロックから排除する。
4. `outputs/phase-05/main.md` には Part A / Part B を統合した運用ドキュメントを配置する。

## 目的

UT-07B の `apps/api/migrations/0008_schema_alias_hardening.sql` を本番 D1 (`ubm-hyogo-db-prod`) に適用するための「orchestrator スクリプト群（F1〜F7, F9）+ 5 段運用 runbook」を、Token 値・Account ID を残さず・冪等性を機械的に検証して再現可能なかたちで正式化する。

## 参照資料

- `index.md`（AC-1〜AC-12）
- `artifacts.json`
- `phase-02.md`（runbook 章立て・承認ゲート設計）
- `phase-04.md`（テスト戦略）
- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `apps/api/wrangler.toml`（`[env.production]` / `[env.staging]` binding）
- `scripts/cf.sh`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`

## 入力

- Phase 2 成果物（runbook 構造・承認ゲート設計）
- Phase 4 成果物（bats / staging dry-run / redaction-check / CI gate）
- 上流 UT-07B 完了済み migration SQL
- 上流 U-FIX-CF-ACCT-01（production Token scope 最小化済み）

## 新規作成 / 修正ファイル一覧

| 種別 | パス | 役割 |
| --- | --- | --- |
| 新規 | `scripts/d1/preflight.sh` | F1: 未適用 migration JSON 抽出、対象 DB / `--env` 引数検証 |
| 新規 | `scripts/d1/postcheck.sh` | F2: sqlite_master + PRAGMA で 5 オブジェクト存在 verify |
| 新規 | `scripts/d1/evidence.sh` | F3: `.evidence/d1/<ts>/` 保存 + Token/Account ID redact |
| 新規 | `scripts/d1/apply-prod.sh` | F4: F1→確認→apply→F2→F3 オーケストレータ。`DRY_RUN=1` 対応 |
| 編集 | `scripts/cf.sh` | F5: `d1:apply-prod` サブコマンド追加 |
| 新規 | `.github/workflows/d1-migration-verify.yml` | F6: staging dry-run CI gate |
| 新規 | `scripts/d1/__tests__/*.bats` | F7: bats-core 単体テスト |
| 編集 | `package.json` | F9: `test:scripts` script 追加 |
| 新規 | `outputs/phase-05/main.md` | Part A + Part B 統合 runbook |
| 参照のみ | `apps/api/migrations/0008_schema_alias_hardening.sql` | 適用対象 SQL（変更しない） |
| 参照のみ | `apps/api/wrangler.toml` | DB binding 確認のみ（変更しない） |

## 運用境界（最重要・冒頭明記）

- 本タスク内では production 実 apply を **実行しない**。
- 実行は次の **4 ゲート** すべて満たした後に、別運用として行う:
  1. **commit** — 本タスクの全成果物が feature ブランチに commit 済み
  2. **PR** — `dev` または `main` への PR が opened 状態
  3. **merge** — PR が `main` へ merge 済み（CLOSED / merged）
  4. **ユーザー明示承認** — production apply を行ってよい旨の明示文言取得
- Cloudflare / Wrangler 操作は `bash scripts/cf.sh` 経由のみ許可（`wrangler` 直接呼び禁止）。
- Token 値 / OAuth トークン値 / Account ID 値は runbook・evidence のいずれにも記録しない。

## exit code 規約（apply-prod.sh / 関連スクリプト共通）

| code | 意味 | 発火例 |
| --- | --- | --- |
| 0 | 成功 | apply 全段完了 / DRY_RUN 完走 |
| 1 | verify 失敗 | postcheck の object 欠落（後述）以外の generic verify 失敗 |
| 2 | 引数誤り | `--env` 欠落 / DB 名誤り / 未知サブコマンド / 確認プロンプト拒否 |
| 3 | preflight 失敗 | 二重適用検出 / 認証失敗 / DB 不在 / 承認ゲート未充足 |
| 4 | apply 失敗 | wrangler 起動失敗 / UNIQUE 衝突 / duplicate column |
| 5 | postcheck 失敗 | 5 オブジェクトいずれか欠落 |
| 6 | evidence 検証失敗 | redaction-check ヒット / 4 ファイル生成欠落 |

---

# Part A: コード実装手順

## F1: `scripts/d1/preflight.sh`

### ヘッダ / 制約

- shebang: `#!/usr/bin/env bash`
- `set -euo pipefail`
- `set -x` 禁止（テストでも有効化しない）
- 入力環境変数: `MOCK_WRANGLER`（テスト用）

### 引数仕様

```text
preflight.sh <db_name> --env <production|staging> --migration <name>
```

- `<db_name>`: `ubm-hyogo-db-prod` または `ubm-hyogo-db-staging`
- `--env`: 必須。欠落時 exit=2 / stderr `--env required`
- `--migration`: 適用対象 migration 名（拡張子なし）。例: `0008_schema_alias_hardening`

### 関数シグネチャ（擬似コード）

| 関数 | 引数 | 戻り | 副作用 |
| --- | --- | --- | --- |
| `parse_args` | `$@` | global vars: `DB_NAME`, `ENV`, `MIGRATION` | 引数誤りで exit=2 |
| `verify_auth` | なし | exit on fail | `cf.sh whoami` 呼出（exit≠0 で exit=3） |
| `verify_db_exists` | `$DB_NAME` | exit on fail | `cf.sh d1 list` で DB 名突合（不在で exit=2） |
| `list_migrations` | `$DB_NAME $ENV` | JSON 文字列 | `cf.sh d1 migrations list` |
| `assert_unapplied` | JSON, `$MIGRATION` | exit on fail | 既適用なら stderr `already applied: <name>` / exit=3 |
| `emit_preflight_json` | global vars | stdout JSON | `{ "db": ..., "env": ..., "migration": ..., "unapplied": [...], "head_sha": ..., "utc_at": ... }` |

### stdout / stderr 例

```json
{
  "db": "ubm-hyogo-db-prod",
  "env": "production",
  "migration": "0008_schema_alias_hardening",
  "unapplied": ["0008_schema_alias_hardening"],
  "head_sha": "<git rev-parse HEAD>",
  "utc_at": "2026-05-03T00:00:00Z"
}
```

stderr 例（既適用）:

```text
preflight: already applied: 0008_schema_alias_hardening
```

## F2: `scripts/d1/postcheck.sh`

### 引数仕様

```text
postcheck.sh <db_name> --env <production|staging>
```

### 関数シグネチャ

| 関数 | 役割 |
| --- | --- |
| `verify_table` | `SELECT name FROM sqlite_master WHERE type='table' AND name='schema_aliases'` 1 行確認 |
| `verify_unique_indexes` | sqlite_master で 2 件確認（`idx_schema_aliases_revision_stablekey_unique` / `idx_schema_aliases_revision_question_unique`） |
| `verify_columns` | `PRAGMA table_info(schema_diff_queue)` で `backfill_cursor` / `backfill_status` 存在確認 |
| `emit_postcheck_json` | `{ "objects": { "schema_aliases": true, "idx_..._stablekey_unique": true, ... }, "missing": [], "verified_at": "..." }` |

### exit code

- 0: 5 オブジェクト全存在
- 1: いずれか欠落（stderr `missing: <object>`）
- 5: DB 接続失敗（wrangler exit≠0）

## F3: `scripts/d1/evidence.sh`

### 引数仕様

```text
evidence.sh --ts <UTC timestamp> --type <preflight|apply|postcheck|meta> [--stdin]
```

### 関数シグネチャ

| 関数 | 役割 |
| --- | --- |
| `mkdir_evidence` | `.evidence/d1/<ts>/` を作成（既存なら冪等） |
| `redact_stream` | stdin を受け、Token 形式 `[A-Za-z0-9_-]{40,}` と 32 桁 hex を `***REDACTED***` に置換 |
| `save_artifact` | redact 後を `.evidence/d1/<ts>/<type>.{json,log}` へ保存 |
| `emit_meta_json` | `meta.json` に `commit_sha` / `migration_sha` / `utc_at` / `operator`（`gh api user --jq .login`）を記録 |
| `verify_redaction` | 保存後 grep で Token / Account ID パターン残存ゼロ確認（残存で exit=6） |

### 保存先

```
.evidence/d1/<UTC-timestamp>/
├── preflight.json
├── apply.log
├── postcheck.json
└── meta.json
```

## F4: `scripts/d1/apply-prod.sh`（オーケストレータ）

### 引数仕様

```text
apply-prod.sh <db_name> --env <production|staging> --migration <name>
```

環境変数:
- `DRY_RUN=1` … apply をスキップして preflight + skipped postcheck evidence + meta evidence を実行。migration 未適用の staging でも PR gate として exit 0 を期待するため、schema 存在 postcheck は実 apply 後のみ必須

### 擬似コード

```text
1. parse_args
2. ts=$(date -u +%Y%m%dT%H%M%SZ)
3. preflight_json=$(scripts/d1/preflight.sh ...) || exit 3
4. echo "$preflight_json" | scripts/d1/evidence.sh --ts "$ts" --type preflight --stdin
5. if [[ "$DRY_RUN" != "1" ]]; then
     prompt "Apply $MIGRATION to $DB_NAME ($ENV)? [y/N]"
     read -r answer; [[ "$answer" == "y" ]] || exit 2
     scripts/cf.sh d1 migrations apply "$DB_NAME" --env "$ENV" 2>&1 \
       | scripts/d1/evidence.sh --ts "$ts" --type apply --stdin
     [[ ${PIPESTATUS[0]} -eq 0 ]] || exit 4
   else
     echo "[DRY_RUN] skipping migrations apply" \
       | scripts/d1/evidence.sh --ts "$ts" --type apply --stdin
   fi
6. postcheck_json=$(scripts/d1/postcheck.sh "$DB_NAME" --env "$ENV") || exit 5
7. echo "$postcheck_json" | scripts/d1/evidence.sh --ts "$ts" --type postcheck --stdin
8. scripts/d1/evidence.sh --ts "$ts" --type meta || exit 6
9. exit 0
```

### DRY_RUN=1 挙動

- preflight 実行（既適用なら exit=3）
- 確認プロンプトはスキップ
- `cf.sh d1 migrations apply` は呼ばない（mock テストで `MOCK_WRANGLER_LAST_ARGS` に現れないことを assert）
- postcheck は schema 確認を実施せず、`postcheck.json` に skipped reason を保存する
- evidence の `apply.log` は `[DRY_RUN] skipping migrations apply` の 1 行

## F5: `scripts/cf.sh` の `d1:apply-prod` サブコマンド追加

### 編集箇所

`scripts/cf.sh` 内の dispatch ロジックに `d1:apply-prod` 分岐を追加:

```text
case "$1" in
  ...
  d1:apply-prod)
    shift
    exec bash "$(dirname "$0")/d1/apply-prod.sh" "$@"
    ;;
  ...
esac
```

未知サブコマンドは exit=2、stderr に `unknown subcommand: <name>`。

## F6: `.github/workflows/d1-migration-verify.yml`

### トリガー

- `pull_request` で `apps/api/migrations/**` または `scripts/d1/**` または `scripts/cf.sh` の変更時

### ジョブ

| job | runs-on | step 概要 |
| --- | --- | --- |
| `bats-unit` | ubuntu-latest | bats-core install → `pnpm test:scripts` |
| `staging-dry-run` | ubuntu-latest, environment: `staging` | GitHub Secret/Variable 注入 + `CF_SH_SKIP_WITH_ENV=1` → `DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening` |
| `redaction-check` | ubuntu-latest | `bash scripts/d1/__tests__/redaction-check.sh` |
| `lint-shell` | ubuntu-latest | 任意追加 gate。現 workflow では未実装 |

`required_status_checks` への追加対象。

## F7: `scripts/d1/__tests__/`

### ファイル構成

```
scripts/d1/__tests__/
├── preflight.bats        # TC-U-PF-01〜05
├── postcheck.bats        # TC-U-PC-01〜04
├── evidence.bats         # TC-U-EV-01〜04
├── apply-prod.bats       # TC-U-AP-01〜04
├── cf.bats               # TC-U-CF-01〜02
├── redaction-check.sh    # CI gate スクリプト
├── mocks/
│   └── wrangler          # mock 実行可能スタブ
└── fixtures/
    ├── migrations-list-unapplied.json
    ├── migrations-list-applied.json
    ├── sqlite-master-table-ok.json
    ├── sqlite-master-index-ok.json
    ├── sqlite-master-index-missing.json
    ├── pragma-table-info-ok.json
    ├── pragma-table-info-no-cursor.json
    ├── apply-success.log
    ├── apply-unique-fail.log
    └── apply-duplicate-column.log
```

各 bats ファイルは Phase 4 の TC ID 表に 1:1 対応する `@test` を持つ。総ケース数 19。

## F9: `package.json` 編集

```json
{
  "scripts": {
    "test:scripts": "bats scripts/d1/__tests__/*.bats"
  }
}
```

`pnpm test:scripts` で 19 ケースを実行する。

---

# Part B: 運用 runbook（5 セクション）

> **冒頭再掲**: 本 runbook 内では production 実 apply を **実行しない**。実行は commit / PR / merge / ユーザー明示承認の 4 ゲート全通過後の別運用。
> Cloudflare / Wrangler 操作は `bash scripts/cf.sh` 経由のみ。`wrangler` 直接呼び禁止。

## Section 1: Preflight

実コマンド:

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
bash scripts/d1/preflight.sh ubm-hyogo-db-prod --env production --migration 0008_schema_alias_hardening
```

期待:

- `whoami` exit=0、Token 値出力なし
- `d1 list` で `ubm-hyogo-db-prod` 存在
- `preflight.sh` exit=0、stdout JSON で `unapplied` に `0008_schema_alias_hardening` 含む

異常:
- 既適用 → exit=3、Phase 6 FC-01 へ
- DB 名 / `--env` 誤り → exit=2、Phase 6 FC-02 へ
- 認証失敗 → exit=3、Phase 6 FC-03 へ

## Section 2: Apply

実コマンド:

```bash
bash scripts/cf.sh d1:apply-prod \
  ubm-hyogo-db-prod --env production --migration 0008_schema_alias_hardening
```

期待:

- 確認プロンプト `Apply 0008_schema_alias_hardening to ubm-hyogo-db-prod (production)? [y/N]` に `y` 入力
- exit=0
- stdout に `Migration applied` 相当ログ
- `.evidence/d1/<UTC-ts>/apply.log` に redact 済み apply ログ保存

異常:
- 確認プロンプト `n` → exit=2（apply 未実行）
- UNIQUE 衝突 → exit=4、Phase 6 FC-06 へ
- duplicate column → exit=4、Phase 6 FC-07 へ
- ネットワーク中断 → exit=4、1 回のみ再試行可（Phase 6 FC-08）

## Section 3: Post-check

`apply-prod.sh` 内で自動実行されるが、独立コマンドとしても呼べる:

```bash
bash scripts/d1/postcheck.sh ubm-hyogo-db-prod --env production
```

期待:

- exit=0
- stdout JSON で `objects` 配下の 5 キー全て `true`
- `missing` が空配列

異常:
- いずれか欠落 → exit=5、Phase 6 FC-10〜12 へ

## Section 4: Evidence

保存先: `.evidence/d1/<UTC-timestamp>/`

ファイル:

| ファイル | 内容 |
| --- | --- |
| `preflight.json` | `preflight.sh` の stdout（redact 済） |
| `apply.log` | apply の stdout/stderr（redact 済 / DRY_RUN 時は 1 行） |
| `postcheck.json` | `postcheck.sh` の stdout |
| `meta.json` | `commit_sha` / `migration_sha` / `utc_at` / `operator` |

検証: `bash scripts/d1/__tests__/redaction-check.sh` で Token / Account ID / `set -x` / wrangler 直叩きパターンが 0 件であることを確認。違反は exit=6。

## Section 5: Failure handling

詳細は Phase 6 を参照。本セクションは停止条件のみ列挙:

| exit | 停止条件 | 分岐先 |
| --- | --- | --- |
| 2 | 引数誤り / 確認拒否 | 引数訂正後やり直し |
| 3 | preflight 失敗 | Phase 6 FC-01〜05 |
| 4 | apply 失敗 | Phase 6 FC-06〜09。**自己判断で追加 SQL を発行しない**、ユーザー判断待ち |
| 5 | postcheck 失敗 | Phase 6 FC-10〜12。**rollback 不可** ケースは判断待ち |
| 6 | evidence 検証失敗 | Phase 6 FC-15〜18。Token Roll を検討 |

## SLA / escalation

- 判断待ち状態に入ったら同一セッション内で停止。
- 24h 以内に本タスク派生 Issue にコメント投稿しユーザー判断を待つ。
- 24h 応答なしで「現状維持（apply 未完）で停止」を既定とする。
- 部分適用時のみ UT-07B `rollback-runbook.md` 経由で rollback 要否をユーザーに上申する（rollback 実行はユーザー再承認後）。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 「実 apply は実行しない」を冒頭明記、Part A 実装と Part B 運用の章対応が 1:1 |
| 漏れなし | PASS | F1〜F7, F9 / 5 セクション / exit 0〜6 / 4 ゲート / 対象 5 オブジェクトを全記載 |
| 整合性 | PASS | UT-07B `migration-runbook.md` を継承、CLAUDE.md の `cf.sh` 経由縛りに合致 |
| 依存関係整合 | PASS | 上流 UT-07B / U-FIX-CF-ACCT-01 完了済、Phase 4 / 6 / 7 / 11 へ正しく接続 |

## 完了条件

- [ ] F1〜F5, F9 のヘッダ・引数仕様・関数シグネチャ・exit code 規約が記載されている
- [ ] F6 の CI gate ジョブが 4 つ列挙されている
- [ ] F7 の bats テスト 19 ケースが TC ID で参照されている
- [ ] DRY_RUN=1 挙動が apply スキップ + preflight + skipped postcheck evidence + meta evidence で記載されている
- [ ] Part B が preflight / apply / post-check / evidence / failure handling の 5 セクションで構成
- [ ] 「production 実 apply は実行しない」が冒頭明記
- [ ] 4 ゲート（commit / PR / merge / ユーザー承認）が冒頭明記
- [ ] Token / Account ID 値が runbook・仕様書のどこにも記載されない

## 成果物

- `outputs/phase-05/main.md`（Part A + Part B 統合）
