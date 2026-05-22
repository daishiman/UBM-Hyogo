# Phase 4: テスト作成

> [実装区分: 実装仕様書] / TDD RED

## 1. テスト対象と方針

| 対象 | テスト種別 | ツール |
|---|---|---|
| `.github/workflows/*.yml` の env 階層 | grep-based static check | bash + grep |
| `scripts/redaction-check.sh` のロジック | bats / shellcheck + 単体テスト | bats（または bash test script） |
| workflow yaml syntax | static validation | `actionlint` |

## 2. テストファイル一覧（CONST_005 必須）

| パス | 種別 | 内容 |
|---|---|---|
| `scripts/__tests__/redaction-check.test.sh` | 新規 | redaction-check.sh の単体テスト |
| `scripts/__tests__/workflow-env-scope.test.sh` | 新規 | workflow yaml が job-level に `CLOUDFLARE_API_TOKEN` を持たないことを grep 検証 |

## 3. テストケース

### 3.1 `redaction-check.test.sh`

| TC | 入力 | 期待 |
|---|---|---|
| TC-01 | leak なし log | exit 0 |
| TC-02 | log に Cloudflare Account ID 含む | exit 1, 該当行出力 |
| TC-03 | log に token 形式の文字列（40+ chars `[A-Za-z0-9_-]`）含む | exit 1 |
| TC-04 | log に `***` マスク済みのみ含む | exit 0 |
| TC-05 | `--log <存在しないファイル>` | exit 1, error message |
| TC-06 | account-id 環境変数なし + token regex なし → 空 log | exit 0 |

### 3.2 `workflow-env-scope.test.sh`

| TC | 対象 | 期待 |
|---|---|---|
| TC-W01 | `web-cd.yml` | job-level（`jobs.*.env`）に `CLOUDFLARE_API_TOKEN` が **存在しない** |
| TC-W02 | `web-cd.yml` | deploy step（`jobs.*.steps[*].env` または `with.apiToken`）には `CLOUDFLARE_API_TOKEN` が **存在する** |
| TC-W03 | `backend-ci.yml` | wrangler-action の `apiToken` 入力が step 直下 `with:` に閉じている |
| TC-W04 | 全 workflow | build / lint / install step に `env.CLOUDFLARE_API_TOKEN` を持たない |

検出ロジック（参考）:

```bash
# job-level env 検出（yq があれば yq、なければ awk で env: ブロックの位置確認）
yq '.jobs.*.env.CLOUDFLARE_API_TOKEN' .github/workflows/web-cd.yml | grep -v null
# → 出力があれば FAIL
```

## 4. 実行コマンド

```bash
bash scripts/__tests__/redaction-check.test.sh
bash scripts/__tests__/workflow-env-scope.test.sh
# 補助: actionlint
actionlint .github/workflows/web-cd.yml .github/workflows/backend-ci.yml
```

## 5. 入出力・副作用

- すべて副作用なし（read-only）
- exit code で PASS/FAIL を判定
- stdout に該当行（マスク済み）を出力

## 6. expected RED → GREEN

- RED: Phase 4 完了時、`web-cd.yml` の job-level env がまだ存在 → TC-W01 FAIL
- GREEN: Phase 5 完了後、TC-W01 PASS
