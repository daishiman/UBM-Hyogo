# Implementation Guide — UT-07B-FU-03 production migration apply runbook + scripts

## Part 1: 中学生向け

### 全体イメージ

UBM 兵庫支部会の会員データは、Cloudflare D1 という「クラウド上の本物の名簿台帳」に入っています。今回 UT-07B で「台帳に新しい欄を 5 つ増やす」工事（migration `0008_schema_alias_hardening.sql`）を作りました。

この工事は **本物の台帳に対してやる** ので、間違えると元に戻すのが難しいです。だから、

1. 「工事の手順書（runbook）」を先に紙に書いておく
2. 「手順書のとおりに動く専用ロボット（scripts）」を作る
3. 「ロボットを毎回必ず体育館（staging）で空運転してから職員室（main ブランチ）に入れるルール（CI gate）」を作る
4. 「校長先生（ユーザー）の許可が出るまで本物の台帳には触らない」

の 4 つを揃えました。

### 4 つのロボット

| ロボット | 担当 |
| --- | --- |
| `preflight.sh` | 工事の前に、もう同じ工事をしていないか / 別の台帳と間違えていないかを確認する |
| `postcheck.sh` | 工事のあとに、本当に欄が 5 つ増えているか確認する（台帳を読むだけ、書かない）|
| `evidence.sh` | 工事の前後の写真（実行ログ・時刻・誰が許可したか）をフォルダに保存する。秘密の鍵が混ざらないかも自動でチェック |
| `apply-prod.sh` | 上の 3 つを正しい順番で動かす親方ロボット |

### なぜ本物の台帳を本タスクで触らないか

「ロボットを作る仕事」と「ロボットに本物を触らせる仕事」は別だからです。今は **ロボットを完成させて空運転で動くことを確認するところまで**。校長先生の許可が出たら、別のタスク（UT-07B-FU-04）でロボットに本物を触らせます。

### CI gate（学校で言うと「事前点検ルール」）

新しいロボットを職員室に持っていくには、必ず体育館で空運転して PASS することが GitHub のルールに書いてあります（`.github/workflows/d1-migration-verify.yml`）。これで「人間がうっかり点検を忘れる」ことを防ぎます。

---

## Part 2: 運用者向け（F1〜F9）

### 対象 migration とオブジェクト

| 項目 | 値 |
| --- | --- |
| 対象 SQL | `apps/api/migrations/0008_schema_alias_hardening.sql` |
| 対象 DB | `ubm-hyogo-db-prod`（`apps/api/wrangler.toml` の `[env.production]` D1 binding）|
| 対象オブジェクト | `schema_aliases` table / `idx_schema_aliases_revision_stablekey_unique` / `idx_schema_aliases_revision_question_unique` / `schema_diff_queue.backfill_cursor` / `schema_diff_queue.backfill_status` |

### 6 段階承認ゲート

```
G1 commit (spec + 実装分離) → G2 PR → G3 CI gate d1-migration-verify green
  → G4 merge → G5 ユーザー明示承認 → G6 runbook 実走（FU-04）
```

本タスク（FU-03）は G1〜G4 まで。G5〜G6 は FU-04 で別途実施。

### 実装ファイル F1〜F9

#### F1 `scripts/d1/preflight.sh`

```bash
bash scripts/d1/preflight.sh <db-name> --env <staging|production>
```

- shebang: `#!/usr/bin/env bash`
- header: `set -euo pipefail`（`set -x` は禁止）
- 引数: `<db-name>` 必須、`--env` 必須
- 動作:
  1. `bash scripts/cf.sh whoami` で Cloudflare 認証を確認
  2. `bash scripts/cf.sh d1 list` に `<db-name>` が含まれることを確認
  3. `bash scripts/cf.sh d1 migrations list <db-name> --env <env>` を実行し、対象 migration が既に `applied` / `success` でないことを確認
  4. `--json` 指定時は `{"db":"...","env":"...","migration":"...","unapplied":["..."],"head_sha":"...","utc_at":"..."}` を stdout に出力
- exit code: 0 未適用あり / 64 引数誤り / 65 認証失敗または二重適用検知 / 66 D1 database 不在

#### F2 `scripts/d1/postcheck.sh`

```bash
bash scripts/d1/postcheck.sh <db-name> --env <staging|production>
```

- read-only クエリのみ（destructive smoke 禁止）
- 検査 SQL:
  - `SELECT name FROM sqlite_master WHERE type='table' AND name='schema_aliases';`
  - `SELECT name FROM sqlite_master WHERE type='index' AND name IN ('idx_schema_aliases_revision_stablekey_unique','idx_schema_aliases_revision_question_unique');`
  - `PRAGMA table_info(schema_diff_queue);` で `backfill_cursor` / `backfill_status` 存在確認
- 全 5 オブジェクト存在 → exit 0、欠落 → exit 1（または 5）、SQL 失敗 → exit 1

#### F3 `scripts/d1/evidence.sh`

```bash
bash scripts/d1/evidence.sh --ts <UTC compact ts> --type <preflight|apply|postcheck|meta> [--stdin]
```

- 保存先: `.evidence/d1/<UTC-timestamp>/`
- 入力種別: `preflight` / `postcheck` は JSON として保存、`apply` は `apply.log`、`meta` は `meta.json`
- `meta.json`: `commit_sha, migration_filename, utc_at, operator`
- redaction grep: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` の実値、`Bearer ...`、`sk-...`、JWT 断片を検知時 → `.evidence/d1/<ts>/` 削除 + exit 80
- `op://Vault/...` 参照記法は redaction 対象外（false-positive 回避）

#### F4 `scripts/d1/apply-prod.sh`

```bash
bash scripts/d1/apply-prod.sh <db-name> --env <env> [--migration <filename>] [DRY_RUN=1]
```

- フロー: F1 preflight → 確認プロンプト（`--env production` かつ `DRY_RUN!=1` のみ y/N） → `bash scripts/cf.sh d1 migrations apply <db-name> --env <env> --remote` → F2 postcheck → F3 evidence
- `DRY_RUN=1`: preflight + skipped postcheck evidence + meta evidence のみ実行、apply と schema 存在 postcheck はスキップ（CI gate / staging で使用）
- exit: 0 成功 / 10 preflight失敗 / 20 production確認拒否 / 30 apply失敗 / 40 postcheck失敗 / 64 引数誤り / 80 evidence/redaction失敗

#### F5 `scripts/cf.sh` の `d1:apply-prod` サブコマンド

```bash
bash scripts/cf.sh d1:apply-prod <db-name> --env <env> [DRY_RUN=1]
```

F4 への薄ラッパ。`d1:apply-prod` は production 確認プロンプトを壊さないため `scripts/with-env.sh` を挟まず、F4 内の `scripts/cf.sh` 呼び出しが必要な Cloudflare 環境解決を担う。CI では GitHub Secret/Variable を直接注入するため、`CF_SH_SKIP_WITH_ENV=1` で `op` / `mise` 前提を迂回し、ローカル `node_modules/.bin/wrangler` を直接使う。

#### F6 `.github/workflows/d1-migration-verify.yml`

- trigger: `pull_request` で `apps/api/migrations/**` / `scripts/d1/**` / `scripts/cf.sh` / `package.json` / `pnpm-lock.yaml` 変更時
- jobs:
  - `Run script tests`: `bats scripts/d1/__tests__/*.bats`
  - `staging-dry-run`: `CF_SH_SKIP_WITH_ENV=1 DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging`（secret は `CLOUDFLARE_API_TOKEN_STAGING` 限定）
  - dependency setup: pnpm 10.33.2 / Node 24 / frozen lockfile / apt `bats`
- branch protection で main の必須 status checks に追加するかはリポジトリ保護設定側で別途確認

#### F7 `scripts/d1/__tests__/*.bats`

| ファイル | 主要ケース |
| --- | --- |
| preflight.bats | 認証失敗、DB不在、既適用検知、JSON 出力 |
| postcheck.bats | 5 オブジェクト存在、欠落検出 |
| evidence.bats | ディレクトリ生成、Token redact、redaction 失敗時の証跡削除 |
| apply-prod.bats | DRY_RUN モード、確認プロンプト拒否、preflight 失敗時中断、全成功 |

mock 戦略: 各 bats が `CF_WRAPPER` に一時 shim を渡し、`scripts/cf.sh` 相当の stdout/stderr/exit code を制御する。

#### F9 `package.json`

```json
{
  "scripts": {
    "test:scripts": "bash scripts/d1/run-tests.sh"
  }
}
```

### Evidence meta 項目

| key | 例 |
| --- | --- |
| commit_sha | （実 apply 時の HEAD SHA）|
| migration_filename | `0008_schema_alias_hardening.sql` |
| migration_sha | 対象 SQL ファイルの sha256 |
| utc_at | `2026-05-XXTXX:XX:XXZ` |
| operator | ローカル実行ユーザー |

`db` / `env` / `migration` / `head_sha` / `utc_at` は `preflight.json` 側に記録する。`apply.log` と `postcheck.json` は同じ timestamp directory に保存する。

### Failure handling 4 ケース

| ケース | 検知 | exit code | 対応 |
| --- | --- | --- | --- |
| 二重適用 | F1 preflight | 10（F4 が preflight failure として返す） | apply 中止、判断待ち |
| UNIQUE 衝突 | F4 apply stderr | 30 | 中止、別 migration で重複データ整理 |
| DB 取り違え | F1 preflight `d1 list` 不在 | 10（内部 F1 は 66） | 即時中止 |
| postcheck 欠落 | F2 postcheck | 40 | apply 後確認失敗として停止 |

### Local 実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test:scripts
DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging
```

### DoD（Definition of Done）

- `pnpm test:scripts` PASS（bats があれば bats、なければ fallback shell tests）
- `pnpm typecheck` / `pnpm lint` PASS
- `DRY_RUN=1` staging で exit 0
- CI gate `d1-migration-verify` PR 上で green
- redaction-check で機密値混入 0 件
- evidence サンプル `.evidence/d1/<ts>/` が `preflight.json` / `apply.log` / `postcheck.json` / `meta.json` を含む
- `apps/api/migrations/0008_schema_alias_hardening.sql` 不変
- `scripts/cf.sh` 経由のみで wrangler を呼ぶ

### Out of scope（本タスクで実行しない）

- production D1 への実 migration apply（UT-07B-FU-04 に委譲）
- queue / cron split for large back-fill（UT-07B-FU-01）
- admin UI retry label（UT-07B-FU-02）

### 参考

- 上流: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/`
- runbook 本体: `outputs/phase-05/main.md`
- 4 条件評価: `outputs/phase-09/main.md`
- AC トレース: `outputs/phase-07/main.md`
