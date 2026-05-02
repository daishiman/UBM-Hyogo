# Phase 4: テスト戦略 / 検証戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 4 |
| 状態 | spec_created |
| taskType | implementation / scripts / runbook |
| subtype | production-migration-apply-orchestrator |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. 新スコープに従い、本タスクは「runbook 文書のみ」から「runbook + orchestrator スクリプト群（F1〜F7, F9）+ CI gate（F6）」へ拡張された。テスト戦略はシェルスクリプトの単体テスト（bats-core）と staging dry-run 統合テストの 2 軸で組み立てる。
2. orchestrator スクリプト（`scripts/d1/preflight.sh`, `postcheck.sh`, `evidence.sh`, `apply-prod.sh`, `cf.sh d1:apply-prod` 拡張）の各関数を mock wrangler で隔離検証する戦略を確立する。
3. staging 環境での `DRY_RUN=1` 統合実行を CI gate 化し、production apply 前に runbook 全段が通ることを保証する。
4. evidence redaction（Token 値 / Account ID grep gate）と「`set -x` 混入なし」を bats / CI 両方で永続化する。

## 目的

production migration apply runbook を「コード化された orchestrator + bats 単体テスト + staging dry-run CI gate + evidence redaction gate」の 4 段で保証することで、文書のみでは担保できない「実走時の引数誤り」「mock では再現できない wrangler 実挙動」「Token 混入」「冪等性違反」を機械的に防止する。

## 参照資料

- `index.md`（AC-1〜AC-12）
- `artifacts.json`
- `phase-02.md`（runbook 構造設計）
- `phase-03.md`（PASS 判定）
- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `apps/api/wrangler.toml`（`[env.production]` / `[env.staging]` binding）
- `scripts/cf.sh`
- bats-core 公式: <https://bats-core.readthedocs.io/>

## 入力

- Phase 2 成果物（runbook 章立て・承認ゲート・evidence 保存項目）
- Phase 3 成果物（PASS 判定）
- 既存 staging D1（`ubm-hyogo-db-staging`）— dry-run CI 検証の対象
- 既存 GitHub Environment Secret `CLOUDFLARE_API_TOKEN`（staging）

## 検証アーキテクチャ

```
              ┌──────────────────────────────────────┐
              │  bats unit test（mock wrangler）      │  ← F7
              ├──────────────────────────────────────┤
              │  staging dry-run 統合テスト           │  ← F6 CI gate
              ├──────────────────────────────────────┤
              │  evidence redaction grep gate         │  ← TC-E
              ├──────────────────────────────────────┤
              │  runbook 文書静的検証                 │  ← TC-D / TC-X
              └──────────────────────────────────────┘
```

## mock wrangler 戦術

- 環境変数 `MOCK_WRANGLER=1` が設定されている場合、`scripts/cf.sh` 内の wrangler 起動部を fixture からの応答返却に切り替える PoC を bats `setup()` で stub する。
- fixture 配置: `scripts/d1/__tests__/fixtures/`
  - `migrations-list-unapplied.json` … `0008_schema_alias_hardening` が未適用側に並ぶ JSON
  - `migrations-list-applied.json` … 既適用側に並ぶ JSON
  - `sqlite-master-table-ok.json` … `schema_aliases` 1 行
  - `sqlite-master-index-ok.json` … UNIQUE index 2 行
  - `pragma-table-info-ok.json` … `backfill_cursor` / `backfill_status` 含む
  - `apply-success.log` / `apply-unique-fail.log` / `apply-duplicate-column.log`
- mock 切替方針: `command -v wrangler` を bats の `PATH` 操作で `__tests__/mocks/wrangler` に解決させ、fixture 名を引数から決定的に選ぶシェルスタブとする。
- mock スタブは「stdout に fixture を吐く / stderr に固定文字列 / 引数 echo を `MOCK_WRANGLER_LAST_ARGS` ファイルへ書く / exit code を `MOCK_WRANGLER_EXIT` で制御」の 4 機能のみ持つ。

## 単体テストケース表（F7: bats）

### 1. preflight.sh（F1）— 計 5 ケース

| TC ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-PF-01 | 未適用検出 | `MOCK_WRANGLER=1` + `migrations-list-unapplied.json` | exit=0、stdout に `unapplied: ["0008_schema_alias_hardening"]` を含む JSON |
| TC-U-PF-02 | 既適用検出（二重適用ガード） | `migrations-list-applied.json` | exit=3、stderr に `already applied` を含む |
| TC-U-PF-03 | DB 名誤り | 引数 `ubm-hyogo-db-typo --env production` | exit=2、stderr に `unknown database` |
| TC-U-PF-04 | `--env` 欠落 | 引数 `ubm-hyogo-db-prod` のみ | exit=2、stderr に `--env required` |
| TC-U-PF-05 | 出力 JSON 形式 | TC-U-PF-01 の stdout | `jq -e '.unapplied | type == "array"'` で PASS |

### 2. postcheck.sh（F2）— 計 4 ケース

| TC ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-PC-01 | 5 オブジェクト全存在 | sqlite-master / pragma fixture が全て OK 系 | exit=0、stdout に `all 5 objects verified` |
| TC-U-PC-02 | UNIQUE index 1 件欠落 | `sqlite-master-index-ok.json` から 1 行削除版 | exit=1、stderr に `missing: idx_schema_aliases_revision_question_unique` |
| TC-U-PC-03 | カラム欠落 | `pragma-table-info-no-cursor.json` | exit=1、stderr に `missing column: backfill_cursor` |
| TC-U-PC-04 | DB 接続失敗 | mock exit=1 | exit=5、stderr に `postcheck failed` |

### 3. evidence.sh（F3）— 計 4 ケース

| TC ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-EV-01 | ディレクトリ生成 | `EVIDENCE_DIR=/tmp/x EVIDENCE_TS=20260503T000000Z` | `.evidence/d1/20260503T000000Z/{preflight.json,apply.log,postcheck.json,meta.json}` 存在 |
| TC-U-EV-02 | Token redact | stdin に `Bearer abcdefghijklmnopqrstuvwxyz0123456789ABCDEF` | 保存後 grep で該当文字列がヒットしない（`***REDACTED***` 等に置換） |
| TC-U-EV-03 | Account ID redact | stdin に 32 桁 hex | 同上で redact |
| TC-U-EV-04 | meta SHA 記録 | `git rev-parse HEAD` 結果 | `meta.json` に `commit_sha` / `migration_sha` / `utc_at` の 3 フィールド |

### 4. apply-prod.sh（F4）— 計 4 ケース

| TC ID | ケース | 入力 | 期待 |
| --- | --- | --- | --- |
| TC-U-AP-01 | DRY_RUN モード | `DRY_RUN=1` 指定 | preflight + skipped postcheck evidence が走り apply は呼ばれない、exit=0、`MOCK_WRANGLER_LAST_ARGS` に `migrations apply` が現れない |
| TC-U-AP-02 | 確認プロンプト拒否 | stdin に `n\n` | exit=2、apply 未実行 |
| TC-U-AP-03 | preflight 失敗時中断 | 既適用 fixture | exit=3、apply / postcheck / evidence いずれも未実行 |
| TC-U-AP-04 | 正常系 full path | mock 全 OK + stdin `y\n` | preflight→apply→postcheck→evidence の順で呼ばれ exit=0、evidence ディレクトリ生成 |

### 5. cf.sh d1:apply-prod 拡張（F5）— 計 2 ケース

| TC ID | ケース | 期待 |
| --- | --- | --- |
| TC-U-CF-01 | サブコマンド dispatch | `bash scripts/cf.sh d1:apply-prod ubm-hyogo-db-prod --env production --migration 0008_schema_alias_hardening` が `scripts/d1/apply-prod.sh` を所定引数で起動 |
| TC-U-CF-02 | 未知サブコマンド | `d1:unknown` で exit=2 |

**bats テストケース総数: 19**

## staging dry-run 統合テスト

実コマンド:

```bash
DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening
```

期待:

- exit=0
- stdout に `[DRY_RUN] skipping migrations apply` を含む
- `.evidence/d1/<UTC-ts>/preflight.json` が生成され、`unapplied` キーを持つ
- `.evidence/d1/<UTC-ts>/postcheck.json` が生成される（schema 確認のみ）
- `apply.log` は `dry-run skipped` 1 行のみ
- redaction-check grep（後段）が PASS

## CI gate（F6: `.github/workflows/d1-migration-verify.yml`）

トリガー: `pull_request` で `apps/api/migrations/**` または `scripts/d1/**` に変更があった場合。

ジョブ構成:

| job | 内容 | verify 条件 |
| --- | --- | --- |
| `bats-unit` | `pnpm test:scripts` 実行 | 全 19 ケース PASS |
| `staging-dry-run` | staging Environment（`CLOUDFLARE_API_TOKEN` staging）で `DRY_RUN=1 bash scripts/cf.sh d1:apply-prod ubm-hyogo-db-staging --env staging` | exit=0、preflight.json 生成、postcheck.json 生成 |
| `redaction-check` | `.evidence/` 配下 + `outputs/` 配下を grep | Token 形式 / 32 桁 hex / `+ wrangler ` パターン全て 0 件 |
| `lint-shell` | `shellcheck scripts/d1/*.sh scripts/cf.sh` | 警告 0 |

PR は 4 ジョブ全 green が必須（`required_status_checks` に追加）。

## redaction-check の grep verification 戦略

```bash
set -e
TARGET_DIRS=".evidence docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs"

# Token 様の長 token
! grep -rEn '[A-Za-z0-9_-]{40,}' $TARGET_DIRS

# 32 桁 hex（Account ID 様）
! grep -rEn '\b[a-f0-9]{32}\b' $TARGET_DIRS

# set -x 由来
! grep -rnE '^\+ (bash|wrangler|cf\.sh|scripts/) ' $TARGET_DIRS

# wrangler 直叩きログ
! grep -rnE '^[^#]*\bwrangler\b' $TARGET_DIRS | grep -v 'scripts/cf.sh' | grep -v 'scripts/d1/'
```

各行が exit=0 を返す（=パターンマッチ 0 件）ことが PASS 条件。

## 文書静的検証 / 整合性検証（既存ベース継承）

| TC ID | 種別 | コマンド | 期待 |
| --- | --- | --- | --- |
| TC-D01 | 必須セクション存在 | `grep -E '^## (Overview\|承認ゲート\|Preflight\|Apply\|Post-check\|Evidence\|Failure handling\|Smoke 制限)' outputs/phase-05/main.md` | 8 セクション全てヒット |
| TC-D02 | 対象 SQL 明記 | `grep` `0008_schema_alias_hardening.sql` | 1 件以上 |
| TC-D03 | 対象 DB 明記 | `grep ubm-hyogo-db-prod` | 1 件以上 |
| TC-D04 | `--env production` 明記 | `grep -- --env production` | apply / list / post-check 各所 |
| TC-D05 | 対象 5 オブジェクト網羅 | `grep -E '(schema_aliases\|idx_schema_aliases_revision_stablekey_unique\|idx_schema_aliases_revision_question_unique\|backfill_cursor\|backfill_status)'` | 5 件 |
| TC-D06 | wrangler 直接呼び禁止 | `grep -E '^[^#]*\bwrangler\b' \| grep -v 'scripts/cf.sh\|scripts/d1/'` | 0 件 |
| TC-D07 | 4 ゲート文言（commit / PR / merge / ユーザー承認） | `grep` 各キーワード | 各 1 件以上 |
| TC-D08 | 「本タスクでは production 実 apply 実行しない」 | `grep` | 1 件以上 |
| TC-D09 | exit code 規約（0/1/2/3/4/5/6） | `grep` exit code 表 | 7 種記載 |
| TC-X01 | runbook ↔ apply-prod.sh の対応 | Section 3〜5 のコマンドが apply-prod.sh のフェーズ呼び出しに 1:1 対応 | 整合 |
| TC-X02 | UT-07B Phase 5 と差分整合 | UT-07B `migration-runbook.md` の preflight / collision 検出が継承 | 包含確認 |
| TC-X03 | rollback 方針整合 | UT-07B `rollback-runbook.md` 4 シナリオが Phase 6 にマップ | 4/4 |

## ローカル実行コマンド

```bash
# bats 単体テストのみ
bats scripts/d1/__tests__/

# package.json 経由
mise exec -- pnpm test:scripts

# staging dry-run（手動）
DRY_RUN=1 bash scripts/cf.sh d1:apply-prod ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening

# redaction-check（手動）
bash scripts/d1/__tests__/redaction-check.sh
```

## TDD 適用判定

シェルスクリプトに対して bats-core で RED→GREEN→REFACTOR を回す。fixture を先に用意し、F1〜F5 各スクリプトの「期待される stdout / exit code」を bats アサーションとして先に書き、実装を後追いする。

## カバレッジ目標

| 観点 | 目標 |
| --- | --- |
| bats 単体テスト | F1〜F5 で 19/19 PASS（100%） |
| 対象 5 オブジェクト | postcheck.sh の verify 配列で 5/5 |
| exit code 規約 | 0〜6 の 7 種が apply-prod.sh のテストで全て発火 |
| staging dry-run | apply 以外の 4 段（preflight / 確認スキップ / postcheck / evidence）100% |
| redaction-check | 4 種類の grep gate 全て 0 件 |
| AC | 12/12（Phase 7 マトリクスで全件紐付） |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | bats / staging dry-run / redaction / 文書静的の 4 軸が排他なく協調。production 実 apply はテスト範囲外として明記 |
| 漏れなし | PASS | F1〜F5 全スクリプト・対象 5 オブジェクト・exit code 0〜6・redaction 4 パターンを TC で網羅 |
| 整合性あり | PASS | UT-07B Phase 5 / `scripts/cf.sh` / CLAUDE.md `cf.sh` 経由縛りと整合 |
| 依存関係整合 | PASS | 上流 UT-07B（SQL）／ U-FIX-CF-ACCT-01（Token）完了済み。下流 Phase 5（実装手順）／ Phase 6（異常系）に接続 |

## DoD（Definition of Done）

- [ ] bats-core 単体テスト 19 ケース全 PASS
- [ ] staging dry-run（`DRY_RUN=1`）で exit=0 / evidence 生成確認
- [ ] CI gate（`.github/workflows/d1-migration-verify.yml`）が 4 ジョブ全 green
- [ ] redaction-check が 4 種 grep 全て 0 件
- [ ] shellcheck で警告 0
- [ ] 4 条件評価（矛盾なし / 漏れなし / 整合性 / 依存関係）が PASS

## Token 値非記録ガード

- 全 TC で `set -x` を使用しない。
- mock wrangler の fixture には Token 形式 / 32 桁 hex を含めない（テスト fixture 自体への混入も禁止）。
- bats のログ出力（`stderr`）に `${CLOUDFLARE_API_TOKEN}` を直接 echo しない。
- `.evidence/` 配下は redaction-check 通過後のみ commit 対象、failure 時は git に残さず破棄。

## 統合テスト連携

- アプリ統合テストは追加しない（`apps/api` の D1 binding テストは別タスク責務）。
- runtime 検証は staging dry-run のみで完結する（production 実 apply は本タスクで実行しない）。

## 完了条件

- [ ] bats 19 ケースが ID 付きで列挙されている
- [ ] mock wrangler 戦術と fixture 一覧が定義されている
- [ ] staging dry-run コマンドと CI gate ジョブ構成が定義されている
- [ ] redaction-check の 4 種 grep が定義されている
- [ ] exit code 規約（0〜6）が apply-prod.sh のテストで全 path カバーされている
- [ ] 4 条件評価が PASS

## 成果物

- `outputs/phase-04/main.md`
