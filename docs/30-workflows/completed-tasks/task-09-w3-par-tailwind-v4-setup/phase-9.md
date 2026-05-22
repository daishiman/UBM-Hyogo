# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 名称 | 品質保証 |
| タスクID | TASK-W3-TAILWIND-V4-SETUP-001 |
| 状態 | implemented-local |
| 実装区分 | 実装仕様書 |

## 目的

PR 提出前に **5 点セット**（typecheck / lint / test / build / preview）+ HEX grep gate + apps/api 不変確認 + node 24 確認を全件 PASS させる。

## 品質ゲート（5 点セット + 補強）

| Gate | コマンド | 期待 |
| --- | --- | --- |
| Node version | `node -v` | `v24.15.0` |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 0 errors |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | 0 errors |
| unit test | `mise exec -- pnpm --filter @ubm-hyogo/web test` | all pass |
| build (cloudflare) | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0 / `.open-next/worker.js` 生成 |
| preview (workers) | `mise exec -- pnpm --filter @ubm-hyogo/web preview:cloudflare` + `curl /` | 200 |
| HEX grep gate | `bash outputs/phase-4/hex-grep-gate.sh apps/web/src` | exit 0 |
| apps/api 不変 | `git diff main...HEAD --name-only \| grep '^apps/api/' \| wc -l` | `0` |
| diff scope 規律 | `git diff main...HEAD --name-only` | task-09 §3 + 本 task workflow dir のみ |

## evidence 採取

各 Gate の出力を `outputs/phase-9/evidence/` に保存:

```
outputs/phase-9/evidence/
├── node-version.log
├── typecheck.log
├── lint.log
├── test.log
├── build.log
├── preview-curl.log
├── hex-grep-gate.log
├── apps-api-diff-zero.log
└── diff-scope.log
```

## ローカル一括実行

```bash
#!/usr/bin/env bash
# outputs/phase-9/run-all-gates.sh
set -euo pipefail
EV=docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-9/evidence
mkdir -p "$EV"

node -v | tee "$EV/node-version.log"
mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee "$EV/typecheck.log"
mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 | tee "$EV/lint.log"
mise exec -- pnpm --filter @ubm-hyogo/web test 2>&1 | tee "$EV/test.log"
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare 2>&1 | tee "$EV/build.log"

mise exec -- pnpm --filter @ubm-hyogo/web preview:cloudflare > "$EV/preview-stdout.log" 2>&1 &
PREVIEW_PID=$!
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8788/ | tee "$EV/preview-curl.log"
kill $PREVIEW_PID || true

bash docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-4/hex-grep-gate.sh apps/web/src 2>&1 | tee "$EV/hex-grep-gate.log"

git diff main...HEAD --name-only | grep '^apps/api/' | wc -l | tee "$EV/apps-api-diff-zero.log"
git diff main...HEAD --name-only | tee "$EV/diff-scope.log"
```

## 完了条件

- [ ] 全 9 Gate が PASS
- [ ] `outputs/phase-9/evidence/*` がすべて生成されている
- [ ] preview-curl.log が `200` を含む
- [ ] apps-api-diff-zero.log が `0`

## 成果物

- `outputs/phase-9/main.md`
- `outputs/phase-9/run-all-gates.sh`
- `outputs/phase-9/evidence/*`
