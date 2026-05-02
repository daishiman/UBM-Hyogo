# Phase 4 成果物: テスト戦略 / 検証戦略

本ドキュメントは `phase-04.md` の正式成果物。bats-core 単体テスト・staging dry-run・CI gate・redaction-check の 4 軸で
production migration apply orchestrator（F1〜F7, F9）を機械的に検証する戦略を確定する。

## 検証 4 軸サマリ

| 層 | 対象 | 主要テスト ID |
| --- | --- | --- |
| 単体（bats） | F1〜F5 各シェルスクリプト | TC-U-PF-01〜05 / TC-U-PC-01〜04 / TC-U-EV-01〜04 / TC-U-AP-01〜04 / TC-U-CF-01〜02（計 19） |
| 統合（staging dry-run） | F4 + F5 を staging 環境で実走 | TC-I-DR-01 |
| Gate（redaction） | `.evidence/` / `outputs/` 配下の grep | TC-E01〜E04 |
| 文書（静的 / 整合） | runbook 章立て / AC マトリクス | TC-D01〜09 / TC-X01〜03 |

## mock wrangler

- `MOCK_WRANGLER=1` 時、bats `setup()` で `PATH` 先頭に `scripts/d1/__tests__/mocks/` を挿入し、fixture を返すスタブ `wrangler` を有効化する。
- スタブは引数を `MOCK_WRANGLER_LAST_ARGS` に書き、`MOCK_WRANGLER_FIXTURE` の指す fixture を stdout に出し、`MOCK_WRANGLER_EXIT` で exit code を返す。
- fixture 配置: `scripts/d1/__tests__/fixtures/`（`migrations-list-unapplied.json` 他、Phase 4 仕様書に列挙）。

## bats 単体テスト 19 ケース（要点）

| TC ID | スクリプト | 検証点 | 期待 exit |
| --- | --- | --- | --- |
| TC-U-PF-01 | preflight.sh | 未適用 JSON 出力 | 0 |
| TC-U-PF-02 | preflight.sh | 既適用検出 | 3 |
| TC-U-PF-03 | preflight.sh | DB 名誤り | 2 |
| TC-U-PF-04 | preflight.sh | `--env` 欠落 | 2 |
| TC-U-PF-05 | preflight.sh | 出力 JSON 型検査 | 0 |
| TC-U-PC-01 | postcheck.sh | 5 オブジェクト全存在 | 0 |
| TC-U-PC-02 | postcheck.sh | UNIQUE index 欠落 | 1 |
| TC-U-PC-03 | postcheck.sh | カラム欠落 | 1 |
| TC-U-PC-04 | postcheck.sh | DB 接続失敗 | 5 |
| TC-U-EV-01 | evidence.sh | `.evidence/d1/<ts>/` 4 ファイル生成 | 0 |
| TC-U-EV-02 | evidence.sh | Token redact | 0 |
| TC-U-EV-03 | evidence.sh | Account ID redact | 0 |
| TC-U-EV-04 | evidence.sh | meta SHA 記録 | 0 |
| TC-U-AP-01 | apply-prod.sh | DRY_RUN | 0 |
| TC-U-AP-02 | apply-prod.sh | 確認プロンプト拒否 | 2 |
| TC-U-AP-03 | apply-prod.sh | preflight 失敗で中断 | 3 |
| TC-U-AP-04 | apply-prod.sh | 正常系 full path | 0 |
| TC-U-CF-01 | cf.sh | `d1:apply-prod` dispatch | 0 |
| TC-U-CF-02 | cf.sh | 未知サブコマンド | 2 |

## staging dry-run（TC-I-DR-01）

```bash
DRY_RUN=1 bash scripts/cf.sh d1:apply-prod \
  ubm-hyogo-db-staging --env staging --migration 0008_schema_alias_hardening
```

期待:

- exit=0
- stdout に `[DRY_RUN] skipping migrations apply`
- `.evidence/d1/<UTC-ts>/preflight.json`（`unapplied` キー存在）
- `.evidence/d1/<UTC-ts>/postcheck.json`（schema 確認のみ）
- `.evidence/d1/<UTC-ts>/apply.log` は `dry-run skipped` の 1 行のみ
- 後段 redaction-check が全 PASS

## redaction-check（TC-E01〜E04）

| TC ID | 検出パターン | 期待 |
| --- | --- | --- |
| TC-E01 | `grep -rEn '[A-Za-z0-9_-]{40,}'` | 0 件 |
| TC-E02 | `grep -rEn '\b[a-f0-9]{32}\b'` | 0 件 |
| TC-E03 | `grep -rnE '^\+ (bash\|wrangler\|cf\.sh\|scripts/) '` | 0 件 |
| TC-E04 | wrangler 直叩きログ | `scripts/cf.sh` / `scripts/d1/` 経由以外 0 件 |

## CI gate（`.github/workflows/d1-migration-verify.yml`）

| job | 必須 PASS 条件 |
| --- | --- |
| `bats-unit` | 19 ケース全 PASS |
| `staging-dry-run` | TC-I-DR-01 PASS |
| `redaction-check` | TC-E01〜E04 全 0 件 |
| `lint-shell` | `shellcheck` 警告 0 |

`required_status_checks` への登録対象。

## ローカル実行

```bash
# bats のみ
bats scripts/d1/__tests__/

# pnpm 経由
mise exec -- pnpm test:scripts

# redaction-check
bash scripts/d1/__tests__/redaction-check.sh
```

## DoD

- bats 19 ケース全 PASS
- staging dry-run（TC-I-DR-01）PASS
- CI gate 4 ジョブ全 green
- redaction-check 4 種全 0 件
- shellcheck 警告 0

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 4 軸が排他なく協調、production 実 apply はテスト範囲外と明記 |
| 漏れなし | PASS | F1〜F5・5 オブジェクト・exit 0〜6・redaction 4 パターンを TC で網羅 |
| 整合性 | PASS | `scripts/cf.sh` 経由縛り / UT-07B Phase 5 と整合 |
| 依存関係整合 | PASS | 上流 UT-07B / U-FIX-CF-ACCT-01 完了済 |
