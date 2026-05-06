# Phase 4: テスト作成

## テスト計画

| ID | 種別 | 対象 | 期待 |
| --- | --- | --- | --- |
| T-1 | static | `actionlint .github/workflows/backend-ci.yml` | exit 0 |
| T-2 | static | `actionlint .github/workflows/backend-ci.yml` | exit 0 |
| T-3 | shell | `scripts/__tests__/cf-token-arg.test.sh` | `CLOUDFLARE_API_TOKEN` 設定済み環境で `op run` を skip する分岐が動く |
| T-4 | runtime | `bash scripts/cf.sh whoami`（各 Token で実行） | exit 0 + 期待 scope だけが API response に含まれる |
| T-5 | runtime | staging deploy dry-run（各 job 単独） | scope 不足の API call が発生しない |
| T-6 | hygiene | `grep -RI "CLOUDFLARE_API_TOKEN=" docs/ outputs/` | 0 hit（実値の混入禁止） |

## テストファイル雛形（実装は Phase 5）

`scripts/__tests__/cf-token-arg.test.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# T-3: 環境変数注入時に op run を skip する
CLOUDFLARE_API_TOKEN="dummy-token" \
  bash -x scripts/cf.sh whoami 2>&1 \
  | grep -v "op run --env-file" \
  || { echo "FAIL: op run was invoked despite env var set"; exit 1; }

echo "PASS: T-3 cf.sh token arg branch"
```

## 成果物

- `outputs/phase-4/test-plan.md`
- `outputs/phase-4/test-skeleton-references.md`（T-1〜T-6 の実コマンド）
