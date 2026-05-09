# Phase 2: 設計 — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 2 / 13 |
| 入力 | Phase 1 outputs（AC-1〜AC-7, G1〜G5, 自走禁止リスト, 用語集） |
| 出力 | `outputs/phase-02/main.md`（workflow YAML 設計 / secret 注入 ADR 骨子 / required check 昇格 ADR 骨子 / file inventory） |

## 目的

CI 自動実行経路の **設計（trigger / job 構成 / secret 注入 / artifact / failure post / ADR 骨子 / 変更ファイル inventory）** を確定し、Phase 5（実装ランブック）が決定論的に進められる状態にする。

## 設計対象

### A. `.github/workflows/runtime-smoke-staging.yml`（新設）

#### A.1 trigger（採用: `workflow_call`）

```yaml
name: runtime-smoke-staging
on:
  workflow_call:
  workflow_dispatch:
    inputs:
      reason:
        description: "manual run reason"
        required: false
        default: "ad-hoc smoke"
permissions:
  contents: read
concurrency:
  group: runtime-smoke-staging
  cancel-in-progress: false  # smoke 並列発火を防止（同時 trigger は queue）
```

採用根拠:
- `backend-ci.yml` の API staging deploy 成功後に同一 ref の reusable workflow として呼び出すため、smoke 対象 API の deploy 完了を待てる
- `repository_dispatch` は default branch workflow 定義、同一 SHA checkout、token permission の制約があり、本タスクでは不採用

#### A.2 `backend-ci.yml` への reusable workflow call 追記

`.github/workflows/backend-ci.yml` の `deploy-staging` 成功後に呼ぶ:

```yaml
  runtime-smoke-staging:
    name: runtime smoke staging
    needs: [deploy-staging]
    if: success() && github.ref_name == 'dev' && !contains(github.event.head_commit.message, '[skip runtime-smoke]')
    uses: ./.github/workflows/runtime-smoke-staging.yml
    secrets: inherit
```

> `repository_dispatch` 用の `RUNTIME_SMOKE_DISPATCH_TOKEN` は不要。

#### A.3 jobs 構成

```yaml
jobs:
  smoke:
    runs-on: ubuntu-latest
    environment: staging-runtime-smoke   # ← Environment-scoped secret はここで初めて読める
    timeout-minutes: 10
    env:
      STAGING_API_BASE: ${{ secrets.STAGING_API_BASE }}
      STAGING_ADMIN_BEARER: ${{ secrets.STAGING_ADMIN_BEARER }}
      STAGING_MEMBER_ID: ${{ secrets.STAGING_MEMBER_ID }}
      STAGING_ME_BEARER: ${{ secrets.STAGING_ME_BEARER }}
    steps:
      - uses: actions/checkout@v4
      - name: mask staging credentials
        run: |
          echo "::add-mask::$STAGING_ADMIN_BEARER"
          echo "::add-mask::$STAGING_ME_BEARER"
          # set -x を使わない（::add-mask:: と set -x の相互作用で leak した過去事故あり）
      - name: run runtime smoke
        run: |
          mkdir -p ci-evidence
          bash scripts/smoke/runtime-attendance-provider.sh staging --out-dir ci-evidence --ci-summary
      - name: redaction grep gate
        run: |
          ! grep -rEn 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|hooks\.slack\.com/services/[A-Z0-9]|sentry\.io/[0-9]+/[0-9]+|xox[bp]-' ci-evidence/
      - name: upload evidence artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: runtime-smoke-staging-${{ github.run_id }}
          path: ci-evidence/
          retention-days: 30
      - name: post failure summary to Slack
        if: failure()
        env:
          SLACK_WEBHOOK_INCIDENT: ${{ secrets.SLACK_WEBHOOK_INCIDENT }}
        run: bash scripts/smoke/ci-summary-post.sh ci-evidence
```

#### A.4 設計上の不変

- `set -x` / `bash -x` 禁止（grep gate で自動検出）
- secret は workflow YAML の `env:` で job-scoped に渡す（step 内で `${{ secrets.X }}` を直接 echo しない）
- `::add-mask::` は **secret を参照する最初の step** で必ず宣言。ただし参照前の宣言は GitHub Actions 仕様により mask 対象に登録されないため、参照後 1 step 以内に置く
- artifact upload は `if: always()` で failure 時も upload（debug 用）
- Slack post は `if: failure()` のみ（成功時 0 通）
- `ci-summary-post.sh` は `summary.json` を必須入力にするため、workflow の smoke runner 起動は `--ci-summary` を必ず付ける

#### A.5 secret category boundary

| Category | Secret | Scope | 許可理由 |
| --- | --- | --- | --- |
| staging runtime credential | `STAGING_API_BASE`, `STAGING_ADMIN_BEARER`, `STAGING_MEMBER_ID`, `STAGING_ME_BEARER`, `SLACK_WEBHOOK_INCIDENT` | GitHub Environment `staging-runtime-smoke` only | staging runtime job だけが読む。repository-scoped secret に置かない |

AC-6 の「repository-scoped secret に staging credential を置かない」は staging runtime credential に適用する。dispatch control token は別カテゴリとして扱い、権限は repository dispatch 最小スコープに限定する。

### B. `scripts/smoke/runtime-attendance-provider.sh` 拡張（最小）

- 第二引数を `--out-dir <path>` で受ける（位置引数 ENVIRONMENT は維持）
- 引数省略時は既存 hard-coded path（issue-531 配下）を保持して後方互換
- `set -x` 削除（既存実装で `set -euo pipefail` のみ。再確認）
- 出力ファイル: `runtime-smoke.log`（既存）に加え、CI 用に `summary.json`（status / count / pass-fail を JSON で構造化）を出力する option `--ci-summary` を追加

### C. `scripts/smoke/ci-summary-post.sh`（新設）

- 入力: 第一引数 = evidence dir
- 動作: `summary.json` を読み、redact 済み Slack message を 1 通 post
- secret: `SLACK_WEBHOOK_INCIDENT` 環境変数のみ参照（YAML から渡す）
- 出力: stdout に redact 済み message（mask 後の値）

### D. ADR-runtime-smoke-secret-injection（骨子）

| 観点 | GitHub Environments | 1Password connect | OIDC short-lived |
| --- | --- | --- | --- |
| 初期コスト | 低（既存機能） | 中（self-host が必要） | 中（Cloudflare Workers OAuth client 設定） |
| rotate 容易性 | 中（手動 update） | 高（1Password 一元化） | 高（短命） |
| 無料枠 | ◯ | △（self-host 維持コスト） | ◯ |
| 誤発火リスク | 低（Environment scoped） | 中（ネットワーク依存） | 低（短命） |
| 既存運用整合 | 高（CLAUDE.md と整合） | 高（1Password 正本と一致） | 中（新規導入） |
| **本サイクル採用** | **採用** | future option | production 拡張時に再評価 |

#### rollback 条件
- Environment-scoped secret が staging→production で混線した場合、即時 disable し 1Password connect 案へ切替

### E. ADR-runtime-smoke-required-status-check（骨子）

- 本サイクル: optional check（PR を block しない）
- 昇格条件: 30 日連続 PASS かつ failure 偽陽性率 < 2%
- 偽陽性 escape valve: `[skip runtime-smoke]` PR title prefix（merge queue では非推奨だが debug 用）
- 昇格判断は別サイクル G5 で実施

### F. 変更ファイル inventory

| 種別 | パス | 概要 |
| --- | --- | --- |
| 新規 | `.github/workflows/runtime-smoke-staging.yml` | 主 workflow |
| 編集 | `.github/workflows/backend-ci.yml` | reusable workflow call 追記 |
| 編集 | `scripts/smoke/runtime-attendance-provider.sh` | `--out-dir` / `--ci-summary` 追加 |
| 新規 | `scripts/smoke/ci-summary-post.sh` | failure 時 Slack post helper |
| 新規 | `scripts/smoke/__tests__/redact.test.sh` | redaction 偽陰性対策テスト |
| 新規 | `docs/40-architecture/adr/ADR-runtime-smoke-secret-injection.md` | 注入経路 ADR |
| 新規 | `docs/40-architecture/adr/ADR-runtime-smoke-required-status-check.md` | required check 昇格 ADR |
| 新規 | `docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/operations/setup-github-environment.md` | Environment 配置 runbook |

## 検証コマンド

```bash
# workflow path existence gate
test -f .github/workflows/web-cd.yml
test -f .github/workflows/runtime-smoke-staging.yml

# Phase 2 output が trigger / jobs / ADR 骨子 / file inventory を含む
SPEC_DIR=docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration
grep -q "workflow_call\|workflow_dispatch" "$SPEC_DIR/outputs/phase-02/main.md"
grep -q "environment: staging-runtime-smoke" "$SPEC_DIR/outputs/phase-02/main.md"
grep -q "ADR-runtime-smoke-secret-injection" "$SPEC_DIR/outputs/phase-02/main.md"
grep -q "ADR-runtime-smoke-required-status-check" "$SPEC_DIR/outputs/phase-02/main.md"
grep -q "set -x" "$SPEC_DIR/outputs/phase-02/main.md"  # 禁止記述として
grep -q -- "--ci-summary" "$SPEC_DIR/outputs/phase-02/main.md"
```

## 完了条件（DoD）

- [ ] workflow YAML 設計（trigger / jobs / steps / secret / `::add-mask::` 配置）が決定論的
- [ ] dispatch 元 workflow の追記差分が 1 step に収まる
- [ ] `runtime-attendance-provider.sh` への変更が `--out-dir` / `--ci-summary` の 2 オプションに限定（後方互換維持）
- [ ] `ci-summary-post.sh` の入出力契約が確定
- [ ] ADR 2 本の骨子（評価軸 / 採用案 / rollback 条件 / 昇格条件）が確定
- [ ] 変更ファイル inventory が 8 件で確定（新規 6 / 編集 2）
- [ ] `set -x` / `bash -x` 禁止が grep gate として明示

## 次 Phase への引き渡し

Phase 3 へ: 設計レビュー観点（trigger 制約 / secret scope / redaction 偽陰性 / `::add-mask::` 順序 / 無料枠見積もり）
