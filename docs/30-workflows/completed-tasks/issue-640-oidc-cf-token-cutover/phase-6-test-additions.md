# Phase 6: テスト拡充

> [実装区分: 実装仕様書]

## 1. 追加テストケース（fail path / 回帰 guard）

### 6.1 redaction-check の fail path

| TC | 内容 | 期待 |
|---|---|---|
| TC-F01 | log に `CLOUDFLARE_API_TOKEN=<実値風文字列>` が含まれる | exit 1 |
| TC-F02 | log に複数行に渡る token 漏洩 | 全行を mask 出力、exit 1 |
| TC-F03 | `--account-id` 引数なし + env `CLOUDFLARE_ACCOUNT_ID` なし | Account ID 検出は skip、token regex のみ判定 |
| TC-F04 | 巨大 log（>10MB） | 5秒以内に処理完了 |

### 6.2 workflow yaml 回帰 guard

| TC | 内容 | 期待 |
|---|---|---|
| TC-R01 | 新規 workflow file 追加時に CLOUDFLARE_API_TOKEN を job-level に書く | `workflow-env-scope.test.sh` で FAIL |
| TC-R02 | `web-cd.yml` の build step に誤って `env.CLOUDFLARE_API_TOKEN` を再導入 | FAIL |
| TC-R03 | `cf.sh` 呼び出し step が token env を持たない | FAIL（必要な step に token がない異常検知） |

## 2. 補助コマンド

```bash
# CI 上でのワンショット検証
bash scripts/__tests__/workflow-env-scope.test.sh && \
  bash scripts/__tests__/redaction-check.test.sh && \
  echo "all checks passed"
```

## 3. 既存テストへの影響

- `apps/api` / `apps/web` の unit test には影響なし（CI/CD layer のみの変更）
- `pnpm typecheck` / `pnpm lint` への影響なし

## 4. DoD

- [ ] fail path TC 全件 GREEN
- [ ] 回帰 guard TC 全件 GREEN
- [ ] CI 上で `workflow-env-scope.test.sh` が required check 候補として実行可能
