# Phase 5 Output: 実装ランブック（実行結果）

Canonical source: `../../phase-05.md`

## 実装順序実績

1. ADR 2 本 drafted (`ADR-runtime-smoke-secret-injection.md`, `ADR-runtime-smoke-required-status-check.md`)
2. `runtime-attendance-provider.sh` 拡張（`--out-dir` / `--ci-summary`、`mktemp -d` 受け取り、`summary.json` 出力、後方互換 PASS）
3. `ci-summary-post.sh` 新設（jq + redact.sh + curl POST、`--dry-run` / no-webhook fallback）
4. `__tests__/*.test.sh` 3 本新設・全 PASS
5. `.github/workflows/runtime-smoke-staging.yml` 新設（job-scoped env、Environment scope 参照、artifact 30d、failure-only Slack post）
6. `backend-ci.yml` に `runtime-smoke-staging` reusable workflow call 追記
7. `operations/setup-github-environment.md` runbook 新設

## DoD 達成状況

- [x] 10 ファイル作成・編集済み
- [x] T-1, T-4, T-5, T-6 全 PASS
- [x] grep gate `set -x` 0 hit
- [x] `runtime-attendance-provider.sh` 後方互換維持（T-4-2）
- [x] workflow smoke step が `--out-dir ci-evidence --ci-summary` を指定
- [x] ADR 2 本に評価軸 / 採用案 / rollback / 30 日昇格条件
- [x] runbook に Environment 作成 / secret 配置手順
- [x] `pnpm typecheck` / `pnpm lint` PASS
- [x] regression unit test PASS（builder 30 tests）
- [ ] `actionlint` 0 issue（docker 依存・runtime evidence cycle で取得）
