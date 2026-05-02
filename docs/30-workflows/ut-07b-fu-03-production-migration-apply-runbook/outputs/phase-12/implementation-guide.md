# Implementation Guide

## Part 1: 中学生向け

### なぜ必要か

なぜ必要かというと、本物の台帳を書き換える作業は、間違えるとあとから戻すのが難しいからです。

### 今回作ったもの

### 何をしたか

本番の台帳を変える前に読む手順書を作りました。

本番の D1 は、学校で本当に使っている名簿台帳のようなものです。練習用の紙ではなく、本物の情報を入れておく場所です。migration は、その台帳に新しい欄を増やす作業です。runbook は、その作業をするときに見る手順書です。

なぜ手順書が必要かというと、本物の台帳を書き換えるときに「どの台帳を」「どの順番で」「誰の許可で」変えたかが分からないと、あとで間違いに気づいても戻し方が分からなくなるからです。

このタスクでは、本物の台帳をまだ書き換えません。先に、確認すること、実行する命令、終わったあとに見ること、失敗したら止める条件を手順書にまとめます。実際に本物を触るのは、あとで許可をもらってからです。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| D1 | クラウド上の本物の台帳 |
| migration | 台帳に欄を増やす作業 |
| runbook | 作業手順書 |
| production | 本番で使う場所 |
| evidence | 作業した証拠メモ |

## Part 2: 運用者向け

対象 migration は `apps/api/migrations/0008_schema_alias_hardening.sql`。対象 DB は `ubm-hyogo-db-prod`、対象 environment は `--env production`。

### TypeScript Evidence Contract

```ts
type RunbookEvidenceStatus = "DOC_PASS" | "OPERATOR_GATE_OPEN" | "RUNTIME_PASS";

interface ProductionMigrationRunbookEvidence {
  migrationFile: "apps/api/migrations/0008_schema_alias_hardening.sql";
  targetDatabase: "ubm-hyogo-db-prod";
  targetEnvironment: "production";
  structureVerification: RunbookEvidenceStatus;
  grepVerification: RunbookEvidenceStatus;
  stagingDryRun: RunbookEvidenceStatus;
  redactionCheck: RunbookEvidenceStatus;
  productionApplyExecuted: false;
}
```

### CLIシグネチャ

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

本タスクでは上記 command を実行しない。FU-04 の承認付き運用実行でのみ使用する。

### 使用例

```bash
# preflight only; production mutation はしない
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
```

期待: 対象 migration の適用状態を確認し、実 apply はユーザー承認後の FU-04 に委譲する。

### エラーハンドリング

二重適用、UNIQUE 衝突、DB 取り違え、ALTER TABLE 二重適用を検出した場合は追加 SQL を即興実行しない。evidence を redacted 形式で保存し、判断待ちへ戻す。

### エッジケース

- staging dry-run が未実行の場合は `OPERATOR_GATE_OPEN` と記録し、runtime PASS と書かない
- production migration が既適用の場合は apply を実行せず、fresh `migrations list` evidence で停止する
- output に secret / token / Account ID が含まれる場合は evidence へ転記しない

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| target migration | `apps/api/migrations/0008_schema_alias_hardening.sql` |
| target DB | `ubm-hyogo-db-prod` |
| environment | `production` |
| command wrapper | `bash scripts/cf.sh` |
| execution gate | Phase 13 merge 後 + user approval |

### テスト構成

| Evidence | Scope |
| --- | --- |
| `structure-verification.md` | workflow / artifacts / runbook file structure |
| `grep-verification.md` | target migration / DB / approval wording |
| `staging-dry-run.md` | operator gate or staging dry-run result |
| `redaction-check.md` | token / Account ID / production output exclusion |

本タスクで確定する操作境界:

- production apply は本タスクでは実行しない
- commit / PR / merge 後、ユーザー明示承認を得た別運用でのみ実行する
- Cloudflare 操作は `bash scripts/cf.sh` 経由に限定する
- Token 値、Account ID 値、production apply の実測結果値はこの仕様書に記録しない

対象オブジェクト:

- `schema_aliases`
- `idx_schema_aliases_revision_stablekey_unique`
- `idx_schema_aliases_revision_question_unique`
- `schema_diff_queue.backfill_cursor`
- `schema_diff_queue.backfill_status`

代表コマンド:

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

失敗時は追加 SQL を即興実行せず、二重適用、UNIQUE 衝突、DB 取り違え、ALTER TABLE 二重適用のどれに該当するかを切り分けて判断待ちに戻す。
