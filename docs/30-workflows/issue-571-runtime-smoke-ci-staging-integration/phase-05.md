# Phase 5: 実装ランブック — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 5 / 13 |
| 入力 | Phase 2 設計 / Phase 4 テスト戦略 |
| 出力 | `outputs/phase-05/main.md`（変更ファイル diff 雛形 / 実行順序 / DoD） |

## 目的

設計を **コードに落とすための逐語的手順**（変更ファイル / シグネチャ / 入出力 / 検証コマンド）を確定する。後続実行者が本書のみを読み、迷わず実装着手できる粒度にする。

## 変更対象ファイル一覧（CONST_005 #1）

| 種別 | パス | 主目的 |
| --- | --- | --- |
| 新規 | `.github/workflows/runtime-smoke-staging.yml` | 主 workflow（trigger / smoke job / artifact / Slack post） |
| 編集 | `.github/workflows/backend-ci.yml` | `deploy-staging` 後に reusable workflow call を追記 |
| 編集 | `scripts/smoke/runtime-attendance-provider.sh` | `--out-dir <path>` / `--ci-summary` option 追加（後方互換） |
| 新規 | `scripts/smoke/ci-summary-post.sh` | failure summary を Slack incident webhook に post（`--dry-run` 対応） |
| 新規 | `scripts/smoke/__tests__/redact.test.sh` | T-1 redaction fixture |
| 新規 | `scripts/smoke/__tests__/runtime-attendance-provider.test.sh` | T-4 `--out-dir` 単体 |
| 新規 | `scripts/smoke/__tests__/ci-summary-post.test.sh` | T-5 `--dry-run` 単体 |
| 新規 | `docs/40-architecture/adr/ADR-runtime-smoke-secret-injection.md` | 注入経路 ADR |
| 新規 | `docs/40-architecture/adr/ADR-runtime-smoke-required-status-check.md` | required 昇格 ADR |
| 新規 | `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/operations/setup-github-environment.md` | Environment 配置 runbook |

## シグネチャ・入出力（CONST_005 #2, #3）

### `scripts/smoke/runtime-attendance-provider.sh`

```bash
# Usage:
#   runtime-attendance-provider.sh <env> [--out-dir <path>] [--ci-summary]
#
# Args:
#   env          : "staging" 固定（其他は exit 2）
#   --out-dir    : 出力 dir（省略時 docs/30-workflows/issue-531-.../evidence）
#   --ci-summary : 追加で summary.json を出力
#
# Required env:
#   STAGING_API_BASE / STAGING_ADMIN_BEARER / STAGING_MEMBER_ID / STAGING_ME_BEARER
#
# Outputs:
#   <out-dir>/runtime-smoke.log       (status / contract / count summary, redact 済み)
#   <out-dir>/summary.json            (--ci-summary 指定時のみ)
#
# Side effects:
#   curl が staging API へ送信。secret は ::add-mask:: 前提で env 経由のみ参照
#
# Exit:
#   0 : 全 route PASS
#   1 : いずれかの route が non-200 / contract 違反
#   2 : 引数不正・必須 env 欠落
```

### `scripts/smoke/ci-summary-post.sh`

```bash
# Usage:
#   ci-summary-post.sh <evidence-dir> [--dry-run]
#
# Args:
#   evidence-dir : summary.json があるディレクトリ
#   --dry-run    : Slack post せず stdout に redact 済み message を出力
#
# Required env:
#   SLACK_WEBHOOK_INCIDENT : 1Password / GitHub Secret 経由（未設定なら dry-run 同等）
#
# Outputs:
#   stdout : redact 済み summary message（dry-run 時 / debug 用）
#
# Exit:
#   0 : post 成功（dry-run 含む）
#   1 : summary.json 不在 / 解析失敗
#   2 : Slack post HTTP 4xx/5xx
```

### `.github/workflows/runtime-smoke-staging.yml`

Phase 2 §A.3 の YAML を逐語コピー。差分:
- `concurrency.group: runtime-smoke-staging`
- `environment: staging-runtime-smoke`
- secret name: `STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` / `SLACK_WEBHOOK_INCIDENT`
- artifact retention: 30 days

### `.github/workflows/backend-ci.yml` への追記

```yaml
  runtime-smoke-staging:
    name: runtime smoke staging
    needs: [deploy-staging]
    if: success() && github.ref_name == 'dev' && !contains(github.event.head_commit.message, '[skip runtime-smoke]')
    uses: ./.github/workflows/runtime-smoke-staging.yml
    secrets: inherit
```

> API staging deploy 完了後に同一 ref で smoke を走らせるため、web deploy ではなく `backend-ci.yml` に接続する。

### secret category boundary

| Category | 配置 | 対象 |
| --- | --- | --- |
| staging runtime credential | GitHub Environment `staging-runtime-smoke` | `STAGING_API_BASE`, `STAGING_ADMIN_BEARER`, `STAGING_MEMBER_ID`, `STAGING_ME_BEARER`, `SLACK_WEBHOOK_INCIDENT` |

repository-scoped secret に staging runtime credential を置かない。`repository_dispatch` 不採用のため dispatch control token は作成しない。

## 実装順序（決定論的）

1. ADR 2 本のドラフトを作成（`docs/40-architecture/adr/ADR-runtime-smoke-{secret-injection,required-status-check}.md`）
2. `runtime-attendance-provider.sh` に `--out-dir` / `--ci-summary` を追加（後方互換テストで T-4 PASS を確認）
3. `ci-summary-post.sh` を新設（`--dry-run` 動作で T-5 PASS）
4. `__tests__/*.test.sh` 3 本を新設（T-1, T-4, T-5 PASS）
5. `.github/workflows/runtime-smoke-staging.yml` を新設し `actionlint` で T-2 PASS
6. `backend-ci.yml` に reusable workflow call 追記（actionlint で lint）
7. `operations/setup-github-environment.md` 新設（GitHub Environment 作成 / secret 配置手順）
8. workflow smoke step が `bash scripts/smoke/runtime-attendance-provider.sh staging --out-dir ci-evidence --ci-summary` になっていることを grep で確認
9. grep gate T-3（`set -x` 禁止）を全対象に対して 0 hit 確認
10. `pnpm typecheck` / `pnpm lint` で regression なし
11. local PASS 5 点（typecheck / lint / test / build / grep-gate）の log を `outputs/phase-11/evidence/` に保存

## ローカル実行・検証コマンド（CONST_005 #5）

```bash
# 0. workflow path existence gate
test -f .github/workflows/backend-ci.yml
rg -n 'runtime-smoke-staging|workflow_call|deploy-staging' .github/workflows/backend-ci.yml .github/workflows/runtime-smoke-staging.yml
test -f .github/workflows/runtime-smoke-staging.yml

# 1. shell test
bash scripts/smoke/__tests__/redact.test.sh
bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh
bash scripts/smoke/__tests__/ci-summary-post.test.sh

# 2. workflow YAML lint
docker run --rm -v "$(pwd)":/repo rhysd/actionlint:latest \
  -color /repo/.github/workflows/runtime-smoke-staging.yml
docker run --rm -v "$(pwd)":/repo rhysd/actionlint:latest \
  -color /repo/.github/workflows/web-cd.yml

# 3. set -x 禁止 grep
! grep -rEn 'set -x|bash -x|set -o xtrace' \
  scripts/smoke/ .github/workflows/runtime-smoke-staging.yml

# 3b. summary.json 生成保証
grep -q -- '--ci-summary' .github/workflows/runtime-smoke-staging.yml

# 4. typecheck / lint / build / test / regression
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run \
  apps/api/src/middleware/__tests__/repository-providers.test.ts \
  apps/api/src/repository/__tests__/builder.test.ts

# 5. ADR 構文確認（markdown lint があれば）
mise exec -- pnpm exec markdownlint \
  docs/40-architecture/adr/ADR-runtime-smoke-*.md || true
```

## DoD（CONST_005 #6 — 完了条件）

- [ ] 上記 10 ファイルすべて作成・編集済み
- [ ] T-1〜T-6 全 PASS
- [ ] `actionlint` 0 issue（`runtime-smoke-staging.yml` / `web-cd.yml`）
- [ ] grep gate `set -x` 0 hit
- [ ] `runtime-attendance-provider.sh` 後方互換維持（`--out-dir` 省略時に既存 path へ書く）
- [ ] workflow smoke step が `--out-dir ci-evidence --ci-summary` を指定し、failure Slack helper の `summary.json` 入力が構造保証されている
- [ ] ADR 2 本に評価軸 / 採用案 / rollback 条件 / 30 日 PASS 昇格条件が含まれる
- [ ] `operations/setup-github-environment.md` に Environment 作成 / secret 配置手順
- [ ] `pnpm typecheck` / `pnpm lint` PASS
- [ ] regression unit test PASS

## 自走禁止（再掲）

- 実 GitHub Environment / Secret の本サイクル内作成・配置（**ユーザー承認必須**）
- 実 staging deploy / 実 smoke 発火（Phase 11 evidence wave で個別承認）
- Slack incident webhook への real post（failure injection は Phase 11 のみ）
- commit / push / PR 作成
- Issue #571 reopen
