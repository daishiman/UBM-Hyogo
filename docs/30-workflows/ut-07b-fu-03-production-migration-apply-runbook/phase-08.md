# Phase 8: DRY 化 / 重複検出

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 8 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook / implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. `scripts/cf.sh` 既存 helper（op run / esbuild / mise）と新規 `scripts/d1/*.sh` の重複を検出し、`source` による再利用設計を確定する。
2. UT-07B Phase 5 `migration-runbook.md` / `rollback-runbook.md` と本タスク `outputs/phase-05/main.md` Part A の文書重複を参照リンク化する方針を固定する。
3. 既存 `.github/workflows/` 内 wrangler 呼び出し（`deploy.yml` 等）と新規 `d1-migration-verify.yml` の重複を検出し、composite action 化候補を「時期尚早」として明示記録する。
4. bats fixture / mock wrangler を単一ディレクトリ `scripts/d1/__tests__/__fixtures__/` に集約する設計を固定する。
5. DRY 化採否を YAGNI 原則で判定する。
6. 4 条件評価 PASS × 4 を記録する。

## 目的

実装ファイル群（`scripts/d1/*.sh` / `scripts/cf.sh` / `.github/workflows/d1-migration-verify.yml` / bats / runbook 文書）の中で、コピペ重複を排除しつつ過剰共通化（YAGNI 違反）も避ける。`cf.sh` を helper の正本とし、新規 `d1/*.sh` は `source` で再利用、文書は UT-07B canonical を参照リンク化する。

## 参照資料

- `index.md`
- `phase-02.md`（実装ファイル分割設計）
- `phase-05.md`（Part A 文書 / Part B 実装）
- `phase-06.md`（exit code / failure handling）
- `scripts/cf.sh`（既存 wrapper）
- `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`
- `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`
- `.github/workflows/`（既存 wrangler 呼び出し箇所）

## 入力

- 実装ファイル仕様（spec_created）
- UT-07B Phase 5 canonical
- 既存 CI workflow 群

## 重複検出結果

### 1. `scripts/cf.sh` ↔ `scripts/d1/*.sh` の helper 重複

| helper | cf.sh 既存 | 新規 d1/*.sh での必要性 | DRY 化方針 |
| --- | --- | --- | --- |
| `op run --env-file=.env` ラップ | あり | preflight / apply / postcheck / evidence 全てで必要 | **採用**: `scripts/cf.sh` を `source` で再利用。`scripts/d1/_lib.sh`（薄い） を介して `cf_run_wrangler` 関数を共通化 |
| `ESBUILD_BINARY_PATH` 解決 | あり | apply-prod.sh から `wrangler d1 migrations apply` 呼び出し時に必要 | **採用**: cf.sh helper を共有 |
| `mise exec --` 経由の Node 24 / pnpm 10 保証 | あり | 全スクリプトに必要 | **採用**: cf.sh helper を共有 |
| Token redaction filter | なし（新規） | evidence.sh で必須 | **本タスクで新設**: `scripts/d1/_redact.sh` を導入し、evidence.sh から source。cf.sh には逆輸入しない（責務分離） |
| exit code 規約定義（0〜6） | なし | 全 d1/*.sh で必要 | **本タスクで新設**: `scripts/d1/_exit_codes.sh` を導入し全 d1/*.sh から source |

### 2. 文書重複（UT-07B Phase 5 ↔ 本タスク Phase 5 Part A）

| 項目 | UT-07B 側 | 本タスク Part A 側 | DRY 化方針 |
| --- | --- | --- | --- |
| 対象 SQL の設計意図（`schema_aliases` / 2 UNIQUE / backfill カラム） | 設計章で詳述 | preflight / postcheck の対象列挙として再列挙 | **参照リンク化**: 本タスク Part A 冒頭で UT-07B `migration-runbook.md` を canonical 参照、本タスクは「production apply 専用」差分のみ記述 |
| collision detection SQL | 実装期事前検出として記載 | preflight でも production 重複チェックとして必要 | **コマンドのみ再掲**: SQL 文面は UT-07B canonical 参照、本タスクは `--env production` 付き実行例のみ |
| rollback シナリオ表 | 4 行（index/collision/back-fill/CPU） | production 固有 4 行（DB 取り違え / 二重適用 / UNIQUE 衝突 / ALTER TABLE 衝突） | **継承 + 追補**: UT-07B `rollback-runbook.md` を base、Phase 6 で production 固有行を追加 |
| `bash scripts/cf.sh` ルール | 1 行のみ | 全コマンドで必須 | **本タスクで強化**: Part A で `wrangler` 直叩き禁止を明示、UT-07B 側は base reference として残す |

### 3. CI workflow 重複（`.github/workflows/`）

| 既存 workflow | wrangler 呼び出し | 新規 `d1-migration-verify.yml` との重複 | DRY 化方針 |
| --- | --- | --- | --- |
| `deploy.yml`（apps/api / apps/web） | `wrangler deploy` 系（`scripts/cf.sh deploy` 経由） | bind login / op run のセットアップ手順が類似 | **noted のみ（時期尚早）**: composite action `setup-cf-cli` 抽出は将来候補。現状は `d1-migration-verify.yml` 単独で完結させる |
| `verify-indexes.yml` | なし | 重複なし | n/a |
| その他 | なし | 重複なし | n/a |

> composite action 化は workflow 3 件目以降で再評価（Phase 12 unassigned-task 候補に記録）。

### 4. bats fixture / mock wrangler

| 候補 | DRY 化方針 |
| --- | --- |
| mock wrangler 実行ファイル | **集約**: `scripts/d1/__tests__/__fixtures__/wrangler-mock` 単一に集約。`PATH` 先頭に注入 |
| サンプル `migrations list` 出力 JSON | **集約**: `__fixtures__/migrations-list.{empty,applied,pending}.txt` |
| サンプル `op` 出力 | **集約**: `__fixtures__/op-mock` |
| sample wrangler.toml | **集約**: `__fixtures__/wrangler.toml.sample` |

## DRY 化候補の評価（YAGNI 適用）

| 候補 | 採否 | 理由 |
| --- | --- | --- |
| `scripts/d1/_lib.sh`（cf.sh helper の薄い再利用層） | 採用 | 4 スクリプトで共通必要。`source` で再利用 |
| `scripts/d1/_redact.sh`（Token 等の redaction） | 採用 | evidence.sh で必須、cf.sh の責務外 |
| `scripts/d1/_exit_codes.sh`（exit code 定数） | 採用 | 全 d1/*.sh + bats の整合性確保 |
| 統合 runbook 化（UT-07B + 本タスク） | 不採用 | 承認ゲート / 対象環境 / evidence 保存先が異なる、CLOSED 済 UT-07B への遡及書き込み禁止 |
| 共通 SQL スニペット集 | 不採用（将来候補） | 参照箇所 2 件のみ。3 件目発生時に再評価 |
| composite action `setup-cf-cli` | 不採用（将来候補） | workflow 重複は 2 件のみ、3 件目で再評価 |
| `scripts/cf-prod-migrate.sh`（preflight + apply + postcheck の bash 化） | 不採用 | 各ステップで人間判断ゲートが必要、自動化は AC-2 を侵害 |
| bats fixture 集約 | 採用 | mock 重複防止 |

## 並列・上流タスクとの責務境界

| 領域 | 本タスク | UT-07B（CLOSED） | U-FIX-CF-ACCT-01 |
| --- | --- | --- | --- |
| `0008_schema_alias_hardening.sql` 中身 | 触らない（AC-19） | 担当 | 触らない |
| local / staging 適用検証 | 触らない | 担当 | 触らない |
| production apply runbook + 実装スクリプト | 担当 | 触らない | 触らない |
| Token 権限最小化 | 利用者として参照 | 触らない | 担当 |
| `scripts/cf.sh` 本体 | 拡張（`d1:apply-prod` サブコマンド追加） | 利用のみ | 利用のみ |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 実装ファイル / 仕様書 / AC が排他で重複なし、cf.sh 拡張と新規 d1/*.sh の責務分離明確 |
| 漏れなし | PASS | helper 5 種 / 文書 4 項目 / CI 3 workflow / bats fixture 4 種すべてに採否判定 |
| 整合性 | PASS | CLAUDE.md `scripts/cf.sh` ルール / U-FIX-CF-ACCT-01 / UT-07B canonical / AC-9 / AC-19 と矛盾しない |
| 依存関係整合 | PASS | UT-07B 完了済 / U-FIX-CF-ACCT-01 完了済 / 下流の実 production apply 別運用と破綻しない |

## navigation drift 確認

| 観点 | 結果 |
| --- | --- |
| `bash scripts/cf.sh` 命名 | OK |
| `--env production` 指定統一 | OK |
| 対象 DB 名 `ubm-hyogo-db-prod` | OK |
| migration ファイル名 `0008_schema_alias_hardening.sql` | OK |
| exit code 規約 0〜6 | OK（全 d1/*.sh + bats + runbook で統一） |

## 統合テスト連携

- bats fixture 集約により mock wrangler / mock op の重複生成を防ぐ。
- CI workflow `d1-migration-verify.yml` が単独で staging dry-run を担当し、`deploy.yml` と職務分離。

## 判定結果

**DRY 化適用方針: 「helper の `source` 再利用 + 文書の参照リンク化 + bats fixture 集約」**

- 採用: `_lib.sh` / `_redact.sh` / `_exit_codes.sh` / 文書参照リンク化 / rollback 表継承 + 追補 / bats fixture 集約
- 不採用: 統合 runbook 化 / 共通 SQL スニペット集 / composite action / 自動化 wrapper script
- 将来再評価: 共通 SQL スニペット集（3 件目発生時）/ composite action `setup-cf-cli`（workflow 3 件目）

## 完了条件

- [ ] cf.sh ↔ d1/*.sh の helper 重複表が記録されている
- [ ] 文書重複 4 項目に DRY 化方針が割当されている
- [ ] CI workflow 重複の composite action 化が「時期尚早」として明示記録されている
- [ ] bats fixture 集約方針が記録されている
- [ ] DRY 化候補 8 件が採否判定されている
- [ ] 4 条件評価 PASS × 4 が記録されている
- [ ] 将来再評価条件（3 件目到達時）が unassigned-task 候補として記録されている

## 苦戦想定

**1. cf.sh への過度な機能追加圧力** — 新規 helper を全部 cf.sh 本体に書きたくなるが、redaction / exit code は d1 ドメイン固有なので d1/_*.sh に隔離する。

**2. composite action 化の早すぎる適用** — workflow 2 件で抽出すると interface 設計が固まらず再 refactor を生む。3 件目を待つ。

**3. UT-07B canonical への遡及更新誘惑** — CLOSED 済のため絶対に書き換えない。本タスクからは参照リンクのみ。

## 関連リンク

- 上位 index: `./index.md`
- runbook: `./phase-05.md`
- 異常系: `./phase-06.md`
- AC: `./phase-07.md`
- UT-07B canonical: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`
- UT-07B canonical: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`

## 成果物

- `outputs/phase-08/main.md`
