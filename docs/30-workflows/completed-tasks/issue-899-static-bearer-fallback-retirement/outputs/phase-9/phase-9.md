# Phase 9 — 品質保証

## 1. 実行コマンド一式

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/runtime-smoke-staging.yml

# grep gates
grep -n 'static-fallback' .github/workflows/runtime-smoke-staging.yml
grep -nE 'if:[[:space:]]+env\.STAGING_AUTH_SECRET' .github/workflows/runtime-smoke-staging.yml
grep -n 'RUNTIME_SMOKE_FRESHNESS_ENFORCE' .github/workflows/runtime-smoke-staging.yml
grep -nE '^\s+STAGING_ADMIN_BEARER:[[:space:]]*\$\{\{' .github/workflows/runtime-smoke-staging.yml
grep -nE '^\s+STAGING_ME_BEARER:[[:space:]]*\$\{\{' .github/workflows/runtime-smoke-staging.yml
grep -n 'static-fallback\|後方互換 fallback\|即時運用復旧' docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md

# spec validators
pnpm gate-metadata:validate --require-gates-for-changed docs/30-workflows/issue-899-static-bearer-fallback-retirement/artifacts.json docs/30-workflows/issue-899-static-bearer-fallback-retirement/outputs/artifacts.json
pnpm verify:phase12-compliance

# pre-flight
bash scripts/verify-pr-ready.sh
```

## 2. 期待結果

| コマンド                                  | 期待                                              |
| ----------------------------------------- | ------------------------------------------------- |
| typecheck                                 | exit 0                                            |
| lint                                      | exit 0                                            |
| actionlint                                | exit 0 / warning 0                                |
| grep gate（4 patterns workflow）          | 各 0 件                                           |
| grep gate（runbook）                      | 0 件                                              |
| gate-metadata:validate                    | OK / ERROR:0                                      |
| verify-phase12-compliance                 | PASS                                              |
| verify-pr-ready.sh                        | PASS                                              |

## 3. QA チェックリスト

- [ ] AC-1〜AC-9 すべて自動 gate で検証可能
- [ ] AC-10 / AC-11 は user-gated（Phase 11 で手動 evidence）
- [ ] redaction 不変条件保全（mint→add-mask→GITHUB_ENV export sequence 確認）
- [ ] 順序制約（#916 → workflow edit → smoke green → physical delete）が runbook / PR body 双方に明記される
- [ ] 仕様書 PR と実装 PR を分離（本仕様書は spec commit のみ）
