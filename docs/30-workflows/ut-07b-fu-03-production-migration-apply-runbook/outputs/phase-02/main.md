# Phase 2: 設計（runbook 構造・承認ゲート設計）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 2 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. runbook の章立てを 5 セクション（preflight / apply / post-check / evidence / failure handling）で確定する。
2. 各セクションの具体コマンド（`bash scripts/cf.sh` 経由のみ）と期待結果を設計する。
3. commit → PR → review/CI → merge → ユーザー承認 → runbook 実走 の 6 段階承認ゲートを設計する。
4. evidence 保存項目と機密情報除外ルールを定義する。
5. failure handling 4 ケースの停止判断条件を定義する。

## 目的

Phase 1 で確定した要件をもとに、runbook 本体（Phase 5 で作成）の章立て・コマンド・承認ゲート・evidence 仕様を設計し、Phase 4 検証戦略および Phase 6 異常系へ橋渡しする。本 Phase では runbook の実走を行わない。

## 参照資料

- Phase 1 成果物
- `index.md`
- 対象 SQL: `apps/api/migrations/0008_schema_alias_hardening.sql`
- `scripts/cf.sh`
- `apps/api/wrangler.toml`（`[env.production]` binding `ubm-hyogo-db-prod`）
- 上流 runbook: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`
- 上流 rollback: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`

## 入力

- Phase 1 が確定した 5 セクション要件と AC-1〜AC-12
- 対象オブジェクト 5 件（`schema_aliases`、UNIQUE index 2 件、`schema_diff_queue` 追加カラム 2 件）
- 運用ラッパ `scripts/cf.sh` の許可コマンド集合

## 既存コンポーネント再利用判定

| 観点 | 判定 |
| --- | --- |
| `scripts/cf.sh` 経由実行 | 採用（直 `wrangler` 禁止ルールに従う） |
| UT-07B Phase 5 migration-runbook の章立て | 部分採用（preflight / apply / post-check の構造を継承し、production 専用の承認ゲートと evidence 章を追加） |
| UT-07B Phase 5 rollback-runbook | failure handling セクションから参照のみ（本タスクで rollback SQL は新規定義しない） |
| 新規 Secret / Variable | なし |
| 新規ラッパスクリプト | なし |

## runbook 章立て設計

| # | セクション | 責務 | 主成果 |
| --- | --- | --- | --- |
| 1 | preflight | 適用前の状態確認・対象 DB 確認・未適用判定 | apply 進行 PASS/STOP の判断 |
| 2 | apply | migration apply の単一コマンド実行 | exit=0 確認 |
| 3 | post-check | 適用後の sqlite_master / PRAGMA 検査 | 5 オブジェクト存在確認 |
| 4 | evidence | 実行記録の保存（機密情報除外） | `outputs/phase-11/` 配下への保存 |
| 5 | failure handling | 4 ケースの停止判断と次アクション | 即時停止・追加 SQL を即興実行しない |

## セクション 1: preflight 設計

### 目的

production D1 の現在状態を観測し、apply を進めて良いかを判定する。

### コマンド設計

```bash
# 1. 認証確認（Token 値は出力されない）
bash scripts/cf.sh whoami

# 2. 対象 DB 一覧確認（ubm-hyogo-db-prod の存在確認）
bash scripts/cf.sh d1 list

# 3. migration list（未適用 / 既適用判定の正本）
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# 4. schema introspection（ALTER TABLE 二重適用検知）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "PRAGMA table_info(schema_diff_queue);"
```

### 期待結果と判定

| 観測項目 | 期待結果 | 判定 |
| --- | --- | --- |
| `whoami` exit code | 0 | PASS |
| `d1 list` に `ubm-hyogo-db-prod` が含まれる | Yes | PASS |
| `migrations list` で `0008_schema_alias_hardening.sql` が **未適用** | Yes | PASS（apply 進行）／ No（STOP・既適用扱い） |
| `PRAGMA table_info(schema_diff_queue)` に `backfill_cursor` / `backfill_status` が **無い** | Yes | PASS／ No（STOP・ALTER TABLE 二重適用候補） |

いずれかが NG の場合は **apply に進まず failure handling セクションへ遷移**。

## セクション 2: apply 設計

### 目的

承認済み migration を production D1 へ単一コマンドで適用する。

### コマンド設計

```bash
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

### 実行原則

- このコマンド以外の DDL を runbook 内で発行しない（追加 SQL の即興実行禁止）。
- `--env production` の指定漏れは preflight で対象 DB 名を読み上げ確認することで防止。
- `set -x` 系のシェルデバッグ出力を有効化しない（evidence への混入リスク回避）。

### 期待結果

| 項目 | 期待値 |
| --- | --- |
| exit code | 0 |
| 標準出力 | `0008_schema_alias_hardening.sql` が `Migrations applied!` 系メッセージで成功扱い |
| 二重適用 / UNIQUE 衝突 / "duplicate column" 等のエラー | 出力されない |

エラー出力が観測された場合は post-check に進まず failure handling セクションへ遷移。

## セクション 3: post-check 設計

### 目的

apply 後に対象オブジェクト 5 件が production D1 に存在することを read-only で確認する。

### コマンド設計

```bash
# 5-A. table と UNIQUE index の存在確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT name FROM sqlite_master WHERE name IN ('schema_aliases','idx_schema_aliases_revision_stablekey_unique','idx_schema_aliases_revision_question_unique');"

# 5-B. schema_diff_queue 追加カラムの存在確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "PRAGMA table_info(schema_diff_queue);"
```

### 期待結果

| 観測項目 | 期待結果 |
| --- | --- |
| 5-A の結果に `schema_aliases` / `idx_schema_aliases_revision_stablekey_unique` / `idx_schema_aliases_revision_question_unique` の 3 行が揃う | Yes |
| 5-B の結果に `backfill_cursor` / `backfill_status` カラムが含まれる | Yes |

post-check は **read / dryRun 系に限定** し、INSERT / UPDATE / DELETE 等の destructive smoke は本 runbook の対象外（別承認で扱う）。

## セクション 4: evidence 設計

### 保存先

`outputs/phase-11/main.md` および `outputs/phase-11/` 配下の補助ログ（runbook 実走タスクが書き出す）。本タスクの仕様 Phase ではテンプレートのみ定義し、実値は記録しない。

### 保存項目

| 項目 | 内容 | 機密扱い |
| --- | --- | --- |
| 実行日時 | UTC / JST 両方記録 | 公開 |
| 承認者 | ユーザー明示承認の発話または PR コメント引用 | 公開 |
| 対象 DB 名 | `ubm-hyogo-db-prod` | 公開 |
| 対象 migration | `0008_schema_alias_hardening.sql` | 公開 |
| commit SHA | apply 時点の main HEAD SHA | 公開 |
| migration hash | `migrations list` 出力の hash 列 | 公開 |
| preflight 出力 | コマンドと標準出力 | 公開（Token 値含まない） |
| apply 出力 | コマンドと標準出力 | 公開 |
| post-check 出力 | コマンドと標準出力 | 公開 |

### 機密情報除外ルール

- `CLOUDFLARE_API_TOKEN` の値そのもの・部分文字列を記録しない。
- `CLOUDFLARE_ACCOUNT_ID` の値を記録しない（参照のみ）。
- `op://` 参照記法は記録してよい（実値ではないため）。
- evidence 確定前に `rg -n "CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID" outputs/phase-11/` 相当の grep を行い、ヒット 0 件を確認する。

## セクション 5: failure handling 設計

### 4 ケースと対応

| ケース | 検知方法 | runbook 上の対応 |
| --- | --- | --- |
| 二重適用検知 | preflight `migrations list` で対象 SQL が既適用 | STOP。apply に進まない。Issue 起票して原因調査（既に別経路で適用された可能性） |
| UNIQUE 衝突 | apply 出力に UNIQUE constraint 違反 | STOP。追加 SQL を runbook 内で実行しない。重複データの調査タスクを別途起票し、判断後に再 apply 計画を立てる |
| 対象 DB 取り違え | `--env production` 指定漏れ・`d1 list` 結果と DB 名不一致 | 即時 STOP。誤対象 DB に DDL を発行しない。preflight に戻り対象 DB を再確認 |
| ALTER TABLE 失敗 | apply 出力に `duplicate column` または `no such table` | STOP。preflight の `PRAGMA table_info` 結果を再確認し、二重適用 or 上流 migration 未適用かを切り分け |

### 共通原則

- runbook 内で **rollback SQL を即興発行しない**。rollback が必要な場合は `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md` を参照し、別承認で実行する。
- 失敗時は evidence セクションに「失敗ステータス」「停止判断時刻」「次アクション提案」を記録する。

## 承認ゲート設計（6 段階）

```
[G1] commit 確定
       │   feature branch 上で対象 SQL を含む commit が作成される
       ▼
[G2] PR 作成
       │   gh pr create でレビュー対象化
       ▼
[G3] PR review / CI gate
       │   required status checks（typecheck / lint / verify-indexes 等）が all green
       │   solo dev のため必須レビュアー 0 だが、CI gate を必須通過とする
       ▼
[G4] merge to main
       │   linear history を維持して main に取り込み
       ▼
[G5] ユーザー明示承認
       │   「production migration を apply してよい」という明示の発話 or PR コメント
       │   ※ 暗黙の承認を許容しない
       ▼
[G6] runbook 実走（別タスク）
       │   preflight → apply → post-check → evidence の順で実行
       ▼
完了
```

各ゲートの責務は **直前ゲートの完了状態を観測してから次へ進む** ことにあり、G5 を欠いた G6 実行は **本仕様違反** として扱う。

## 不変条件 #5 への影響評価

`scripts/cf.sh d1 migrations apply` および `scripts/cf.sh d1 execute` は `apps/api/migrations/` 配下の SQL を D1 に適用・観測する運用コマンドであり、ランタイム経路ではない。`apps/web` からの D1 直接アクセスは新設しない。post-check の `sqlite_master` / `PRAGMA table_info` クエリは read-only かつ運用 evidence 用途のみ。よって **不変条件 #5 は侵害しない**。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 5 セクション × 6 ゲートが Phase 1 要件と一対一対応、AC-1〜AC-12 と矛盾なし |
| 漏れなし | PASS | preflight / apply / post-check / evidence / failure handling が AC-4〜AC-8 を網羅、ゲート設計が AC-2 を網羅 |
| 整合性 | PASS | `scripts/cf.sh` 経由のみ・直 `wrangler` 禁止・`--env production` 必須・対象 DB `ubm-hyogo-db-prod` が CLAUDE.md の Cloudflare CLI 実行ルールと整合 |
| 依存関係整合 | PASS | UT-07B（SQL 実装）と U-FIX-CF-ACCT-01（Token 最小化）が前提として完了済み、本タスクは runbook 文書化に限定 |

## 完了条件

- [ ] runbook 5 セクションの責務とコマンドが具体化されている
- [ ] 6 段階承認ゲート（G1〜G6）が図解されている
- [ ] evidence 保存項目と機密情報除外ルールが定義されている
- [ ] failure handling 4 ケースの停止判断条件が定義されている
- [ ] 不変条件 #5 への影響なしが宣言されている
- [ ] 4 条件評価が PASS で記録されている

## 成果物

- `outputs/phase-02/main.md`
