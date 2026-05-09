# Phase 11: 実測 evidence (CI workflow run) — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

visualEvidence: NON_VISUAL（HTTP / workflow run log / artifact / Slack post の summary-only evidence）

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 11 / 13 |
| 入力 | Phase 5 実装完了 / Phase 9 quality gate PASS / G1 ユーザー承認 |
| 出力 | `outputs/phase-11/main.md` + evidence 7 ファイル |

## 目的

`.github/workflows/runtime-smoke-staging.yml` を **実 staging deploy 経由で発火**させ、AC-1〜AC-7 を満たす evidence を NON_VISUAL contract で記録する。production smoke は本 phase の対象外（別 Issue）。

## evidence inventory（CONST_005 #4）

| ファイル | 取得方法 | 用途 |
| --- | --- | --- |
| `outputs/phase-11/evidence/typecheck.log` | `mise exec -- pnpm typecheck 2>&1 \| tee` | local PASS 5 点 #1 |
| `outputs/phase-11/evidence/lint.log` | `mise exec -- pnpm lint 2>&1 \| tee` | #2 |
| `outputs/phase-11/evidence/test.log` | `mise exec -- pnpm exec vitest run ... 2>&1 \| tee` + 3 本の shell test 出力 | #3 |
| `outputs/phase-11/evidence/build.log` | `mise exec -- pnpm build 2>&1 \| tee` | #4 |
| `outputs/phase-11/evidence/grep-gate.log` | Q-8 / Q-9 / Q-13 出力 | #5 |
| `outputs/phase-11/evidence/actionlint.log` | actionlint for workflow YAML | workflow syntax |
| `outputs/phase-11/evidence/workflow-run-summary.md` | GitHub Actions UI / `gh run view <id>` | AC-1, AC-2, AC-6 |
| `outputs/phase-11/evidence/artifact-redaction-grep.log` | artifact download → redact grep | AC-3 |
| `outputs/phase-11/evidence/slack-failure-injection.md` | failure injection run の Slack post screenshot 不要、summary text を redact 後に貼付 | AC-4 |

## 実行手順（G1 承認後）

### G1 承認 — GitHub Environment / Secret 配置

Status: prepared-local / pending user approval. 2026-05-09 CI recovery wave 以降、secret 配置は `scripts/smoke/provision-staging-secrets.sh` を正本 runbook とする。ユーザー承認後に以下を実行し、値を出さない name-only inventory を evidence として保存する。

```bash
# 1. Environment 作成（未作成の場合のみ。GitHub UI または gh CLI）
gh api -X PUT repos/daishiman/UBM-Hyogo/environments/staging-runtime-smoke

# 2. Environment-scoped secret 5 件配置 + name-only inventory verification
bash scripts/smoke/provision-staging-secrets.sh
```

### G2 承認 — workflow YAML レビュー & merge

PR 経由で `.github/workflows/runtime-smoke-staging.yml` / `backend-ci.yml` 編集を merge。merge 後 dev branch で smoke trigger 経路が有効化。

### G3 承認 — staging deploy → 自動 smoke 初回成功

1. `dev` branch に push（または手動 deploy trigger）
2. `backend-ci.yml` の API staging deploy job が PASS
3. `backend-ci.yml` の `runtime-smoke-staging` reusable workflow call が起動
4. `runtime-smoke-staging.yml` が実行
5. smoke job 完走 → artifact upload
6. `gh run view <run-id>` で artifact / log を取得
7. artifact 内容を grep gate で確認:
   ```bash
   gh run download <run-id> --dir /tmp/smoke-artifact
   ! grep -rEn 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}' /tmp/smoke-artifact/
   ```
8. `outputs/phase-11/evidence/workflow-run-summary.md` に run id / trigger type / artifact URL / retention / status を記録
9. `outputs/phase-11/evidence/artifact-redaction-grep.log` に grep 結果（0 hit）を記録
10. workflow log に runner 起動コマンド `--out-dir ci-evidence --ci-summary` が含まれることを記録し、Slack failure helper の `summary.json` 入力が構造保証されていることを確認

### G4 承認 — failure injection で Slack post 実測

1. `staging-runtime-smoke` Environment の `STAGING_API_BASE` を一時的に `https://invalid.example` に差し替え（ユーザー承認必須）
2. `workflow_dispatch` で smoke 手動 trigger（`reason: failure-injection`）
3. smoke job が exit 1 / Slack `#incident` に redact 済み summary が 1 通 post されることを確認
4. Slack post 内容を redact 確認の上 `slack-failure-injection.md` に貼付
5. `STAGING_API_BASE` を正規値へ戻す（必須）
6. 再実行で smoke が PASS することを確認（G3 evidence と整合）

### local PASS 5 点取得

実装完了直後に以下を実行し、`evidence/{typecheck,lint,test,build,grep-gate}.log` を生成:

```bash
mkdir -p docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/outputs/phase-11/evidence
EVD=docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/outputs/phase-11/evidence

mise exec -- pnpm typecheck 2>&1 | tee "$EVD/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$EVD/lint.log"
mise exec -- pnpm exec vitest run \
  apps/api/src/middleware/__tests__/repository-providers.test.ts \
  apps/api/src/repository/__tests__/builder.test.ts 2>&1 | tee "$EVD/test.log"
bash scripts/smoke/__tests__/redact.test.sh                       2>&1 | tee -a "$EVD/test.log"
bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh   2>&1 | tee -a "$EVD/test.log"
bash scripts/smoke/__tests__/ci-summary-post.test.sh               2>&1 | tee -a "$EVD/test.log"
mise exec -- pnpm build 2>&1 | tee "$EVD/build.log"

{
  echo "===== set -x grep gate ====="
  ! grep -rEn 'set -x|bash -x|set -o xtrace' \
    scripts/smoke/ .github/workflows/runtime-smoke-staging.yml \
    && echo "PASS: 0 hit"
  echo "===== secret string grep gate ====="
  ! rg -n 'hooks\.slack\.com/services/[A-Z0-9]|sentry\.io/[0-9]+/[0-9]+|xox[bp]-|Bearer [A-Za-z0-9_-]{20,}' \
    scripts/ .github/workflows/runtime-smoke-staging.yml \
    docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/ \
    && echo "PASS: 0 hit"
  echo "===== Issue #571 state ====="
  gh issue view 571 --repo daishiman/UBM-Hyogo --json state
} 2>&1 | tee "$EVD/grep-gate.log"
```

## 完了条件（DoD・workflow_state 遷移）

- [ ] local PASS 5 点 (typecheck / lint / test / build / grep-gate) すべて取得済み
- [ ] G1〜G3 通過 → `workflow_state: PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` 候補
- [ ] G4 通過 → Slack failure injection evidence 取得（redact 確認済み）
- [ ] artifact-redaction-grep.log で 0 hit
- [ ] workflow-run-summary.md に run id / artifact URL / retention 30 日 / Environment-scoped secret name list を記載
- [ ] `STAGING_API_BASE` の元値復元確認

## 自走禁止（Phase 11 内）

- ❌ ユーザー承認なしの実 secret 投入・実 deploy・実 smoke 発火
- ❌ ユーザー承認なしの `STAGING_API_BASE` 差し替え（G4 必須）
- ❌ Slack incident webhook への test post（G4 のみ）
- ❌ artifact / log への raw response body 保存（summary-only 厳守）
- ❌ Issue #571 reopen
