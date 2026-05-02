# Phase 1: 要件定義（実装仕様書化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 1 |
| 状態 | spec_created |
| taskType | implementation / operations / runbook + scripts |
| 実装区分 | **[実装仕様書]** |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実装区分判定根拠（CONST_004 例外宣言）

ユーザー指定タスク種別は「runbook ドキュメント」だが、本タスクの目的（production D1 への migration apply 安全実行 + 機械検証可能性 + CI gate での staging 検証強制）を達成するには、以下の理由でコード変更（シェルスクリプト + CI workflow + bats テスト）が必要と判断し、**実装仕様書** に格上げする。

1. preflight / post-check / evidence saving の手順を runbook の自然文だけで運用すると、手順逸脱・grep verification 漏れ・evidence への機密値混入リスクが残る。スクリプト化により決定論的に検証可能。
2. CI gate で `apps/api/migrations/**` の変更時に staging へ DRY_RUN を強制することで、本番適用前に runbook 自体の構造的破綻を検出できる（runbook 文書だけでは CI で検証不能）。
3. bats による単体テストで、scripts 自体の引数検証・redaction・exit code を回帰検証可能になる。
4. `scripts/cf.sh` の運用境界（直 wrangler 禁止）を維持しながら、その上に薄い orchestrator を載せる構造は CLAUDE.md の Cloudflare CLI 実行ルールと整合する。

> production への実 apply は本タスクで実行しない（AC-9 維持）。本タスクで実装するのは preflight / postcheck / evidence / orchestrator / CI gate のみ。

## 実行タスク

1. seed と上流（UT-07B / U-FIX-CF-ACCT-01）の完了状態を確認する。
2. 対象 SQL `apps/api/migrations/0008_schema_alias_hardening.sql` の対象オブジェクトを再確認する（5 件）。
3. 実装する成果物 F1〜F9 の責務・入出力・引数仕様・exit code・テスト方針を AC へ展開する。
4. runbook 5 セクション（preflight / apply / post-check / evidence / failure handling）と F1〜F5 の対応を確定する。
5. 4 条件評価で PASS を取る。

## 目的

UT-07B の本番適用 SQL を production D1 に適用するための **承認ゲート付き runbook**、および runbook を機械検証可能にする **実装スクリプト群（F1〜F4）**、`scripts/cf.sh` の薄ラッパサブコマンド（F5）、staging に対する CI gate workflow（F6）、bats による単体テスト（F7）、運用者向け runbook 本文（F8）、`pnpm test:scripts` script 追加（F9）を仕様化する。

## 参照資料

- `index.md` / `artifacts.json`
- seed: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md`
- 上流: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md`
- 上流 runbook: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`
- 上流 rollback: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`
- 対象 SQL: `apps/api/migrations/0008_schema_alias_hardening.sql`
- 既存 `scripts/cf.sh`（編集対象）
- `apps/api/wrangler.toml`（`[env.production]` / `[env.staging]` binding）
- bats-core（テストランナー候補）
- Cloudflare D1 migrations リファレンス

## 入力

- 対象 SQL の 5 オブジェクト
  - `schema_aliases` table
  - `idx_schema_aliases_revision_stablekey_unique`
  - `idx_schema_aliases_revision_question_unique`
  - `schema_diff_queue.backfill_cursor`
  - `schema_diff_queue.backfill_status`
- 対象 DB 名
  - production: `ubm-hyogo-db-prod`
  - staging: `ubm-hyogo-db-staging`
- 既存運用ラッパ: `scripts/cf.sh`

## 実装する成果物 F1〜F9

| # | パス | 種別 | 内容 |
| --- | --- | --- | --- |
| F1 | `scripts/d1/preflight.sh` | 新規 | staging/production DB allow-list、`d1 list`、`migrations list` を `cf.sh` 経由で実行し、未適用 migration を JSON として stdout に出力 |
| F2 | `scripts/d1/postcheck.sh` | 新規 | `sqlite_master` SELECT と `PRAGMA table_info(schema_diff_queue)` を実行し、5 オブジェクト存在を verify |
| F3 | `scripts/d1/evidence.sh` | 新規 | `.evidence/d1/<UTC-timestamp>/` に preflight / apply / postcheck の出力・対象 DB・commit SHA・migration filename を保存。redaction grep を必須実行 |
| F4 | `scripts/d1/apply-prod.sh` | 新規 | F1 → confirm → `cf.sh d1 migrations apply` → F2 → F3 のオーケストレータ。`DRY_RUN=1` で apply スキップ |
| F5 | `scripts/cf.sh` | 編集 | `d1:apply-prod <db> --env <env>` サブコマンドを F4 の薄ラッパとして追加 |
| F6 | `.github/workflows/d1-migration-verify.yml` | 新規 | PR 上で `apps/api/migrations/**` 変更時に staging に対し `DRY_RUN=1` で F4 を実行する CI gate |
| F7 | `scripts/d1/__tests__/*.bats` | 新規 | bats-core によるスクリプト単体テスト（mock wrangler） |
| F8 | `outputs/phase-05/main.md` | 編集（Phase 4-6 担当） | F1〜F5 を呼ぶ runbook 本文。Phase 2 で構造を確定 |
| F9 | `package.json` | 編集 | `test:scripts` script 追加（`bats scripts/d1/__tests__/`） |

### F1: preflight.sh 関数シグネチャ・引数仕様

```
Usage: scripts/d1/preflight.sh <db_name> --env <staging|production> [--json]
Args:
  db_name           : 必須。`ubm-hyogo-db-prod` | `ubm-hyogo-db-staging`
  --env             : 必須。`production` | `staging`
  --json            : 任意。stdout を JSON 配列に整形（pending migrations のみ）
Behavior:
  set -e / set -u を有効化。set -x は禁止
  bash scripts/cf.sh d1 migrations list <db_name> --env <env> を呼ぶ
  pending を抽出し、--json なら [{"name":"0008_...sql"}] 形式で stdout
Exit codes:
  0  : 成功（pending あり / なし両方）
  64 : 引数エラー（usage 違反）
  65 : `cf.sh` 認証失敗
  66 : DB 名が `d1 list` に存在しない
```

### F2: postcheck.sh 関数シグネチャ・引数仕様

```
Usage: scripts/d1/postcheck.sh <db_name> --env <staging|production>
Behavior:
  bash scripts/cf.sh d1 execute <db_name> --env <env> --command "SELECT name FROM sqlite_master WHERE name IN (...)"
  bash scripts/cf.sh d1 execute <db_name> --env <env> --command "PRAGMA table_info(schema_diff_queue);"
  5 オブジェクトの存在を verify
Exit codes:
  0  : 5 オブジェクトすべて存在
  64 : 引数エラー
  70 : `schema_aliases` table 不在
  71 : `idx_schema_aliases_revision_stablekey_unique` 不在
  72 : `idx_schema_aliases_revision_question_unique` 不在
  73 : `schema_diff_queue.backfill_cursor` 不在
  74 : `schema_diff_queue.backfill_status` 不在
```

### F3: evidence.sh 関数シグネチャ・引数仕様

```
Usage: scripts/d1/evidence.sh <db_name> --env <env> --preflight <file> --apply <file> --postcheck <file>
Output:
  .evidence/d1/<UTC ISO8601 compact>/
    ├── meta.json   {db, env, commit_sha, migration_filename, timestamp_utc, timestamp_jst}
    ├── preflight.log
    ├── apply.log
    └── postcheck.log
Redaction:
  rg -n "CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|sk-[A-Za-z0-9]+|Bearer [A-Za-z0-9_-]+" <evidence dir>
  ヒット 0 件で PASS、それ以外で exit 80
Exit codes:
  0  : 保存完了 + redaction PASS
  64 : 引数エラー
  80 : redaction で機密値検知
  81 : 保存先作成失敗
```

### F4: apply-prod.sh オーケストレータ

```
Usage: scripts/d1/apply-prod.sh <db_name> --env <env> [DRY_RUN=1]
Flow:
  1. F1 preflight.sh を実行 → pending に対象 migration が含まれることを確認
  2. interactive confirm prompt（`--env production` のみ。`--env staging` は skip）
  3. DRY_RUN=1 でない場合のみ `bash scripts/cf.sh d1 migrations apply <db> --env <env>` を実行
  4. F2 postcheck.sh を実行
  5. F3 evidence.sh を実行
  6. 失敗時は failure handling 4 ケースに従って即時停止し、evidence 保存だけは試みる
Exit codes:
  0   : 全段階 PASS（DRY_RUN 含む）
  10  : preflight STOP（apply 不要 or 二重適用検知）
  20  : confirm 拒否
  30  : apply 失敗
  40  : postcheck 失敗
  80  : evidence redaction 失敗
```

### F5: cf.sh への d1:apply-prod サブコマンド追加

```
bash scripts/cf.sh d1:apply-prod <db_name> --env <env>
  → exec scripts/d1/apply-prod.sh <db_name> --env <env>
```

直 `wrangler` 禁止ルールを維持しつつ、orchestrator も `cf.sh` のサブコマンドとして公開する。

### F6: CI gate workflow

```yaml
name: d1-migration-verify
on:
  pull_request:
    paths:
      - 'apps/api/migrations/**'
jobs:
  verify-staging-dryrun:
    steps:
      - run: DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN_STAGING }}
```

production secret は使用しない（staging only の CI gate）。

### F7: bats テストケース

`scripts/d1/__tests__/preflight.bats`、`postcheck.bats`、`evidence.bats`、`apply-prod.bats` を新規作成。mock wrangler は `PATH` に挿入する shim で実装。

代表ケース:

- preflight: 引数欠落で exit 64 / pending 0 件で exit 0 / 認証失敗で exit 65
- postcheck: 5 オブジェクトすべて存在で exit 0 / table 欠損で exit 70 / column 欠損で exit 73
- evidence: 機密値混入で exit 80 / 正常で `.evidence/d1/<ts>/` 配下が生成
- apply-prod: DRY_RUN=1 で apply step がスキップされ exit 0 / preflight STOP で exit 10

### F8: runbook 本文（Phase 5 で作成）

Phase 2 で章立てを確定。Phase 5 担当が F1〜F5 を呼ぶ運用手順として記述。

### F9: package.json `test:scripts`

```json
"scripts": {
  "test:scripts": "bats scripts/d1/__tests__/"
}
```

## 真の論点

production migration apply の安全性を、(a) 自然文 runbook のみ、(b) スクリプト + 自然文、(c) スクリプト + CI gate + 自然文、のいずれで担保するか。本タスクは (c) を採用し、staging への DRY_RUN を CI gate で強制することで、本番適用前に runbook 構造の破綻を検出する。

## 受入条件マッピング（拡張版 AC-1〜AC-20）

| AC | 確認方法 |
| --- | --- |
| AC-1 | `outputs/phase-05/main.md` runbook 本体（F8）が F1〜F5 を呼ぶ手順で作成 |
| AC-2 | commit / PR / CI gate / merge / ユーザー承認 / 実走 の 6 ゲートが runbook と F4 で実装 |
| AC-3 | 対象オブジェクト 5 件が F2 postcheck.sh で機械検証 |
| AC-4 | F1 preflight.sh が DB allow-list、`d1 list`、`migrations list` を実装 |
| AC-5 | F4 apply-prod.sh が `bash scripts/cf.sh d1 migrations apply <db> --env <env>` を呼ぶ |
| AC-6 | F2 postcheck.sh が `sqlite_master` + `PRAGMA table_info(schema_diff_queue)` を実装 |
| AC-7 | F3 evidence.sh が evidence 10 項目を `.evidence/d1/<ts>/` に保存 |
| AC-8 | F4 apply-prod.sh が failure handling 4 ケース（exit 10/30/40/80）に対応 |
| AC-9 | 本タスクで production 実 apply を行わない。F4 の `--env production` 実走は別タスク |
| AC-10 | F2 postcheck.sh は read-only クエリのみ、destructive smoke を含まない |
| AC-11 | skill 検証 4 条件 PASS |
| AC-12 | F3 redaction grep で機密値混入時 exit 80 |
| AC-13 | F1〜F4 の引数仕様・exit code が Phase 2 で確定 |
| AC-14 | F5 `cf.sh d1:apply-prod` サブコマンドが薄ラッパとして追加 |
| AC-15 | F6 CI gate が `apps/api/migrations/**` PR で staging DRY_RUN を実行 |
| AC-16 | F7 bats テストが PASS（`pnpm test:scripts`） |
| AC-17 | F9 `test:scripts` script が package.json に追加 |
| AC-18 | `set -x` をいずれのスクリプトでも有効化しない |
| AC-19 | `apps/api/migrations/0008_schema_alias_hardening.sql` を本タスクで変更しない |
| AC-20 | 直 `wrangler` 呼び出しを scripts 内で行わない（`cf.sh` 経由のみ） |

## 不変条件 #5 への影響評価

F1〜F5 は `apps/api/migrations/` 配下の SQL を D1 へ適用・観測する運用コマンドで、ランタイム経路ではない。`apps/web` からの D1 直接アクセスは新設しない。post-check は read-only。よって不変条件 #5 は侵害しない。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | F1〜F9 の責務が排他、AC-1〜AC-20 と一対一対応 |
| 漏れなし | PASS | runbook 5 セクションと F1〜F5 が網羅、CI gate と bats でテスト経路も網羅 |
| 整合性 | PASS | `scripts/cf.sh` 経由のみ・直 wrangler 禁止・`set -x` 禁止が CLAUDE.md と整合 |
| 依存関係整合 | PASS | UT-07B / U-FIX-CF-ACCT-01 が前提、本タスクは scripts + runbook で完結 |

## 完了条件

- [ ] F1〜F9 の責務・引数仕様・exit code が確定
- [ ] AC-1〜AC-20 が一対一対応
- [ ] 不変条件 #5 影響なし宣言
- [ ] 4 条件評価 PASS

## 成果物

- `outputs/phase-01/main.md`

## 統合テスト連携

bats スクリプト単体テストは `pnpm test:scripts` で実行。production への実 apply は本タスクの統合テスト対象外。
